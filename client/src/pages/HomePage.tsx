import { useNavigate } from 'react-router-dom'
import { Bot, Users, Zap, Target, Play, Trophy } from 'lucide-react'
import { useAuthStore } from '../store/authStore'

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated, login } = useAuthStore()

  const features = [
    {
      icon: Bot,
      title: 'AI dengan 3 Level Kesulitan',
      desc: 'Pemula, Menengah, dan Master. AI menggunakan algoritma minimax alpha-beta tingkat lanjut.',
    },
    {
      icon: Users,
      title: 'Multiplayer Online Real-time',
      desc: 'Main lawan teman di seluruh dunia dengan WebSocket. Private room atau public match.',
    },
    {
      icon: Zap,
      title: 'Taruhan Token & Hadiah',
      desc: 'Pertaruhkan token di setiap pertandingan. Pemenang mengambil seluruh pot (fee 5%).',
    },
    {
      icon: Trophy,
      title: 'Sistem Rating & Level',
      desc: 'Elo rating otomatis naik/turun. Naikkan level dan buka hadiah token harian.',
    },
  ]

  const gameModes = [
    { time: '5 + 0', name: 'Blitz', desc: 'Cepat & intens' },
    { time: '10 + 0', name: 'Rapid', desc: 'Seimbang' },
    { time: '30 + 0', name: 'Classical', desc: 'Strategi mendalam' },
  ]

  return (
    <div className="space-y-10">
      {/* Hero - straightforward */}
      <div className="text-center pt-6 pb-4">
        <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-3">
          Catur Arena
        </h1>
        <p className="text-lg text-[#71717a] max-w-md mx-auto">
          Main catur lawan AI, lawan pemain online, atau bertaruh Spingu Token.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
          <button 
            onClick={() => navigate('/vs-ai')}
            className="btn btn-primary w-full sm:w-auto px-6"
          >
            <Bot className="w-4 h-4" /> Lawan AI
          </button>
          <button 
            onClick={() => navigate('/online')}
            className="btn btn-secondary w-full sm:w-auto px-6"
          >
            <Users className="w-4 h-4" /> Main Online
          </button>
          <button 
            onClick={() => navigate('/spingu')}
            className="btn btn-secondary w-full sm:w-auto px-6"
          >
            Spingu Arena (Real Bet)
          </button>
        </div>
      </div>

      {/* Quick Login / Guest - simple */}
      {!isAuthenticated && (
        <div className="max-w-sm mx-auto card p-4">
          <div className="text-sm mb-3 text-center text-[#71717a]">Login cepat untuk coba fitur</div>
          
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => login('demo', 'demo123')} 
              className="w-full btn btn-secondary justify-center"
            >
              Masuk Demo (banyak token)
            </button>
            <button 
              onClick={() => {
                const name = prompt('Username (min 3 huruf):') || ''
                if (name.length >= 3) login(name, 'guest123')
              }} 
              className="w-full btn btn-secondary justify-center"
            >
              Masuk sebagai Tamu
            </button>
          </div>
          <div className="text-center text-[10px] text-[#52525b] mt-2">Demo: demo / demo123</div>
        </div>
      )}

      {/* Features - plain list */}
      <div className="max-w-3xl mx-auto pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 text-sm">
          {features.map((f, i) => (
            <div key={i} className="flex gap-3">
              <div className="mt-0.5 text-emerald-600">
                <f.icon className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">{f.title}</div>
                <div className="text-[#71717a] text-xs mt-0.5">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Game Modes */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <div className="font-semibold text-lg">Mode Permainan</div>
            <div className="text-[#94a3b8] text-sm">Pilih sesuai gaya bermain Anda</div>
          </div>
          <button onClick={() => navigate('/online')} className="text-emerald-400 text-sm flex items-center gap-1 hover:underline">
            Lihat semua <Target className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {gameModes.map((mode, idx) => (
            <div key={idx} onClick={() => navigate('/online')} className="card p-5 cursor-pointer hover:border-emerald-500/40 transition group">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-3xl font-bold tracking-tighter">{mode.time}</div>
                  <div className="font-semibold mt-1">{mode.name}</div>
                </div>
                <div className="text-xs px-3 py-1 rounded bg-emerald-500/10 text-emerald-400 font-medium">{mode.desc}</div>
              </div>
              <div className="mt-8 flex items-center text-sm text-emerald-400 group-hover:gap-2 transition-all">
                Main sekarang <Play className="w-4 h-4 ml-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
        {[
          { label: 'Pertandingan Hari Ini', value: '47.291' },
          { label: 'Total Token Dipertaruhkan', value: '2.8jt' },
          { label: 'Pemain Aktif', value: '18.402' },
          { label: 'Rating Tertinggi', value: '2.847' },
        ].map((s, i) => (
          <div key={i} className="card px-5 py-4 text-center">
            <div className="text-2xl font-bold tracking-tight text-emerald-400">{s.value}</div>
            <div className="text-[#94a3b8] text-sm mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
