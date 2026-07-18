import { BrowserProvider } from "ethers";
import { create } from "zustand";
import {
  api,
  clearTokens,
  getStoredRole,
  getStoredWallet,
  isAuthenticated,
  saveRole,
  saveTokens,
  saveWallet,
} from "../api/client";

export interface LoginResult {
  walletAddress: string;
  role: string;
}

interface AuthState {
  walletAddress: string | null;
  role: string | null;
  authenticated: boolean;
  initializing: boolean;
  loading: boolean;
  error: string;
  connectAndLogin: () => Promise<LoginResult>;
  restoreSession: () => Promise<void>;
  logout: () => void;
  setError: (error: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  walletAddress: getStoredWallet(),
  role: getStoredRole(),
  authenticated: isAuthenticated(),
  initializing: isAuthenticated(),
  loading: false,
  error: "",

  connectAndLogin: async () => {
    set({ loading: true, error: "" });

    try {
      if (!window.ethereum) {
        throw new Error("MetaMask or another Web3 wallet is required.");
      }

      const provider = new BrowserProvider(window.ethereum);
      await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();

      const session = await api.login(address);
      saveTokens({ accessToken: session.access_token });
      saveWallet(session.wallet_address);
      saveRole(session.role);
      set({
        walletAddress: session.wallet_address,
        role: session.role,
        authenticated: true,
      });
      return { walletAddress: session.wallet_address, role: session.role };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Wallet login failed.";
      set({ error: message });
      throw err;
    } finally {
      set({ loading: false });
    }
  },

  restoreSession: async () => {
    if (!isAuthenticated()) {
      set({ initializing: false });
      return;
    }

    try {
      const me = await api.getMe();
      saveWallet(me.wallet_address);
      saveRole(me.role);
      set({
        walletAddress: me.wallet_address,
        role: me.role,
        authenticated: true,
      });
    } catch {
      clearTokens();
      set({ walletAddress: null, role: null, authenticated: false, error: "" });
    } finally {
      set({ initializing: false });
    }
  },

  logout: () => {
    clearTokens();
    window.ethereum
      ?.request({
        method: "wallet_revokePermissions",
        params: [{ eth_accounts: {} }],
      })
      .catch(() => {});
    set({ walletAddress: null, role: null, authenticated: false, error: "" });
  },

  setError: (error) => set({ error }),
}));
