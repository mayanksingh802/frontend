import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type {
  AuthUser,
  LoginResponse,
} from "@/app/types/auth/auth";

const SESSION_COOKIE_NAME = "corpiz_session";

interface AuthSession {
  accessToken: string;
  expiresAt: string;
  user: AuthUser;
}

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;

  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET is not configured.");
  }

  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

function serializeSession(session: AuthSession) {
  const payload = Buffer.from(
    JSON.stringify(session)
  ).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function parseSession(value: string): AuthSession | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = sign(payload);

  if (signature.length !== expectedSignature.length) {
    return null;
  }

  const isValid = timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );

  if (!isValid) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    ) as AuthSession;

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function getSessionCookieName() {
  return SESSION_COOKIE_NAME;
}

export async function getSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  return value ? parseSession(value) : null;
}

export function getSafeUser(response: LoginResponse): AuthUser {
  return {
    id: response.user.id,
    displayName: response.user.displayName,
    email: response.user.email,
    companyCode: response.user.companyCode,
    enabled: response.user.enabled,
    roles: response.user.roles,
    alternateNumber: response.user.alternateNumber,
    mobileNumber: response.user.mobileNumber,
    createdBy: response.user.createdBy,
    updatedBy: response.user.updatedBy,
  };
}

export function createSession(response: LoginResponse): AuthSession {
  return {
    accessToken: response.accessToken,
    expiresAt: response.expiresAt,
    user: getSafeUser(response),
  };
}

export function getSessionCookieOptions(expiresAt: string) {
  const maxAge = Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );

  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
    expires: new Date(expiresAt),
  };
}

export function serializeAuthSession(session: AuthSession) {
  return serializeSession(session);
}