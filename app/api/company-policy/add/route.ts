import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { message: "Unauthenticated." },
      { status: 401 },
    );
  }

  const backendUrl = process.env.BACKEND_API_BASE_URL;

  if (!backendUrl) {
    return NextResponse.json(
      { message: "Backend API is not configured." },
      { status: 500 },
    );
  }

  try {
    const contentType = request.headers.get("content-type") ?? "";
    let body: Record<string, unknown> = {};
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData().catch(() => null);
      if (formData) {
        const rawPolicy = formData.get("policy");
        const rawFile = formData.get("file");

        file = rawFile instanceof File ? rawFile : null;

        if (typeof rawPolicy === "string") {
          body = (JSON.parse(rawPolicy) as Record<string, unknown>) ?? {};
        }
      }
    } else if (contentType.includes("application/json")) {
      body = ((await request.json().catch(() => ({}))) as Record<string, unknown>) ?? {};
    }

    const companyCode = String(body.companyCode ?? "").trim();
    const name = String(body.name ?? "").trim();
    const startDate = String(body.startDate ?? "").trim();
    const endDate = String(body.endDate ?? "").trim();

    if (!companyCode || !name || !startDate) {
      return NextResponse.json(
        { message: "companyCode, name and startDate are required." },
        { status: 400 },
      );
    }

    if (file) {
      const upload = new FormData();
      upload.append("policy", JSON.stringify({
        companyCode,
        name,
        startDate,
        ...(endDate ? { endDate } : {}),
      }));
      upload.append("file", file, file.name);

      const backendResponse = await fetch(`${backendUrl}/tms/api/company-policy/add`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: upload,
        cache: "no-store",
      });

      const payload = await backendResponse.json().catch(() => null);

      if (!backendResponse.ok) {
        return NextResponse.json(
          {
            message: payload?.message ?? "Unable to add policy.",
            ...(payload ?? {}),
          },
          { status: backendResponse.status || 500 },
        );
      }

      return NextResponse.json(payload ?? {}, { status: 201 });
    }

    const backendResponse = await fetch(`${backendUrl}/tms/api/company-policy/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        companyCode,
        name,
        startDate,
        ...(endDate ? { endDate } : {}),
      }),
      cache: "no-store",
    });

    const payload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: payload?.message ?? "Unable to add policy.",
          ...(payload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    return NextResponse.json(payload ?? {}, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the policy service." },
      { status: 503 },
    );
  }
}