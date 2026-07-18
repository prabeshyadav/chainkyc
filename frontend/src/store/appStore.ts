import { create } from "zustand";

interface AccessRequest {
  id: string;
  name: string;
  initials: string;
  requesting: string;
}

interface GrantedAccess {
  id: string;
  name: string;
  initials: string;
  approvedOn: string;
  status: string;
}

interface ActivityEntry {
  date: string;
  text: string;
}

interface AppState {
  role: string | null; // 'customer' | 'institution' | 'admin'
  setRole: (role: string | null) => void;
  wallet: string | null;
  connectWallet: (providerName: string) => string;
  kycStatus: string; // not_submitted | pending | verified
  setKycStatus: (status: string) => void;
  kycForm: Record<string, any>;
  submitKyc: (formData: Record<string, any>) => void;
  accessRequests: AccessRequest[];
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  grantedAccess: GrantedAccess[];
  revokeAccess: (id: string) => void;
  activityLog: ActivityEntry[];
}

const initialActivity: ActivityEntry[] = [
  { date: "Jun 28", text: "Khalti viewed your verified status." },
  { date: "Jun 21", text: "You revoked access for NIC Asia Bank." },
  { date: "Jun 14", text: "Your KYC token was issued by a verifier." },
];

const initialGranted: GrantedAccess[] = [
  {
    id: "khalti",
    name: "Khalti",
    initials: "KH",
    approvedOn: "Jun 28, 2026",
    status: "Verified shared",
  },
];

const initialRequests: AccessRequest[] = [
  {
    id: "esewa",
    name: "eSewa",
    initials: "eS",
    requesting: "Requesting: verified status only",
  },
];

export const useAppStore = create<AppState>((set, get) => ({
  role: null,
  setRole: (role) => set({ role }),
  wallet: null,
  kycStatus: "not_submitted",
  setKycStatus: (kycStatus) => set({ kycStatus }),
  kycForm: {},
  accessRequests: initialRequests,
  grantedAccess: initialGranted,
  activityLog: initialActivity,

  connectWallet: (_providerName) => {
    const fakeAddress =
      "0x71C7" +
      Math.random().toString(16).slice(2, 6) +
      "..." +
      Math.random().toString(16).slice(2, 6);
    set({ wallet: fakeAddress });
    return fakeAddress;
  },

  submitKyc: (formData) =>
    set((state) => ({
      kycForm: formData,
      kycStatus: "pending",
      activityLog: [
        { date: "Today", text: "You submitted documents for verification." },
        ...state.activityLog,
      ],
    })),

  approveRequest: (id) => {
    const req = get().accessRequests.find((r) => r.id === id);
    if (!req) return;
    set((state) => ({
      accessRequests: state.accessRequests.filter((r) => r.id !== id),
      grantedAccess: [
        {
          id: req.id,
          name: req.name,
          initials: req.initials,
          approvedOn: "Today",
          status: "Verified shared",
        },
        ...state.grantedAccess,
      ],
      activityLog: [
        { date: "Today", text: `You approved access for ${req.name}.` },
        ...state.activityLog,
      ],
    }));
  },

  rejectRequest: (id) => {
    const req = get().accessRequests.find((r) => r.id === id);
    if (!req) return;
    set((state) => ({
      accessRequests: state.accessRequests.filter((r) => r.id !== id),
      activityLog: [
        { date: "Today", text: `You rejected access for ${req.name}.` },
        ...state.activityLog,
      ],
    }));
  },

  revokeAccess: (id) => {
    const grant = get().grantedAccess.find((g) => g.id === id);
    if (!grant) return;
    set((state) => ({
      grantedAccess: state.grantedAccess.filter((g) => g.id !== id),
      activityLog: [
        { date: "Today", text: `You revoked access for ${grant.name}.` },
        ...state.activityLog,
      ],
    }));
  },
}));
