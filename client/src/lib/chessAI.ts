import type { Square } from 'chess.js'
import { Chess } from 'chess.js'

export type Difficulty = 'pemula' | 'menengah' | 'master'



// Piece values (centipawns)
const PIECE_VALUES: Record<string, number> = {
  p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000,
}

// Simple piece-square tables (for white, mirrored for black)
const PST: Record<string, number[]> = {
  p: [
     0,  0,  0,  0,  0,  0,  0,  0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
     5,  5, 10, 25, 25, 10,  5,  5,
     0,  0,  0, 20, 20,  0,  0,  0,
     5, -5,-10,  0,  0,-10, -5,  5,
     5, 10, 10,-20,-20, 10, 10,  5,
     0,  0,  0,  0,  0,  0,  0,  0
  ],
  n: [
    -50,-40,-30,-30,-30,-30,-40,-50,
    -40,-20,  0,  0,  0,  0,-20,-40,
    -30,  0, 10, 15, 15, 10,  0,-30,
    -30,  5, 15, 20, 20, 15,  5,-30,
    -30,  0, 15, 20, 20, 15,  0,-30,
    -30,  5, 10, 15, 15, 10,  5,-30,
    -40,-20,  0,  5,  5,  0,-20,-40,
    -50,-40,-30,-30,-30,-30,-40,-50
  ],
}

function evaluatePosition(game: Chess): number {
  const board = game.board()
  let score = 0

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row][col]
      if (!piece) continue

      const value = PIECE_VALUES[piece.type] || 0
      const isWhite = piece.color === 'w'
      const squareIndex = row * 8 + col
      const pstIndex = isWhite ? squareIndex : 63 - squareIndex

      let pstValue = 0
      if (PST[piece.type]) {
        pstValue = PST[piece.type][pstIndex]
      }

      const pieceScore = value + pstValue
      score += isWhite ? pieceScore : -pieceScore
    }
  }

  // Mobility bonus
  const whiteMoves = game.moves({ verbose: true }).length
  game.turn() === 'b' ? null : null // already correct side
  score += (game.turn() === 'w' ? 1 : -1) * (whiteMoves * 2)

  // Check bonus
  if (game.inCheck()) {
    score += game.turn() === 'w' ? -30 : 30
  }

  return score
}

function orderMoves(moves: ReturnType<Chess['moves']>): ReturnType<Chess['moves']> {
  // Simple ordering: captures first
  return [...moves].sort((a, b) => {
    const aCapture = (a as any).captured ? 10 : 0
    const bCapture = (b as any).captured ? 10 : 0
    return bCapture - aCapture
  })
}

function minimax(
  game: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || game.isGameOver()) {
    if (game.isCheckmate()) {
      return isMaximizing ? -99999 : 99999
    }
    if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition()) {
      return 0
    }
    return evaluatePosition(game)
  }

  const moves = orderMoves(game.moves({ verbose: true }))
  let bestEval = isMaximizing ? -Infinity : Infinity

  for (const move of moves) {
    game.move(move)
    const evaluation = minimax(game, depth - 1, alpha, beta, !isMaximizing)
    game.undo()

    if (isMaximizing) {
      bestEval = Math.max(bestEval, evaluation)
      alpha = Math.max(alpha, evaluation)
    } else {
      bestEval = Math.min(bestEval, evaluation)
      beta = Math.min(beta, evaluation)
    }

    if (beta <= alpha) break
  }

  return bestEval
}

export function getBestMove(game: Chess, difficulty: Difficulty): string | null {
  if (game.isGameOver()) return null

  const moves = game.moves({ verbose: true })
  if (moves.length === 0) return null

  let depth = 2
  let randomFactor = 0

  switch (difficulty) {
    case 'pemula':
      depth = 1
      randomFactor = 0.6 // 60% chance to pick random good move
      break
    case 'menengah':
      depth = 3
      randomFactor = 0.15
      break
    case 'master':
      depth = 4
      randomFactor = 0.02
      break
  }

  // For very low depth, sometimes pick random to feel "human"
  if (Math.random() < randomFactor && difficulty === 'pemula') {
    return moves[Math.floor(Math.random() * moves.length)].san
  }

  let bestMove = moves[0].san
  let bestScore = -Infinity

  const ordered = orderMoves(moves)

  for (const move of ordered) {
    game.move(move)
    const score = minimax(game, depth - 1, -Infinity, Infinity, false)
    game.undo()

    // Add tiny randomness for variety at higher levels
    const finalScore = score + (Math.random() - 0.5) * (difficulty === 'master' ? 8 : 25)

    if (finalScore > bestScore) {
      bestScore = finalScore
      bestMove = move.san
    }
  }

  return bestMove
}

// Get all legal moves for highlighting
export function getLegalMoves(game: Chess, square: Square): Square[] {
  const moves = game.moves({ square, verbose: true })
  return moves.map(m => m.to as Square)
}
