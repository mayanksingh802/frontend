// "use client";

// import { ReactNode, useEffect } from "react";
// import { useRouter } from "next/navigation";

// import { useAuth } from "@/app/context/AuthContext";

// interface ProtectedRouteProps {
//   children: ReactNode;
// }

// export default function ProtectedRoute({
//   children,
// }: ProtectedRouteProps) {
//   const {
//     isAuthenticated,
//   } = useAuth();

//   const router = useRouter();

//   useEffect(() => {
//     if (!isAuthenticated) {
//       router.replace("/login");
//     }
//   }, [isAuthenticated, router]);

//   if (!isAuthenticated) {
//     return null;
//   }

//   return <>{children}</>;
// }

"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function ProtectedRoute({
  children,
}: {
  children: ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}