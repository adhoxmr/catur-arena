import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { Crown, Users, Bot, Wallet, LogOut, Play, Link as LinkIcon } from 'lucide-react'
import HomePage from './pages/HomePage'
import VsAIPage from './pages/VsAIPage'
import OnlineLobbyPage from './pages/OnlineLobbyPage'
import GamePage from './pages/GamePage'
import WalletPage from './pages/WalletPage'
import SpinguArenaPage from './pages/SpinguArenaPage'
import { useAuthStore } from './store/authStore'
import { useWalletStore } from './store/walletStore'

function WalletButton() {
  const { 
    address, isConnected, isLoading, spinguBalance, 
    connect, autoConnect, disconnect, error 
  } = useWalletStore()
  const [showMenu, setShowMenu] = useState(false)

  // Global auto-connect attempt for EVM wallets (Bitget, MetaMask, etc.)
  useEffect(() => {
    if (!isConnected && !isLoading) {
      autoConnect()
    }
  }, [])

  const shortAddr = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : ''

  if (!isConnected) {
    return (
      <button 
        onClick={connect} 
        disabled={isLoading}
        className="btn btn-secondary flex items-center gap-2 text-sm px-4 py-2"
      >
        <LinkIcon className="w-4 h-4" />
        {isLoading ? 'Menghubungkan...' : 'Connect Wallet (Bitget / EVM)'}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2.5 pl-4 pr-3 py-1.5 rounded-full bg-[#1c202c] border border-[#2a2f3d] hover:border-emerald-500/50 transition text-sm"
      >
        <div className="text-right">
          <div className="font-mono text-xs text-[#94a3b8]">{shortAddr}</div>
          <div className="text-emerald-400 text-xs font-semibold -mt-0.5">
            {parseFloat(spinguBalance).toLocaleString()} SPINGU
          </div>
        </div>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[#0f1117]">
          <LinkIcon className="w-3.5 h-3.5" />
        </div>
      </button>

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 card p-2 z-50 text-sm">
          <div className="px-3 py-2 text-[11px] text-[#94a3b8] border-b border-[#2a2f3d] break-all">
            {address}
          </div>
          <div className="px-3 py-2 text-xs">
            Saldo Spingu: <span className="font-semibold text-emerald-400">{spinguBalance}</span>
          </div>
          <button 
            onClick={() => { disconnect(); setShowMenu(false) }} 
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-500/10 text-red-400 flex items-center gap-2 mt-1"
          >
            <LogOut className="w-4 h-4" /> Disconnect Wallet
          </button>
          {error && <div className="px-3 py-1 text-xs text-red-400">{error}</div>}
        </div>
      )}
    </div>
  )
}

function App() {
  const navigate = useNavigate()
  const { user, logout, isAuthenticated } = useAuthStore()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navItems = [
    { path: '/', label: 'Beranda', icon: Crown },
    { path: '/vs-ai', label: 'Lawan AI', icon: Bot },
    { path: '/spingu', label: 'Spingu Arena', icon: LinkIcon },
    { path: '/online', label: 'Online & Taruhan', icon: Users },
    { path: '/wallet', label: 'Dompet Token', icon: Wallet },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
    setShowUserMenu(false)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] text-white">
      {/* Top Navigation - Professional like Chess.com */}
      <nav className="sticky top-0 z-50 border-b border-[#2a2f3d] bg-[#0f1117]/95 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-[#0f1117]" />
              </div>
              <div>
                <div className="font-bold text-xl tracking-tight">CATUR ARENA</div>
                <div className="text-[10px] text-emerald-500 -mt-1 font-medium">PROFESSIONAL CHESS</div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-[#0f1117]'
                      : 'hover:bg-[#1c202c] text-[#94a3b8] hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Spingu Wallet Connection */}
            <WalletButton />

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-3 pl-4 pr-3 py-1.5 rounded-full bg-[#1c202c] border border-[#2a2f3d] hover:border-emerald-500/50 transition"
                >
                  <div className="text-right">
                    <div className="text-sm font-semibold">{user.username}</div>
                    <div className="text-[11px] text-emerald-400 -mt-0.5">
                      {user.tokens.toLocaleString()} Token
                    </div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-[#0f1117] font-bold text-sm">
                    {user.username[0].toUpperCase()}
                  </div>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-52 card p-1.5 z-50">
                    <div className="px-3 py-2 text-xs text-[#94a3b8] border-b border-[#2a2f3d]">
                      Level {user.level} • {user.rating} Elo
                    </div>
                    <button
                      onClick={() => {
                        navigate('/wallet')
                        setShowUserMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-[#2a2f3d] mt-1"
                    >
                      <Wallet className="w-4 h-4" /> Dompet Saya
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-red-500/10 text-red-400 mt-0.5"
                    >
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="btn btn-primary btn-lg text-sm"
              >
                <Play className="w-4 h-4" /> Mulai Bermain
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vs-ai" element={<VsAIPage />} />
          <Route path="/online" element={<OnlineLobbyPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/spingu" element={<SpinguArenaPage />} />
          <Route path="/game/:mode" element={<GamePage />} />
        </Routes>
      </main>

      <footer className="border-t border-[#2a2f3d] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-[#64748b] text-sm">
          Catur Arena — Game Catur Profesional dengan AI, Multiplayer Online &amp; Taruhan Token • Dibuat dengan ❤️
        </div>
      </footer>
    </div>
  )
}

export default App
