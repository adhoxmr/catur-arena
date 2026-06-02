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
    white?: { id: string; username: string; socketId: string; address?: string }
    black?: { id: string; username: string; socketId: string; address?: string }
  }
  status: 'waiting' | 'playing' | 'finished'
  createdAt: number
  // Real Spingu Token fields
  isRealBet?: boolean
  playerAddress?: string
  treasuryAddress?: string
  // For chat tagging: collect known wallet addresses of actual players
  playerAddresses?: string[]
}
