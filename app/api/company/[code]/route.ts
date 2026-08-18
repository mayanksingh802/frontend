import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

export async function PUT(req: Request) {
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

  // extract the id segment from the request URL
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts[parts.length - 1] ?? "";

  try {
    const body = await req.text();

    const backendResponse = await fetch(
      `${backendUrl.replace(/\/$/, "")}/tms/api/company/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body,
        cache: "no-store",
      },
    );

    const payload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: payload?.message ?? "Unable to update company.",
          ...(payload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    return NextResponse.json(payload ?? {});
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the company service." },
      { status: 503 },
    );
  }
}

export async function DELETE(req: Request) {
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

  // extract the id segment from the request URL
  const url = new URL(req.url);
  const parts = url.pathname.split("/").filter(Boolean);
  const id = parts[parts.length - 1] ?? "";

  try {
    const backendResponse = await fetch(
      `${backendUrl.replace(/\/$/, "")}/tms/api/company/${encodeURIComponent(id)}`,
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
          message: payload?.message ?? "Unable to delete company.",
          ...(payload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    return NextResponse.json(payload ?? {});
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the company service." },
      { status: 503 },
    );
  }
}