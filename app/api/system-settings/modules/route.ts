import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 }
    );
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/module/all`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: "Unable to load modules." },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(await backendResponse.json());
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the module service." },
      { status: 503 }
    );
  }
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 }
    );
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!code || !name) {
    return NextResponse.json(
      { message: "Module code and module name are required." },
      { status: 400 }
    );
  }

  try {
    const backendResponse = await fetch(`${backendUrl}/tms/api/module/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, name }),
      cache: "no-store",
    });
    const responseBody = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message:
            responseBody?.message ?? "Unable to add the module.",
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(responseBody, { status: backendResponse.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the module service." },
      { status: 503 }
    );
  }
}
