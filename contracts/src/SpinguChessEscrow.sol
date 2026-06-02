// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title SpinguChessEscrow
 * @notice Escrow contract for Spingu Token chess bets on SatuChain.
 *         Supports:
 *         - Player vs AI Spingu (treasury matches bet)
 *         - Player vs Player real money matches
 *         - Automatic 3% platform fee on total pot
 *
 * @dev Only the gameOperator (backend) can resolve games after off-chain result.
 */
contract SpinguChessEscrow is Ownable2Step, ReentrancyGuard {
    IERC20 public immutable spinguToken;

    // Address that receives the 3% platform fee
    address public feeCollector;

    // Backend wallet / server that is allowed to resolve games
    address public gameOperator;

    uint256 public constant FEE_PERCENT = 3;

    enum GameType { VS_AI, MULTIPLAYER }
    enum GameStatus { Created, Funded, Resolved, Cancelled }

    struct Game {
        address player1;        // White / Challenger
        address player2;        // Black / Opponent (address(0) if vs AI until funded)
        uint256 betAmount;      // Amount each side bets
        uint256 totalPot;       // 2 x betAmount after both funded
        GameType gameType;
        GameStatus status;
        address winner;         // Final winner
        uint256 resolvedAt;
    }

    mapping(bytes32 => Game) public games;
    mapping(bytes32 => mapping(address => uint256)) public deposits;

    // Events
    event GameCreated(
        bytes32 indexed gameId,
        address indexed player1,
        address indexed player2,
        uint256 betAmount,
        GameType gameType
    );

    event DepositMade(
        bytes32 indexed gameId,
        address indexed player,
        uint256 amount
    );

    event GameFunded(bytes32 indexed gameId, uint256 totalPot);

    event GameResolved(
        bytes32 indexed gameId,
        address winner,
        uint256 winnerPayout,
        uint256 platformFee
    );

    event GameCancelled(bytes32 indexed gameId);

    event OperatorUpdated(address newOperator);
    event FeeCollectorUpdated(address newCollector);

    modifier onlyOperator() {
        require(msg.sender == gameOperator, "Not game operator");
        _;
    }

    modifier gameExists(bytes32 gameId) {
        require(games[gameId].player1 != address(0), "Game does not exist");
        _;
    }

    constructor(
        address _spinguToken,
        address _feeCollector,
        address _gameOperator
    ) Ownable(msg.sender) {
        require(_spinguToken != address(0), "Invalid token");
        require(_feeCollector != address(0), "Invalid feeCollector");
        require(_gameOperator != address(0), "Invalid operator");

        spinguToken = IERC20(_spinguToken);
        feeCollector = _feeCollector;
        gameOperator = _gameOperator;
    }

    // ============================================================
    //                      ADMIN FUNCTIONS
    // ============================================================

    function setGameOperator(address _newOperator) external onlyOwner {
        require(_newOperator != address(0), "Invalid address");
        gameOperator = _newOperator;
        emit OperatorUpdated(_newOperator);
    }

    function setFeeCollector(address _newCollector) external onlyOwner {
        require(_newCollector != address(0), "Invalid address");
        feeCollector = _newCollector;
        emit FeeCollectorUpdated(_newCollector);
    }

    // ============================================================
    //                      GAME CREATION
    // ============================================================

    /**
     * @notice Create a new chess game (called by backend when user creates match)
     * @param gameId Unique ID from frontend (e.g. keccak256 of roomId or matchId)
     * @param player1 Address of the first player (the one who created)
     * @param player2 Address of second player. For VS_AI, pass treasury address or address(0)
     * @param betAmount Amount in Spingu (18 decimals) that each side will bet
     * @param gameType VS_AI or MULTIPLAYER
     */
    function createGame(
        bytes32 gameId,
        address player1,
        address player2,
        uint256 betAmount,
        GameType gameType
    ) external onlyOperator {
        require(games[gameId].player1 == address(0), "Game already exists");
        require(player1 != address(0), "Invalid player1");
        require(betAmount > 0, "Bet must be > 0");

        games[gameId] = Game({
            player1: player1,
            player2: player2,
            betAmount: betAmount,
            totalPot: 0,
            gameType: gameType,
            status: GameStatus.Created,
            winner: address(0),
            resolvedAt: 0
        });

        emit GameCreated(gameId, player1, player2, betAmount, gameType);
    }

    // ============================================================
    //                      DEPOSIT (LOCK FUNDS)
    // ============================================================

    /**
     * @notice Player deposits their bet into the escrow for a specific game.
     *         Must have approved the contract first.
     */
    function deposit(bytes32 gameId) external nonReentrant gameExists(gameId) {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Created || game.status == GameStatus.Funded, "Game not open");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player in this game");

        uint256 amount = game.betAmount;
        require(deposits[gameId][msg.sender] == 0, "Already deposited");

        // Pull tokens
        require(
            spinguToken.transferFrom(msg.sender, address(this), amount),
            "TransferFrom failed"
        );

        deposits[gameId][msg.sender] = amount;

        uint256 currentPot = game.totalPot + amount;

        // Check if game is now fully funded
        if (game.gameType == GameType.MULTIPLAYER) {
            if (currentPot >= game.betAmount * 2) {
                game.totalPot = currentPot;
                game.status = GameStatus.Funded;
                emit GameFunded(gameId, currentPot);
            } else {
                game.totalPot = currentPot;
            }
        } else {
            // VS_AI: only player needs to deposit. Treasury side handled separately or by operator.
            game.totalPot = currentPot;
            game.status = GameStatus.Funded;
            emit GameFunded(gameId, currentPot);
        }

        emit DepositMade(gameId, msg.sender, amount);
    }

    /**
     * @notice Operator (backend) can fund the AI side of the bet from treasury.
     *         Call this after player has deposited for VS_AI games.
     */
    function fundAIMatch(bytes32 gameId) external onlyOperator nonReentrant gameExists(gameId) {
        Game storage game = games[gameId];
        require(game.gameType == GameType.VS_AI, "Not AI game");
        require(game.status == GameStatus.Funded || game.status == GameStatus.Created, "Invalid status");
        require(game.player2 != address(0), "AI side address not set");

        uint256 amount = game.betAmount;

        require(
            spinguToken.transferFrom(game.player2, address(this), amount),
            "AI match funding failed"
        );

        deposits[gameId][game.player2] = amount;
        game.totalPot += amount;

        if (game.totalPot >= game.betAmount * 2) {
            game.status = GameStatus.Funded;
        }

        emit DepositMade(gameId, game.player2, amount);
    }

    // ============================================================
    //                      RESOLVE GAME
    // ============================================================

    /**
     * @notice Resolve a game and distribute funds. Only callable by gameOperator.
     * @param gameId The game identifier
     * @param winner Address of the winner (must be player1 or player2)
     */
    function resolveGame(bytes32 gameId, address winner)
        external
        onlyOperator
        nonReentrant
        gameExists(gameId)
    {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Funded, "Game not funded");
        require(winner == game.player1 || winner == game.player2, "Invalid winner");
        require(game.totalPot > 0, "No pot");

        game.status = GameStatus.Resolved;
        game.winner = winner;
        game.resolvedAt = block.timestamp;

        uint256 totalPot = game.totalPot;
        uint256 platformFee = (totalPot * FEE_PERCENT) / 100;
        uint256 winnerPayout = totalPot - platformFee;

        // Send fee to collector
        if (platformFee > 0) {
            require(spinguToken.transfer(feeCollector, platformFee), "Fee transfer failed");
        }

        // Send winnings to winner
        require(spinguToken.transfer(winner, winnerPayout), "Winner payout failed");

        emit GameResolved(gameId, winner, winnerPayout, platformFee);
    }

    /**
     * @notice Cancel a game and refund both players (if any deposited).
     *         Only operator or owner in emergency.
     */
    function cancelGame(bytes32 gameId) external gameExists(gameId) {
        require(
            msg.sender == owner() || msg.sender == gameOperator,
            "Not authorized"
        );

        Game storage game = games[gameId];
        require(game.status != GameStatus.Resolved, "Already resolved");

        game.status = GameStatus.Cancelled;

        // Refund player1
        if (deposits[gameId][game.player1] > 0) {
            uint256 refund1 = deposits[gameId][game.player1];
            deposits[gameId][game.player1] = 0;
            spinguToken.transfer(game.player1, refund1);
        }

        // Refund player2 (if exists and deposited)
        if (game.player2 != address(0) && deposits[gameId][game.player2] > 0) {
            uint256 refund2 = deposits[gameId][game.player2];
            deposits[gameId][game.player2] = 0;
            spinguToken.transfer(game.player2, refund2);
        }

        emit GameCancelled(gameId);
    }

    // ============================================================
    //                      VIEW HELPERS
    // ============================================================

    function getGame(bytes32 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    function getDeposit(bytes32 gameId, address player) external view returns (uint256) {
        return deposits[gameId][player];
    }

    // Emergency: recover tokens sent by mistake (only owner)
    function emergencyRecover(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(spinguToken) || amount == 0, "Cannot recover Spingu this way");
        IERC20(token).transfer(to, amount);
    }
}
