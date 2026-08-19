import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

type AddDesignationRouteContext = {
  params: Promise<{ code: string }>;
};

export async function POST(
  request: Request,
  { params }: AddDesignationRouteContext,
) {
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
  const requestPayload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const payload = {
    name: String(requestPayload?.name ?? "").trim(),
    code: String(requestPayload?.code ?? "").trim(),
  };

  if (!companyCode || !payload.name || !payload.code) {
    return NextResponse.json(
      { message: "Designation name and code are required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/${encodeURIComponent(companyCode)}/designation/add`,
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
          message: responsePayload?.message ?? "Unable to add designation.",
          ...(responsePayload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    return NextResponse.json(responsePayload ?? {}, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the company service." },
      { status: 503 },
    );
  }
}
