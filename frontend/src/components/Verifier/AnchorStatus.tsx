import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { Button, SectionCard } from "../ui";
import { errorMessage } from "../../helper/approvalFlow";
import type { OnChainAnchorState } from "../../helper/kycRegistry";

export default function AnchorStatus({
  version,
  isChecking,
  error,
  state,
  canAnchor,
  onRecheck,
  onAnchor,
}: {
  version: number;
  isChecking: boolean;
  error: unknown;
  state: OnChainAnchorState | undefined;
  canAnchor: boolean;
  onRecheck: () => void;
  onAnchor: () => void;
}) {
  return (
    <SectionCard
      title="Blockchain anchor"
      description="Approval only records the decision — this is the on-chain half."
    >
      {isChecking ? (
        <p className="flex items-center gap-2.5 text-sm text-ink-600">
          <Loader2 size={16} className="text-accent-600 animate-spin" />
          Checking the registry...
        </p>
      ) : error ? (
        <div className="space-y-3">
          <p className="flex items-start gap-2.5 text-sm text-ink-600">
            <AlertTriangle
              size={16}
              className="text-amber-600 shrink-0 mt-px"
            />
            Could not read the registry, so the on-chain state is unknown:{" "}
            {errorMessage(error)}
          </p>
          <Button variant="secondary" onClick={onRecheck}>
            Check again
          </Button>
        </div>
      ) : state?.anchored ? (
        <p className="flex items-start gap-2.5 text-sm text-ink-600">
          <Check size={16} className="text-emerald-600 shrink-0 mt-px" />
          Anchored on-chain — the registry holds {state.versionCount} version
          {state.versionCount === 1 ? "" : "s"} for this wallet.
        </p>
      ) : (
        <div className="space-y-4">
          <p className="flex items-start gap-2.5 text-sm text-ink-900">
            <AlertTriangle
              size={16}
              className="text-amber-600 shrink-0 mt-px"
            />
            Approved, but version {version} is not on the blockchain — the
            earlier attempt stopped before the anchor was recorded.
          </p>
          {canAnchor ? (
            <Button variant="success" onClick={onAnchor}>
              Finish anchoring
            </Button>
          ) : (
            <p className="text-sm text-ink-600">
              No verification record is attached to this submission, so it
              cannot be anchored from here.
            </p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
