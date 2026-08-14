"use client";

import { ReactNode } from "react";

import { useAuth } from "@/app/context/AuthContext";
import { Role } from "@/app/types/auth/auth";

interface RoleGuardProps {
  allowedRoles: Role[];
  children: ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  children,
}: RoleGuardProps) {
  const { hasAnyRole } = useAuth();


  if (!hasAnyRole(allowedRoles)) {
    return (
      <div>
        You don't have permission to access this page.
      </div>
    );
  }

  return <>{children}</>;
}