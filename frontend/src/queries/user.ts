import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError } from "../api/client";

export const userKeys = {
  all: ["user"] as const,
  dashboard: () => [...userKeys.all, "dashboard"] as const,
  kyc: () => [...userKeys.all, "kyc"] as const,
};

export function useUserDashboard() {
  return useQuery({
    queryKey: userKeys.dashboard(),
    queryFn: api.getUserDashboard,
  });
}

export function useMyKyc() {
  return useQuery({
    queryKey: userKeys.kyc(),
    queryFn: async () => {
      try {
        return await api.getMyKyc();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
  });
}

export function useSubmitKyc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (form: FormData) => api.submitKyc(form),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
