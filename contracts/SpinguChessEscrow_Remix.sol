// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// =====================================================
// REMIX-READY VERSION - SpinguChessEscrow
// Copy seluruh file ini ke https://remix.ethereum.org/
// =====================================================

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable2Step.sol";

/**
 * @title SpinguChessEscrow (Remix Version)
 * @notice Contract escrow untuk taruhan Spingu Token di SatuChain
 * 
 * =====================================================
 * CARA DEPLOY DI REMIX:
 * =====================================================
 * 1. Buka https://remix.ethereum.org/
 * 2. Buat file baru bernama "SpinguChessEscrow.sol"
 * 3. Paste SELURUH isi file ini
 * 4. Pilih compiler 0.8.20 atau 0.8.21
 * 5. Klik "Compile SpinguChessEscrow.sol"
 * 6. Pergi ke tab "Deploy & Run Transactions"
 * 7. Pilih Environment: "Injected Provider - MetaMask"
 * 8. Pastikan MetaMask sudah connect ke SatuChain
 * 9. Isi 3 parameter di bawah ini, lalu Deploy
 *
 * =====================================================
 * CONSTRUCTOR PARAMETERS (WAJIB DIISI):
 * =====================================================
 *
 * 1. _spinguToken     : 0xb6248d93cf91b00b79fae46d3d4a8b50ac04fd3b
 *
 * 2. _feeCollector    : 0x600cFd2aCfD798B7f7bC5Fbbcc5FCe4a2A579684
 *                       
 * 3. _gameOperator    : 0x7207D5A0450492C1f2478aE8EB2180D283cB71F5
 *
 * CATATAN PENTING:
 * - Gunakan alamat yang sama persis (huruf kecil/besar tidak masalah di EVM)
 * - Setelah deploy, simpan alamat contract yang muncul!
 * - Masukkan alamat contract tersebut ke file .env frontend kamu
 */

contract SpinguChessEscrow is Ownable2Step, ReentrancyGuard {
    IERC20 public immutable spinguToken;

    address public feeCollector;
    address public gameOperator;

    uint256 public constant FEE_PERCENT = 3;

    enum GameType { VS_AI, MULTIPLAYER }
    enum GameStatus { Created, Funded, Resolved, Cancelled }

    struct Game {
        address player1;
        address player2;
        uint256 betAmount;
        uint256 totalPot;
        GameType gameType;
        GameStatus status;
        address winner;
        uint256 resolvedAt;
    }

    mapping(bytes32 => Game) public games;
    mapping(bytes32 => mapping(address => uint256)) public deposits;

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

    // =====================================================
    // CONSTRUCTOR - ISI 3 ALAMAT DI BAWAH INI
    // =====================================================
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

    // ==================== ADMIN ====================

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

    // ==================== CREATE GAME ====================

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

    // ==================== DEPOSIT ====================

    function deposit(bytes32 gameId) external nonReentrant gameExists(gameId) {
        Game storage game = games[gameId];
        require(game.status == GameStatus.Created || game.status == GameStatus.Funded, "Game not open");
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player in this game");

        uint256 amount = game.betAmount;
        require(deposits[gameId][msg.sender] == 0, "Already deposited");

        require(
            spinguToken.transferFrom(msg.sender, address(this), amount),
            "TransferFrom failed"
        );

        deposits[gameId][msg.sender] = amount;

        uint256 currentPot = game.totalPot + amount;

        if (game.gameType == GameType.MULTIPLAYER) {
            if (currentPot >= game.betAmount * 2) {
                game.totalPot = currentPot;
                game.status = GameStatus.Funded;
                emit GameFunded(gameId, currentPot);
            } else {
                game.totalPot = currentPot;
            }
        } else {
            game.totalPot = currentPot;
            game.status = GameStatus.Funded;
            emit GameFunded(gameId, currentPot);
        }

        emit DepositMade(gameId, msg.sender, amount);
    }

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

    // ==================== RESOLVE ====================

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

        if (platformFee > 0) {
            require(spinguToken.transfer(feeCollector, platformFee), "Fee transfer failed");
        }

        require(spinguToken.transfer(winner, winnerPayout), "Winner payout failed");

        emit GameResolved(gameId, winner, winnerPayout, platformFee);
    }

    function cancelGame(bytes32 gameId) external gameExists(gameId) {
        require(
            msg.sender == owner() || msg.sender == gameOperator,
            "Not authorized"
        );

        Game storage game = games[gameId];
        require(game.status != GameStatus.Resolved, "Already resolved");

        game.status = GameStatus.Cancelled;

        if (deposits[gameId][game.player1] > 0) {
            uint256 refund1 = deposits[gameId][game.player1];
            deposits[gameId][game.player1] = 0;
            spinguToken.transfer(game.player1, refund1);
        }

        if (game.player2 != address(0) && deposits[gameId][game.player2] > 0) {
            uint256 refund2 = deposits[gameId][game.player2];
            deposits[gameId][game.player2] = 0;
            spinguToken.transfer(game.player2, refund2);
        }

        emit GameCancelled(gameId);
    }

    // ==================== VIEW ====================

    function getGame(bytes32 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    function getDeposit(bytes32 gameId, address player) external view returns (uint256) {
        return deposits[gameId][player];
    }

    function emergencyRecover(address token, address to, uint256 amount) external onlyOwner {
        require(token != address(spinguToken) || amount == 0, "Cannot recover Spingu this way");
        IERC20(token).transfer(to, amount);
    }
}
