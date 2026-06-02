import { useState, useEffect, useCallback, useRef } from 'react'
import type { Square } from 'chess.js'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { Bot, RotateCcw, Flag, Handshake, ArrowLeft, Play } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getBestMove, getLegalMoves } from '../lib/chessAI'
import type { Difficulty } from '../lib/chessAI'
import { useAuthStore } from '../store/authStore'
import { useWalletStore } from '../store/walletStore'
import { toast } from 'sonner'
import GameTabs from '../components/GameTabs'

const DIFFICULTIES: { key: Difficulty; label: string; desc: string; color: string }[] = [
  { key: 'pemula', label: 'Pemula', desc: 'Depth 1 • Cocok untuk belajar', color: '#22c55e' },
  { key: 'menengah', label: 'Menengah', desc: 'Depth 3 • Tantangan nyata', color: '#eab308' },
  { key: 'master', label: 'Master', desc: 'Depth 4 • Seperti Grandmaster', color: '#ef4444' },
]

const GAME_MODES = [
  { label: 'Blitz', time: 300, inc: 0 },
  { label: 'Rapid', time: 600, inc: 0 },
  { label: 'Classical', time: 1800, inc: 0 },
]

export default function VsAIPage() {
  const navigate = useNavigate()
  const { user, addTokens } = useAuthStore()

  const [game, setGame] = useState(new Chess())
  const [difficulty, setDifficulty] = useState<Difficulty>('menengah')
  const [selectedMode, setSelectedMode] = useState(0)
  const [timeLeft, setTimeLeft] = useState({ white: 600, black: 300 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [captured, setCaptured] = useState<{ white: string[]; black: string[] }>({ white: [], black: [] })
  const [gameOver, setGameOver] = useState<string | null>(null)
  const [playerColor] = useState<'w' | 'b'>('w')
  const [legalSquares, setLegalSquares] = useState<Square[]>([])

  // Responsive board + wallet for chat
  const [boardSize, setBoardSize] = useState(520)
  const boardContainerRef = useRef<HTMLDivElement>(null)

  const { address: walletAddress, isConnected: isWalletConnected } = useWalletStore()

  // Live chat player detection (for spingu-ai real bet: the human is the only "Pemain")
  const [playerAddresses, setPlayerAddresses] = useState<string[]>([])

  const currentGameMode = GAME_MODES[selectedMode]

  // Reset everything for new game
  const resetGame = useCallback(() => {
    const newGame = new Chess()
    setGame(newGame)
    setTimeLeft({ white: currentGameMode.time, black: currentGameMode.time })
    setMoveHistory([])
    setCaptured({ white: [], black: [] })
    setGameOver(null)
    setIsPlaying(false)
    setIsThinking(false)
    setLegalSquares([])
  }, [currentGameMode.time])

  // Start a new game
  const startGame = () => {
    resetGame()
    setIsPlaying(true)
    toast.success(`Permainan dimulai • Level ${DIFFICULTIES.find(d => d.key === difficulty)?.label}`)
  }

  // Timer
  useEffect(() => {
    if (!isPlaying || gameOver) return

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        const turn = game.turn()
        const newTime = { ...prev }
        
        if (turn === 'w') {
          newTime.white = Math.max(0, prev.white - 1)
        } else {
          newTime.black = Math.max(0, prev.black - 1)
        }

        if (newTime.white === 0) {
          setGameOver('Waktu putih habis. AI menang!')
          setIsPlaying(false)
        } else if (newTime.black === 0) {
          setGameOver('Waktu AI habis. Anda menang!')
          setIsPlaying(false)
          addTokens(120)
        }
        return newTime
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isPlaying, gameOver, game, addTokens])

  // AI Move
  const makeAIMove = useCallback(async () => {
    if (game.turn() !== 'b' || gameOver || !isPlaying) return

    setIsThinking(true)

    // Small delay to feel natural + simulate thinking
    await new Promise(resolve => setTimeout(resolve, difficulty === 'master' ? 620 : 340))

    const bestMove = getBestMove(game, difficulty)

    if (bestMove) {
      const moveObj = game.move(bestMove)
      if (moveObj) {
        const newGame = new Chess(game.fen())
        setGame(newGame)

        // Record captured
        if (moveObj.captured) {
          const piece = moveObj.captured.toUpperCase()
          setCaptured(prev => ({
            ...prev,
            white: [...prev.white, piece],
          }))
        }

        setMoveHistory(prev => [...prev, moveObj.san])

        // Check game end
        if (newGame.isGameOver()) {
          handleGameEnd(newGame)
        }
      }
    }
    setIsThinking(false)
  }, [game, difficulty, gameOver, isPlaying])

  // Trigger AI when it's black's turn
  useEffect(() => {
    if (isPlaying && !gameOver && game.turn() === 'b') {
      makeAIMove()
    }
  }, [game, isPlaying, gameOver, makeAIMove])

  // Responsive board sizing (mobile dApp wallets, portrait Android Bitget etc)
  useEffect(() => {
    const updateSize = () => {
      let containerW = window.innerWidth - 32
      if (boardContainerRef.current) {
        containerW = boardContainerRef.current.clientWidth || containerW
      }
      const vw = window.visualViewport?.width || window.innerWidth
      const vh = window.visualViewport?.height || window.innerHeight

      const isMobile = vw < 640
      const hPad = isMobile ? 6 : 12
      const reserved = isMobile ? 175 : 140

      const availW = Math.max(200, containerW - hPad)
      const availH = Math.max(200, vh - reserved)

      let size = Math.min(availW, availH, 540)
      size = Math.max(isMobile ? 245 : 280, Math.floor(size))
      setBoardSize(size)
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    window.addEventListener('orientationchange', updateSize)
    if (window.visualViewport) window.visualViewport.addEventListener('resize', updateSize)

    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(updateSize)
      if (boardContainerRef.current) ro.observe(boardContainerRef.current)
    }
    return () => {
      window.removeEventListener('resize', updateSize)
      window.removeEventListener('orientationchange', updateSize)
      if (window.visualViewport) window.visualViewport.removeEventListener('resize', updateSize)
      if (ro) ro.disconnect()
    }
  }, [])

  // For real-bet AI games (spingu-ai): the connected wallet is the Pemain
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const isReal = searchParams.get('real') === '1' || searchParams.get('real') === 'true'

    if (isReal && walletAddress) {
      setPlayerAddresses([walletAddress.toLowerCase()])
    } else if (isWalletConnected && walletAddress) {
      // even non-real, if wallet connected treat as player for chat
      setPlayerAddresses([walletAddress.toLowerCase()])
    }
  }, [walletAddress, isWalletConnected])

  const handleGameEnd = (g: Chess) => {
    setIsPlaying(false)
    let message = ''

    if (g.isCheckmate()) {
      const winner = g.turn() === 'w' ? 'AI' : 'Anda'
      message = `Skakmat! ${winner} menang.`
      if (winner === 'Anda') addTokens(180)
    } else if (g.isDraw() || g.isStalemate() || g.isThreefoldRepetition()) {
      message = 'Permainan berakhir remis.'
      addTokens(40)
    } else {
      message = 'Permainan selesai.'
    }
    setGameOver(message)
    toast.info(message)
  }

  // Player move handler
  const onPieceDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (!isPlaying || gameOver || game.turn() !== playerColor) return false

    const move = game.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q',
    })

    if (!move) return false

    const newGame = new Chess(game.fen())
    setGame(newGame)
    setLegalSquares([])

    // Captured
    if (move.captured) {
      setCaptured(prev => ({
        ...prev,
        black: [...prev.black, move.captured!.toUpperCase()],
      }))
    }

    setMoveHistory(prev => [...prev, move.san])

    if (newGame.isGameOver()) {
      handleGameEnd(newGame)
    }

    return true
  }

  // Highlight legal moves
  const onSquareClick = (square: Square) => {
    if (!isPlaying || gameOver || game.turn() !== playerColor) {
      setLegalSquares([])
      return
    }

    const piece = game.get(square)
    if (piece && piece.color === playerColor) {
      const moves = getLegalMoves(game, square)
      setLegalSquares(moves)
    } else if (legalSquares.length > 0) {
      // Try to move
      const moveAttempt = game.move({
        from: game.history({ verbose: true }).pop()?.from || square,
        to: square,
        promotion: 'q',
      })

      if (moveAttempt) {
        const newGame = new Chess(game.fen())
        setGame(newGame)
        setLegalSquares([])

        if (moveAttempt.captured) {
          setCaptured(prev => ({ ...prev, black: [...prev.black, moveAttempt.captured!.toUpperCase()] }))
        }
        setMoveHistory(prev => [...prev, moveAttempt.san])

        if (newGame.isGameOver()) handleGameEnd(newGame)
      } else {
        setLegalSquares([])
      }
    }
  }

  // Resign
  const handleResign = () => {
    if (!isPlaying) return
    setIsPlaying(false)
    setGameOver('Anda menyerah. AI menang.')
    toast.error('Anda menyerah')
  }

  // Offer draw
  const handleDraw = () => {
    if (!isPlaying) return
    const accept = window.confirm('Minta remis? AI akan menerima (demo).')
    if (accept) {
      setIsPlaying(false)
      setGameOver('Permainan berakhir remis (draw offer diterima).')
      addTokens(60)
    }
  }

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60)
    const s = sec % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const currentTurn = game.turn() === 'w' ? 'Anda (Putih)' : 'AI (Hitam)'

  return (
    <div className="max-w-[1080px] mx-auto px-0.5">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/')} className="btn btn-secondary px-3 py-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <div className="font-bold text-3xl tracking-tight">Lawan AI</div>
          <div className="text-[#94a3b8]">Pilih level dan main catur klasik</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* LEFT: Board */}
        <div className="lg:col-span-7">
          <div ref={boardContainerRef} className="board-wrapper flex justify-center">
            <div style={{ width: boardSize, height: boardSize, maxWidth: '100%' }}>
              <Chessboard
                options={{
                  position: game.fen(),
                  onPieceDrop: ({ sourceSquare, targetSquare }: any) => onPieceDrop(sourceSquare as any, targetSquare as any),
                  onSquareClick: ({ square }: any) => onSquareClick(square as any),
                  boardOrientation: 'white',
                  chessboardRows: 8,
                  boardWidth: boardSize,
                  // Classic wood board
                  lightSquareStyle: { backgroundColor: '#f0d9b5' },
                  darkSquareStyle: { backgroundColor: '#b58863' },
                  squareStyles: legalSquares.reduce((acc: any, sq) => {
                    acc[sq] = { background: 'rgba(34, 197, 94, 0.55)' }
                    return acc
                  }, {}),
                } as any}
              />
            </div>
          </div>

          {/* Player / AI Info */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className={`card p-3 flex items-center justify-between ${game.turn() === 'w' && isPlaying ? 'ring-1 ring-emerald-500' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-xl">♔</div>
                <div>
                  <div className="font-semibold">{user?.username || 'Anda'}</div>
                  <div className="text-xs text-[#94a3b8]">Putih • {user?.rating || 1280} Elo</div>
                </div>
              </div>
              <div className={`clock ${game.turn() === 'w' && isPlaying ? 'active' : ''}`}>
                {formatTime(timeLeft.white)}
              </div>
            </div>

            <div className={`card p-3 flex items-center justify-between ${game.turn() === 'b' && isPlaying ? 'ring-1 ring-emerald-500' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#1c202c] flex items-center justify-center text-xl">♚</div>
                <div>
                  <div className="font-semibold flex items-center gap-2">
                    AI <Bot className="w-4 h-4" />
                  </div>
                  <div className="text-xs text-[#94a3b8]">{DIFFICULTIES.find(d => d.key === difficulty)?.label}</div>
                </div>
              </div>
              <div className={`clock ${game.turn() === 'b' && isPlaying ? 'active' : ''}`}>
                {formatTime(timeLeft.black)}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Controls + Tabs (Moves + Live Chat) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Difficulty Selector - tetap terlihat */}
          <div className="card p-4 md:p-5">
            <div className="font-semibold mb-2 flex items-center gap-2 text-sm">
              <Bot className="w-4 h-4" /> Level AI
            </div>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(d => (
                <button
                  key={d.key}
                  disabled={isPlaying}
                  onClick={() => setDifficulty(d.key)}
                  className={`p-2.5 rounded-xl border text-left transition text-xs md:text-sm ${difficulty === d.key ? 'border-emerald-500 bg-emerald-500/5' : 'border-[#2a2f3d] hover:bg-[#1c202c]'}`}
                >
                  <div className="font-semibold" style={{ color: d.color }}>{d.label}</div>
                  <div className="text-[10px] text-[#64748b] mt-0.5 hidden sm:block">{d.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tabs: Langkah + Chat — diletakkan di bawah papan (mobile friendly) */}
          <GameTabs
            moveHistory={moveHistory}
            captured={captured}
            gameStatus={currentTurn}
            isPlaying={isPlaying}
            roomId={(() => {
              // Untuk spingu-ai real bet, pakai room dari URL
              if (typeof window !== 'undefined') {
                const sp = new URLSearchParams(window.location.search)
                return sp.get('room') || null
              }
              return null
            })()}
            playerAddresses={playerAddresses}
            currentUserAddress={walletAddress}
            currentUsername={user?.username}
          />

          {/* Time mode tetap di bawah tabs (kompak) */}
          <div className="card p-4 md:p-5">
            <div className="font-semibold mb-2 text-sm">Mode Waktu</div>
            <div className="flex gap-2">
              {GAME_MODES.map((m, i) => (
                <button
                  key={i}
                  disabled={isPlaying}
                  onClick={() => {
                    setSelectedMode(i)
                    setTimeLeft({ white: m.time, black: m.time })
                  }}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${selectedMode === i ? 'border-emerald-500 bg-emerald-500/5' : 'border-[#2a2f3d]'}`}
                >
                  {m.label} ({Math.floor(m.time / 60)}m)
                </button>
              ))}
            </div>

            {/* Status + Actions (di dalam card waktu agar rapi) */}
            <div className="mt-4 pt-3 border-t border-[#2a2f3d]">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-xs text-[#94a3b8]">GILIRAN</div>
                  <div className="font-semibold text-base">{currentTurn}</div>
                </div>
                {isThinking && (
                  <div className="badge badge-green flex items-center gap-1 text-xs">
                    <div className="w-1.5 h-1.5 bg-emerald-400 animate-pulse rounded-full" /> AI BERPIKIR
                  </div>
                )}
              </div>

              {!isPlaying ? (
                <div className="space-y-2">
                  <button onClick={startGame} className="btn btn-primary w-full py-2.5">
                    <Play className="w-4 h-4" /> MULAI PERTANDINGAN
                  </button>
                  {gameOver && (
                    <button onClick={resetGame} className="btn btn-secondary w-full py-2">
                      <RotateCcw className="w-4 h-4" /> Main Lagi
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={handleDraw} className="btn btn-secondary flex-1 py-2 text-sm">
                    <Handshake className="w-4 h-4" /> Tawar Remis
                  </button>
                  <button onClick={handleResign} className="btn btn-danger flex-1 py-2 text-sm">
                    <Flag className="w-4 h-4" /> Menyerah
                  </button>
                </div>
              )}

              {gameOver && (
                <div className="mt-3 p-2.5 bg-[#1c202c] rounded-lg text-xs border border-emerald-500/30 text-center font-medium">
                  {gameOver}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
