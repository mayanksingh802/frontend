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

  return NextResponse.json({
    user: session.user,
  });
}