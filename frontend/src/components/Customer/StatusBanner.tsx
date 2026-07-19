import { Clock, ShieldAlert, ShieldCheck } from "lucide-react";
import { ComponentType } from "react";
import { useNavigate } from "react-router-dom";
import { UserDashboardResponse } from "../../api/client";
import { Button } from "../ui";

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

const StatusBanner = ({ dashboard }: { dashboard: UserDashboardResponse }) => {
  const navigate = useNavigate();

  const status =
    statusCopy[dashboard.status ?? "PENDING"] ?? statusCopy.PENDING;
  return (
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
  );
};

export default StatusBanner;
