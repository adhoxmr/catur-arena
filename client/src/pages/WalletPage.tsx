import { useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { Wallet, Gift, TrendingUp, History } from 'lucide-react'
import { toast } from 'sonner'

export default function WalletPage() {
  const { user, addTokens } = useAuthStore()
  const [amount, setAmount] = useState(500)

  if (!user) {
    return <div className="text-center py-20 text-[#94a3b8]">Silakan login terlebih dahulu untuk melihat dompet Anda.</div>
  }

  const claimDaily = () => {
    addTokens(350)
    toast.success('Berhasil klaim bonus harian +350 Token')
  }

  const purchaseTokens = () => {
    // Demo purchase
    addTokens(amount)
    toast.success(`Berhasil membeli ${amount} token (demo)`)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="font-bold text-3xl tracking-tight">Dompet Token</div>
        <div className="text-[#94a3b8]">Kelola token Anda untuk bertaruh di pertandingan online</div>
      </div>

      <div className="card p-8 mb-6 text-center">
        <div className="flex justify-center mb-3">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 flex items-center justify-center">
            <Wallet className="w-9 h-9 text-[#0f1117]" />
          </div>
        </div>
        <div className="text-6xl font-bold tracking-tighter text-emerald-400">{user.tokens.toLocaleString()}</div>
        <div className="uppercase text-sm tracking-[3px] text-[#64748b] mt-1">TOKEN</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Daily Bonus */}
        <div className="card p-5">
          <div className="flex gap-4">
            <Gift className="w-6 h-6 text-emerald-400 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold">Bonus Harian</div>
              <div className="text-sm text-[#94a3b8] mt-0.5 mb-3">Klaim 350 token gratis setiap hari</div>
              <button onClick={claimDaily} className="btn btn-primary w-full">Klaim Sekarang</button>
            </div>
          </div>
        </div>

        {/* Buy Tokens */}
        <div className="card p-5">
          <div className="flex gap-4">
            <TrendingUp className="w-6 h-6 text-emerald-400 mt-0.5" />
            <div className="flex-1">
              <div className="font-semibold">Beli Token (Demo)</div>
              <div className="text-sm text-[#94a3b8] mt-1 mb-3">1.000 token = Rp 10.000 (simulasi)</div>
              
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={amount} 
                  onChange={e => setAmount(Math.max(100, parseInt(e.target.value) || 100))} 
                  className="input flex-1" 
                />
                <button onClick={purchaseTokens} className="btn btn-secondary">Beli</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-5 mt-4">
        <div className="flex items-center gap-3 mb-4">
          <History className="w-5 h-5" />
          <div className="font-semibold">Riwayat Transaksi (Demo)</div>
        </div>
        <div className="text-sm space-y-2 text-[#94a3b8]">
          <div className="flex justify-between py-1 border-b border-[#2a2f3d]"><span>Klaim bonus harian</span><span className="text-emerald-400">+350</span></div>
          <div className="flex justify-between py-1 border-b border-[#2a2f3d]"><span>Menang vs AI (Master)</span><span className="text-emerald-400">+180</span></div>
          <div className="flex justify-between py-1"><span>Taruhan Online vs @sinta — Kalah</span><span className="text-red-400">-800</span></div>
        </div>
        <div className="text-[10px] text-[#64748b] mt-4">Transaksi asli akan tersimpan di server dan blockchain (coming soon)</div>
      </div>
    </div>
  )
}
