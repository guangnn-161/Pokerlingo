import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { takeRateLimit } from "@/lib/rate-limit";

async function hashedClientKey(request: NextRequest) {
  const clientIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(clientIp),
  );

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("").slice(0, 24);
}

export async function middleware(request: NextRequest) {
  const requestId = request.headers.get("x-request-id") ?? crypto.randomUUID();
  const headers = new Headers(request.headers);
  headers.set("x-request-id", requestId);

  if (request.nextUrl.pathname.startsWith("/api/auth/signin/")) {
    const clientKey = await hashedClientKey(request);
    const limit = await takeRateLimit(`auth:${clientKey}`, 10, 10 * 60_000);

    if (!limit.allowed) {
      const retryAfter = Math.max(
        1,
        Math.ceil((limit.resetAt - Date.now()) / 1_000),
      );

      return NextResponse.json(
        {
          code: "RATE_LIMITED",
          message: "Bạn đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.",
          requestId,
        },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(retryAfter),
            "x-request-id": requestId,
          },
        },
      );
    }
  }

  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/api/:path*"] };
