import { useNavigate } from "react-router-dom";
import { ShieldCheck, Wallet, Link2, ArrowLeft } from "lucide-react";
import { useApp } from "../context/AppContext";
import { TopBar } from "../components/ui";

const roleCopy = {
  customer: {
    access: "Customer access",
    title: "Connect your wallet to continue.",
    body: "Your wallet address is your identity on VerifyChain. No separate username or password to manage.",
  },
  institution: {
    access: "Institution access",
    title: "Connect your institution wallet.",
    body: "Your wallet must be whitelisted by the regulator before you can request customer data.",
  },
  admin: {
    access: "Admin access",
    title: "Connect your regulator wallet.",
    body: "Only pre-authorized regulator wallets can access the audit and whitelist console.",
  },
};

export default function ConnectWallet() {
  const navigate = useNavigate();
  const { role, connectWallet } = useApp();
  const copy = role
    ? roleCopy[role as keyof typeof roleCopy]
    : roleCopy.customer;

  function handleConnect(provider: string) {
    connectWallet(provider);
    if (role === "customer") navigate("/kyc");
    else if (role === "institution") navigate("/institution");
    else navigate("/admin");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      <div className="flex-1 grid md:grid-cols-2">
        <div className="bg-navy-900 text-white px-30 py-16 md:py-0 flex flex-col justify-center">
          <p className="uppercase text-xs tracking-widest text-white/50 mb-4 font-mono">
            {copy.access}
          </p>
          <h1 className="font-display text-4xl font-semibold leading-tight mb-6">
            {copy.title}
          </h1>
          <p className="text-white/70 max-w-md mb-12 leading-relaxed">
            {copy.body}
          </p>
          <button
            onClick={() => navigate("/")}
            className="self-start flex items-center gap-2 text-sm text-white/70 border border-white/20 rounded-lg px-4 py-2.5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft size={14} /> Choose a different role
          </button>
        </div>

        <div className="p-[150px_120px_80px_80px] flex flex-col justify-center">
          <p className="uppercase text-xs tracking-widest text-ink-400 mb-2 font-mono">
            Step 1 of 2
          </p>
          <h2 className="font-display text-2xl font-semibold text-ink-900 mb-1">
            Log in with wallet
          </h2>
          <p className="text-ink-600 mb-8">
            MetaMask confirms your identity. VerifyChain never sees your private
            key.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleConnect("metamask")}
              className="w-full flex items-center gap-3 border border-line rounded-lg px-4 py-3.5 hover:border-accent-600 hover:bg-accent-50/40 transition-colors font-medium text-ink-900"
            >
              <Wallet size={18} className="text-accent-600" /> Connect MetaMask
            </button>
            <div className="flex items-center gap-3 text-xs text-ink-400">
              <div className="h-px bg-line flex-1" /> OR{" "}
              <div className="h-px bg-line flex-1" />
            </div>
            <button
              onClick={() => handleConnect("walletconnect")}
              className="w-full flex items-center gap-3 border border-line rounded-lg px-4 py-3.5 hover:border-accent-600 hover:bg-accent-50/40 transition-colors font-medium text-ink-900"
            >
              <Link2 size={18} className="text-accent-600" /> Connect
              WalletConnect
            </button>
          </div>

          <p className="text-xs text-ink-400 mt-6">
            By connecting, you agree to VerifyChain's{" "}
            <a href="#" className="text-accent-600 hover:underline">
              Terms
            </a>{" "}
            and acknowledge our{" "}
            <a href="#" className="text-accent-600 hover:underline">
              data policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
