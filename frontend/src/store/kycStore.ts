import { create } from "zustand";
import type { KycSubmission } from "../api/client";
import { api, ApiError } from "../api/client";

interface KycState {
  kyc: KycSubmission | null;
  loaded: boolean;
  loading: boolean;
  error: string;
  fetchMyKyc: () => Promise<void>;
  reset: () => void;
}

export const useKycStore = create<KycState>((set) => ({
  kyc: null,
  loaded: false,
  loading: false,
  error: "",

  fetchMyKyc: async () => {
    set({ loading: true, error: "" });

    try {
      const kyc = await api.getMyKyc();
      set({ kyc, loaded: true });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        set({ kyc: null, loaded: true });
      } else {
        const message =
          err instanceof Error ? err.message : "Failed to load your KYC.";
        set({ error: message, loaded: true });
      }
    } finally {
      set({ loading: false });
    }
  },

  reset: () => set({ kyc: null, loaded: false, loading: false, error: "" }),
}));
