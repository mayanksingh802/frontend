import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

type UserRouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(
  request: Request,
  { params }: UserRouteContext,
) {
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

  const { id } = await params;
  const userId = id.trim();
  const requestPayload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  const companyCode = String(requestPayload?.companyCode ?? "").trim();
  const displayName = String(requestPayload?.displayName ?? "").trim();
  const email = String(requestPayload?.email ?? "").trim();
  const roles = requestPayload?.roles;
  const mobileNumber = String(requestPayload?.mobileNumber ?? "").trim();
  const alternateNumber = String(requestPayload?.alternateNumber ?? "").trim();
  const status = String(requestPayload?.status ?? "").trim();
  const remark = requestPayload?.remark;

  if (!userId || !companyCode || !displayName || !email) {
    return NextResponse.json(
      { message: "User ID, company code, display name, and email are required." },
      { status: 400 },
    );
  }

  const payload: Record<string, unknown> = {
    companyCode,
    displayName,
    email,
    ...(Array.isArray(roles) && roles.length ? { roles } : {}),
    ...(mobileNumber ? { mobileNumber } : {}),
    ...(alternateNumber ? { alternateNumber } : {}),
    ...(status ? { status } : {}),
    ...(typeof remark === "string" || remark === null ? { remark } : {}),
  };

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/user/${encodeURIComponent(userId)}`,
      {
        method: "PUT",
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
          message: responsePayload?.message ?? "Unable to update user.",
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
      { message: "Unable to reach the user service." },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: UserRouteContext,
) {
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

  const { id } = await params;
  const userId = id.trim();
  const requestPayload = _request.json().catch(() => null) as Promise<Record<string, unknown> | null>;
  const body = await requestPayload;
  const companyCode = String(body?.companyCode ?? "").trim();

  if (!userId || !companyCode) {
    return NextResponse.json(
      { message: "User ID and company code are required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/user/${encodeURIComponent(userId)}?companyCode=${encodeURIComponent(companyCode)}`,
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
          message: responsePayload?.message ?? "Unable to delete user.",
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
      { message: "Unable to reach the user service." },
      { status: 503 },
    );
  }
}
