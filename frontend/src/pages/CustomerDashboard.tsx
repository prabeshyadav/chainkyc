import { Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";
import { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Badge, Button, SectionCard, TopBar } from "../components/ui";
import { useAppStore } from "../store/appStore";
import { useAuthStore } from "../store/authStore";
import { useKycStore } from "../store/kycStore";

const institutions = [
  "NIC Asia Bank",
  "Global IME Bank",
  "Nabil Bank",
  "Prabhu Bank",
];

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const {
    accessRequests,
    approveRequest,
    rejectRequest,
    grantedAccess,
    revokeAccess,
    activityLog,
  } = useAppStore();

  const { walletAddress } = useAuthStore();
  const { kyc, loaded, fetchMyKyc } = useKycStore();

  useEffect(() => {
    fetchMyKyc();
  }, [fetchMyKyc]);

  const statusCopy: Record<
    string,
    {
      icon: ComponentType<{ size?: number; className?: string }>;
      title: string;
      body: string;
      tone: string;
    }
  > = {
    PENDING: {
      icon: Clock,
      title: "Verification in progress",
      body: "A licensed verifier is reviewing your documents off-chain.",
      tone: "bg-amber-600",
    },
    APPROVED: {
      icon: ShieldCheck,
      title: "KYC verified",
      body: "Your identity token is active and ready to share with institutions.",
      tone: "bg-emerald-700",
    },
    REJECTED: {
      icon: ShieldAlert,
      title: "KYC rejected",
      body: "Your submission was rejected. Please review your details and resubmit.",
      tone: "bg-red-700",
    },
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-3xl mx-auto py-20 px-6 text-center text-ink-400">
          Loading your KYC...
        </div>
      </div>
    );
  }

  if (!kyc) {
    return <Navigate to="/kyc" replace />;
  }

  const status = statusCopy[kyc.status] ?? statusCopy.PENDING;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="max-w-3xl mx-auto py-10 px-6 space-y-6">
        <div>
          <p className="uppercase text-xs tracking-widest text-ink-400 mb-2 font-mono">
            Customer &middot; {walletAddress}
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
            Your KYC
          </h1>
          <p className="text-ink-600">
            Submit once, then approve which institutions can see your verified
            status.
          </p>
        </div>

        {/* Status banner */}
        <div
          className={`${status.tone} text-white rounded-xl px-6 py-5 flex items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-4">
            <status.icon size={20} className="shrink-0 text-white/80" />
            <div>
              <p className="font-medium">{status.title}</p>
              <p className="text-sm text-white/70">{status.body}</p>
            </div>
          </div>
          {kyc.status === "REJECTED" && (
            <Button
              variant="primary"
              className="bg-white text-navy-900 hover:bg-white/90 shrink-0"
              onClick={() => navigate("/kyc")}
            >
              Resubmit KYC
            </Button>
          )}
        </div>

        {/* Request verification */}
        <SectionCard
          title="Request verification from a bank"
          description="Send your KYC token to an institution for onboarding."
        >
          <div className="flex gap-3">
            <select className="flex-1 rounded-lg border border-line px-3.5 py-2.5 text-sm text-ink-600">
              <option>Select a bank or institution...</option>
              {institutions.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <Button>Send request</Button>
          </div>
        </SectionCard>

        {/* Access requests */}
        <SectionCard
          title="Access requests"
          description="Institutions asking to view your KYC status."
        >
          {accessRequests.length === 0 ? (
            <p className="text-sm text-ink-400">
              No pending requests right now.
            </p>
          ) : (
            <div className="space-y-3">
              {accessRequests.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 border border-line rounded-lg px-4 py-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-ink-600">
                    {r.initials}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-ink-900 text-sm">{r.name}</p>
                    <p className="text-xs text-ink-600">{r.requesting}</p>
                  </div>
                  <Button variant="danger" onClick={() => rejectRequest(r.id)}>
                    Reject
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => approveRequest(r.id)}
                  >
                    Approve
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Granted access */}
        <SectionCard
          title="Granted access"
          description="Institutions that can currently see your status."
        >
          {grantedAccess.length === 0 ? (
            <p className="text-sm text-ink-400">
              You haven't granted anyone access yet.
            </p>
          ) : (
            <div className="space-y-3">
              {grantedAccess.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center gap-3 border border-line rounded-lg px-4 py-3"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-ink-600">
                    {g.initials}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-ink-900 text-sm">{g.name}</p>
                    <p className="text-xs text-ink-600">
                      Approved on {g.approvedOn}
                    </p>
                  </div>
                  <Badge tone="success">{g.status}</Badge>
                  <Button
                    variant="secondary"
                    onClick={() => revokeAccess(g.id)}
                  >
                    Revoke
                  </Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* Activity log */}
        <SectionCard
          title="Activity log"
          description="Every time your data was accessed, on-chain."
        >
          <div className="divide-y divide-line -mt-2">
            {activityLog.map((a, i) => (
              <div key={i} className="flex gap-4 py-3 text-sm">
                <span className="text-ink-400 font-mono w-14 shrink-0">
                  {a.date}
                </span>
                <span className="text-ink-900">{a.text}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
