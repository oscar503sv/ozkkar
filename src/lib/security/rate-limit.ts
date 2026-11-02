/**
 * Per-IP rate limit for the contact form, backed by Upstash Redis so the
 * count is shared across every serverless instance.
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/** Messages allowed per IP within the window. */
export const CONTACT_LIMIT = 4;
export const CONTACT_WINDOW = '24 h';

interface RedisCredentials {
  url?: string;
  token?: string;
}

let limiter: Ratelimit | null | undefined;

function getLimiter({ url, token }: RedisCredentials): Ratelimit | null {
  if (limiter !== undefined) return limiter;
  limiter =
    url && token
      ? new Ratelimit({
          redis: new Redis({ url, token }),
          limiter: Ratelimit.slidingWindow(CONTACT_LIMIT, CONTACT_WINDOW),
          prefix: 'ratelimit:contact',
        })
      : null;
  return limiter;
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number }
  | { allowed: true; skipped: 'not_configured' | 'unavailable' };

export async function limitContact(
  ip: string,
  credentials: RedisCredentials,
): Promise<RateLimitResult> {
  const ratelimit = getLimiter(credentials);
  if (!ratelimit) return { allowed: true, skipped: 'not_configured' };

  try {
    const { success, reset } = await ratelimit.limit(ip);
    if (success) return { allowed: true };
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((reset - Date.now()) / 1000)),
    };
  } catch (error) {
    // Don't lose real messages if Redis is down; Turnstile still applies.
    console.error('[rate-limit] Upstash request failed', error);
    return { allowed: true, skipped: 'unavailable' };
  }
}
