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
      `${backendUrl}/tms/api/keyValue/all`,
      {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        cache: "no-store",
      }
    );

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: "Unable to load key values." },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(await backendResponse.json());
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the key value service." },
      { status: 503 }
    );
  }
}
