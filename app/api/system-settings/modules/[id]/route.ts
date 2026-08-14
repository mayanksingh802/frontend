import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  if (!id) {
    return NextResponse.json(
      { message: "Module ID is required." },
      { status: 400 }
    );
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const remark = typeof body?.remark === "string" ? body.remark.trim() : "";
  const status = body?.status;

  if (!code || !name || (status !== "ACTIVE" && status !== "INACTIVE")) {
    return NextResponse.json(
      { message: "Module code, module name, and a valid status are required." },
      { status: 400 }
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/module/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, name, remark: remark || null, status }),
        cache: "no-store",
      }
    );
    const responseBody = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: responseBody?.message ?? "Unable to update the module." },
        { status: backendResponse.status }
      );
    }

    return new NextResponse(null, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the module service." },
      { status: 503 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  if (!id) {
    return NextResponse.json(
      { message: "Module ID is required." },
      { status: 400 }
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/module/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      }
    );
    const responseBody = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: responseBody?.message ?? "Unable to delete the module." },
        { status: backendResponse.status }
      );
    }

    return new NextResponse(null, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the module service." },
      { status: 503 }
    );
  }
}
