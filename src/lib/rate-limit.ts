/**
 * In-memory sliding-window rate limiter ringan untuk melindungi endpoint publik
 * (RSVP, Customer Feedback, Support Tickets) dari spam berulang.
 */
interface Bucket {
  timestamps: number[];
}

const store = new Map<string, Bucket>();

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export function checkRateLimit(
  key: string,
  limit = 8,
  windowMs = 60_000
): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const cutoff = now - windowMs;

  // Pembersihan berkala agar Map tidak membengkak di memori
  if (store.size > 2000) {
    for (const [k, v] of store.entries()) {
      if (v.timestamps.length === 0 || v.timestamps[v.timestamps.length - 1] < cutoff) {
        store.delete(k);
      }
    }
  }

  const bucket = store.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    store.set(key, bucket);
    return { allowed: false, retryAfterSec };
  }

  bucket.timestamps.push(now);
  store.set(key, bucket);
  return { allowed: true, retryAfterSec: 0 };
}
