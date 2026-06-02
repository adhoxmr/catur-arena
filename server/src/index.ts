import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'
import Database from 'better-sqlite3'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { Room } from './types'
import { initBlockchain, createGameOnChain, resolveGameOnChain, isBlockchainEnabled } from './blockchain'
import { ethers } from 'ethers'

const PORT = process.env.PORT || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'catur-arena-secret-2026'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { 
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'] 
  },
})

app.use(cors({ 
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true 
}))
app.use(express.json())

// Initialize Blockchain Service (Spingu Escrow)
const blockchainEnabled = initBlockchain()

// SQLite Database
const db = new Database('./catur-arena.db')
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE,
    password TEXT,
    tokens INTEGER DEFAULT 8000,
    rating INTEGER DEFAULT 1200,
    created_at INTEGER
  );

  CREATE TABLE IF NOT EXISTS matches (
    id TEXT PRIMARY KEY,
    white_id TEXT,
    black_id TEXT,
    stake INTEGER,
    winner TEXT,
    ended_at INTEGER
  );
`)

// In-memory rooms (for speed + simplicity)
const rooms = new Map<string, Room>()

// ===== AUTH =====
app.post('/api/register', (req, res) => {
  const { username, password } = req.body
  if (!username || username.length < 3) return res.status(400).json({ error: 'Username minimal 3 karakter' })

  const hashed = bcrypt.hashSync(password || 'guest', 10)
  const id = 'u_' + Date.now()

  try {
    const stmt = db.prepare('INSERT INTO users (id, username, password, tokens, rating, created_at) VALUES (?, ?, ?, 8000, 1200, ?)')
    stmt.run(id, username, hashed, Date.now())
    
    const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token, user: { id, username, tokens: 8000, rating: 1200 } })
  } catch (e: any) {
    if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return res.status(409).json({ error: 'Username sudah digunakan' })
    }
    res.status(500).json({ error: 'Gagal mendaftar' })
  }
})

app.post('/api/login', (req, res) => {
  const { username, password } = req.body
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any
  
  if (!user) return res.status(401).json({ error: 'User tidak ditemukan' })
  
  const valid = bcrypt.compareSync(password || 'guest', user.password)
  if (!valid) return res.status(401).json({ error: 'Password salah' })

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' })
  res.json({
    token,
    user: { id: user.id, username: user.username, tokens: user.tokens, rating: user.rating },
  })
})

app.get('/api/me', (req, res) => {
  const auth = req.headers.authorization?.split(' ')[1]
  if (!auth) return res.status(401).json({ error: 'Unauthorized' })
  try {
    const decoded = jwt.verify(auth, JWT_SECRET) as any
    const user = db.prepare('SELECT id, username, tokens, rating FROM users WHERE id = ?').get(decoded.id) as any
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ user })
  } catch {
    res.status(401).json({ error: 'Token invalid' })
  }
})

// ===== SOCKET.IO REAL-TIME =====
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id)

  socket.on('join-room', async ({ 
    roomId, 
    username, 
    stake, 
    isRealBet = false,
    playerAddress,
    treasuryAddress,
  }: { 
    roomId: string; 
    username: string; 
    stake: number;
    isRealBet?: boolean;
    playerAddress?: string;
    treasuryAddress?: string;
  }) => {
    let room = rooms.get(roomId)

    if (!room) {
      // Create new room
      room = {
        id: roomId,
        stake: stake || 0,
        timeControl: '10+0',
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        players: {},
        status: 'waiting',
        createdAt: Date.now(),
        isRealBet: isRealBet,
        playerAddress: playerAddress,
        treasuryAddress: treasuryAddress,
      }
      rooms.set(roomId, room)

      // If this is a real Spingu bet, create the game on-chain
      if (isRealBet && blockchainEnabled && playerAddress && stake > 0) {
        const betAmount = ethers.parseUnits(stake.toString(), 18)
        const opponentForChain = treasuryAddress || playerAddress // for AI mode, treasury is player2

        const result = await createGameOnChain({
          roomId,
          player1: playerAddress,
          player2: opponentForChain,
          betAmount,
          isVsAI: !treasuryAddress ? false : true, // simple heuristic
        })

        if (result.success) {
          console.log(`[RealBet] On-chain game created for room ${roomId}`)
          io.to(roomId).emit('real-bet-created', { txHash: result.txHash })
        } else {
          console.error(`[RealBet] Failed to create on-chain game: ${result.error}`)
        }
      }
    }

    const player = { id: socket.id, username, socketId: socket.id }

    // Assign color
    if (!room.players.white) {
      room.players.white = player
      socket.join(roomId)
      socket.emit('room-joined', { color: 'w', fen: room.fen, opponent: 'Menunggu lawan...' })
    } else if (!room.players.black) {
      room.players.black = player
      socket.join(roomId)
      room.status = 'playing'

      socket.emit('room-joined', { 
        color: 'b', 
        fen: room.fen, 
        opponent: room.players.white?.username 
      })
      io.to(roomId).emit('opponent-joined', username)
    } else {
      socket.emit('room-full')
      return
    }
  })

  socket.on('make-move', ({ roomId, fen, san, captured }) => {
    const room = rooms.get(roomId)
    if (!room) return

    room.fen = fen
    io.to(roomId).emit('move-made', { fen, san, captured })
  })

  socket.on('resign', ({ roomId }) => {
    const room = rooms.get(roomId)
    if (!room) return
    room.status = 'finished'
    io.to(roomId).emit('game-ended', { winner: 'opponent', reason: 'Lawan menyerah' })
  })

  socket.on('offer-draw', ({ roomId }) => {
    io.to(roomId).emit('draw-offered')
  })

  socket.on('game-over', async ({ roomId, reason, winnerAddress, winnerUsername }) => {
    const room = rooms.get(roomId)
    if (!room) return
    room.status = 'finished'
    
    // Real Spingu Token payout via Smart Contract
    if (room.isRealBet && room.stake > 0 && winnerAddress && blockchainEnabled) {
      console.log(`[RealBet] Game ${roomId} ended. Resolving on-chain...`)

      const result = await resolveGameOnChain({
        roomId,
        winnerAddress,
      })

      if (result.success) {
        const payoutFormatted = result.payout ? ethers.formatUnits(result.payout, 18) : '0'
        const feeFormatted = result.fee ? ethers.formatUnits(result.fee, 18) : '0'

        io.to(roomId).emit('game-ended', {
          winner: winnerUsername || 'unknown',
          reason: reason || 'Game finished',
          isRealBet: true,
          payout: payoutFormatted,
          fee: feeFormatted,
          txHash: result.txHash,
        })
        console.log(`[RealBet] On-chain resolution successful for ${roomId}`)
      } else {
        console.error(`[RealBet] Failed to resolve on-chain: ${result.error}`)
        io.to(roomId).emit('game-ended', {
          winner: winnerUsername || 'unknown',
          reason: reason || 'Game finished (on-chain resolution failed)',
          isRealBet: true,
          error: result.error,
        })
      }
      return
    }

    // Legacy virtual token payout
    if (room.stake > 0) {
      io.to(roomId).emit('game-ended', { winner: winnerUsername || 'unknown', reason, payout: 0 })
    }
  })

  socket.on('disconnect', () => {
    // Find room and notify
    for (const [id, room] of rooms) {
      if (room.players.white?.socketId === socket.id || room.players.black?.socketId === socket.id) {
        io.to(id).emit('opponent-disconnected')
        room.status = 'finished'
      }
    }
  })
})

// Health
app.get('/health', (_, res) => res.json({ 
  ok: true, 
  rooms: rooms.size,
  blockchainEnabled,
  escrow: process.env.SPINGU_CHESS_ESCROW || 'not configured'
}))

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Catur Arena Server running on http://localhost:${PORT} (accessible on LAN at your-ip:${PORT})`)
  if (blockchainEnabled) {
    console.log('   🔗 Real Spingu Token betting is ENABLED')
  } else {
    console.log('   ⚠️  Real Spingu Token betting is DISABLED (configure .env)')
  }
})
