import { ArrowLeft, FileText } from "lucide-react";
import { useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import type { KycDocument } from "../api/client";
import { Badge, SectionCard, TopBar } from "../components/ui";
import PersonalDetail from "../components/ui/DetailRow";
import AnchorStatus from "../components/Verifier/AnchorStatus";
import ApprovalStatusCard from "../components/Verifier/ApprovalStatusCard";
import DecisionForm from "../components/Verifier/DecisionForm";
import { useApprovalFlow } from "../hooks/useApprovalFlow";
import {
  useAnchorState,
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
        <p className="text-xs text-ink-600">{doc.document_type}</p>
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

  const { data: submission, isPending, isError, error } = useSubmission(id!);
  const reject = useRejectSubmission();

  const approval = useApprovalFlow({
    submissionId: id!,
    walletAddress: submission?.wallet_address,
    version: submission?.version,
  });

  const anchorState = useAnchorState(
    submission?.wallet_address,
    submission?.version,
    submission?.status === "APPROVED" && !approval.active,
  );

  if (!id) {
    return <Navigate to="/verifier" replace />;
  }

  function handleReject() {
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
                  {submission.status}
                </Badge>
                <Badge>v{submission.version}</Badge>
              </div>
            </div>

            <SectionCard title="Applicant details">
              <PersonalDetail
                fullName={submission?.full_name}
                dob={submission?.date_of_birth}
                country={submission?.country}
                nationality={submission?.nationality}
                phoneNumber={submission?.phone_number}
                email={submission?.email}
                address={submission?.address}
              />
            </SectionCard>

            <SectionCard
              title="Documents"
              description="Files uploaded with this submission."
            >
              {submission.identity_document && (
                <DocumentRow
                  doc={{
                    id: "identity_document",
                    document_type: "Identity Document",
                    document_type_display: "",
                    file: submission.identity_document,
                    uploaded_at: "",
                  }}
                />
              )}
              {submission.selfie && (
                <DocumentRow
                  doc={{
                    id: "identity_document",
                    document_type: "Passport size photo",
                    document_type_display: "",
                    file: submission.selfie,
                    uploaded_at: "",
                  }}
                />
              )}
            </SectionCard>

            {approval.active ? (
              <ApprovalStatusCard
                approval={approval}
                onLeave={() => navigate("/verifier")}
              />
            ) : submission.status === "PENDING" ? (
              <DecisionForm
                remarks={remarks}
                onRemarksChange={setRemarks}
                rejecting={reject.isPending}
                error={approval.approveError ?? reject.error}
                onApprove={() => approval.run({ remarks })}
                onReject={handleReject}
              />
            ) : submission.status === "APPROVED" ? (
              <AnchorStatus
                version={submission.version}
                isChecking={anchorState.isPending}
                error={anchorState.error}
                state={anchorState.data}
                canAnchor={Boolean(submission.verification_id)}
                onRecheck={() => anchorState.refetch()}
                onAnchor={() =>
                  approval.run({
                    verificationId: submission.verification_id!,
                  })
                }
              />
            ) : (
              <p className="text-sm text-ink-400">
                This submission has already been{" "}
                {submission.status.toLowerCase()}— no further action is
                possible.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
