import { NextResponse } from "next/server";
import type { LoginResponse } from "@/app/types/auth/auth";
import {
  createSession,
  getSafeUser,
  getSessionCookieName,
  getSessionCookieOptions,
  serializeAuthSession,
} from "@/app/lib/auth/session";

export const runtime = "nodejs";

interface LoginRequest {
  email?: string;
  password?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as LoginRequest;

  const email = body.email?.trim();
  const password = body.password?.trim();

  if (!email || !password) {
    return NextResponse.json(
      { message: "Email and password are required." },
      { status: 400 }
    );
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Authentication service is not configured." },
      { status: 500 }
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      }
    );

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: backendResponse.status === 401 ? 401 : 400 }
      );
    }

    const loginResponse =
      (await backendResponse.json()) as LoginResponse;

    if (!loginResponse.user.enabled) {
      return NextResponse.json(
        { message: "Your account is disabled." },
        { status: 403 }
      );
    }

    const session = createSession(loginResponse);

    const response = NextResponse.json({
      user: getSafeUser(loginResponse),
    });

    response.cookies.set(
      getSessionCookieName(),
      serializeAuthSession(session),
      getSessionCookieOptions(loginResponse.expiresAt)
    );

    return response;
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the authentication service." },
      { status: 503 }
    );
  }
}