import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UploadCloud, FileText, Check } from "lucide-react";
import { Button, Input, TopBar } from "../components/ui";
import { useSubmitKyc, useUserDashboard } from "../queries/user";
import { useAuthStore } from "../store/authStore";

const stepLabels = ["Personal details", "Documents", "Review & submit"];

const kycSchema = z.object({
  fullName: z.string().min(3, "Enter your full legal name"),
  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required")
    .refine((value) => {
      const dob = new Date(value);
      if (Number.isNaN(dob.getTime())) return false;
      const cutoff = new Date();
      cutoff.setFullYear(cutoff.getFullYear() - 18);
      return dob <= cutoff;
    }, "You must be at least 18 years old"),
  country: z.string().min(1, "Country is required"),
  nationality: z.string().min(1, "Nationality is required"),
  documentNumber: z
    .string()
    .min(1, "Citizenship number is required")
    .regex(/^[\d-]+$/, "Use digits and dashes only, e.g. 12-01-70-04521"),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^\+?[\d\s-]{7,15}$/, "Enter a valid phone number"),
  address: z.string().min(5, "Enter your full permanent address"),
  identityDocument: z.instanceof(File, {
    message: "Citizenship certificate is required",
  }),
  selfie: z.instanceof(File, {
    message: "Passport-size photo is required",
  }),
});

type KycFormValues = z.infer<typeof kycSchema>;

const stepFields: Record<number, (keyof KycFormValues)[]> = {
  1: [
    "fullName",
    "dateOfBirth",
    "country",
    "nationality",
    "documentNumber",
    "phone",
    "email",
    "address",
  ],
  2: ["identityDocument", "selfie"],
};

const docItems = [
  {
    key: "identityDocument",
    label: "Citizenship certificate",
    desc: "Clear photo or scan, both sides",
    accept: "image/*,.pdf",
  },
  {
    key: "selfie",
    label: "Passport-size photo",
    desc: "Recent, plain background",
    accept: "image/*",
  },
] as const;

export default function SubmitKyc() {
  const navigate = useNavigate();
  const { walletAddress } = useAuthStore();
  const { data: dashboard, isPending: dashboardPending } = useUserDashboard();
  const {
    mutate: submitKyc,
    isPending: submitting,
    error: submitError,
  } = useSubmitKyc();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors },
  } = useForm<KycFormValues>({
    resolver: zodResolver(kycSchema),
    mode: "onTouched",
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      country: "",
      nationality: "",
      documentNumber: "",
      phone: "",
      email: "",
      address: "",
    },
  });

  const values = watch();

  const onSubmit = handleSubmit((data) => {
    const form = new FormData();
    const { identityDocument, selfie } = data;
    // form.append("full_name", data.fullName);
    // form.append("date_of_birth", data.dateOfBirth);
    // form.append("country", data.country);
    // form.append("nationality", data.nationality);
    // form.append("document_number", data.documentNumber);
    // form.append("phone_number", data.phone);
    // form.append("email", data.email);
    // form.append("address", data.address);

    const mappingData = {
      full_name: data.fullName,
      date_of_birth: data.dateOfBirth,
      country: data.country,
      nationality: data.nationality,
      document_number: data.documentNumber,
      phone_number: data.phone,
      email: data.email,
      address: data.address,
    };
    form.append("document_type", "CITIZENSHIP");
    form.append("identity_document", identityDocument);
    form.append("selfie", selfie);
    form.append("data", JSON.stringify(mappingData));

    submitKyc(form, {
      onSuccess: () => navigate("/kyc/submitted"),
    });
  });

  async function handleContinue() {
    if (step < 3) {
      const valid = await trigger(stepFields[step]);
      if (valid) setStep(step + 1);
    } else {
      onSubmit();
    }
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
    else navigate("/dashboard");
  }

  if (dashboardPending) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopBar />
        <div className="max-w-3xl mx-auto py-20 px-6 text-center text-ink-400">
          Loading your KYC...
        </div>
      </div>
    );
  }

  if (dashboard?.has_submission && dashboard.status !== "REJECTED") {
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
            <form
              className="grid grid-cols-2 gap-x-6 gap-y-5"
              onSubmit={(e) => e.preventDefault()}
            >
              <Input
                label="Full legal name"
                hint="As shown on citizenship certificate"
                error={errors.fullName?.message}
                {...register("fullName")}
              />
              <Input
                label="Date of birth"
                type="date"
                hint="DD / MM / YYYY"
                error={errors.dateOfBirth?.message}
                {...register("dateOfBirth")}
              />
              <Input
                label="Country"
                hint="e.g. Nepal"
                error={errors.country?.message}
                {...register("country")}
              />
              <Input
                label="Nationality"
                hint="e.g. Nepali"
                error={errors.nationality?.message}
                {...register("nationality")}
              />
              <Input
                label="Citizenship no."
                hint="e.g. 12-01-70-04521"
                error={errors.documentNumber?.message}
                {...register("documentNumber")}
              />
              <Input
                label="Phone number"
                hint="+977 98XXXXXXXX"
                error={errors.phone?.message}
                {...register("phone")}
              />
              <Input
                label="Email"
                type="email"
                hint="you@example.com"
                error={errors.email?.message}
                {...register("email")}
              />
              <Input
                label="Permanent address"
                hint="Ward no., Municipality, District"
                error={errors.address?.message}
                {...register("address")}
              />
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              {docItems.map(({ key, label, desc, accept }) => {
                const file = values[key];
                const error = errors[key]?.message;
                return (
                  <div key={key}>
                    <label
                      className={`w-full flex items-center gap-4 border rounded-lg px-4 py-4 text-left transition-colors cursor-pointer ${
                        file
                          ? "border-accent-600 bg-accent-50/40"
                          : error
                            ? "border-red-400"
                            : "border-line hover:border-accent-600"
                      }`}
                    >
                      <input
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={(e) => {
                          const picked = e.target.files?.[0];
                          if (picked) {
                            setValue(key, picked, { shouldValidate: true });
                          }
                        }}
                      />
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center ${file ? "bg-accent-600 text-white" : "bg-gray-100 text-ink-600"}`}
                      >
                        {file ? (
                          <FileText size={16} />
                        ) : (
                          <UploadCloud size={16} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-ink-900">{label}</p>
                        <p className="text-sm text-ink-600">
                          {file ? file.name : desc}
                        </p>
                      </div>
                      <span className="text-sm text-accent-600 font-medium">
                        {file ? "Change" : "Upload"}
                      </span>
                    </label>
                    {error && (
                      <p className="text-xs text-red-600 mt-1">{error}</p>
                    )}
                  </div>
                );
              })}
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
                  ["Full legal name", values.fullName || "—"],
                  ["Date of birth", values.dateOfBirth || "—"],
                  ["Country", values.country || "—"],
                  ["Nationality", values.nationality || "—"],
                  ["Citizenship no.", values.documentNumber || "—"],
                  ["Phone number", values.phone || "—"],
                  ["Email", values.email || "—"],
                  ["Permanent address", values.address || "—"],
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
                  {
                    [values.identityDocument, values.selfie].filter(Boolean)
                      .length
                  }{" "}
                  of 2
                </span>
              </div>
              {submitError && (
                <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg px-4 py-3">
                  {submitError.message}
                </p>
              )}
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
            <Button onClick={handleContinue} disabled={submitting}>
              {step < 3 ? "Continue" : submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
