export type ApprovalStep =
  | "approving"
  | "checking"
  | "locating"
  | "preparing"
  | "wallet"
  | "signing"
  | "confirming"
  | "finalizing";

export type FlowState = "idle" | ApprovalStep | "done";

export interface ApprovalFailure {
  step: ApprovalStep;
  message: string;
}

export const ANCHOR_STEPS: ApprovalStep[] = [
  "preparing",
  "wallet",
  "signing",
  "confirming",
  "finalizing",
];

export const RECOVER_STEPS: ApprovalStep[] = ["locating", "finalizing"];

export function errorMessage(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  if (/user rejected|ACTION_REJECTED|4001/i.test(raw)) {
    return "You rejected the request in your wallet.";
  }
  return raw || "Something went wrong.";
}
