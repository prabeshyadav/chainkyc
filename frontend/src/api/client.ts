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

export type KycStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface KycDocument {
  id: string;
  document_type: string;
  document_type_display: string;
  file: string | null;
  uploaded_at: string;
}

export interface KycSubmission {
  id: string;
  full_name: string;
  date_of_birth: string;
  country: string;
  nationality: string;
  document_number: string;
  phone_number: string;
  email: string;
  address: string;
  version: number;
  status: KycStatus;
  status_display: string;
  created_at: string;
  updated_at: string;
  documents: KycDocument[];
  identity_document: KycDocument | null;
  selfie: KycDocument | null;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
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
    throw new ApiError(message, response.status);
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

  getMyKyc: () => request<KycSubmission>("/kyc/me"),

  submitKyc: (formData: FormData) =>
    request<KycSubmission>("/kyc/", {
      method: "POST",
      body: formData,
    }),

  updateKyc: (submissionId: string, formData: FormData) =>
    request<KycSubmission>(`/kyc/${submissionId}`, {
      method: "PUT",
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
