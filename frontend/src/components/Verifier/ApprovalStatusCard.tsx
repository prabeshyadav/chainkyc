import { Button, SectionCard } from "../ui";
import ApprovalProgress from "./ApprovalProgress";
import type { ApprovalFlow } from "../../hooks/useApprovalFlow";

export default function ApprovalStatusCard({
  approval,
  onLeave,
}: {
  approval: ApprovalFlow;
  onLeave: () => void;
}) {
  const { flow, plan, failure, txHash, running } = approval;

  return (
    <SectionCard
      title={
        flow === "done"
          ? "Anchoring complete"
          : failure
            ? "Anchoring incomplete"
            : "Working..."
      }
      description={
        flow === "done"
          ? "The decision is recorded and anchored on-chain."
          : failure
            ? "The decision is recorded, but the on-chain anchor did not finish. Retrying is safe — an anchor that already landed is reused, not repeated."
            : "Keep this tab open until every step below is done."
      }
    >
      <ApprovalProgress
        plan={plan}
        flow={flow}
        failedStep={failure?.step ?? null}
      />

      {failure && (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg px-4 py-3 mt-4">
          {failure.message}
        </p>
      )}

      {txHash && (
        <p className="text-xs text-ink-600 font-mono break-all mt-4">
          tx {txHash}
        </p>
      )}

      <div className="flex justify-end gap-3 mt-5">
        {failure && (
          <Button variant="success" onClick={approval.retry}>
            Retry
          </Button>
        )}
        <Button variant="secondary" disabled={running} onClick={onLeave}>
          Back to console
        </Button>
      </div>
    </SectionCard>
  );
}
