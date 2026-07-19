import { useMutation } from "@tanstack/react-query";
import { api } from "../api/client";

export function useAddVerifier() {
  return useMutation({
    mutationFn: (walletAddress: string) => api.addVerifier(walletAddress),
  });
}

export function useRemoveVerifier() {
  return useMutation({
    mutationFn: (walletAddress: string) => api.removeVerifier(walletAddress),
  });
}
