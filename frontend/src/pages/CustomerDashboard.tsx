import { Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import type { ComponentType } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import BankAccessSection from "../components/Customer/BankAccessSection";
import { Button, TopBar } from "../components/ui";
import { useUserDashboard } from "../queries/user";
import { useAuthStore } from "../store/authStore";

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const { walletAddress } = useAuthStore();
  const { data: dashboard, isPending, isError, error } = useUserDashboard();

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

  if (isPending) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-3xl mx-auto py-20 px-6 text-center text-ink-400">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-3xl mx-auto py-20 px-6 text-center text-red-600">
          {error.message}
        </div>
      </div>
    );
  }

  if (!dashboard.has_submission) {
    return <Navigate to="/kyc" replace />;
  }

  const status =
    statusCopy[dashboard.status ?? "PENDING"] ?? statusCopy.PENDING;

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
          {dashboard.status === "REJECTED" && (
            <Button
              variant="primary"
              className="bg-white text-navy-900 hover:bg-white/90 shrink-0"
              onClick={() => navigate("/kyc")}
            >
              Resubmit KYC
            </Button>
          )}
        </div>

        {dashboard.status === "APPROVED" && walletAddress && (
          <BankAccessSection walletAddress={walletAddress} />
        )}
      </div>
    </div>
  );
}
