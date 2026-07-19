import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, SectionCard } from "../ui";
import { useSubmissions } from "../../queries/verifier";
import type { SubmissionListStatus } from "../../api/client";

const tabs: { value: SubmissionListStatus; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

export default function SubmissionsList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<SubmissionListStatus>("pending");
  const { data: submissions, isPending, isError, error } = useSubmissions(tab);

  return (
    <SectionCard
      title="KYC applications"
      description="Customer submissions on the network."
    >
      <div className="flex gap-2 mb-4">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              tab === t.value
                ? "bg-accent-600 text-white"
                : "bg-gray-100 text-ink-600 hover:text-ink-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <p className="text-sm text-ink-400">Loading submissions...</p>
      ) : isError ? (
        <p className="text-sm text-red-600">{error.message}</p>
      ) : submissions.length === 0 ? (
        <p className="text-sm text-ink-400">No {tab} submissions.</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 border border-line rounded-lg px-4 py-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-ink-900 text-sm">
                  {s.full_name}
                </p>
                <p className="text-xs text-ink-600">
                  Submitted {new Date(s.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge>v{s.version}</Badge>
              <Button
                variant="secondary"
                onClick={() => navigate(`/verifier/submissions/${s.id}`)}
              >
                Review
              </Button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
