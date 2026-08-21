import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "User service is not configured." },
      { status: 500 },
    );
  }

  const requestPayload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  const companyCode = String(requestPayload?.companyCode ?? "").trim();
  const displayName = String(requestPayload?.displayName ?? "").trim();
  const email = String(requestPayload?.email ?? "").trim();
  const password = String(requestPayload?.password ?? "").trim();
  const roles = requestPayload?.roles;

  if (!companyCode || !displayName || !email || !password) {
    return NextResponse.json(
      { message: "Company code, display name, email, and password are required." },
      { status: 400 },
    );
  }

  const payload: Record<string, unknown> = {
    companyCode,
    displayName,
    email,
    password,
    ...(Array.isArray(roles) && roles.length ? { roles } : {}),
  };

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/user/add`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );

    const responsePayload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: responsePayload?.message ?? "Unable to add user.",
          ...(responsePayload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    return NextResponse.json(responsePayload ?? {}, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the user service." },
      { status: 503 },
    );
  }
}
