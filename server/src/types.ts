export interface User {
  id: string
  username: string
  tokens: number
  rating: number
}

export interface Room {
  id: string
  stake: number
  timeControl: string
  fen: string
  players: {
    white?: { id: string; username: string; socketId: string }
    black?: { id: string; username: string; socketId: string }
  }
  status: 'waiting' | 'playing' | 'finished'
  createdAt: number
  // Real Spingu Token fields
  isRealBet?: boolean
  playerAddress?: string
  treasuryAddress?: string
}
