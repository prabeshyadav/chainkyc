import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export const ROLE_HOME: Record<string, string> = {
  ADMIN: "/admin",
  VERIFIER: "/institution",
  BANK: "/institution",
  USER: "/dashboard",
};

export function homeForRole(role: string | null): string {
  return (role && ROLE_HOME[role]) || "/dashboard";
}

export default function RequireRole({
  roles,
  children,
}: {
  roles?: string[];
  children: ReactNode;
}) {
  const { authenticated, role, initializing } = useAuthStore();

  if (initializing) return null;

  if (!authenticated) return <Navigate to="/" replace />;

  if (roles && role && !roles.includes(role)) {
    return <Navigate to={homeForRole(role)} replace />;
  }

  return <>{children}</>;
}
