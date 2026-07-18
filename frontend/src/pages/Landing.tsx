import { CheckCircle2, Lock, Share2, Upload, Wallet } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { homeForRole } from "../components/RequireRole";
import { TopBar } from "../components/ui";
import { useAuthStore } from "../store/authStore";

const steps = [
  { icon: Upload, label: "SUBMIT" },
  { icon: Lock, label: "ENCRYPT" },
  { icon: CheckCircle2, label: "VERIFY" },
  { icon: Share2, label: "SHARE" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { connectAndLogin, authenticated, role, initializing, loading, error } =
    useAuthStore();

  // Already logged in (stored token confirmed against /me) — go straight
  // to the console for this wallet's role.
  useEffect(() => {
    if (!initializing && authenticated) {
      navigate(homeForRole(role), { replace: true });
    }
  }, [initializing, authenticated, role, navigate]);

  async function handleConnect() {
    try {
      const session = await connectAndLogin();
      navigate(homeForRole(session.role));
    } catch {
      // error is surfaced via the auth store
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      <div className="flex-1 grid md:grid-cols-2">
        {/* Left: hero */}
        <div className="bg-navy-900 text-white px-30 py-16 md:py-0 flex flex-col justify-center">
          <p className="uppercase text-xs tracking-widest text-white/50 mb-4 font-mono">
            Shared KYC · Built On-Chain
          </p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-6">
            Verify your identity once.
            <br />
            Use it everywhere.
          </h1>
          <p className="text-white/70 max-w-md mb-10 leading-relaxed">
            One encrypted submission, stored on IPFS and hashed on-chain,
            replaces the paperwork you'd otherwise repeat at every bank.
          </p>
          <div className="flex items-center gap-8">
            {steps.map(({ icon: Icon, label }, i) => (
              <div key={label} className="flex items-center gap-8">
                <div className="flex flex-col items-center gap-2 text-white/60">
                  <Icon size={18} />
                  <span className="text-[10px] font-mono tracking-wide">
                    {label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div className="w-8 h-px bg-white/20 -mt-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: connect wallet */}
        <div className="p-[150px_120px_80px_80px] flex flex-col justify-center">
          <p className="uppercase text-xs tracking-widest text-ink-400 mb-2 font-mono">
            Get started
          </p>
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-1">
            Sign in with your wallet
          </h2>
          <p className="text-ink-600 mb-8">
            VerifyChain shows you the right console automatically.
          </p>

          <button
            onClick={() => handleConnect()}
            disabled={loading || initializing}
            className="w-full flex items-center justify-center gap-3 bg-navy-900 text-white rounded-lg px-4 py-3.5 hover:bg-navy-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Wallet size={18} />
            {initializing
              ? "Checking session..."
              : loading
                ? "Connecting..."
                : "Connect MetaMask"}
          </button>
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

          <p className="text-xs text-ink-400 mt-6">
            Institutions need admin approval before their wallet can be
            whitelisted.{" "}
            <a href="#" className="text-accent-600 hover:underline">
              Learn how access works &rarr;
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
