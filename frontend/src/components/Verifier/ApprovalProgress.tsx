import { AlertCircle, Check, Circle, Loader2 } from "lucide-react";
import type { ApprovalStep, FlowState } from "../../helper/approvalFlow";

const STEP_LABELS: Record<ApprovalStep, string> = {
  approving: "Recording the decision",
  checking: "Checking the blockchain",
  locating: "Locating the existing transaction",
  preparing: "Building the on-chain payload",
  wallet: "Connecting your wallet",
  signing: "Waiting for your signature",
  confirming: "Confirming the transaction",
  finalizing: "Saving the on-chain proof",
};

export default function ApprovalProgress({
  plan,
  flow,
  failedStep,
}: {
  plan: ApprovalStep[];
  flow: FlowState;
  failedStep: ApprovalStep | null;
}) {
  const activeIndex =
    flow === "done" ? plan.length : plan.findIndex((step) => step === flow);

  return (
    <ol className="space-y-2.5">
      {plan.map((step, index) => {
        const failed = failedStep === step;
        const done = !failed && index < activeIndex;
        const active = !failed && index === activeIndex;

        return (
          <li key={step} className="flex items-center gap-2.5 text-sm">
            {failed ? (
              <AlertCircle size={16} className="text-red-600 shrink-0" />
            ) : done ? (
              <Check size={16} className="text-emerald-600 shrink-0" />
            ) : active ? (
              <Loader2
                size={16}
                className="text-accent-600 shrink-0 animate-spin"
              />
            ) : (
              <Circle size={16} className="text-ink-400 shrink-0" />
            )}
            <span
              className={
                failed
                  ? "text-red-600 font-medium"
                  : active
                    ? "text-ink-900 font-medium"
                    : done
                      ? "text-ink-600"
                      : "text-ink-400"
              }
            >
              {STEP_LABELS[step]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
