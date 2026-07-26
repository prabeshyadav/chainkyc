import { useRef, useState } from "react";
import {
  ANCHOR_STEPS,
  RECOVER_STEPS,
  errorMessage,
} from "../helper/approvalFlow";
import type {
  ApprovalFailure,
  ApprovalStep,
  FlowState,
} from "../helper/approvalFlow";
import { anchorKyc } from "../helper/anchorKyc";
import { ensureChain } from "../helper/chain";
import { findAnchorTx, readAnchorState } from "../helper/kycRegistry";
import type { AnchorTxRef } from "../helper/kycRegistry";
import {
  useApproveSubmission,
  useCompleteSubmission,
  usePrepareSubmission,
} from "../queries/verifier";

interface ApprovalTarget {
  submissionId: string;
  walletAddress: string | undefined;
  version: number | undefined;
}

export interface RunOptions {
  verificationId?: string;
  remarks?: string;
}

export function useApprovalFlow({
  submissionId,
  walletAddress,
  version,
}: ApprovalTarget) {
  const [flow, setFlow] = useState<FlowState>("idle");
  const [plan, setPlan] = useState<ApprovalStep[]>(ANCHOR_STEPS);
  const [failure, setFailure] = useState<ApprovalFailure | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const approvedId = useRef<string | null>(null);
  const lastOptions = useRef<RunOptions>({});

  const approve = useApproveSubmission();
  const prepare = usePrepareSubmission();
  const complete = useCompleteSubmission();

  async function finalize(verificationId: string, tx: AnchorTxRef) {
    try {
      await complete.mutateAsync({
        verificationId,
        transactionHash: tx.txHash,
        blockNumber: tx.blockNumber,
      });
    } catch (err) {
      if (err instanceof Error && /already anchored/i.test(err.message)) {
        return;
      }
      throw err;
    }
  }

  async function run(options: RunOptions = {}) {
    if (!walletAddress || !version) return;

    lastOptions.current = options;
    setFailure(null);
    setTxHash(null);

    const resumeId = options.verificationId ?? approvedId.current;
    const head: ApprovalStep[] = resumeId
      ? ["network", "checking"]
      : ["approving", "network", "checking"];
    setPlan([...head, ...ANCHOR_STEPS]);

    let step: ApprovalStep = head[0];
    const go = (next: ApprovalStep) => {
      step = next;
      setFlow(next);
    };

    try {
      let verificationId = resumeId;

      if (!verificationId) {
        go("approving");
        const approved = await approve.mutateAsync({
          id: submissionId,
          remarks: options.remarks ?? "",
        });
        verificationId = approved.id;
        approvedId.current = approved.id;
      }

      go("network");
      await ensureChain();

      go("checking");
      const onChain = await readAnchorState(walletAddress, version);

      if (onChain.anchored) {
        setPlan([...head, ...RECOVER_STEPS]);

        go("locating");
        const existing = await findAnchorTx(walletAddress, version);
        if (!existing) {
          throw new Error(
            "This KYC is already anchored on-chain, but its transaction is not in the registry logs. The record has to be reconciled manually.",
          );
        }

        go("finalizing");
        await finalize(verificationId, existing);
        setTxHash(existing.txHash);
      } else {
        go("preparing");
        const prepared = await prepare.mutateAsync({ id: verificationId });
        const { ipfs_cid, data_hash, verification_id, user_wallet } = prepared;
        if (!ipfs_cid || !data_hash || !user_wallet) {
          throw new Error(
            "The server did not return the CID, hash and wallet needed to anchor on-chain.",
          );
        }

        go("wallet");
        const anchored = await anchorKyc(user_wallet, ipfs_cid, data_hash, go);

        go("finalizing");
        await finalize(verification_id, anchored);
        setTxHash(anchored.txHash);
      }

      setFlow("done");
    } catch (err) {
      console.error(`Approval failed at step "${step}"`, err);
      if (step === "approving") {
        setFlow("idle");
        return;
      }
      setFailure({ step, message: errorMessage(err) });
    }
  }

  return {
    flow,
    plan,
    failure,
    txHash,
    running: flow !== "idle" && flow !== "done" && !failure,
    active: flow !== "idle",
    approveError: approve.error,
    run,
    retry: () => run(lastOptions.current),
  };
}

export type ApprovalFlow = ReturnType<typeof useApprovalFlow>;
