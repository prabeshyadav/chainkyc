import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PrepareResult, SubmissionListStatus } from "../api/client";
import { api } from "../api/client";
import { readAnchorState } from "../helper/kycRegistry";

export const verifierKeys = {
  all: ["verifier"] as const,
  dashboard: () => [...verifierKeys.all, "dashboard"] as const,
  submissions: (status: SubmissionListStatus) =>
    [...verifierKeys.all, "submissions", status] as const,
  submission: (id: string) => [...verifierKeys.all, "submission", id] as const,
  anchor: (wallet: string, version: number) =>
    [...verifierKeys.all, "anchor", wallet.toLowerCase(), version] as const,
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

export function useAnchorState(
  walletAddress: string | undefined,
  version: number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: verifierKeys.anchor(walletAddress ?? "", version ?? 0),
    queryFn: () => readAnchorState(walletAddress!, version!),
    enabled: enabled && Boolean(walletAddress) && Boolean(version),
    retry: false,
    staleTime: 0,
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

interface PrepareInput {
  id: string;
}

export function usePrepareSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: PrepareInput) => api.prepareSubmission(id),
    onSuccess: (response: PrepareResult) => {
      console.log({ response });
      queryClient.invalidateQueries({ queryKey: verifierKeys.all });
    },
  });
}

export interface CompleteInput {
  verificationId: string;
  transactionHash: string;
  blockNumber: number;
}

export function useCompleteSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      verificationId,
      transactionHash,
      blockNumber,
    }: CompleteInput) =>
      api.completeSubmission(verificationId, {
        transaction_hash: transactionHash,
        block_number: blockNumber,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: verifierKeys.all });
    },
  });
}
