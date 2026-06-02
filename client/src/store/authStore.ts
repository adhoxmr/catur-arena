import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  username: string
  tokens: number
  rating: number
  level: number
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  token: string | null
  
  login: (username: string, password: string) => Promise<boolean>
  register: (username: string, password: string) => Promise<boolean>
  logout: () => void
  updateTokens: (newTokens: number) => void
  addTokens: (amount: number) => void
  deductTokens: (amount: number) => boolean
}

// Demo users + local "database"
const DEMO_USERS: Record<string, { password: string; user: User }> = {
  'demo': { password: 'demo123', user: { id: 'u1', username: 'demo', tokens: 12500, rating: 1480, level: 12 } },
  'master': { password: 'chess2025', user: { id: 'u2', username: 'master', tokens: 48750, rating: 1920, level: 27 } },
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,

      login: async (username: string, password: string) => {
        // Simulate API
        await new Promise(r => setTimeout(r, 180))
        
        const found = DEMO_USERS[username.toLowerCase()]
        if (found && found.password === password) {
          const userCopy = { ...found.user }
          set({ user: userCopy, isAuthenticated: true, token: 'demo-jwt-token-' + Date.now() })
          return true
        }
        // Allow any login as guest for demo
        if (password.length >= 4) {
          const newUser: User = {
            id: 'u_' + Date.now(),
            username,
            tokens: 5000,
            rating: 1200,
            level: 5,
          }
          set({ user: newUser, isAuthenticated: true, token: 'jwt-' + Date.now() })
          return true
        }
        return false
      },

      register: async (username: string, _password: string) => {
        await new Promise(r => setTimeout(r, 220))
        if (username.length < 3) return false
        
        const newUser: User = {
          id: 'u_' + Date.now(),
          username,
          tokens: 8000, // Welcome bonus
          rating: 1200,
          level: 4,
        }
        set({ user: newUser, isAuthenticated: true, token: 'jwt-' + Date.now() })
        return true
      },

      logout: () => set({ user: null, isAuthenticated: false, token: null }),

      updateTokens: (newTokens) => {
        const { user } = get()
        if (user) set({ user: { ...user, tokens: Math.max(0, newTokens) } })
      },

      addTokens: (amount) => {
        const { user, updateTokens } = get()
        if (user) updateTokens(user.tokens + amount)
      },

      deductTokens: (amount) => {
        const { user, updateTokens } = get()
        if (!user || user.tokens < amount) return false
        updateTokens(user.tokens - amount)
        return true
      },
    }),
    { name: 'catur-arena-auth' }
  )
)
