import { TopBar, SectionCard, Button, Badge } from "../components/ui";
import DashboardStats from "../components/Verifier/DashboardStats";
import SubmissionsList from "../components/Verifier/SubmissionsList";
import { useAuthStore } from "../store/authStore";

export default function VerifierConsole() {
  const { walletAddress } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="max-w-3xl mx-auto py-10 px-6 space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="uppercase text-xs tracking-widest text-ink-400 mb-2 font-mono">
              Verifier &middot; {walletAddress}
            </p>
            <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
              Verifier console
            </h1>
            <p className="text-ink-600">Verifies customer's KYC.</p>
          </div>
          <Badge tone="success">Whitelisted</Badge>
        </div>

        <DashboardStats />
        <SubmissionsList />
      </div>
    </div>
  );
}
