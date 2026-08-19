import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

type DesignationRouteContext = {
  params: Promise<{ code: string; id: string }>;
};

const validate = (code: string, id: string, name?: string) => {
  if (!code || !id || (name !== undefined && !name)) {
    return NextResponse.json(
      { message: "Company code, Designation ID, and name are required." },
      { status: 400 },
    );
  }

  return null;
};

export async function PUT(
  request: Request,
  { params }: DesignationRouteContext,
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;
  const { code, id } = await params;
  const companyCode = code.trim();
  const designationId = id.trim();
  const requestPayload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const name = String(requestPayload?.name ?? "").trim();
  const designationCode = String(requestPayload?.code ?? "").trim();
  const status = String(requestPayload?.status ?? "").trim();
  const remark = requestPayload?.remark;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Company service is not configured." },
      { status: 500 },
    );
  }

  const validationError = validate(companyCode, designationId, name);
  if (validationError) return validationError;

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/${encodeURIComponent(companyCode)}/designation/${encodeURIComponent(designationId)}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify({
          name,
          ...(designationCode ? { code: designationCode } : {}),
          ...(status ? { status } : {}),
          ...(typeof remark === "string" || remark === null ? { remark } : {}),
        }),
        cache: "no-store",
      },
    );
    const payload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: payload?.message ?? "Unable to update designation.",
          ...(payload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    return payload === null
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json(payload, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the company service." },
      { status: 503 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: DesignationRouteContext,
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;
  const { code, id } = await params;
  const companyCode = code.trim();
  const designationId = id.trim();

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Company service is not configured." },
      { status: 500 },
    );
  }

  const validationError = validate(companyCode, designationId);
  if (validationError) return validationError;

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/${encodeURIComponent(companyCode)}/designation/${encodeURIComponent(designationId)}`,
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
          message: payload?.message ?? "Unable to delete designation.",
          ...(payload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    return payload === null
      ? new NextResponse(null, { status: 204 })
      : NextResponse.json(payload, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the company service." },
      { status: 503 },
    );
  }
}
