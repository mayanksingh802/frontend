"use client";

import ProtectedRoute from "@/app/components/auth/ProtectedRoute";
import DashboardShell from "@/app/components/dashboard/DashboardLayout";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}