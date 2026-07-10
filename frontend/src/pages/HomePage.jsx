import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { useAuth } from '../context/AuthContext'
import KycForm from '../components/KycForm'
import WalletLogin from '../components/WalletLogin'

function shortenAddress(address) {
  if (!address) return ''
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export default function HomePage() {
  const { authenticated, walletAddress, logout } = useAuth()
  const [health, setHealth] = useState(null)

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null))
  }, [])

  return (
    <div className="page">
      <header className="header">
        <div>
          <p className="eyebrow">Reusable KYC</p>
          <h1>Blockchain identity portal</h1>
        </div>

        <div className="header-actions">
          {health && (
            <span className="health-pill">
              API {health.status} · {health.service}
            </span>
          )}
          {authenticated && (
            <>
              <span className="wallet-pill">{shortenAddress(walletAddress)}</span>
              <button type="button" className="btn btn-secondary" onClick={logout}>
                Disconnect
              </button>
            </>
          )}
        </div>
      </header>

      <main className="content">
        {!authenticated ? <WalletLogin /> : <KycForm />}
      </main>
    </div>
  )
}
