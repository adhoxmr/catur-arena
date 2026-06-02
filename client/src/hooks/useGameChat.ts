import { useState, useEffect, useCallback, useRef } from 'react'
import {
  db,
  ref,
  push,
  onValue,
  query,
  limitToLast,
  orderByChild,
} from '../lib/firebase'

export interface ChatMessage {
  id: string
  text: string
  name: string
  address?: string
  ts: number
}

interface UseGameChatOptions {
  maxMessages?: number
}

export function useGameChat(
  roomId: string | null | undefined,
  options: UseGameChatOptions = {}
) {
  const { maxMessages = 80 } = options
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Subscribe ke chat room (real-time)
  useEffect(() => {
    if (!roomId) {
      setMessages([])
      setIsConnected(false)
      return
    }

    const messagesRef = ref(db, `chats/${roomId}/messages`)
    // Ambil maxMessages terakhir, urut berdasarkan timestamp
    const messagesQuery = query(
      messagesRef,
      orderByChild('ts'),
      limitToLast(maxMessages)
    )

    const unsubscribe = onValue(
      messagesQuery,
      (snapshot) => {
        const data = snapshot.val() || {}
        const list: ChatMessage[] = Object.entries(data).map(([id, val]: any) => ({
          id,
          text: val.text || '',
          name: val.name || 'Anonim',
          address: val.address || undefined,
          ts: val.ts || Date.now(),
        }))

        // Sort by time (karena limitToLast + orderByChild)
        list.sort((a, b) => a.ts - b.ts)

        setMessages(list)
        setIsConnected(true)
      },
      (error) => {
        console.error('[Chat] Firebase read error:', error)
        setIsConnected(false)
      }
    )

    unsubscribeRef.current = unsubscribe

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
      setIsConnected(false)
    }
  }, [roomId, maxMessages])

  // Kirim pesan baru
  const sendMessage = useCallback(
    async (text: string, senderName: string, senderAddress?: string) => {
      if (!roomId || !text.trim()) return false

      const trimmed = text.trim().slice(0, 280) // batas panjang pesan
      if (!trimmed) return false

      try {
        const messagesRef = ref(db, `chats/${roomId}/messages`)

        await push(messagesRef, {
          text: trimmed,
          name: senderName || 'Anonim',
          address: senderAddress || null,
          ts: Date.now(), // gunakan client time (cukup akurat untuk chat)
          // serverTimestamp() juga bisa, tapi Date.now lebih simpel untuk sorting
        })

        return true
      } catch (err) {
        console.error('[Chat] Failed to send message:', err)
        return false
      }
    },
    [roomId]
  )

  const clearLocal = useCallback(() => setMessages([]), [])

  return {
    messages,
    sendMessage,
    isConnected,
    clearLocal,
  }
}
