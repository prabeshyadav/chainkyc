import AddVerifierSection from "../components/Admin/AddVerifierSection";
import { TopBar } from "../components/ui";
import { useAuthStore } from "../store/authStore";

export default function AdminConsole() {
  const { walletAddress } = useAuthStore();
  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="max-w-3xl mx-auto py-10 px-6 space-y-6">
        <div>
          <p className="uppercase text-xs tracking-widest text-ink-400 mb-2 font-mono">
            Admin &middot; {walletAddress}
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
            Regulatory console
          </h1>
          <p className="text-ink-600">
            Whitelist institutions and audit network-wide verification activity.
          </p>
        </div>

        <AddVerifierSection />
      </div>
    </div>
  );
}
