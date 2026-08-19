import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

type CompanyPolicyRouteContext = {
  params: Promise<{ id: string }>;
};

async function getPolicyId({ params }: CompanyPolicyRouteContext) {
  const { id } = await params;
  return id.trim();
}

function unauthenticatedResponse() {
  return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
}

function backendNotConfiguredResponse() {
  return NextResponse.json(
    { message: "Backend API is not configured." },
    { status: 500 },
  );
}

export async function GET(
  _request: Request,
  context: CompanyPolicyRouteContext,
) {
  const session = await getSession();
  if (!session) return unauthenticatedResponse();

  const backendUrl = process.env.BACKEND_API_BASE_URL;
  if (!backendUrl) return backendNotConfiguredResponse();

  const policyId = await getPolicyId(context);
  if (!policyId) {
    return NextResponse.json({ message: "Policy ID is required." }, { status: 400 });
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/company-policy/${encodeURIComponent(policyId)}`,
      {
        headers: { Accept: "application/json", Authorization: `Bearer ${session.accessToken}` },
        cache: "no-store",
      },
    );
    const payload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: payload?.message ?? "Unable to fetch policy.", ...(payload ?? {}) },
        { status: backendResponse.status || 500 },
      );
    }

    return NextResponse.json(payload ?? {});
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the company policy service." },
      { status: 503 },
    );
  }
}

export async function PUT(request: Request, context: CompanyPolicyRouteContext) {
  const session = await getSession();
  if (!session) return unauthenticatedResponse();

  const backendUrl = process.env.BACKEND_API_BASE_URL;
  if (!backendUrl) return backendNotConfiguredResponse();

  const policyId = await getPolicyId(context);
  if (!policyId) {
    return NextResponse.json({ message: "Policy ID is required." }, { status: 400 });
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/company-policy/${encodeURIComponent(policyId)}`,
      {
        method: "PUT",
        headers: contentType.includes("multipart/form-data")
          ? { Authorization: `Bearer ${session.accessToken}` }
          : {
              Authorization: `Bearer ${session.accessToken}`,
              "Content-Type": contentType || "application/json",
              Accept: "application/json",
            },
        body: await request.arrayBuffer(),
        cache: "no-store",
      },
    );
    const payload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: payload?.message ?? "Unable to update policy.", ...(payload ?? {}) },
        { status: backendResponse.status || 500 },
      );
    }

    return NextResponse.json(payload ?? {}, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the company policy service." },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: CompanyPolicyRouteContext,
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 },
    );
  }

  const policyId = await getPolicyId({ params });

  if (!policyId) {
    return NextResponse.json(
      { message: "Policy ID is required." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/company-policy/${encodeURIComponent(policyId)}`,
      {
        method: "DELETE",
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
          message: payload?.message ?? "Unable to delete policy.",
          ...(payload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    if (backendResponse.status === 204 || payload === null) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(payload, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the company policy service." },
      { status: 503 },
    );
  }
}
