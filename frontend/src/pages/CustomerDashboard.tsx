import { Navigate } from "react-router-dom";
import StatusBanner from "../components/Customer/StatusBanner";
import { TopBar } from "../components/ui";
import { useUserDashboard } from "../queries/user";
import { useAuthStore } from "../store/authStore";

export default function CustomerDashboard() {
  const { walletAddress } = useAuthStore();
  const { data: dashboard, isPending, isError, error } = useUserDashboard();

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

        <StatusBanner dashboard={dashboard} />
      </div>
    </div>
  );
}
