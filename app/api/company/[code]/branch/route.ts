import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

type BranchRouteContext = {
  params: Promise<{ code: string }>;
};

export async function GET(_request: Request, { params }: BranchRouteContext) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Company service is not configured." },
      { status: 500 },
    );
  }

  const { code } = await params;
  const companyCode = code.trim();

  if (!companyCode) {
    return NextResponse.json(
      { message: "Company code is required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/${encodeURIComponent(companyCode)}/branch`,
      {
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
        {
          message: payload?.message ?? "Unable to fetch branches.",
          ...(payload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    return NextResponse.json(payload ?? []);
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the company service." },
      { status: 503 },
    );
  }
}