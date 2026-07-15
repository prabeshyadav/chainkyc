import React, { createContext, useContext, useState } from "react";

interface AppContextType {
  role: string | null;
  setRole: React.Dispatch<React.SetStateAction<string | null>>;
  wallet: string | null;
  connectWallet: (providerName: string) => string;
  kycStatus: string;
  setKycStatus: React.Dispatch<React.SetStateAction<string>>;
  kycForm: Record<string, any>;
  submitKyc: (formData: Record<string, any>) => void;
  accessRequests: Array<any>;
  approveRequest: (id: string) => void;
  rejectRequest: (id: string) => void;
  grantedAccess: Array<any>;
  revokeAccess: (id: string) => void;
  activityLog: Array<any>;
}

const AppContext = createContext<AppContextType | null>(null);

const initialActivity = [
  { date: "Jun 28", text: "Khalti viewed your verified status." },
  { date: "Jun 21", text: "You revoked access for NIC Asia Bank." },
  { date: "Jun 14", text: "Your KYC token was issued by a verifier." },
];

const initialGranted = [
  {
    id: "khalti",
    name: "Khalti",
    initials: "KH",
    approvedOn: "Jun 28, 2026",
    status: "Verified shared",
  },
];

const initialRequests = [
  {
    id: "esewa",
    name: "eSewa",
    initials: "eS",
    requesting: "Requesting: verified status only",
  },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<string | null>(null); // 'customer' | 'institution' | 'admin'
  const [wallet, setWallet] = useState<string | null>(null); // wallet address string once "connected"
  const [kycStatus, setKycStatus] = useState("not_submitted"); // not_submitted | pending | verified
  const [kycForm, setKycForm] = useState({});
  const [accessRequests, setAccessRequests] = useState(initialRequests);
  const [grantedAccess, setGrantedAccess] = useState(initialGranted);
  const [activityLog, setActivityLog] = useState(initialActivity);

  function connectWallet(_providerName: string) {
    const fakeAddress =
      "0x71C7" +
      Math.random().toString(16).slice(2, 6) +
      "..." +
      Math.random().toString(16).slice(2, 6);
    setWallet(fakeAddress);
    return fakeAddress;
  }

  function submitKyc(formData: {}) {
    setKycForm(formData);
    setKycStatus("pending");
    setActivityLog((log) => [
      { date: "Today", text: "You submitted documents for verification." },
      ...log,
    ]);
  }

  function approveRequest(id: string) {
    const req = accessRequests.find((r) => r.id === id);
    if (!req) return;
    setAccessRequests((list) => list.filter((r) => r.id !== id));
    setGrantedAccess((list) => [
      {
        id: req.id,
        name: req.name,
        initials: req.initials,
        approvedOn: "Today",
        status: "Verified shared",
      },
      ...list,
    ]);
    setActivityLog((log) => [
      { date: "Today", text: `You approved access for ${req.name}.` },
      ...log,
    ]);
  }

  function rejectRequest(id: string) {
    const req = accessRequests.find((r) => r.id === id);
    if (!req) return;
    setAccessRequests((list) => list.filter((r) => r.id !== id));
    setActivityLog((log) => [
      { date: "Today", text: `You rejected access for ${req.name}.` },
      ...log,
    ]);
  }

  function revokeAccess(id: string) {
    const grant = grantedAccess.find((g) => g.id === id);
    if (!grant) return;
    setGrantedAccess((list) => list.filter((g) => g.id !== id));
    setActivityLog((log) => [
      { date: "Today", text: `You revoked access for ${grant.name}.` },
      ...log,
    ]);
  }

  const value = {
    role,
    setRole,
    wallet,
    connectWallet,
    kycStatus,
    setKycStatus,
    kycForm,
    submitKyc,
    accessRequests,
    approveRequest,
    rejectRequest,
    grantedAccess,
    revokeAccess,
    activityLog,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
