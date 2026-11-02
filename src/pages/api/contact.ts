import type { APIRoute } from 'astro';
import {
  CONTACT_FROM_EMAIL,
  CONTACT_TO_EMAIL,
  KV_REST_API_TOKEN,
  KV_REST_API_URL,
  RESEND_API_KEY,
  TURNSTILE_SECRET_KEY,
  UPSTASH_REDIS_REST_TOKEN,
  UPSTASH_REDIS_REST_URL,
} from 'astro:env/server';

import { buildContactEmail, contactSchema } from '../../lib/contact';
import { limitContact } from '../../lib/security/rate-limit';
import { verifyTurnstile } from '../../lib/security/turnstile';

export const prerender = false;

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });

export const POST: APIRoute = async ({ request, clientAddress }) => {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: 'invalid_json' }, 400);
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return json({ ok: false, error: 'invalid_payload' }, 422);
  }

  const payload = parsed.data;

  // Bots fill the honeypot: pretend it worked and drop the message.
  if (payload.website) return json({ ok: true });

  // 1. Human check (Cloudflare Turnstile).
  if (TURNSTILE_SECRET_KEY) {
    const human = await verifyTurnstile(
      payload.turnstileToken,
      TURNSTILE_SECRET_KEY,
      clientAddress,
    );
    if (!human) return json({ ok: false, error: 'captcha_failed' }, 403);
  } else {
    console.warn('[contact] TURNSTILE_SECRET_KEY is not configured; skipping bot check');
  }

  // 2. Per-IP rate limit (Upstash Redis).
  const limit = await limitContact(clientAddress, {
    url: UPSTASH_REDIS_REST_URL ?? KV_REST_API_URL,
    token: UPSTASH_REDIS_REST_TOKEN ?? KV_REST_API_TOKEN,
  });
  if (!limit.allowed) {
    return json({ ok: false, error: 'rate_limited' }, 429, {
      'Retry-After': String(limit.retryAfterSeconds),
    });
  }
  if ('skipped' in limit) {
    console.warn(`[contact] rate limit skipped: ${limit.skipped}`);
  }

  // 3. Send.
  if (!RESEND_API_KEY) {
    console.error('[contact] RESEND_API_KEY is not configured');
    return json({ ok: false, error: 'not_configured' }, 500);
  }

  const { subject, text } = buildContactEmail(payload);

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: CONTACT_FROM_EMAIL,
      to: [CONTACT_TO_EMAIL],
      reply_to: payload.email,
      subject,
      text,
    }),
  });

  if (!response.ok) {
    console.error('[contact] Resend error', response.status, await response.text());
    return json({ ok: false, error: 'send_failed' }, 502);
  }

  return json({ ok: true });
};
