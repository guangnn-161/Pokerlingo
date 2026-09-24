type Bucket = { count: number; resetAt: number };
type RateLimitResult = { allowed: boolean; remaining: number; resetAt: number };

const memory = new Map<string, Bucket>();

function takeLocalRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = memory.get(key);

  if (!bucket || bucket.resetAt <= now) {
    memory.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  bucket.count += 1;
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

async function takeUpstashRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) throw new Error("Upstash is not configured.");

  const redisKey = `pokerlingo:ratelimit:${key}`;
  const seconds = Math.max(1, Math.ceil(windowMs / 1_000));
  const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", redisKey],
      ["EXPIRE", redisKey, seconds, "NX"],
      ["PTTL", redisKey],
    ]),
    cache: "no-store",
  });

  if (!response.ok) throw new Error(`Upstash returned ${response.status}.`);

  const results = (await response.json()) as Array<{ result?: number | string }>;
  const count = Number(results[0]?.result);
  const ttlMs = Number(results[2]?.result);

  if (!Number.isFinite(count) || !Number.isFinite(ttlMs)) {
    throw new Error("Upstash returned an invalid rate-limit response.");
  }

  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    resetAt: Date.now() + Math.max(0, ttlMs),
  };
}

/**
 * Uses Upstash Redis in deployed environments and a local in-memory fallback
 * for development or temporary provider outages.
 */
export async function takeRateLimit(
  key: string,
  limit = 30,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await takeUpstashRateLimit(key, limit, windowMs);
    } catch (error) {
      console.warn("rate_limit_upstash_fallback", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  return takeLocalRateLimit(key, limit, windowMs);
}
