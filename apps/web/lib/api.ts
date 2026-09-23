import { NextResponse } from "next/server";
import { createHash, randomUUID } from "node:crypto";

export const requestId = (request: Request) => request.headers.get("x-request-id") ?? randomUUID();

export function ok<T>(request: Request, data: T, init: ResponseInit = {}) {
  return NextResponse.json({ data, requestId: requestId(request) }, init);
}
export function fail(request: Request, status: number, code: string, message: string, details?: Record<string, unknown>) {
  return NextResponse.json({ code, message, requestId: requestId(request), ...(details ? { details } : {}) }, { status });
}
export function ipHash(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
}
export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  return !origin || !appUrl || origin === appUrl;
}