import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401, headers: { "x-proxied-to": String(process.env.BACKEND_API_BASE_URL ?? "") } },
    );
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Company service is not configured." },
      { status: 500, headers: { "x-proxied-to": String(process.env.BACKEND_API_BASE_URL ?? "") } },
    );
  }

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const code = parts[parts.length - 2] === "department" ? parts[parts.length - 3] : parts[parts.length - 1];

    // fallback if simple extraction fails
    const companyCode = code ?? "";

    const backendResponse = await fetch(`${backendUrl}/tms/api/${encodeURIComponent(companyCode)}/department`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${session.accessToken}`,
      },
      cache: "no-store",
    });

    const payload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: payload?.message ?? "Unable to fetch departments.",
          ...(payload ?? {}),
        },
        {
          status: backendResponse.status || 500,
          headers: { "x-proxied-to": backendUrl },
        },
      );
    }

    return NextResponse.json(payload ?? [], { headers: { "x-proxied-to": backendUrl } });
  } catch (err) {
    return NextResponse.json(
      { message: "Unable to reach the company service." },
      { status: 503, headers: { "x-proxied-to": String(process.env.BACKEND_API_BASE_URL ?? "") } },
    );
  }
}
