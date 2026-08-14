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
      { message: "Key name ID is required." },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/keyName/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
        cache: "no-store",
      }
    );

    const responseBody = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: responseBody?.message ?? "Unable to update key name.",
          ...(responseBody ?? {}),
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(responseBody ?? {}, {
      status: backendResponse.status,
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the key name service." },
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
      { message: "Key name ID is required." },
      { status: 400 }
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/keyName/${encodeURIComponent(id)}`,
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
        {
          message: responseBody?.message ?? "Unable to delete key name.",
          ...(responseBody ?? {}),
        },
        { status: backendResponse.status }
      );
    }

    return new NextResponse(null, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the key name service." },
      { status: 503 }
    );
  }
}