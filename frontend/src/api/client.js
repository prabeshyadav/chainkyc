const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'

function getAuthHeaders() {
  const token = localStorage.getItem('access_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function request(path, options = {}) {
  const isFormData = options.body instanceof FormData
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...getAuthHeaders(),
      ...options.headers,
    },
    ...options,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.detail || data?.message || `Request failed (${response.status})`
    throw new Error(message)
  }

  return data
}

export const api = {
  health: () => request('/health'),

  getNonce: (walletAddress) =>
    request('/nonce', {
      method: 'POST',
      body: JSON.stringify({ wallet_address: walletAddress }),
    }),

  verifyWallet: (walletAddress, signature) =>
    request('/verify', {
      method: 'POST',
      body: JSON.stringify({
        wallet_address: walletAddress,
        signature,
      }),
    }),

  getMyKyc: () => request('/kyc/me'),

  submitKyc: (formData) =>
    request('/kyc/submit', {
      method: 'POST',
      body: formData,
    }),

  updateKyc: (formData) =>
    request('/kyc/update', {
      method: 'POST',
      body: formData,
    }),

  listBanks: () => request('/banks/'),

  registerBank: (payload) =>
    request('/banks/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  requestVerification: (bankId, payload) =>
    request(`/verification/request/${bankId}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMyVerificationRequests: () => request('/verification/my-requests'),

  verifyWalletOnChain: (walletAddress) =>
    request(`/blockchain/verify/${walletAddress}`),
}

export function saveTokens({ access_token, refresh_token }) {
  localStorage.setItem('access_token', access_token)
  localStorage.setItem('refresh_token', refresh_token)
}

export function clearTokens() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('wallet_address')
}

export function getStoredWallet() {
  return localStorage.getItem('wallet_address')
}

export function saveWallet(address) {
  localStorage.setItem('wallet_address', address)
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem('access_token'))
}
