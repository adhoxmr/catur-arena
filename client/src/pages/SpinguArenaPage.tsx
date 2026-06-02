import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bot, Users, AlertTriangle, Coins } from 'lucide-react'
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
    connect, autoConnect, ensureCorrectNetwork, refreshBalance, isLoading, error 
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
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 text-emerald-400 px-4 py-1 rounded-full text-sm font-medium mb-4">
          <Coins className="w-4 h-4" /> ON-CHAIN • SATUCHAIN
        </div>
        <h1 className="text-5xl font-bold tracking-tighter">Spingu Arena</h1>
        <p className="text-xl text-[#94a3b8] mt-2">
          Bertaruh dengan <span className="text-emerald-400 font-semibold">Spingu Token</span> asli di jaringan SatuChain.
          3% fee untuk operasional game.
        </p>
      </div>

      {/* Wallet Connection Section - shown only if not yet connected.
         On dApp wallet browser (Bitget etc), the useEffect will auto attempt connection. */}
      {!isConnected && (
        <div className="card p-6 md:p-8 text-center mb-8 border border-emerald-500/40">
          <div className="mx-auto w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <Coins className="w-7 h-7 md:w-8 md:h-8 text-emerald-400" />
          </div>
          <h2 className="text-xl md:text-2xl font-bold mb-2">Menghubungkan ke Wallet EVM...</h2>
          <p className="text-[#94a3b8] mb-6 max-w-md mx-auto text-sm md:text-base">
            {typeof window !== 'undefined' && (window.ethereum || window.bitget) ? (
              <>Terdeteksi wallet EVM (Bitget atau lainnya) di browser ini. <strong>Sedang mencoba otomatis konek</strong>. Periksa Bitget untuk approve koneksi ke aplikasi Catur.</>
            ) : (
              <>Buka halaman ini di dalam browser Bitget Wallet (atau wallet EVM lain) untuk koneksi otomatis.</>
            )}
            <br /><br />
            Untuk test di HP: buka URL IP komputer kamu (bukan localhost) dari dalam dApp browser wallet.
          </p>
          <button 
            onClick={connect} 
            disabled={isLoading}
            className="btn btn-secondary px-6 py-2 text-sm mt-2 disabled:opacity-60"
          >
            {isLoading ? 'Connecting...' : (typeof window !== 'undefined' && (window.ethereum || window.bitget) ? 'Force Connect (Bitget / EVM)' : 'Connect Wallet (Bitget / EVM) & Switch to SatuChain')}
          </button>
          <p className="text-xs text-[#64748b] mt-4">
            Pastikan kamu sudah punya Spingu Token di wallet ini.
            <br />
            <strong>Untuk test di Bitget dApp browser (HP):</strong> Jalankan <code>npm run dev:host</code> di client, lalu buka <code>http://IP-laptop:5173/spingu</code> dari dalam browser Bitget (bukan Chrome biasa). IP laptop: jalankan <code>ipconfig</code>.
            <br />
            Untuk https (lebih stabil untuk wallet): install ngrok, jalankan <code>ngrok http 5173</code>, buka https URL-nya di Bitget.
          </p>
          {error && (
            <div className="mt-4 text-red-400 text-sm">
              Error: {error}
            </div>
          )}
        </div>
      )}

      {/* Show the rest of the page only when wallet is connected */}
      {isConnected && (
        <>
          {/* Connected Wallet Info */}
          <div className="mb-6 flex items-center justify-between card p-4">
            <div>
              <div className="text-xs text-[#64748b]">CONNECTED</div>
              <div className="font-mono text-sm">{walletAddress}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-[#64748b]">SALDO SPINGU</div>
              <div className="text-2xl font-bold text-emerald-400">{spinguBalance} <span className="text-sm font-normal text-[#94a3b8]">SPINGU</span></div>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex gap-2 mb-6">
            <button 
              onClick={() => setMode('ai')} 
              className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${mode === 'ai' ? 'bg-emerald-500 text-black' : 'bg-[#1c202c] hover:bg-[#2a2f3d]'}`}
            >
              <Bot className="w-5 h-5" /> Lawan AI Spingu (Match Bet)
            </button>
            <button 
              onClick={() => setMode('multi')} 
              className={`flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${mode === 'multi' ? 'bg-emerald-500 text-black' : 'bg-[#1c202c] hover:bg-[#2a2f3d]'}`}
            >
              <Users className="w-5 h-5" /> Multiplayer (Taruhan Real)
            </button>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6 flex gap-3 text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-400">Penting</div>
              <ul className="text-[#cbd5e1] list-disc ml-4 mt-1 space-y-0.5">
                <li>3% dari total pot akan dipotong sebagai sewa Game Spingu.</li>
                <li>Saat lawan AI: Spingu Treasury otomatis match taruhan kamu dengan jumlah yang sama.</li>
                <li>Pastikan kamu sudah berada di jaringan <strong>SatuChain</strong>.</li>
                <li>Kontrak token: <span className="font-mono text-xs">{SPINGU_TOKEN_ADDRESS}</span></li>
              </ul>
            </div>
          </div>

          {/* Bet Selector */}
          <div className="card p-6 mb-6">
            <div className="font-semibold mb-3">Jumlah Taruhan (per pemain)</div>
            
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
              {PRESET_BETS.map((amt) => (
                <button 
                  key={amt}
                  onClick={() => { setBetAmount(amt); setCustomAmount('') }}
                  className={`py-3 rounded-xl border font-semibold transition ${currentBet === amt ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-[#2a2f3d] hover:bg-[#1c202c]'}`}
                >
                  {amt} SPINGU
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

          {/* Pot Breakdown */}
          <div className="card p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <div className="text-[#94a3b8]">Taruhan Kamu</div>
                <div className="text-3xl font-bold mt-1">{currentBet} <span className="text-base font-normal">SPINGU</span></div>
              </div>
              <div>
                <div className="text-[#94a3b8]">Total Pot (2× taruhan)</div>
                <div className="text-3xl font-bold mt-1">{(currentBet * 2).toLocaleString()} <span className="text-base font-normal">SPINGU</span></div>
              </div>
              <div className="border-l border-[#2a2f3d] pl-6">
                <div className="text-red-400">Fee 3% Spingu Game</div>
                <div className="text-3xl font-bold mt-1 text-red-400">-{formatSpingu(fee)} SPINGU</div>
                <div className="text-emerald-400 mt-2">Kamu menang → <span className="font-bold">{formatSpingu(winnerPayout)}</span> SPINGU</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {mode === 'ai' ? (
            <div>
              <button 
                onClick={handleStartAI}
                disabled={!isConnected || isProcessing || currentBet < 10}
                className="btn btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {isApproving ? 'Approving Token...' : isProcessing ? 'Memproses Transaksi...' : 
                  `Mulai Lawan AI Spingu • Taruh ${currentBet} SPINGU`}
              </button>
              <p className="text-center text-xs text-[#64748b] mt-3">Spingu Treasury akan otomatis match taruhanmu dengan jumlah yang sama.</p>
            </div>
          ) : (
            <button 
              onClick={handleStartMultiplayer}
              disabled={!isConnected || currentBet < 10}
              className="btn btn-primary w-full py-4 text-lg"
            >
              Buat / Cari Room Multiplayer • Taruh {currentBet} SPINGU
            </button>
          )}
        </>
      )}

      {/* Treasury Info - always visible */}
      <div className="mt-8 text-xs text-[#64748b] text-center">
        Treasury: <span className="font-mono">{SPINGU_TREASURY_ADDRESS}</span><br />
        Token: <span className="font-mono">{SPINGU_TOKEN_ADDRESS}</span>
      </div>
    </div>
  )
}
