import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";
import type { KycDocument } from "../api/client";
import { Badge, Button, SectionCard, TopBar } from "../components/ui";
import {
  useApproveSubmission,
  useRejectSubmission,
  useSubmission,
} from "../queries/verifier";

const statusTones = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
} as const;

function DocumentRow({ doc }: { doc: KycDocument }) {
  return (
    <div className="flex items-center gap-4 border border-line rounded-lg px-4 py-3">
      <div className="w-9 h-9 rounded-lg bg-gray-100 text-ink-600 flex items-center justify-center">
        <FileText size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink-900 text-sm">
          {doc.document_type_display}
        </p>
        <p className="text-xs text-ink-600">
          Uploaded {new Date(doc.uploaded_at).toLocaleDateString()}
        </p>
      </div>
      {doc.file ? (
        <a
          href={doc.file}
          target="_blank"
          rel="noreferrer"
          className="text-sm text-accent-600 font-medium hover:text-accent-700"
        >
          View
        </a>
      ) : (
        <span className="text-sm text-ink-400">Unavailable</span>
      )}
    </div>
  );
}

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
              <div className="flex items-center gap-2">
                <Badge tone={statusTones[submission.status]}>
                  {submission.status_display}
                </Badge>
                <Badge>v{submission.version}</Badge>
              </div>
            </div>

            <SectionCard title="Applicant details">
              <div className="border border-line rounded-lg divide-y divide-line">
                {[
                  ["Full legal name", submission.full_name],
                  ["Date of birth", submission.date_of_birth],
                  ["Country", submission.country],
                  ["Nationality", submission.nationality],
                  ["Document number", submission.document_number],
                  ["Phone number", submission.phone_number],
                  ["Email", submission.email],
                  ["Permanent address", submission.address],
                  [
                    "Submitted on",
                    new Date(submission.created_at).toLocaleString(),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 px-4 py-3 text-sm"
                  >
                    <span className="text-ink-600 shrink-0">{label}</span>
                    <span className="text-ink-900 font-medium text-right">
                      {value || "—"}
                    </span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              title="Documents"
              description="Files uploaded with this submission."
            >
              {submission.documents.length === 0 ? (
                <p className="text-sm text-ink-400">No documents attached.</p>
              ) : (
                <div className="space-y-3">
                  {submission.documents.map((doc) => (
                    <DocumentRow key={doc.id} doc={doc} />
                  ))}
                </div>
              )}
            </SectionCard>

            {submission.status === "PENDING" ? (
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
            ) : (
              <p className="text-sm text-ink-400">
                This submission has already been {submission.status_display.toLowerCase()}
                — no further action is possible.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
