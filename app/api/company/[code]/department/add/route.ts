import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

export async function POST(req: Request) {
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

  try {
    const url = new URL(req.url);
    const parts = url.pathname.split("/").filter(Boolean);
    // path: api/company/{code}/department/add -> company at parts[indexOf('company')+1]
    let companyCode = "";
    const idx = parts.indexOf("company");
    if (idx >= 0 && parts.length > idx + 1) {
      companyCode = parts[idx + 1];
    }

    // parse body (support json and multipart)
    const contentType = req.headers.get("content-type") ?? "";
    let body: Record<string, unknown> = {};
    let file: File | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData().catch(() => null);
      if (formData) {
        const raw = formData.get("request") ?? formData.get("department") ?? null;
        const rawFile = formData.get("file");
        file = rawFile instanceof File ? rawFile : null;
        if (typeof raw === "string") {
          body = JSON.parse(raw) as Record<string, unknown>;
        }
      }
    } else if (contentType.includes("application/json")) {
      body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    }

    const name = String(body.name ?? "").trim();
    const deptCode = String(body.code ?? body.departmentCode ?? "").trim();
    const finalCompanyCode = String(body.companyCode ?? companyCode ?? "").trim();

    if (!finalCompanyCode || !name) {
      return NextResponse.json({ message: "companyCode and name are required." }, { status: 400 });
    }

    if (file) {
      const upload = new FormData();
      upload.append("department", JSON.stringify({ name, ...(deptCode ? { code: deptCode } : {}) }));
      upload.append("file", file, (file as any).name ?? "file");

      const backendResponse = await fetch(`${backendUrl}/tms/api/${encodeURIComponent(finalCompanyCode)}/department/add`, {
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
          { message: payload?.message ?? "Unable to add department.", ...(payload ?? {}) },
          { status: backendResponse.status || 500 },
        );
      }

      return NextResponse.json(payload ?? {}, { status: 201 });
    }

    const backendResponse = await fetch(`${backendUrl}/tms/api/${encodeURIComponent(finalCompanyCode)}/department/add`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ name, ...(deptCode ? { code: deptCode } : {}) }),
      cache: "no-store",
    });

    const payload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { message: payload?.message ?? "Unable to add department.", ...(payload ?? {}) },
        { status: backendResponse.status || 500 },
      );
    }

    return NextResponse.json(payload ?? {}, { status: 201 });
  } catch (err) {
    return NextResponse.json({ message: "Unable to reach the company service." }, { status: 503 });
  }
}
