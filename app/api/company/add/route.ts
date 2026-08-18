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
    const url = `${backendUrl}/tms/api/company/add`;

    // Preserve incoming content-type (for multipart/form-data or application/json)
    const contentType = req.headers.get("content-type") ?? undefined;

    // Read raw body and forward it to backend to preserve multipart boundaries
    const buffer = Buffer.from(await req.arrayBuffer());

    // Diagnostic logs to help compare browser vs Postman requests
    try {
      console.log("/api/company/add incoming content-type:", contentType);
      console.log("/api/company/add incoming size:", buffer.byteLength);

      // Log a small safe snippet if the body looks textual (e.g., multipart boundaries)
      if (buffer.byteLength > 0 && contentType && contentType.includes("multipart/form-data")) {
        const snippet = buffer.slice(0, Math.min(buffer.byteLength, 1024)).toString("utf8");
        console.log("/api/company/add body snippet:\n", snippet);
      }
    } catch (logErr) {
      console.warn("/api/company/add logging failed", String(logErr));
    }

    const backendResponse = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        ...(contentType ? { "content-type": contentType } : {}),
      },
      body: buffer,
      // do not cache proxied requests
      cache: "no-store",
    });

    // attach proxied target for easier debugging in the browser devtools
    const proxiedTo = url;

    // try to parse json, fall back to text for richer error messages
    let payload: any = null;
    let textBody: string | null = null;
    try {
      payload = await backendResponse.json().catch(() => null);
    } catch (e) {
      payload = null;
    }

    try {
      if (!payload) {
        textBody = await backendResponse.text().catch(() => null);
      }
    } catch (e) {
      textBody = null;
    }

    if (!backendResponse.ok) {
      const message =
        payload?.message ??
        payload?.error ??
        textBody ??
        "Unable to add company.";
      // log backend response headers and text for debugging
      try {
        console.error("/api/company/add backend status:", backendResponse.status);
        console.error(
          "/api/company/add backend headers:",
          Array.from(backendResponse.headers.entries()),
        );
        if (textBody) console.error("/api/company/add backend text:\n", textBody);
      } catch (logErr) {
        console.warn("/api/company/add backend logging failed", String(logErr));
      }

      const res = NextResponse.json(
        {
          message,
          proxiedTo,
          backendStatus: backendResponse.status,
          ...(payload ?? {}),
          ...(textBody ? { backendText: textBody } : {}),
        },
        { status: backendResponse.status || 500 },
      );
      res.headers.set("x-proxied-to", proxiedTo);
      res.headers.set("x-request-size", String(buffer.byteLength));
      return res;
    }

    const successBody = payload ?? null;
    const res = NextResponse.json(successBody ?? {});
    res.headers.set("x-proxied-to", proxiedTo);
    res.headers.set("x-request-size", String(buffer.byteLength));
    return res;
  } catch (err) {
    console.error("/api/company/add proxy error:", err);
    return NextResponse.json(
      { message: "Internal server error", detail: String(err) },
      { status: 500 },
    );
  }
}
