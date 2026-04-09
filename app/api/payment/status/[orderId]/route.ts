import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getBackendBaseUrl(): string {
  const base = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = await params;
  const targetUrl = `${getBackendBaseUrl()}/api/payment/status/${encodeURIComponent(orderId)}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: "GET",
      headers: {
        ...(request.headers.get("authorization")
          ? { authorization: request.headers.get("authorization")! }
          : {}),
      },
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const body = await upstream.text();

    return new NextResponse(body, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch {
    return NextResponse.json(
      { detail: "Cannot reach payment backend." },
      { status: 502 }
    );
  }
}
