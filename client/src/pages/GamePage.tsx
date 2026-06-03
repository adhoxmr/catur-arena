import { useState, useEffect, useRef } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import type { Square } from 'chess.js'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { Flag, Handshake, ArrowLeft, Users } from 'lucide-react'
import { io, Socket } from 'socket.io-client'
import { useAuthStore } from '../store/authStore'
import { useWalletStore } from '../store/walletStore'
import { getLegalMoves } from '../lib/chessAI'
import { toast } from 'sonner'
import GameTabs from '../components/GameTabs'
import { 
  approveSpingu, 
  depositToEscrow, 
  generateGameId, 
  parseSpingu, 
  SPINGU_CHESS_ESCROW 
} from '../lib/satuchain'

let socket: Socket | null = null

export default function GamePage() {
  const { mode } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, addTokens } = useAuthStore()
  const { 
    address: walletAddress, 
    isConnected: isWalletConnected, 
    autoConnect, 
    connect,
    isLoading: isWalletLoading,
    ensureCorrectNetwork
  } = useWalletStore()

  const isOnline = mode === 'online' || mode === 'spingu-ai'
  const roomId = searchParams.get('room') || 'LOCAL'
  const stake = parseInt(searchParams.get('stake') || '0')
  const timeControl = searchParams.get('time') || '10+0'
  const isRealBet = searchParams.get('real') === '1' || searchParams.get('real') === 'true'
  const treasuryAddressFromUrl = searchParams.get('treasury') || undefined

  const [game, setGame] = useState(new Chess())
  const [timeLeft, setTimeLeft] = useState({ white: 600, black: 600 })
  const [isPlaying, setIsPlaying] = useState(false)
  const [moveHistory, setMoveHistory] = useState<string[]>([])
  const [captured, setCaptured] = useState({ white: [] as string[], black: [] as string[] })
  const [gameOver, setGameOver] = useState<string | null>(null)
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>('w')
  const [opponent, setOpponent] = useState('Menunggu lawan...')
  const [legalSquares, setLegalSquares] = useState<Square[]>([])
  const [connected, setConnected] = useState(false)
  const [boardSize, setBoardSize] = useState(600)
  const boardContainerRef = useRef<HTMLDivElement>(null)

  // For Live Chat [Pemain] vs [Penonton] detection
  const [playerAddresses, setPlayerAddresses] = useState<string[]>([])

  // Real bet deposit state
  const [isDepositing, setIsDepositing] = useState(false)
  const [deposited, setDeposited] = useState(false)

  // Highly responsive board sizing for mobile dApp wallets (Bitget Android webview etc.)
  // Uses container measurement + visualViewport + orientation for reliable auto-adjust in narrow portrait webviews.
  useEffect(() => {
    const updateSize = () => {
      // Prefer measuring the actual parent column width (accounts for grid, main paddings, etc.)
      let containerW = window.innerWidth - 32
      if (boardContainerRef.current) {
        containerW = boardContainerRef.current.clientWidth || containerW
      }

      const vw = window.visualViewport?.width || window.innerWidth
      const vh = window.visualViewport?.height || window.innerHeight

      // On mobile portrait: board should dominate but leave space for clocks + controls + nav
      const isMobile = vw < 640
      const horizontalPad = isMobile ? 8 : 16
      const reservedForUI = isMobile ? 195 : 155   // nav + header + player bars + buttons area + safe margin. Tune for no overflow

      const availW = Math.max(200, containerW - horizontalPad)
      const availH = Math.max(200, vh - reservedForUI)

      let size = Math.min(availW, availH, 580)
      size = Math.max(isMobile ? 250 : 280, Math.floor(size))

      setBoardSize(size)
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    window.addEventListener('orientationchange', updateSize)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateSize)
    }

    // Observe the actual board container for layout changes (webview chrome, keyboard, etc)
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

  // Auto connect wallet for real bet games (supports Bitget, MetaMask, etc.)
  // In dApp wallet browser, this will auto trigger when page loads inside the wallet.
  useEffect(() => {
    if (isRealBet && !isWalletConnected && !isWalletLoading && typeof window !== 'undefined') {
      const hasProvider = !!(window.ethereum || window.bitget);
      if (hasProvider) {
        // Small delay to ensure provider is fully ready in dApp browser context
        const timer = setTimeout(() => {
          autoConnect().then((success) => {
            if (!success) {
              connect().catch(() => {});
            }
          });
        }, 500);
        return () => clearTimeout(timer);
      } else {
        autoConnect();
      }
    }
  }, [isRealBet]);

  // For real bet MULTIPLAYER only: auto deposit stake to escrow when wallet ready.
  // (AI uses direct treasury transfer in SpinguArenaPage)
  useEffect(() => {
    if (
      isRealBet &&
      !treasuryAddressFromUrl && // only for multiplayer (not AI)
      isWalletConnected &&
      walletAddress &&
      roomId &&
      stake > 0 &&
      !deposited &&
      !isDepositing
    ) {
      const doDeposit = async () => {
        setIsDepositing(true)
        try {
          const ok = await ensureCorrectNetwork()
          if (!ok) throw new Error('Gagal memastikan jaringan SatuChain')

          const { getProvider } = await import('../lib/satuchain')
          const provider = await getProvider()
          const signer = await provider.getSigner()

          const gameId = generateGameId(roomId)
          const betBigInt = parseSpingu(stake.toString())

          toast.loading('Approving Spingu Token ke Escrow...', { id: 'real-deposit' })
          await approveSpingu(SPINGU_CHESS_ESCROW, betBigInt, signer)

          toast.loading('Mengirim taruhan ke Escrow...', { id: 'real-deposit' })
          await depositToEscrow(gameId, signer)

          toast.success('Taruhan berhasil dideposit ke escrow', { id: 'real-deposit' })
          setDeposited(true)
        } catch (err: any) {
          console.error('Real bet deposit error:', err)
          if (err.code === 'ACTION_REJECTED') {
            toast.error('Deposit dibatalkan oleh pemain', { id: 'real-deposit' })
          } else if (
            err.message?.toLowerCase().includes('deposited') ||
            err.reason?.toLowerCase().includes('deposited') ||
            err.message?.toLowerCase().includes('already')
          ) {
            toast.info('Taruhan sudah dideposit sebelumnya', { id: 'real-deposit' })
            setDeposited(true)
          } else {
            toast.error(err.reason || err.message || 'Gagal deposit ke escrow', { id: 'real-deposit' })
          }
        } finally {
          setIsDepositing(false)
        }
      }
      doDeposit()
    }
  }, [isRealBet, treasuryAddressFromUrl, isWalletConnected, walletAddress, roomId, stake, deposited, isDepositing])

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`

  // Connect to server for online games
  useEffect(() => {
    if (!isOnline) return

    let SERVER = import.meta.env.VITE_SERVER_URL || 'http://localhost:4000'

    // For testing in dApp wallet browser on another device (phone), use the same host as the page
    if (typeof window !== 'undefined' && !import.meta.env.VITE_SERVER_URL) {
      const pageHost = window.location.hostname
      if (pageHost !== 'localhost' && pageHost !== '127.0.0.1') {
        SERVER = `http://${pageHost}:4000`
      }
    }
    
    socket = io(SERVER, { transports: ['websocket'] })

    socket.on('connect', () => {
      setConnected(true)

      const joinPayload: any = { 
        roomId, 
        username: user?.username || 'Guest', 
        stake 
      }

      // For real Spingu token bets, send wallet + treasury info
      if (isRealBet) {
        joinPayload.isRealBet = true
        joinPayload.playerAddress = walletAddress
        if (treasuryAddressFromUrl) {
          joinPayload.treasuryAddress = treasuryAddressFromUrl
        }
      }

      socket!.emit('join-room', joinPayload)
    })

    socket.on('room-joined', (data: any) => {
      if (data.color) setPlayerColor(data.color)
      if (data.opponent) setOpponent(data.opponent)
      if (data.fen) {
        const g = new Chess(data.fen)
        setGame(g)
      }
      if (data.playerAddresses && Array.isArray(data.playerAddresses)) {
        setPlayerAddresses(data.playerAddresses)
      }
      // Pastikan alamat wallet sendiri selalu masuk (untuk kasus AI atau real bet)
      if (isRealBet && walletAddress) {
        setPlayerAddresses(prev => Array.from(new Set([...prev, walletAddress.toLowerCase()])))
      }
      if (data.isSpectator) {
        toast.info('Anda bergabung sebagai penonton. Bisa ikut chat!')
      } else {
        toast.success(`Anda bermain sebagai ${data.color === 'w' ? 'PUTIH' : 'HITAM'}`)
      }
      setIsPlaying(true)
    })

    socket.on('opponent-joined', (name: string) => {
      setOpponent(name)
      toast.success(`${name} bergabung! Pertandingan dimulai.`)
    })

    // Real-bet: server mengirim update daftar alamat pemain (untuk tag chat)
    socket.on('players-updated', (data: { playerAddresses: string[] }) => {
      if (data.playerAddresses) {
        setPlayerAddresses(data.playerAddresses)
      }
    })

    socket.on('game-cancelled', (data: any) => {
      setIsPlaying(false)
      const msg = data.reason || 'Game dibatalkan'
      setGameOver(msg)
      if (data.txHash) {
        toast.success(`${msg} (Tx: ${data.txHash.slice(0,10)}...)`)
      } else if (data.error) {
        toast.error(`${msg} - ${data.error}`)
      } else {
        toast.info(msg)
      }
      // Navigate after cancel
      setTimeout(() => {
        navigate('/spingu')
      }, 1500)
    })

    socket.on('move-made', (data: { fen: string; san: string; captured?: string }) => {
      const g = new Chess(data.fen)
      setGame(g)
      setMoveHistory(prev => [...prev, data.san])
      if (data.captured) {
        const capColor = game.turn() === 'w' ? 'black' : 'white'
        setCaptured(prev => ({ ...prev, [capColor]: [...prev[capColor as 'white' | 'black'], data.captured!.toUpperCase()] }))
      }
    })

    socket.on('game-ended', (data: any) => {
      setIsPlaying(false)

      if (data.isRealBet) {
        // Real Spingu Token result
        const youWon = data.winner === user?.username || data.winner === walletAddress
        let msg = data.reason || 'Permainan selesai'

        if (data.payout) {
          msg += ` • Menang ${data.payout} SPINGU`
        }
        if (data.txHash) {
          msg += ` (Tx: ${data.txHash.slice(0, 10)}...)`
        }
        if (data.error) {
          msg += ` (Warning: ${data.error})`
        }

        setGameOver(msg)
        toast[youWon ? 'success' : 'error'](msg)
        return
      }

      // Legacy virtual token flow
      const youWon = data.winner === user?.username || (data.winner === 'white' && playerColor === 'w')
      let msg = data.reason
      if (youWon && stake > 0) {
        const winAmount = Math.floor(stake * 1.9)
        addTokens(winAmount + stake)
        msg += ` • +${winAmount} token`
      }
      setGameOver(msg)
      toast[youWon ? 'success' : 'error'](msg)
    })

    socket.on('opponent-disconnected', () => {
      toast.error('Lawan terputus. Anda menang.')
      setIsPlaying(false)
      if (stake > 0) addTokens(Math.floor(stake * 1.85))
      setGameOver('Lawan meninggalkan permainan.')
    })

    return () => {
      socket?.disconnect()
      socket = null
    }
  }, [isOnline, roomId, user, stake, playerColor])

  // Local timer (for both modes)
  useEffect(() => {
    if (!isPlaying || gameOver) return
    const id = setInterval(() => {
      setTimeLeft(prev => {
        const t = { ...prev }
        const turn = game.turn()
        if (turn === 'w') t.white = Math.max(0, t.white - 1)
        else t.black = Math.max(0, t.black - 1)

        if (t.white <= 0 || t.black <= 0) {
          setIsPlaying(false)
          const loser = t.white <= 0 ? 'Putih' : 'Hitam'
          setGameOver(`Waktu ${loser} habis.`)
        }
        return t
      })
    }, 1000)
    return () => clearInterval(id)
  }, [isPlaying, gameOver, game])

  // Send move to server
  const sendMoveToServer = (move: any, newFen: string) => {
    if (socket && isOnline) {
      socket.emit('make-move', {
        roomId,
        fen: newFen,
        san: move.san,
        captured: move.captured || null,
      })
    }
  }

  const onPieceDrop = (source: Square, target: Square): boolean => {
    if (!isPlaying || gameOver) return false
    if (isOnline && game.turn() !== playerColor) return false

    const move = game.move({ from: source, to: target, promotion: 'q' })
    if (!move) return false

    const newGame = new Chess(game.fen())
    setGame(newGame)

    if (move.captured) {
      const cap = game.turn() === 'w' ? 'black' : 'white'
      setCaptured(c => ({ ...c, [cap]: [...c[cap as 'white'|'black'], move.captured!.toUpperCase()] }))
    }
    setMoveHistory(h => [...h, move.san])
    setLegalSquares([])

    sendMoveToServer(move, newGame.fen())

    if (newGame.isGameOver()) {
      handleLocalGameEnd(newGame)
    }
    return true
  }

  const onSquareClick = (square: Square) => {
    if (!isPlaying || gameOver) return
    if (isOnline && game.turn() !== playerColor) return

    const piece = game.get(square)
    if (piece && piece.color === (isOnline ? playerColor : game.turn())) {
      setLegalSquares(getLegalMoves(game, square))
    } else if (legalSquares.length) {
      const lastFrom = game.history({ verbose: true }).at(-1)?.from || ''
      const move = game.move({ from: lastFrom || square, to: square, promotion: 'q' })
      if (move) {
        const ng = new Chess(game.fen())
        setGame(ng)
        setLegalSquares([])
        if (move.captured) setCaptured(c => ({ ...c, black: [...c.black, move.captured!.toUpperCase()] }))
        setMoveHistory(h => [...h, move.san])
        sendMoveToServer(move, ng.fen())
        if (ng.isGameOver()) handleLocalGameEnd(ng)
      } else setLegalSquares([])
    }
  }

  const handleLocalGameEnd = (g: Chess) => {
    setIsPlaying(false)
    let msg = ''
    let winnerAddr: string | undefined

    if (g.isCheckmate()) {
      const winnerColor = g.turn() === 'w' ? 'b' : 'w' // the one who just moved wins
      const winnerName = winnerColor === playerColor ? (user?.username || 'Anda') : opponent

      msg = `Skakmat! ${winnerName} menang.`

      // For real bets, we need to send the actual wallet address of the winner
      if (isRealBet && isWalletConnected && walletAddress) {
        winnerAddr = (winnerColor === playerColor) ? walletAddress : undefined
        // If we don't know opponent's address, backend will need to handle or we pass the known one
      }
    } else {
      msg = 'Permainan berakhir remis.'
    }

    setGameOver(msg)

    if (isOnline && socket) {
      const payload: any = { roomId, reason: msg }
      if (winnerAddr) payload.winnerAddress = winnerAddr
      if (user?.username) payload.winnerUsername = user.username

      socket.emit('game-over', payload)
    }
  }

  const resign = () => {
    if (!isPlaying) return
    setIsPlaying(false)
    setGameOver('Anda menyerah.')

    if (isOnline && socket) {
      const payload: any = { roomId }
      if (isRealBet && walletAddress) {
        // When resigning, the opponent wins
        payload.reason = 'Anda menyerah'
        // We can let backend know the winner is the other side, but for simplicity we emit game-over
        socket.emit('game-over', {
          roomId,
          reason: 'Anda menyerah',
          winnerAddress: undefined, // backend may need opponent address or handle as loss
          winnerUsername: opponent
        })
        return
      }
      socket.emit('resign', payload)
    }

    if (stake > 0 && !isRealBet) toast.info('Taruhan hangus karena menyerah')
  }

  const offerDraw = () => {
    if (!isPlaying) return
    if (isOnline && socket) {
      socket.emit('offer-draw', { roomId })
      toast.info('Permintaan remis dikirim...')
    } else {
      if (window.confirm('Lawan setuju remis?')) {
        setIsPlaying(false)
        setGameOver('Remis disepakati.')
        if (stake > 0) addTokens(Math.floor(stake * 0.95))
      }
    }
  }

  // Cancel real bet if no opponent joins - backend will call cancel on-chain using operator (refunds deposits)
  const handleCancelBet = async () => {
    if (!isRealBet || !roomId || !walletAddress) return
    if (!window.confirm('Batalkan pertandingan? Taruhan akan dikembalikan ke wallet Anda.')) return

    try {
      await ensureCorrectNetwork()
    } catch (e) {
      toast.error('Pastikan wallet Anda berada di jaringan SatuChain sebelum membatalkan.')
      return
    }

    toast.loading('Mengirim permintaan pembatalan ke server...', { id: 'cancel-bet' })

    if (socket) {
      socket.emit('cancel-room', { roomId })
    }

    // The 'game-cancelled' event listener will handle the result, toast, and navigation.
    // Backend operator will call cancelGame on-chain (authorized).
  }

  const startLocalGame = () => {
    const baseTime = parseInt(timeControl) * 60 || 600
    setTimeLeft({ white: baseTime, black: baseTime })
    setGame(new Chess())
    setIsPlaying(true)
    setMoveHistory([])
    setCaptured({ white: [], black: [] })
    setGameOver(null)
    toast.success('Permainan lokal dimulai')
  }

  return (
    <div className="max-w-[1040px] mx-auto px-0.5">
      <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-5">
        <button onClick={() => navigate(isOnline ? '/online' : '/vs-ai')} className="btn btn-secondary px-2 py-1.5 md:px-3 md:py-2">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-bold text-lg md:text-2xl flex items-center gap-2 flex-wrap">
            {isOnline ? 'Pertandingan Online' : 'Permainan Lokal'} 
            {stake > 0 && (
              <span className="text-emerald-400 text-base md:text-xl">
                • {stake.toLocaleString()} {isRealBet ? 'SPINGU' : 'TOKEN'}
              </span>
            )}
            {isRealBet && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gradient-to-r from-emerald-500 to-teal-500 text-black font-bold">REAL</span>
            )}
          </div>
          <div className="text-xs md:text-sm text-[#94a3b8] truncate">{timeControl} • {roomId}</div>
        </div>
        {isOnline && (
          <div className="ml-auto flex items-center gap-1.5 text-[10px] md:text-xs px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-emerald-500/10 text-emerald-400 whitespace-nowrap">
            <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-red-400'}`} /> {connected ? 'ONLINE' : '...'}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Board + Clocks (mobile first: board full width, clocks directly below it) */}
        <div className="lg:col-span-7">
          <div ref={boardContainerRef} className="flex justify-center">
            <div className="board-wrapper" style={{ width: boardSize, height: boardSize, maxWidth: '100%' }}>
              <Chessboard
                options={{
                  position: game.fen(),
                  onPieceDrop: ({ sourceSquare, targetSquare }: any) => onPieceDrop(sourceSquare as any, targetSquare as any),
                  onSquareClick: ({ square }: any) => onSquareClick(square as any),
                  boardOrientation: playerColor === 'w' ? 'white' : 'black',
                  chessboardRows: 8,
                  boardWidth: boardSize,
                  // Classic wood board look
                  lightSquareStyle: { backgroundColor: '#f0d9b5' },
                  darkSquareStyle: { backgroundColor: '#b58863' },
                  squareStyles: legalSquares.reduce((a: any, s) => ({ ...a, [s]: { background: 'rgba(34,197,94,0.55)' } }), {}),
                } as any}
              />
            </div>
          </div>

          {/* Player clocks - stacked on very small, or compact row. Always directly under board for mobile dApp */}
          <div className="mt-3 max-w-[min(100%,600px)] mx-auto space-y-2">
            {[
              { label: isOnline ? opponent : 'Lawan', color: playerColor === 'w' ? 'b' : 'w', time: playerColor === 'w' ? timeLeft.black : timeLeft.white },
              { label: user?.username || 'Anda', color: playerColor, time: playerColor === 'w' ? timeLeft.white : timeLeft.black },
            ].map((p, idx) => (
              <div key={idx} className={`card px-2.5 py-1.5 md:px-4 md:py-2 flex justify-between items-center ${game.turn() === p.color && isPlaying ? 'ring-1 ring-emerald-500' : ''}`}>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-xs md:text-sm truncate max-w-[120px]">{p.label}</div>
                  {p.color === playerColor && <div className="text-[9px] md:text-[10px] px-1 py-px bg-emerald-500 text-black rounded">ANDA</div>}
                </div>
                <div className={`clock text-base md:text-xl ${game.turn() === p.color && isPlaying ? 'active' : ''}`}>{formatTime(p.time)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: Status + Tabs (Moves + Live Chat) — on mobile this entire block sits BELOW the board + clocks */}
        <div className="lg:col-span-5 space-y-3 text-sm">
          {/* Status ringkas selalu terlihat */}
          <div className="card p-3 md:p-4">
            <div className="uppercase text-[10px] tracking-widest text-[#64748b] mb-1">STATUS</div>
            <div className="text-lg md:text-xl font-semibold leading-tight">
              {isPlaying ? `Giliran ${game.turn() === 'w' ? 'Putih' : 'Hitam'}` : gameOver || 'Menunggu'}
            </div>
            {isOnline && (
              <div className="text-xs text-[#94a3b8] mt-0.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" /> {opponent}
              </div>
            )}
          </div>

          {/* === TABS: LANGKAH + CHAT (Mobile-first, di bawah papan) === */}
          <GameTabs
            moveHistory={moveHistory}
            captured={captured}
            gameStatus={isPlaying ? `Giliran ${game.turn() === 'w' ? 'Putih' : 'Hitam'}` : gameOver || undefined}
            isPlaying={isPlaying}
            roomId={isOnline ? roomId : null}
            playerAddresses={playerAddresses}
            currentUserAddress={walletAddress}
            currentUsername={user?.username}
          />

          {/* Action buttons — selalu di bawah tabs */}
          <div className="card p-3 md:p-4 space-y-2">
            {!isPlaying && !isOnline && (
              <button onClick={startLocalGame} className="btn btn-primary w-full py-2.5 md:py-3">MULAI PERMAINAN</button>
            )}
            {isPlaying && (
              <>
                <button onClick={offerDraw} className="btn btn-secondary w-full py-2 md:py-2.5 text-sm"><Handshake className="w-4 h-4" /> Tawarkan Remis</button>
                <button onClick={resign} className="btn btn-danger w-full py-2 md:py-2.5 text-sm"><Flag className="w-4 h-4" /> Menyerah</button>
              </>
            )}
            {isRealBet && isOnline && !isPlaying && !gameOver && (
              <button onClick={handleCancelBet} className="btn btn-secondary w-full py-2 md:py-2.5 text-sm">
                Batalkan Taruhan (Kembalikan ke Wallet)
              </button>
            )}
            {gameOver && (
              <>
                <div className="py-2.5 px-3 md:py-3 md:px-4 rounded-xl bg-emerald-500/10 text-emerald-400 font-medium text-center text-sm">{gameOver}</div>
                <button onClick={() => navigate(isOnline ? '/online' : '/vs-ai')} className="btn btn-primary w-full py-2.5">Kembali ke Lobby</button>
              </>
            )}
          </div>

          <button onClick={() => navigate('/')} className="text-xs text-[#64748b] flex items-center gap-1 mx-auto py-1">
            <ArrowLeft className="w-3 h-3" /> Kembali ke Beranda
          </button>
        </div>
      </div>
    </div>
  )
}
