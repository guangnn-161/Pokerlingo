import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
export function middleware(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.set("x-request-id", request.headers.get("x-request-id") ?? randomUUID());
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/api/:path*"] };