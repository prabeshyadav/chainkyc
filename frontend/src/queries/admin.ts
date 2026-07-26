import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export const adminKeys = {
  all: ["admins"] as const,
  verifiers: () => [...adminKeys.all, "verifiers"] as const,
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
