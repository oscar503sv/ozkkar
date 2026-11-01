import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, CONTACT_TO_EMAIL, RESEND_API_KEY } from 'astro:env/server';

import { buildContactEmail, contactSchema } from '../../lib/contact';

export const prerender = false;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
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
