type Bucket = { count: number; resetAt: number };
const memory = new Map<string, Bucket>();

/** Local fallback. Replace with Redis/Upstash adapter before multi-instance production traffic. */
export function takeRateLimit(key: string, limit = 30, windowMs = 60_000) {
  const now = Date.now();
  const bucket = memory.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  bucket.count += 1;
  return { allowed: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}