import { isAddress } from "ethers";
import { ArrowLeft } from "lucide-react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { Badge, SectionCard, TopBar } from "../components/ui";
import PersonalDetail, { DetailRow } from "../components/ui/DetailRow";
import DocumentPreview from "../components/ui/DocumentPreview";
import { useBankKyc } from "../queries/bank";

const statusTones = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
} as const;

function formatTimestamp(value: string | number | null | undefined): string {
  if (!value) return "—";
  const date =
    typeof value === "number" ? new Date(value * 1000) : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

export default function BankCustomerDetail() {
  const navigate = useNavigate();
  const { address } = useParams<{ address: string }>();
  const { data, isPending, isError, error } = useBankKyc(
    address && isAddress(address) ? address : null,
  );

  if (!address || !isAddress(address)) {
    return <Navigate to="/bank" replace />;
  }

  const user = data?.kyc_data.user;
  const documents = data?.kyc_data.documents;
  const verification = data?.kyc_data.verification;
  const submission = data?.kyc_data.submission;

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar />

      <div className="max-w-3xl mx-auto py-10 px-6 space-y-6">
        <div className="sticky top-(--topbar-h) z-40 -mx-6 px-6 py-3 bg-gray-50">
          <button
            onClick={() => navigate("/bank")}
            className="flex items-center gap-1.5 text-sm text-ink-600 hover:text-ink-900"
          >
            <ArrowLeft size={14} />
            Back to console
          </button>
        </div>

        {isPending ? (
          <p className="text-ink-400 text-center py-16">Decrypting record...</p>
        ) : isError ? (
          <div className="border border-red-200 bg-red-50 rounded-lg px-4 py-3">
            <p className="text-sm text-red-600">
              Could not load this record: {error.message}
            </p>
            <p className="text-xs text-red-600/80 mt-1">
              Access may have been revoked since the list was loaded, or the
              customer's KYC has not been anchored yet.
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="uppercase text-xs tracking-widest text-ink-400 mb-2 font-mono truncate">
                  Customer &middot; {data.user_wallet}
                </p>
                <h1 className="font-display text-2xl font-semibold text-ink-900 mb-1">
                  {user?.full_name || "Verified customer"}
                </h1>
                <p className="text-ink-600">
                  Decrypted from IPFS after an on-chain permission check.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {submission?.status && (
                  <Badge tone={statusTones[submission.status]}>
                    {submission.status}
                  </Badge>
                )}
                {submission?.version && <Badge>v{submission.version}</Badge>}
              </div>
            </div>

            <SectionCard
              title="Identity details"
              description="Personal data the customer submitted and a verifier approved."
            >
              <PersonalDetail
                fullName={user?.full_name}
                dob={user?.date_of_birth}
                country={user?.country}
                nationality={user?.nationality}
                phoneNumber={user?.phone_number}
                email={user?.email}
                address={user?.address}
              />
            </SectionCard>

            <SectionCard
              title="Documents"
              description="Files attached to the approved submission."
            >
              {documents?.identity_document || documents?.selfie ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {documents.identity_document && (
                    <DocumentPreview
                      label={documents.document_type || "Identity document"}
                      data={documents.identity_document}
                    />
                  )}
                  {documents.selfie && (
                    <DocumentPreview label="Selfie" data={documents.selfie} />
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink-400">
                  No documents in this record.
                </p>
              )}
            </SectionCard>

            <SectionCard
              title="Verification"
              description="Who approved this record and when."
            >
              <div className="border border-line rounded-lg divide-y divide-line mt-4">
                <DetailRow
                  label="Verified on"
                  value={formatTimestamp(data.verified_at)}
                />
                <DetailRow
                  label="Verifier remarks"
                  value={verification?.remarks}
                />
                <DetailRow label="Wallet address" value={data.user_wallet} />
                <DetailRow
                  label="Verifier wallet"
                  value={verification?.verifier_wallet}
                />
              </div>
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
