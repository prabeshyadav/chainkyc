import { Clock, Link2, ShieldAlert, ShieldCheck } from "lucide-react";
import { Card } from "../ui";
import { useVerifierDashboard } from "../../queries/verifier";

const tiles = [
  {
    key: "pending",
    label: "Pending review",
    icon: Clock,
    tone: "bg-amber-50 text-amber-700",
  },
  {
    key: "approved",
    label: "Approved",
    icon: ShieldCheck,
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    key: "rejected",
    label: "Rejected",
    icon: ShieldAlert,
    tone: "bg-red-50 text-red-600",
  },
  {
    key: "uploaded_to_blockchain",
    label: "On-chain records",
    icon: Link2,
    tone: "bg-accent-50 text-accent-700",
  },
] as const;

export default function DashboardStats() {
  const { data, isPending, isError, error } = useVerifierDashboard();

  if (isError) {
    return (
      <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg px-4 py-3">
        {error.message}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {tiles.map(({ key, label, icon: Icon, tone }) => (
        <Card key={key} className="p-5">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${tone}`}
          >
            <Icon size={16} />
          </div>
          <p className="font-display text-2xl font-semibold text-ink-900">
            {isPending ? "—" : data[key]}
          </p>
          <p className="text-sm text-ink-600">{label}</p>
        </Card>
      ))}
    </div>
  );
}
