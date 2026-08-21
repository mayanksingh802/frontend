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

  let requestPayload: Record<string, unknown> | null;
  try {
    requestPayload = (await request.json()) as Record<string, unknown>;
  } catch {
    requestPayload = null;
  }

  const companyCode = String(requestPayload?.companyCode ?? "").trim();

  if (!companyCode) {
    return NextResponse.json(
      { message: "Company code is required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/user/all`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({ companyCode }),
        cache: "no-store",
      },
    );

    const responsePayload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: responsePayload?.message ?? "Unable to fetch users.",
          ...(responsePayload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    return NextResponse.json(responsePayload ?? []);
  } catch(error) {
    return NextResponse.json(
      { message: "Unable to reach the user service." },
      { status: 503 },
    );
  }
}
