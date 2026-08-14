// "use client";

// import {
//   createContext,
//   useContext,
//   useMemo,
//   useState,
//   ReactNode,
// } from "react";

// import {
//   AuthUser,
//   LoginResponse,
//   Role,
// } from "@/app/types/auth/auth";

// interface AuthContextType {
//   user: AuthUser | null;
//   accessToken: string | null;
//   isAuthenticated: boolean;

//   login: (response: LoginResponse) => void;
//   logout: () => void;

//   hasRole: (role: Role) => boolean;
//   hasAnyRole: (roles: Role[]) => boolean;
//   hasAllRoles: (roles: Role[]) => boolean;
// }

// const AuthContext = createContext<
//   AuthContextType | undefined
// >(undefined);

// export function AuthProvider({
//   children,
// }: {
//   children: ReactNode;
// }) {
//   const [user, setUser] = useState<AuthUser | null>(null);
//   const [accessToken, setAccessToken] =
//     useState<string | null>(null);

//   const login = (response: LoginResponse) => {
//     setUser(response.user);
//     setAccessToken(response.accessToken);
//   };

//   const logout = () => {
//     setUser(null);
//     setAccessToken(null);
//   };

//   const hasRole = (role: Role) => {
//     return user?.roles.includes(role) ?? false;
//   };

//   const hasAnyRole = (roles: Role[]) => {
//     return (
//       user?.roles.some((role) =>
//         roles.includes(role)
//       ) ?? false
//     );
//   };

//   const hasAllRoles = (roles: Role[]) => {
//     return (
//       roles.every((role) =>
//         user?.roles.includes(role)
//       ) ?? false
//     );
//   };

//   const value = useMemo(
//     () => ({
//       user,
//       accessToken,
//       isAuthenticated: !!user,
//       login,
//       logout,
//       hasRole,
//       hasAnyRole,
//       hasAllRoles,
//     }),
//     [user, accessToken]
//   );

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);

//   if (!context) {
//     throw new Error(
//       "useAuth must be used within AuthProvider"
//     );
//   }

//   return context;
// }

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/app/services/auth/authService";
import type {
  AuthUser,
  Role,
} from "@/app/types/auth/auth";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthenticatedUser: (user: AuthUser) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: Role) => boolean;
  hasAnyRole: (roles: Role[]) => boolean;
  hasAllRoles: (roles: Role[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    try {
      const currentUser = await authService.getSession();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const setAuthenticatedUser = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (role: Role) => user?.roles.includes(role) ?? false,
    [user]
  );

  const hasAnyRole = useCallback(
    (roles: Role[]) =>
      user?.roles.some((role) => roles.includes(role)) ?? false,
    [user]
  );

  const hasAllRoles = useCallback(
    (roles: Role[]) =>
      roles.every((role) => user?.roles.includes(role)) ?? false,
    [user]
  );

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      setAuthenticatedUser,
      refreshSession,
      logout,
      hasRole,
      hasAnyRole,
      hasAllRoles,
    }),
    [
      user,
      isLoading,
      setAuthenticatedUser,
      refreshSession,
      logout,
      hasRole,
      hasAnyRole,
      hasAllRoles,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider."
    );
  }

  return context;
}