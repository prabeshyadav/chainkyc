const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";

export interface LoginResponse {
  access_token: string;
  role: string;
  wallet_address: string;
}

export interface MeResponse {
  wallet_address: string;
  role: string;
}

export interface HealthStatus {
  status: string;
  service: string;
}

export interface KycProfile {
  full_name: string;
  date_of_birth: string;
  gender: string;
  nationality: string;
  phone: string;
  email: string | null;
  country: string;
  province: string;
  district: string;
  street: string;
  postal_code: string;
  document_type: string;
  document_number: string;
  status: string;
  tx_hash?: string | null;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...getAuthHeaders(),
      ...(options.headers as Record<string, string> | undefined),
    },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.detail || data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}

export const api = {
  health: () => request<HealthStatus>("/health"),

  login: (walletAddress: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ wallet_address: walletAddress }),
    }),

  getMe: () => request<MeResponse>("/me"),

  getMyKyc: () => request<KycProfile>("/kyc/me"),

  submitKyc: (formData: FormData) =>
    request<KycProfile>("/kyc/submit", {
      method: "POST",
      body: formData,
    }),

  updateKyc: (formData: FormData) =>
    request<KycProfile>("/kyc/update", {
      method: "POST",
      body: formData,
    }),

  listBanks: () => request<unknown[]>("/banks/"),

  registerBank: (payload: Record<string, unknown>) =>
    request<unknown>("/banks/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  requestVerification: (
    bankId: string | number,
    payload: Record<string, unknown>,
  ) =>
    request<unknown>(`/verification/request/${bankId}`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyVerificationRequests: () =>
    request<unknown[]>("/verification/my-requests"),

  verifyWalletOnChain: (walletAddress: string) =>
    request<unknown>(`/blockchain/verify/${walletAddress}`),
};

export function saveTokens({ accessToken }: { accessToken: string }) {
  localStorage.setItem("access_token", accessToken);
}

export function clearTokens() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("wallet_address");
  localStorage.removeItem("role");
}

export function saveRole(role: string) {
  localStorage.setItem("role", role);
}

export function getStoredRole(): string | null {
  return localStorage.getItem("role");
}

export function getStoredWallet(): string | null {
  return localStorage.getItem("wallet_address");
}

export function saveWallet(address: string) {
  localStorage.setItem("wallet_address", address);
}

export function isAuthenticated(): boolean {
  return Boolean(localStorage.getItem("access_token"));
}
