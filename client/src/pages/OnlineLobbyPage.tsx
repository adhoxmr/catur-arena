import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Plus, Key, Coins } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { toast } from 'sonner'

interface Room {
  id: string
  creator: string
  stake: number
  mode: string
  timeControl: string
  players: number
  status: 'waiting' | 'playing'
}

const MOCK_ROOMS: Room[] = [
  { id: 'RM-8841', creator: 'grandmaster88', stake: 2500, mode: 'Rapid', timeControl: '10+0', players: 1, status: 'waiting' },
  { id: 'RM-8842', creator: 'queenSlayer', stake: 5000, mode: 'Blitz', timeControl: '5+0', players: 1, status: 'waiting' },
  { id: 'RM-8843', creator: 'caturPro', stake: 1000, mode: 'Classical', timeControl: '30+0', players: 2, status: 'playing' },
]

export default function OnlineLobbyPage() {
  const navigate = useNavigate()
  const { user, deductTokens, isAuthenticated } = useAuthStore()
  const [rooms, setRooms] = useState<Room[]>(MOCK_ROOMS)
  const [showCreate, setShowCreate] = useState(false)
  const [stake, setStake] = useState(1000)
  const [timeControl, setTimeControl] = useState('10+0')
  const [privateCode, setPrivateCode] = useState('')

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <Users className="mx-auto w-12 h-12 text-emerald-400 mb-4" />
        <div className="text-2xl font-semibold">Login untuk bermain online</div>
        <p className="text-[#94a3b8] mt-2">Anda perlu memiliki akun untuk membuat atau bergabung ke pertandingan bertaruhan.</p>
      </div>
    )
  }

  const createRoom = () => {
    if (stake > user.tokens) {
      toast.error('Token tidak cukup untuk taruhan ini')
      return
    }
    if (!deductTokens(stake)) {
      toast.error('Gagal mengunci token')
      return
    }

    const roomId = 'RM-' + Math.floor(1000 + Math.random() * 9000)
    const newRoom: Room = {
      id: roomId,
      creator: user.username,
      stake,
      mode: timeControl.includes('5') ? 'Blitz' : timeControl.includes('30') ? 'Classical' : 'Rapid',
      timeControl,
      players: 1,
      status: 'waiting',
    }
    setRooms([newRoom, ...rooms])
    setShowCreate(false)

    toast.success(`Room ${roomId} dibuat! Menunggu lawan...`)
    // Navigate directly to game room with stake info
    navigate(`/game/online?room=${roomId}&stake=${stake}&time=${timeControl}`)
  }

  const joinRoom = (room: Room) => {
    if (room.status === 'playing') {
      toast.error('Pertandingan sudah dimulai')
      return
    }
    if (room.stake > user.tokens) {
      toast.error('Token tidak cukup')
      return
    }
    if (!deductTokens(room.stake)) return

    toast.success(`Bergabung ke room ${room.id}. Taruhan ${room.stake} token`)
    navigate(`/game/online?room=${room.id}&stake=${room.stake}&time=${room.timeControl}`)
  }

  const joinWithCode = () => {
    if (!privateCode.trim()) return
    const code = privateCode.toUpperCase()
    if (user.tokens < 500) {
      toast.error('Minimal 500 token untuk join private room')
      return
    }
    deductTokens(500)
    navigate(`/game/online?room=${code}&stake=500&time=10+0&private=1`)
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <div className="font-semibold text-xl">Online</div>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary text-sm">
          <Plus className="w-4 h-4" /> Buat Room
        </button>
      </div>

      {/* Quick join */}
      <div className="card p-5 mb-6 flex items-center gap-4">
        <Key className="text-emerald-400" />
        <div className="font-medium">Punya kode room teman?</div>
        <div className="flex-1 flex gap-2 max-w-sm">
          <input 
            value={privateCode} 
            onChange={e => setPrivateCode(e.target.value)} 
            placeholder="RM-XXXX" 
            className="input uppercase tracking-widest" 
          />
          <button onClick={joinWithCode} className="btn btn-secondary px-6">Gabung</button>
        </div>
        <div className="text-xs text-[#64748b]">Taruhan minimum 500 token</div>
      </div>

      {/* Public Rooms */}
      <div className="mb-3 px-1 flex justify-between items-center">
        <div className="font-semibold">Ruang Terbuka ({rooms.filter(r => r.status === 'waiting').length})</div>
        <div className="text-xs text-emerald-400">Pemenang mengambil seluruh pot (fee 5%)</div>
      </div>

      <div className="grid gap-3">
        {rooms.map(room => (
          <div key={room.id} className="room-card card p-5 flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="font-mono text-xl font-bold tracking-widest text-emerald-400">{room.id}</div>
              <div>
                <div className="font-semibold">{room.creator}</div>
                <div className="text-xs text-[#94a3b8]">{room.mode} • {room.timeControl}</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs md:text-sm md:gap-8 mt-2 md:mt-0">
              <div className="flex items-center gap-1.5 text-amber-400">
                <Coins className="w-4 h-4" /> <span className="font-semibold">{room.stake.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#94a3b8]">
                <Users className="w-4 h-4" /> {room.players}/2
              </div>
              <div>
                {room.status === 'waiting' ? (
                  <button onClick={() => joinRoom(room)} className="btn btn-primary px-6">Gabung & Taruh</button>
                ) : (
                  <div className="badge badge-orange">Berlangsung</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100]">
          <div className="modal w-full max-w-md p-7">
            <div className="font-bold text-2xl mb-1">Buat Pertandingan</div>
            <p className="text-[#94a3b8] text-sm mb-6">Taruhan akan dikunci sampai pertandingan selesai.</p>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-medium tracking-wider text-[#94a3b8]">JUMLAH TARUHAN</label>
                <div className="flex items-center gap-3 mt-2">
                  <input type="range" min="250" max="15000" step="250" value={stake} onChange={e => setStake(+e.target.value)} className="flex-1 accent-emerald-500" />
                  <div className="font-mono w-24 text-right text-xl font-semibold text-emerald-400">{stake.toLocaleString()}</div>
                </div>
                <div className="text-xs text-[#64748b] mt-1">Pot total: {(stake * 2).toLocaleString()} token (pemenang ambil {Math.floor(stake * 1.9)})</div>
              </div>

              <div>
                <label className="text-xs font-medium tracking-wider text-[#94a3b8]">KONTROL WAKTU</label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['5+0', '10+0', '30+0'].map(tc => (
                    <button key={tc} onClick={() => setTimeControl(tc)} className={`py-2.5 rounded-xl border text-sm font-medium ${timeControl === tc ? 'border-emerald-500 bg-emerald-500/5' : 'border-[#2a2f3d]'}`}>
                      {tc}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowCreate(false)} className="btn btn-secondary flex-1">Batal</button>
              <button onClick={createRoom} className="btn btn-primary flex-1">Buat Room &amp; Kunci Taruhan</button>
            </div>
            <div className="text-center text-[10px] text-[#64748b] mt-4">5% dari pot digunakan sebagai fee platform</div>
          </div>
        </div>
      )}
    </div>
  )
}
