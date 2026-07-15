import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { BrowserProvider } from 'ethers'
import {
  api,
  clearTokens,
  getStoredWallet,
  isAuthenticated,
  saveTokens,
  saveWallet,
} from '../api/client'

interface AuthContextValue {
  walletAddress: string | null
  authenticated: boolean
  loading: boolean
  error: string
  connectAndLogin: () => Promise<string>
  logout: () => void
  setError: (error: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [walletAddress, setWalletAddress] = useState<string | null>(getStoredWallet())
  const [authenticated, setAuthenticated] = useState(isAuthenticated())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const connectAndLogin = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      if (!window.ethereum) {
        throw new Error('MetaMask or another Web3 wallet is required.')
      }

      const provider = new BrowserProvider(window.ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      const address = await signer.getAddress()

      const { nonce } = await api.getNonce(address)
      const signature = await signer.signMessage(nonce)
      const tokens = await api.verifyWallet(address, signature)

      saveTokens(tokens)
      saveWallet(address)
      setWalletAddress(address)
      setAuthenticated(true)
      return address
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Wallet login failed.'
      setError(message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setWalletAddress(null)
    setAuthenticated(false)
    setError('')
  }, [])

  const value = useMemo(
    () => ({
      walletAddress,
      authenticated,
      loading,
      error,
      connectAndLogin,
      logout,
      setError,
    }),
    [walletAddress, authenticated, loading, error, connectAndLogin, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
