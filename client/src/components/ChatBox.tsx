import { useState, useRef, useEffect } from 'react'
import type { ChatMessage } from '../hooks/useGameChat'
import { useGameChat } from '../hooks/useGameChat'

interface ChatBoxProps {
  roomId?: string | null | undefined
  playerAddresses: string[] // lowercase addresses milik pemain asli
  currentUserAddress?: string | null | undefined
  currentUsername?: string | null | undefined
  className?: string
}

function formatTime(ts: number) {
  const d = new Date(ts)
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

function shortAddr(addr?: string) {
  if (!addr) return 'Guest'
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export default function ChatBox({
  roomId,
  playerAddresses,
  currentUserAddress,
  currentUsername,
  className = '',
}: ChatBoxProps) {
  const { messages, sendMessage, isConnected } = useGameChat(roomId)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto scroll ke bawah setiap ada pesan baru
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const normalizedPlayers = playerAddresses.map((a) => a.toLowerCase())

  const getDisplayName = (msg: ChatMessage) => {
    if (msg.name && msg.name !== 'Anonim') return msg.name
    return shortAddr(msg.address)
  }

  const isPlayerMessage = (msg: ChatMessage) => {
    if (!msg.address) return false
    return normalizedPlayers.includes(msg.address.toLowerCase())
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || sending || !roomId) return

    const nameToUse =
      currentUsername ||
      (currentUserAddress ? shortAddr(currentUserAddress) : 'Guest')

    setSending(true)
    const ok = await sendMessage(input, nameToUse, currentUserAddress || undefined)
    setSending(false)

    if (ok) {
      setInput('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className={`flex flex-col h-full min-h-[220px] bg-[#161922] rounded-xl border border-[#2a2f3d] ${className}`}>
      {/* Header - plain */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-[#27272a] text-xs text-[#71717a]">
        <div className="flex items-center gap-1.5">
          <span>Chat</span>
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-zinc-600'}`} />
        </div>
        <div className="font-mono text-[10px]">{roomId ? roomId.slice(0, 10) : '—'}</div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-2 space-y-1 text-sm custom-scroll"
      >
        {messages.length === 0 && (
          <div className="text-center text-[#64748b] text-xs py-6">
            Belum ada chat. Jadilah yang pertama menyapa!
          </div>
        )}

        {messages.map((msg) => {
          const isPlayer = isPlayerMessage(msg)
          const isSelf = currentUserAddress && msg.address?.toLowerCase() === currentUserAddress.toLowerCase()

          return (
            <div key={msg.id} className={`flex flex-col ${isSelf ? 'items-end' : ''}`}>
              <div
                className={`max-w-[80%] px-2 py-1 text-xs leading-snug border-l-2 ${isSelf ? 'border-emerald-600' : 'border-[#3f3f46]'} ${isSelf ? 'pl-2' : ''}`}
              >
                <div className="flex items-baseline gap-2 text-[10px] mb-0.5">
                  <span className="font-medium text-[#e4e4e7]">{getDisplayName(msg)}</span>
                  <span className={`font-mono text-[9px] ${isPlayer ? 'text-emerald-600' : 'text-[#52525b]'}`}>
                    {isPlayer ? 'pemain' : 'penonton'}
                  </span>
                  <span className="ml-auto text-[#52525b]">{formatTime(msg.ts)}</span>
                </div>
                <div className="text-[#d4d4d8] break-words">{msg.text}</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Input - simple */}
      <form onSubmit={handleSend} className="p-1.5 border-t border-[#27272a] flex gap-1.5">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={roomId ? "pesan..." : "tunggu room"}
          disabled={!roomId || sending}
          className="input flex-1 text-sm py-1 px-2"
          maxLength={280}
        />
        <button
          type="submit"
          disabled={!input.trim() || !roomId || sending}
          className="btn btn-primary px-2.5 text-xs disabled:opacity-50"
        >
          kirim
        </button>
      </form>
    </div>
  )
}
