import { useAuth } from '../context/AuthContext'

export default function WalletLogin() {
  const { connectAndLogin, loading, error } = useAuth()

  return (
    <section className="card login-card">
      <div className="badge">Web3 Authentication</div>
      <h1>Connect your wallet</h1>
      <p>
        Sign in with MetaMask to access the reusable KYC portal. Your wallet
        proves identity without sharing private keys.
      </p>

      <button
        type="button"
        className="btn btn-primary"
        onClick={connectAndLogin}
        disabled={loading}
      >
        {loading ? 'Connecting…' : 'Connect Wallet & Sign In'}
      </button>

      {error && <p className="error">{error}</p>}

      <ul className="steps">
        <li>Request a one-time nonce from the backend</li>
        <li>Sign the nonce with your wallet</li>
        <li>Receive JWT tokens and unlock KYC verification</li>
      </ul>
    </section>
  )
}
