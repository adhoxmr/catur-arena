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
        className="btn btn-secondary flex items-center gap-2 text-sm px-3 py-1.5"
      >
        <LinkIcon className="w-4 h-4" />
        {isLoading ? 'Connecting...' : 'Connect Wallet'}
      </button>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="flex items-center gap-2 pl-3 pr-2 py-1 text-sm border border-[#27272a] hover:bg-[#18181b]"
      >
        <div className="text-right">
          <div className="font-mono text-[10px] text-[#71717a]">{shortAddr}</div>
          <div className="text-emerald-500 text-[10px] font-medium -mt-px">
            {parseFloat(spinguBalance).toLocaleString()} SPINGU
          </div>
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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-emerald-600 flex items-center justify-center">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="font-semibold text-lg tracking-tight">Catur Arena</div>
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-2 overflow-x-auto">
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  `flex items-center gap-1 md:gap-2 px-2 md:px-3 py-1.5 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'text-white border-b-2 border-emerald-600'
                      : 'text-[#71717a] hover:text-[#e4e4e7]'
                  }`
                }
              >
                <Icon className="w-3 h-3 md:w-4 md:h-4" />
                <span className="hidden sm:inline">{label}</span>
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
                  className="flex items-center gap-2 pl-3 pr-2 py-1 text-sm border border-[#27272a] hover:bg-[#18181b]"
                >
                  <div className="text-right">
                    <div className="text-sm font-medium">{user.username}</div>
                    <div className="text-[10px] text-[#71717a] -mt-0.5">
                      {user.tokens.toLocaleString()} tokens
                    </div>
                  </div>
                  <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white text-xs font-bold">
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
                className="btn btn-primary text-sm"
              >
                <Play className="w-4 h-4" /> Mulai Bermain
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/vs-ai" element={<VsAIPage />} />
          <Route path="/online" element={<OnlineLobbyPage />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/spingu" element={<SpinguArenaPage />} />
          <Route path="/game/:mode" element={<GamePage />} />
        </Routes>
      </main>

      <footer className="border-t border-[#27272a] py-5 mt-10 text-xs text-[#52525b] text-center">
        Catur Arena — chess + AI + on-chain bets
      </footer>
    </div>
  )
}

export default App
