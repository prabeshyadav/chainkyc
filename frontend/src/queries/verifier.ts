import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { SubmissionListStatus } from "../api/client";

export const verifierKeys = {
  all: ["verifier"] as const,
  dashboard: () => [...verifierKeys.all, "dashboard"] as const,
  submissions: (status: SubmissionListStatus) =>
    [...verifierKeys.all, "submissions", status] as const,
  submission: (id: string) => [...verifierKeys.all, "submission", id] as const,
};

export function useVerifierDashboard() {
  return useQuery({
    queryKey: verifierKeys.dashboard(),
    queryFn: api.getVerifierDashboard,
  });
}

export function useSubmissions(status: SubmissionListStatus) {
  return useQuery({
    queryKey: verifierKeys.submissions(status),
    queryFn: () => api.listSubmissions(status),
  });
}

export function useSubmission(id: string) {
  return useQuery({
    queryKey: verifierKeys.submission(id),
    queryFn: () => api.getSubmission(id),
  });
}

interface DecisionInput {
  id: string;
  remarks: string;
}

export function useApproveSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: DecisionInput) =>
      api.approveSubmission(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verifierKeys.all });
    },
  });
}

export function useRejectSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, remarks }: DecisionInput) =>
      api.rejectSubmission(id, remarks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verifierKeys.all });
    },
  });
}
