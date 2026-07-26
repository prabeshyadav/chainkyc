import { useState } from "react";
import { Button, SectionCard } from "../ui";

export default function DecisionForm({
  remarks,
  onRemarksChange,
  rejecting,
  error,
  onApprove,
  onReject,
}: {
  remarks: string;
  onRemarksChange: (remarks: string) => void;
  rejecting: boolean;
  error: Error | null;
  onApprove: () => void;
  onReject: () => void;
}) {
  const [remarksError, setRemarksError] = useState("");

  function handleReject() {
    if (!remarks.trim()) {
      setRemarksError("Remarks are required when rejecting a submission.");
      return;
    }
    setRemarksError("");
    onReject();
  }

  function handleApprove() {
    setRemarksError("");
    onApprove();
  }

  return (
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
          onChange={(e) => onRemarksChange(e.target.value)}
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

      {error && (
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 rounded-lg px-4 py-3 mb-4">
          {error.message}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <Button variant="danger" disabled={rejecting} onClick={handleReject}>
          {rejecting ? "Rejecting..." : "Reject"}
        </Button>
        <Button variant="success" disabled={rejecting} onClick={handleApprove}>
          Approve
        </Button>
      </div>
    </SectionCard>
  );
}
