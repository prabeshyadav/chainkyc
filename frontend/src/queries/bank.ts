import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { fetchBankCustomers } from "../helper/bankCustomers";

export const bankKeys = {
  all: ["bank"] as const,
  customers: (bankAddress: string) =>
    [...bankKeys.all, "customers", bankAddress.toLowerCase()] as const,
  kyc: (userAddress: string) =>
    [...bankKeys.all, "kyc", userAddress.toLowerCase()] as const,
};

export function useBankCustomers(bankAddress: string | null) {
  return useQuery({
    queryKey: bankKeys.customers(bankAddress ?? ""),
    queryFn: () => fetchBankCustomers(bankAddress as string),
    enabled: Boolean(bankAddress),
    retry: false,
  });
}

export function useBankKyc(userAddress: string | null) {
  return useQuery({
    queryKey: bankKeys.kyc(userAddress ?? ""),
    queryFn: () => api.getBankKyc(userAddress as string),
    enabled: Boolean(userAddress),
    retry: false,
  });
}
