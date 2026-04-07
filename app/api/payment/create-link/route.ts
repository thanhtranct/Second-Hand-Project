import { NextResponse } from "next/server";

export const runtime = "nodejs";

function getBackendBaseUrl(): string {
  const base = process.env.BACKEND_API_URL || "http://127.0.0.1:8000";
  return base.endsWith("/") ? base.slice(0, -1) : base;
}

export async function POST(request: Request) {
  const targetUrl = `${getBackendBaseUrl()}/api/payment/create-link`;

  try {
    const payload = await request.json();

    const upstream = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const body = await upstream.text();

    return new NextResponse(body, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch {
    return NextResponse.json(
      {
        detail:
          "Cannot reach payment backend. Start backend on http://127.0.0.1:8000 or set BACKEND_API_URL.",
      },
      { status: 502 }
    );
  }
}
