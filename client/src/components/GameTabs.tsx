import { useState } from 'react'
import ChatBox from './ChatBox'

interface GameTabsProps {
  // Data untuk tab Langkah
  moveHistory: string[]
  captured: { white: string[]; black: string[] }
  gameStatus?: string // "Giliran Putih" atau gameOver text
  isPlaying?: boolean

  // Data untuk Chat
  roomId?: string | null | undefined
  playerAddresses: string[]
  currentUserAddress?: string | null | undefined
  currentUsername?: string | null | undefined

  className?: string
}

export default function GameTabs({
  moveHistory,
  captured,
  gameStatus,
  isPlaying,
  roomId,
  playerAddresses,
  currentUserAddress,
  currentUsername,
  className = '',
}: GameTabsProps) {
  const [activeTab, setActiveTab] = useState<'moves' | 'chat'>('moves')

  return (
    <div className={`w-full ${className}`}>
      {/* Tab Headers - simple and functional */}
      <div className="flex border-b border-[#27272a] mb-2 text-sm">
        <button
          onClick={() => setActiveTab('moves')}
          className={`flex-1 py-1.5 font-medium transition-colors ${activeTab === 'moves' ? 'text-white border-b-2 border-white' : 'text-[#71717a] hover:text-[#e4e4e7]'}`}
        >
          Langkah ({moveHistory.length})
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 py-1.5 font-medium transition-colors ${activeTab === 'chat' ? 'text-white border-b-2 border-white' : 'text-[#71717a] hover:text-[#e4e4e7]'}`}
        >
          Chat {roomId ? '' : '(room)'}
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[210px]">
        {activeTab === 'moves' ? (
          <div className="space-y-3">
            {/* Status ringkas */}
            {gameStatus && (
              <div className="text-xs uppercase tracking-widest text-[#64748b] px-1">
                {gameStatus}
                {isPlaying && <span className="ml-2 text-emerald-400">• BERLANGSUNG</span>}
              </div>
            )}

            {/* Move list */}
            <div>
              <div className="text-[10px] text-[#94a3b8] mb-1 px-1">RIWAYAT LANGKAH</div>
              <div className="move-list max-h-[128px] overflow-auto bg-[#161922] border border-[#2a2f3d] rounded-lg p-2 text-xs space-y-px">
                {moveHistory.length === 0 ? (
                  <div className="text-[#64748b] px-2 py-1">Belum ada langkah</div>
                ) : (
                  moveHistory.map((m, i) => (
                    <div key={i} className="move-item px-2 py-0.5 rounded">
                      {Math.floor(i / 2) + 1}. {m}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Captured pieces - compact */}
            <div className="px-1">
              <div className="text-[10px] text-[#94a3b8] mb-1">BIDAK TERTANGKAP</div>
              <div className="flex gap-6 text-base text-[#e2e8f0] bg-[#161922] border border-[#2a2f3d] rounded-lg px-3 py-2">
                <div>
                  <span className="text-[#64748b] text-xs mr-1">Hitam:</span>
                  {captured.black.join(' ') || '—'}
                </div>
                <div>
                  <span className="text-[#64748b] text-xs mr-1">Putih:</span>
                  {captured.white.join(' ') || '—'}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <ChatBox
            roomId={roomId}
            playerAddresses={playerAddresses}
            currentUserAddress={currentUserAddress}
            currentUsername={currentUsername}
          />
        )}
      </div>
    </div>
  )
}
