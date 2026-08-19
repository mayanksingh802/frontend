import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth/session";

export const runtime = "nodejs";

type AddBranchRouteContext = {
  params: Promise<{ code: string }>;
};

type BranchAddressPayload = {
  line1?: unknown;
  line2?: unknown;
  city?: unknown;
  state?: unknown;
  country?: unknown;
  pincode?: unknown;
};

export async function POST(request: Request, { params }: AddBranchRouteContext) {
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

  const { code } = await params;
  const companyCode = code.trim();
  const requestPayload = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;
  const address = (requestPayload?.address ?? null) as BranchAddressPayload | null;
  const pincode = Number(address?.pincode);

  const payload = {
    code: String(requestPayload?.code ?? "").trim(),
    type: String(requestPayload?.type ?? "").trim(),
    name: String(requestPayload?.name ?? "").trim(),
    email: String(requestPayload?.email ?? "").trim(),
    number: String(requestPayload?.number ?? "").trim(),
    address: {
      line1: String(address?.line1 ?? "").trim(),
      line2: String(address?.line2 ?? "").trim(),
      city: String(address?.city ?? "").trim(),
      state: String(address?.state ?? "").trim(),
      country: String(address?.country ?? "").trim(),
      pincode,
    },
  };

  if (
    !companyCode ||
    !payload.code ||
    !payload.type ||
    !payload.name ||
    !payload.email ||
    !payload.number ||
    !payload.address.line1 ||
    !payload.address.city ||
    !payload.address.state ||
    !payload.address.country ||
    !Number.isInteger(pincode) ||
    pincode <= 0
  ) {
    return NextResponse.json(
      { message: "All required branch and address fields must be valid." },
      { status: 400 },
    );
  }

  try {
    const backendResponse = await fetch(
      `${backendUrl}/tms/api/${encodeURIComponent(companyCode)}/branch/add`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.accessToken}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );
    const responsePayload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          message: responsePayload?.message ?? "Unable to add branch.",
          ...(responsePayload ?? {}),
        },
        { status: backendResponse.status || 500 },
      );
    }

    return NextResponse.json(responsePayload ?? {}, { status: 201 });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the company service." },
      { status: 503 },
    );
  }
}