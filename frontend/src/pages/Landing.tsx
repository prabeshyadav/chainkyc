import { useNavigate } from "react-router-dom";
import {
  User,
  Building2,
  ShieldCheck,
  Upload,
  Lock,
  CheckCircle2,
  Share2,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/ui";

const roles = [
  {
    id: "customer",
    icon: User,
    title: "Customer",
    desc: "Submit your documents once, control who can access them and see details.",
  },
  {
    id: "institution",
    icon: Building2,
    title: "Bank / Institution",
    desc: "Request verified status on a wallet before onboarding a customer.",
  },
  {
    id: "admin",
    icon: ShieldCheck,
    title: "Admin (Regulatory Authority)",
    desc: "Whitelist institutions, audit on-chain activity, set data-access rules.",
  },
];

const steps = [
  { icon: Upload, label: "SUBMIT" },
  { icon: Lock, label: "ENCRYPT" },
  { icon: CheckCircle2, label: "VERIFY" },
  { icon: Share2, label: "SHARE" },
];

export default function Landing() {
  const navigate = useNavigate();
  const { setRole } = useApp();

  function choose(roleId: string) {
    setRole(roleId);
    navigate("/connect");
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

        {/* Right: role select */}
        <div className="p-[150px_120px_80px_80px] flex flex-col justify-center">
          <p className="uppercase text-xs tracking-widest text-ink-400 mb-2 font-mono">
            Get started
          </p>
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-1">
            Who's signing in?
          </h2>
          <p className="text-ink-600 mb-8">
            Your role determines what you can see and do on VerifyChain.
          </p>

          <div className="space-y-3">
            {roles.map(({ id, icon: Icon, title, desc }) => (
              <button
                key={id}
                onClick={() => choose(id)}
                className="w-full flex items-center gap-4 text-left border border-line rounded-xl px-4 py-4 hover:border-accent-600 hover:bg-accent-50/40 transition-colors group"
              >
                <div className="shrink-0 w-9 h-9 rounded-lg bg-gray-100 group-hover:bg-accent-100 flex items-center justify-center">
                  <Icon
                    size={18}
                    className="text-ink-600 group-hover:text-accent-700"
                  />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-ink-900">{title}</p>
                  <p className="text-sm text-ink-600">{desc}</p>
                </div>
                <span className="text-ink-400 group-hover:text-accent-600">
                  &rarr;
                </span>
              </button>
            ))}
          </div>

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
