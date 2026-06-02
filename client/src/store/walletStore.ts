import { create } from 'zustand'
import {
  connectWallet,
  trySilentConnect,
  switchToSatuChain,
  getSpinguBalance,
  isOnSatuChain,
  formatSpingu,
} from '../lib/satuchain'

interface WalletState {
  address: string | null
  isConnected: boolean
  isOnCorrectNetwork: boolean
  spinguBalance: string
  spinguBalanceRaw: bigint
  isLoading: boolean
  error: string | null

  connect: () => Promise<void>
  autoConnect: () => Promise<boolean>
  disconnect: () => void
  refreshBalance: () => Promise<void>
  ensureCorrectNetwork: () => Promise<boolean>
}

export const useWalletStore = create<WalletState>((set, get) => ({
  address: null,
  isConnected: false,
  isOnCorrectNetwork: false,
  spinguBalance: '0',
  spinguBalanceRaw: 0n,
  isLoading: false,
  error: null,

  connect: async () => {
    set({ isLoading: true, error: null })
    try {
      const { address } = await connectWallet()
      
      // Try to switch to SatuChain (this may fail if RPC not configured in frontend)
      try {
        const onCorrect = await isOnSatuChain()
        if (!onCorrect) {
          await switchToSatuChain()
        }
      } catch (networkErr: any) {
        console.warn('Could not switch to SatuChain automatically:', networkErr)
        // Still allow connection even if network switch fails
      }

      const balanceRaw = await getSpinguBalance(address)
      const balance = formatSpingu(balanceRaw)

      set({
        address,
        isConnected: true,
        isOnCorrectNetwork: true,
        spinguBalance: balance,
        spinguBalanceRaw: balanceRaw,
        isLoading: false,
      })
    } catch (err: any) {
      const message = err.message || 'Gagal menghubungkan wallet'
      set({ 
        error: message, 
        isLoading: false 
      })
      console.error('Wallet Connection Error:', message)
      throw err
    }
  },

  autoConnect: async () => {
    set({ isLoading: true, error: null })
    try {
      const result = await trySilentConnect()
      if (!result) {
        set({ isLoading: false })
        return false
      }

      const { address } = result

      // Try network switch silently
      try {
        const onCorrect = await isOnSatuChain()
        if (!onCorrect) {
          await switchToSatuChain()
        }
      } catch (networkErr) {
        console.warn('Auto network switch skipped or failed:', networkErr)
      }

      const balanceRaw = await getSpinguBalance(address)
      const balance = formatSpingu(balanceRaw)

      set({
        address,
        isConnected: true,
        isOnCorrectNetwork: true,
        spinguBalance: balance,
        spinguBalanceRaw: balanceRaw,
        isLoading: false,
      })

      return true
    } catch (err: any) {
      const message = err.message || 'Gagal auto-connect wallet'
      set({ 
        error: message, 
        isLoading: false 
      })
      console.error('Auto connect error:', message)
      return false
    }
  },

  disconnect: () => {
    set({
      address: null,
      isConnected: false,
      isOnCorrectNetwork: false,
      spinguBalance: '0',
      spinguBalanceRaw: 0n,
    })
  },

  refreshBalance: async () => {
    const { address } = get()
    if (!address) return

    try {
      const balanceRaw = await getSpinguBalance(address)
      set({
        spinguBalance: formatSpingu(balanceRaw),
        spinguBalanceRaw: balanceRaw,
      })
    } catch (e) {
      console.error('Gagal refresh balance Spingu:', e)
    }
  },

  ensureCorrectNetwork: async () => {
    try {
      const onCorrect = await isOnSatuChain()
      if (!onCorrect) {
        await switchToSatuChain()
        set({ isOnCorrectNetwork: true })
      }
      return true
    } catch (err: any) {
      set({ error: 'Gagal switch ke SatuChain. Pastikan RPC sudah benar.' })
      return false
    }
  },
}))

// Auto refresh balance setiap 15 detik jika connected
if (typeof window !== 'undefined') {
  setInterval(() => {
    const state = useWalletStore.getState()
    if (state.isConnected) {
      state.refreshBalance()
    }
  }, 15000)
}
