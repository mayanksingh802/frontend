import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Company service is not configured." },
      { status: 500 }
    );
  }

  try {
    const { code, id } = await params;

    if (!code || !id) {
      return NextResponse.json(
        { message: "Company code and department ID are required." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const deptCode = typeof body?.code === "string" ? body.code.trim() : "";

    if (!name) {
      return NextResponse.json(
        { message: "Department name is required." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(
      `${backendUrl}/tms/api/${encodeURIComponent(code)}/department/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ name, ...(deptCode ? { code: deptCode } : {}) }),
        cache: "no-store",
      }
    );

    const text = await backendResponse.text();
    let payload: Record<string, unknown> | null = null;
    if (text) {
      try {
        payload = JSON.parse(text) as Record<string, unknown>;
      } catch {
        payload = null;
      }
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: payload?.message ?? "Unable to update department.", ...(payload ?? {}) },
        { status: backendResponse.status || 500 }
      );
    }

    if (backendResponse.status === 204 || !text) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(payload ?? {}, { status: backendResponse.status || 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Unable to reach the company service." },
      { status: 503 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ code: string; id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Company service is not configured." },
      { status: 500 }
    );
  }

  try {
    const { code, id } = await params;

    if (!code || !id) {
      return NextResponse.json(
        { message: "Company code and department ID are required." },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(
      `${backendUrl}/tms/api/${encodeURIComponent(code)}/department/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const text = await backendResponse.text();
    let payload: Record<string, unknown> | null = null;
    if (text) {
      try {
        payload = JSON.parse(text) as Record<string, unknown>;
      } catch {
        payload = null;
      }
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: payload?.message ?? "Unable to delete department.", ...(payload ?? {}) },
        { status: backendResponse.status || 500 }
      );
    }

    if (backendResponse.status === 204 || !text) {
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json(payload ?? {}, { status: backendResponse.status || 200 });
  } catch (err) {
    return NextResponse.json(
      { message: "Unable to reach the company service." },
      { status: 503 }
    );
  }
}
