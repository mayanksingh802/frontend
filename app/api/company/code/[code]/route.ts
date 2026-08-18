import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json({ message: "Company service is not configured." }, { status: 500 });
  }

  // extract the code segment from the request URL to avoid experimental `params` Promise
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const code = parts[parts.length - 1] ?? "";

  try {
    const backendResponse = await fetch(
      `${backendUrl.replace(/\/$/, "")}/tms/api/company/code/${encodeURIComponent(code)}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      },
    );

    const payload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: payload?.message ?? "Unable to fetch company profile.", ...(payload ?? {}) },
        { status: backendResponse.status || 500 },
      );
    }

    return NextResponse.json(payload ?? {});
  } catch (err) {
    return NextResponse.json({ message: "Unable to reach the company service." }, { status: 503 });
  }
}
