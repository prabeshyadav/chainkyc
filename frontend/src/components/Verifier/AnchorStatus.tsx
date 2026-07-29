import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { errorMessage } from "../../helper/approvalFlow";
import {
  CHAIN_NAME,
  ChainMismatchError,
  ensureChain,
} from "../../helper/chain";
import { type OnChainAnchorState } from "../../helper/kycRegistry";
import { Button, SectionCard } from "../ui";
import { RegistryNotDeployedError } from "../../helper/error";

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
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  async function handleSwitchNetwork() {
    setSwitching(true);
    setSwitchError(null);
    try {
      await ensureChain();
      onRecheck();
    } catch (err) {
      setSwitchError(errorMessage(err));
    } finally {
      setSwitching(false);
    }
  }

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

          {switchError && (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg px-4 py-3">
              {switchError}
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            {error instanceof ChainMismatchError && (
              <Button
                variant="success"
                disabled={switching}
                onClick={handleSwitchNetwork}
              >
                {switching ? "Switching..." : `Switch to ${CHAIN_NAME}`}
              </Button>
            )}
            {!(error instanceof RegistryNotDeployedError) && (
              <Button variant="secondary" onClick={onRecheck}>
                Check again
              </Button>
            )}
          </div>
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
