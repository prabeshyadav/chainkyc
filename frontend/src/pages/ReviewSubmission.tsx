import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Badge, Button, SectionCard, TopBar } from "../components/ui";
import {
  useApproveSubmission,
  useRejectSubmission,
  useSubmission,
} from "../queries/verifier";

export default function ReviewSubmission() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState("");

  const { data: submission, isPending, isError, error } = useSubmission(id!);
  const approve = useApproveSubmission();
  const reject = useRejectSubmission();
  const acting = approve.isPending || reject.isPending;
  const decisionError = approve.error ?? reject.error;

  if (!id) {
    return <Navigate to="/verifier" replace />;
  }

  function handleApprove() {
    setRemarksError("");
    approve.mutate(
      { id: id!, remarks },
      { onSuccess: () => navigate("/verifier") },
    );
  }

  function handleReject() {
    if (!remarks.trim()) {
      setRemarksError("Remarks are required when rejecting a submission.");
      return;
    }
    setRemarksError("");
    reject.mutate(
      { id: id!, remarks },
      { onSuccess: () => navigate("/verifier") },
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="max-w-3xl mx-auto py-10 px-6 space-y-6">
        <button
          onClick={() => navigate("/verifier")}
          className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900"
        >
          <ArrowLeft size={14} />
          Back to console
        </button>

        {isPending ? (
          <p className="text-ink-400 text-center py-16">
            Loading submission...
          </p>
        ) : isError ? (
          <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg px-4 py-3">
            {error.message}
          </p>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div>
                <p className="uppercase text-xs tracking-widest text-ink-400 mb-2 font-mono">
                  Submission &middot; {submission.id}
                </p>
                <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
                  {submission.full_name}
                </h1>
                <p className="text-ink-600">
                  Review the application and record your decision on-chain.
                </p>
              </div>
              <Badge>v{submission.version}</Badge>
            </div>

            <SectionCard title="Applicant details">
              <div className="border border-line rounded-lg divide-y divide-line">
                {[
                  ["Full legal name", submission.full_name],
                  [
                    "Submitted on",
                    new Date(submission.created_at).toLocaleString(),
                  ],
                  ["Version", `v${submission.version}`],
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
              <p className="text-xs text-ink-400 mt-3">
                The submission API currently returns name, version and date
                only — expand the backend detail schema to review full
                applicant data and documents here.
              </p>
            </SectionCard>

            <SectionCard
              title="Decision"
              description="Approving issues the KYC token; rejecting sends it back to the customer."
            >
              <label className="block mb-4">
                <span className="block text-sm font-medium text-ink-900 mb-1.5">
                  Remarks
                </span>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  rows={3}
                  placeholder="Optional for approval, required for rejection"
                  className={`w-full rounded-lg border px-3.5 py-2.5 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:border-transparent ${
                    remarksError
                      ? "border-red-400 focus:ring-red-500"
                      : "border-line focus:ring-accent-600"
                  }`}
                />
                {remarksError && (
                  <span className="block text-xs text-red-600 mt-1">
                    {remarksError}
                  </span>
                )}
              </label>

              {decisionError && (
                <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg px-4 py-3 mb-4">
                  {decisionError.message}
                </p>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="danger"
                  disabled={acting}
                  onClick={handleReject}
                >
                  {reject.isPending ? "Rejecting..." : "Reject"}
                </Button>
                <Button
                  variant="success"
                  disabled={acting}
                  onClick={handleApprove}
                >
                  {approve.isPending ? "Approving..." : "Approve"}
                </Button>
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
