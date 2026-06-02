import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Coins } from 'lucide-react'
import { ethers } from 'ethers'
import { useWalletStore } from '../store/walletStore'
import { 
  SPINGU_TOKEN_ADDRESS, 
  SPINGU_TREASURY_ADDRESS, 
  SPINGU_CHESS_ESCROW,
  GAME_FEE_PERCENT, 
  parseSpingu,
  formatSpingu,
  approveSpingu,
  getEscrowContract,
} from '../lib/satuchain'
import { toast } from 'sonner'

const PRESET_BETS = [50, 100, 250, 500, 1000, 2500]

export default function SpinguArenaPage() {
  const navigate = useNavigate()
  const { 
    isConnected, address: walletAddress, spinguBalanceRaw, spinguBalance, 
    connect, ensureCorrectNetwork, refreshBalance, isLoading, error 
  } = useWalletStore()

  const [mode, setMode] = useState<'ai' | 'multi'>('ai')
  const [betAmount, setBetAmount] = useState(100)
  const [customAmount, setCustomAmount] = useState('')
  const [isApproving, setIsApproving] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  // Auto-connect to EVM wallet (supports Bitget, MetaMask, etc.) on page load
  // IMPORTANT for dApp wallet browser (Bitget etc.): When you open the local URL (or production) 
  // inside the wallet's dApp browser, this will IMMEDIATELY detect the injected provider (Bitget's)
  // and auto-trigger the wallet connect prompt. This is the "otomatis konek ke wallet EVM".
  useEffect(() => {
    if (!isConnected && !isLoading && typeof window !== 'undefined') {
      const hasProvider = !!(window.ethereum || window.bitget);
      
      if (hasProvider) {
        // Small delay to ensure provider is fully ready in dApp browser context
        const timer = setTimeout(() => {
          // Provider detected (opened inside Bitget dApp browser or with extension) -> auto prompt connect
          // This makes it seamless: open URL in wallet -> wallet asks to connect automatically.
          connect().catch((err) => {
            console.log('Auto connect prompt (user may have cancelled or needs the force button):', err?.message);
          });
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, []); // Run once on mount

  const betBigInt = parseSpingu(betAmount.toString())
  const totalPot = betBigInt * 2n
  const fee = (totalPot * BigInt(GAME_FEE_PERCENT)) / 100n
  const winnerPayout = totalPot - fee

  const currentBet = customAmount ? parseInt(customAmount) || 0 : betAmount

  const handleStartAI = async () => {
    if (!isConnected || !walletAddress) {
      toast.error('Hubungkan wallet Spingu terlebih dahulu')
      return
    }

    if (spinguBalanceRaw < betBigInt) {
      toast.error('Saldo Spingu tidak cukup')
      return
    }

    if (SPINGU_TREASURY_ADDRESS === '0x0000000000000000000000000000000000000000') {
      toast.error('Treasury address belum diset. Hubungi admin.')
      return
    }

    setIsProcessing(true)

    try {
      await ensureCorrectNetwork()

      // 1. Approve dulu ke Treasury
      setIsApproving(true)
      toast.loading('Approving Spingu Token...', { id: 'approve' })

      const { getProvider } = await import('../lib/satuchain')
      const provider = await getProvider()
      const signer = await provider.getSigner()

      // Approve ke Escrow Contract (bukan treasury langsung)
      await approveSpingu(SPINGU_CHESS_ESCROW, betBigInt, signer)

      toast.success('Approval ke Escrow berhasil', { id: 'approve' })
      setIsApproving(false)

      // Deposit ke Escrow (ini yang akan dikunci sampai game selesai)
      toast.loading('Mengirim taruhan ke Smart Contract Escrow...', { id: 'deposit' })

      const escrow = await getEscrowContract(signer)
      // Note: Backend harus sudah memanggil createGame sebelumnya dengan gameId yang sama
      const gameIdBytes = ethers.keccak256(ethers.toUtf8Bytes(`spingu-ai-${Date.now()}`)) // contoh

      const tx = await escrow.deposit(gameIdBytes)
      await tx.wait()

      toast.success('Taruhan berhasil dikunci di Escrow Contract', { id: 'deposit' })

      toast.success('Taruhan berhasil dikunci di treasury', { id: 'transfer' })

      await refreshBalance()

      // Generate room ID and navigate to game with full real bet params
      const roomCode = 'SPG-' + Math.floor(100000 + Math.random() * 900000)
      navigate(`/game/spingu-ai?room=${roomCode}&stake=${betAmount}&real=1&treasury=${SPINGU_TREASURY_ADDRESS}`)
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Transaksi gagal')
    } finally {
      setIsProcessing(false)
      setIsApproving(false)
    }
  }

  const handleStartMultiplayer = () => {
    if (!isConnected || !walletAddress) {
      toast.error('Connect wallet untuk bermain dengan taruhan Spingu asli')
      return
    }
    // Untuk multiplayer real bet
    const roomCode = 'SPG-' + Math.floor(100000 + Math.random() * 900000)
    navigate(`/online?room=${roomCode}&stake=${currentBet}&real=1`)
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-semibold">Spingu Arena</h1>
        <p className="text-sm text-[#71717a] mt-1">
          Taruhan real dengan Spingu Token di SatuChain (3% fee)
        </p>
      </div>

      {/* Wallet Connection Section - shown only if not yet connected.
         On dApp wallet browser (Bitget etc), the useEffect will auto attempt connection. */}
      {!isConnected && (
        <div className="card p-5 md:p-8 text-center mb-6 md:mb-8 border border-emerald-500/40">
          <div className="mx-auto w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-3 md:mb-4">
            <Coins className="w-6 h-6 md:w-8 md:h-8 text-emerald-400" />
          </div>
          <h2 className="text-lg md:text-2xl font-bold mb-1.5">Hubungkan Wallet EVM</h2>
          <p className="text-[#94a3b8] mb-4 md:mb-6 max-w-md mx-auto text-xs md:text-sm">
            {typeof window !== 'undefined' && (window.ethereum || window.bitget) ? (
              <>Buka di <strong>Bitget dApp browser</strong> → auto connect aktif. Ketuk tombol jika tidak muncul popup.</>
            ) : (
              <>Buka URL ini di dalam <strong>browser Bitget Wallet</strong> (bukan browser biasa) untuk koneksi otomatis.</>
            )}
          </p>
          <button 
            onClick={connect} 
            disabled={isLoading}
            className="btn btn-secondary px-5 py-2 text-sm disabled:opacity-60"
          >
            {isLoading ? 'Connecting...' : 'Force Connect Wallet (Bitget / EVM)'}
          </button>
          <p className="text-[10px] md:text-xs text-[#64748b] mt-3 leading-snug">
            Test HP: jalankan <code>npm run dev:host</code>, buka <code>http://IP:5173/spingu</code> dari dalam Bitget.<br />
            Atau pakai ngrok untuk https.
          </p>
          {error && (
            <div className="mt-3 text-red-400 text-xs">
              Error: {error}
            </div>
          )}
        </div>
      )}

      {/* Show the rest of the page only when wallet is connected */}
      {isConnected && (
        <>
          {/* Connected Wallet Info */}
          <div className="mb-4 card p-3 text-sm">
            <div className="flex justify-between items-center">
              <div>
                <div className="text-[10px] text-[#52525b]">WALLET</div>
                <div className="font-mono text-xs break-all">{walletAddress}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-[#52525b]">SALDO</div>
                <div className="font-semibold text-emerald-600">{spinguBalance} SPINGU</div>
              </div>
            </div>
          </div>

          {/* Mode Tabs - simple */}
          <div className="flex gap-2 mb-4 text-sm">
            <button 
              onClick={() => setMode('ai')} 
              className={`flex-1 py-2 border ${mode === 'ai' ? 'border-white text-white' : 'border-[#27272a] text-[#71717a] hover:text-[#e4e4e7]'}`}
            >
              Lawan AI (Treasury match)
            </button>
            <button 
              onClick={() => setMode('multi')} 
              className={`flex-1 py-2 border ${mode === 'multi' ? 'border-white text-white' : 'border-[#27272a] text-[#71717a] hover:text-[#e4e4e7]'}`}
            >
              Multiplayer (Pemain vs Pemain)
            </button>
          </div>

          {/* Warning - simple */}
          <div className="text-xs border-l-2 border-amber-600 pl-2 text-[#71717a] mb-4">
            3% fee. Pastikan di jaringan SatuChain. Token: {SPINGU_TOKEN_ADDRESS}
          </div>

          {/* Bet Selector */}
          <div className="card p-6 mb-6">
            <div className="font-semibold mb-3">Jumlah Taruhan (per pemain)</div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-3">
              {PRESET_BETS.map((amt) => (
                <button 
                  key={amt}
                  onClick={() => { setBetAmount(amt); setCustomAmount('') }}
                  className={`py-2 border text-sm ${currentBet === amt ? 'border-white' : 'border-[#27272a] hover:border-[#3f3f46]'}`}
                >
                  {amt}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <input 
                type="number" 
                value={customAmount} 
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Jumlah custom..."
                className="input flex-1" 
              />
              <button onClick={() => setCustomAmount('')} className="btn btn-secondary px-6">Reset</button>
            </div>
          </div>

          {/* Pot Breakdown - plain */}
          <div className="card p-3 mb-5 text-sm">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="text-[10px] text-[#52525b]">Taruhan</div>
                <div className="font-semibold">{currentBet} SPINGU</div>
              </div>
              <div>
                <div className="text-[10px] text-[#52525b]">Total Pot</div>
                <div className="font-semibold">{(currentBet * 2)} SPINGU</div>
              </div>
              <div>
                <div className="text-[10px] text-red-500">Fee 3%</div>
                <div className="font-semibold text-red-500">-{formatSpingu(fee)}</div>
                <div className="text-[10px] mt-0.5 text-emerald-600">Menang: {formatSpingu(winnerPayout)}</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {mode === 'ai' ? (
            <div>
              <button 
                onClick={handleStartAI}
                disabled={!isConnected || isProcessing || currentBet < 10}
                className="btn btn-primary w-full py-2.5"
              >
                {isApproving ? 'Approving...' : isProcessing ? 'Memproses...' : 
                  `Lawan AI • Taruh ${currentBet} SPINGU`}
              </button>
              <div className="text-center text-xs text-[#52525b] mt-1">Treasury match • Kamu menang dapat 97%</div>
            </div>
          ) : (
            <button 
              onClick={handleStartMultiplayer}
              disabled={!isConnected || currentBet < 10}
              className="btn btn-primary w-full py-2.5"
            >
              Buat / Join Room • Taruh {currentBet} SPINGU
            </button>
          )}
        </>
      )}

      {/* Treasury Info - always visible, compact on mobile */}
      <div className="mt-6 md:mt-8 text-[10px] md:text-xs text-[#64748b] text-center break-all">
        Treasury: <span className="font-mono">{SPINGU_TREASURY_ADDRESS}</span><br className="md:hidden" />
        <span className="hidden md:inline"> • </span>Token: <span className="font-mono">{SPINGU_TOKEN_ADDRESS}</span>
      </div>
    </div>
  )
}
