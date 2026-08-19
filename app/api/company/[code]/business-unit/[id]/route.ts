import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

type BusinessUnitRouteContext = {
  params: Promise<{ code: string; id: string }>;
};

export async function PUT(
  request: Request,
  { params }: BusinessUnitRouteContext,
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

  const { code, id } = await params;
  const companyCode = code.trim();
  const businessUnitId = id.trim();
  const requestPayload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const name = String(requestPayload?.name ?? "").trim();
  const businessUnitCode = String(requestPayload?.code ?? "").trim();
  const status = String(requestPayload?.status ?? "").trim();
  const remark = requestPayload?.remark;

  if (!companyCode || !businessUnitId || !name) {
    return NextResponse.json(
      { message: "Company code, Business Unit ID, and name are required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/${encodeURIComponent(companyCode)}/business-unit/${encodeURIComponent(businessUnitId)}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          name,
          ...(businessUnitCode ? { code: businessUnitCode } : {}),
          ...(status ? { status } : {}),
          ...(typeof remark === "string" || remark === null ? { remark } : {}),
        }),
        cache: "no-store",
      },
    );
    const responsePayload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            responsePayload?.message ?? "Unable to update business unit.",
          ...(responsePayload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    if (backendResponse.status === 204 || responsePayload === null) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(responsePayload, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the company service." },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: BusinessUnitRouteContext,
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

  const { code, id } = await params;
  const companyCode = code.trim();
  const businessUnitId = id.trim();

  if (!companyCode || !businessUnitId) {
    return NextResponse.json(
      { message: "Company code and Business Unit ID are required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/${encodeURIComponent(companyCode)}/business-unit/${encodeURIComponent(businessUnitId)}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      },
    );
    const responsePayload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            responsePayload?.message ?? "Unable to delete business unit.",
          ...(responsePayload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    if (backendResponse.status === 204 || responsePayload === null) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(responsePayload, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the company service." },
      { status: 503 },
    );
  }
}
