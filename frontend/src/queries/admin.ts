import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export const adminKeys = {
  all: ["admins"] as const,
  verifiers: () => [...adminKeys.all, "verifiers"] as const,
  banks: () => [...adminKeys.all, "banks"] as const,
};

export function useVerifiers() {
  return useQuery({
    queryKey: adminKeys.verifiers(),
    queryFn: api.getVerifiers,
  });
}

export function useAddVerifier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletAddress: string) => api.addVerifier(walletAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.verifiers() });
    },
  });
}

export function useRemoveVerifier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletAddress: string) => api.removeVerifier(walletAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.verifiers() });
    },
  });
}

export function useBanks() {
  return useQuery({
    queryKey: adminKeys.banks(),
    queryFn: api.getBanks,
  });
}

export function useAddBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletAddress: string) => api.addBank(walletAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.banks() });
    },
  });
}

export function useRemoveBank() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletAddress: string) => api.removeBank(walletAddress),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.banks() });
    },
  });
}
