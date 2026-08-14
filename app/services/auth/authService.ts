import type { AuthUser } from "@/app/types/auth/auth";

export interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResult {
  user: AuthUser;
}

async function getErrorMessage(response: Response) {
  const body = await response.json().catch(() => null);

  return body?.message ?? "Unable to sign in.";
}

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResult> {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      throw new Error(await getErrorMessage(response));
    }

    return response.json();
  },

  async getSession(): Promise<AuthUser | null> {
    const response = await fetch("/api/auth/session", {
      cache: "no-store",
    });

    if (response.status === 401) {
      return null;
    }

    if (!response.ok) {
      throw new Error("Unable to restore your session.");
    }

    const data = (await response.json()) as {
      user: AuthUser;
    };

    return data.user;
  },

  async logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });
  },
};