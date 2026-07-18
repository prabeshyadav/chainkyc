import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { UploadCloud, FileText, Check } from "lucide-react";
import { useAppStore } from "../store/appStore";
import { Button, Input, TopBar } from "../components/ui";
import { useAuthStore } from "../store/authStore";
import { useKycStore } from "../store/kycStore";

const stepLabels = ["Personal details", "Documents", "Review & submit"];

export default function SubmitKyc() {
  const navigate = useNavigate();
  const { submitKyc } = useAppStore();
  const { walletAddress } = useAuthStore();
  const { kyc, loaded, fetchMyKyc } = useKycStore();
  const [step, setStep] = useState(1);

  useEffect(() => {
    fetchMyKyc();
  }, [fetchMyKyc]);
  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    citizenshipNo: "",
    phone: "",
    address: "",
  });
  const [docs, setDocs] = useState<Record<string, boolean>>({
    citizenship: false,
    photo: false,
    supporting: false,
  });

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleContinue() {
    if (step < 3) setStep(step + 1);
    else {
      submitKyc({ ...form, docs });
      navigate("/kyc/submitted");
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
    else navigate("/dashboard");
  }

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

  if (kyc && kyc.status !== "REJECTED") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="max-w-3xl mx-auto py-12 px-6">
        <div className="bg-white border border-line rounded-xl p-8">
          <p className="uppercase text-xs tracking-widest text-ink-400 mb-2 font-mono">
            Customer &middot; {walletAddress}
          </p>
          <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
            Submit your KYC documents
          </h1>
          <p className="text-ink-600 mb-8">
            This is a one-time submission. Every institution you approve
            afterward reuses it.
          </p>

          {/* Stepper */}
          <div className="flex items-center mb-10">
            {stepLabels.map((label, i) => {
              const n = i + 1;
              const active = n === step;
              const done = n < step;
              return (
                <div
                  key={label}
                  className="flex items-center flex-1 last:flex-none"
                >
                  <div className="flex flex-col items-center gap-1.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium ${
                        done
                          ? "bg-accent-600 text-white"
                          : active
                            ? "bg-accent-600 text-white"
                            : "bg-gray-100 text-ink-400"
                      }`}
                    >
                      {done ? <Check size={14} /> : n}
                    </div>
                    <span
                      className={`text-xs ${active ? "text-ink-900 font-medium" : "text-ink-400"}`}
                    >
                      {label}
                    </span>
                  </div>
                  {n < stepLabels.length && (
                    <div
                      className={`h-px flex-1 mx-3 mb-5 ${done ? "bg-accent-600" : "bg-line"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <div className="grid grid-cols-2 gap-x-6 gap-y-5">
              <Input
                label="Full legal name"
                hint="As shown on citizenship certificate"
                value={form.fullName}
                onChange={(e) => update("fullName", e.target.value)}
              />
              <Input
                label="Date of birth"
                hint="DD / MM / YYYY"
                value={form.dob}
                onChange={(e) => update("dob", e.target.value)}
              />
              <Input
                label="Citizenship no."
                hint="e.g. 12-01-70-04521"
                value={form.citizenshipNo}
                onChange={(e) => update("citizenshipNo", e.target.value)}
              />
              <Input
                label="Phone number"
                hint="+977 98XXXXXXXX"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
              <div className="col-span-2">
                <Input
                  label="Permanent address"
                  hint="Ward no., Municipality, District"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {[
                {
                  key: "citizenship",
                  label: "Citizenship certificate",
                  desc: "Clear photo or scan, both sides",
                },
                {
                  key: "photo",
                  label: "Passport-size photo",
                  desc: "Recent, plain background",
                },
                {
                  key: "supporting",
                  label: "Supporting document",
                  desc: "Utility bill or bank statement for address proof",
                },
              ].map(({ key, label, desc }) => (
                <button
                  key={key}
                  onClick={() => setDocs((d) => ({ ...d, [key]: !d[key] }))}
                  className={`w-full flex items-center gap-4 border rounded-lg px-4 py-4 text-left transition-colors ${
                    docs[key]
                      ? "border-accent-600 bg-accent-50/40"
                      : "border-line hover:border-accent-600"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center ${docs[key] ? "bg-accent-600 text-white" : "bg-gray-100 text-ink-600"}`}
                  >
                    {docs[key] ? (
                      <FileText size={16} />
                    ) : (
                      <UploadCloud size={16} />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-ink-900">{label}</p>
                    <p className="text-sm text-ink-600">{desc}</p>
                  </div>
                  <span className="text-sm text-accent-600 font-medium">
                    {docs[key] ? "Uploaded" : "Upload"}
                  </span>
                </button>
              ))}
              <p className="text-xs text-ink-400 pt-2">
                Files are encrypted client-side and pinned to IPFS before any
                hash is written on-chain.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="border border-line rounded-lg divide-y divide-line">
                {[
                  ["Full legal name", form.fullName || "—"],
                  ["Date of birth", form.dob || "—"],
                  ["Citizenship no.", form.citizenshipNo || "—"],
                  ["Phone number", form.phone || "—"],
                  ["Permanent address", form.address || "—"],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between px-4 py-3 text-sm"
                  >
                    <span className="text-ink-600">{label}</span>
                    <span className="text-ink-900 font-medium">{value}</span>
                  </div>
                ))}
              </div>
              <div className="border border-line rounded-lg px-4 py-3 flex items-center justify-between text-sm">
                <span className="text-ink-600">Documents attached</span>
                <span className="text-ink-900 font-medium">
                  {Object.values(docs).filter(Boolean).length} of 3
                </span>
              </div>
              <p className="text-xs text-ink-400">
                By submitting, wallet{" "}
                <span className="font-mono">{walletAddress}</span> will be
                linked to this document hash on-chain. A licensed verifier
                reviews it off-chain before issuing your KYC token.
              </p>
            </div>
          )}

          <div className="flex justify-between mt-10">
            <button
              onClick={handleBack}
              className="text-sm text-ink-600 hover:text-ink-900"
            >
              &larr; Back
            </button>
            <Button onClick={handleContinue}>
              {step < 3 ? "Continue" : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
