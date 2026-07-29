import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchBankAccess, setBankAccess } from "../helper/bankAccess";

export const accessKeys = {
  all: ["access"] as const,
  banks: (userAddress: string) =>
    [...accessKeys.all, "banks", userAddress.toLowerCase()] as const,
};

export function useBankAccess(userAddress: string | null) {
  return useQuery({
    queryKey: accessKeys.banks(userAddress ?? ""),
    queryFn: () => fetchBankAccess(userAddress as string),
    enabled: Boolean(userAddress),
    retry: false,
  });
}

export interface SetBankAccessVars {
  bank: string;
  grant: boolean;
}

export function useSetBankAccess(userAddress: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ bank, grant }: SetBankAccessVars) =>
      setBankAccess(userAddress as string, bank, grant),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: accessKeys.banks(userAddress ?? ""),
      });
    },
  });
}
