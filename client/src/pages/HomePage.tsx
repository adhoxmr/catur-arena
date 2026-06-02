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
      {/* Hero */}
      <div className="text-center pt-8 pb-6">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-1 rounded-full text-sm font-medium mb-6">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          2.847 pemain online sekarang
        </div>
        
        <h1 className="text-6xl font-bold tracking-tighter mb-4">
          Main Catur.<br />Seperti Juara Dunia.
        </h1>
        <p className="text-xl text-[#94a3b8] max-w-md mx-auto">
          Platform catur profesional dengan AI kelas dunia, pertandingan online, dan sistem taruhan token yang adil.
        </p>

        <div className="flex items-center justify-center gap-4 mt-8">
          <button 
            onClick={() => navigate('/vs-ai')}
            className="btn btn-primary btn-lg text-base px-8"
          >
            <Bot className="w-5 h-5" /> Lawan AI Sekarang
          </button>
          <button 
            onClick={() => navigate('/online')}
            className="btn btn-secondary btn-lg text-base px-8"
          >
            <Users className="w-5 h-5" /> Main Online + Taruhan
          </button>
        </div>
      </div>

      {/* Quick Login / Guest */}
      {!isAuthenticated && (
        <div className="max-w-md mx-auto card p-6">
          <div className="text-center mb-5">
            <div className="font-semibold text-lg">Mulai dalam 3 detik</div>
            <p className="text-[#94a3b8] text-sm mt-1">Masuk sebagai tamu atau pakai akun demo</p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={() => login('demo', 'demo123')} 
              className="w-full btn btn-secondary justify-center py-3"
            >
              Masuk dengan Akun Demo (12.500 token)
            </button>
            <button 
              onClick={() => {
                const name = prompt('Masukkan username (min 3 huruf):') || ''
                if (name.length >= 3) login(name, 'guest123')
              }} 
              className="w-full btn btn-primary justify-center py-3"
            >
              Masuk sebagai Tamu
            </button>
            <div className="text-center text-xs text-[#64748b]">Password demo: demo123</div>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
        {features.map((f, i) => (
          <div key={i} className="card p-5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
              <f.icon className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="font-semibold text-lg mb-1.5">{f.title}</div>
            <p className="text-[#94a3b8] text-[14px] leading-relaxed">{f.desc}</p>
          </div>
        ))}
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
