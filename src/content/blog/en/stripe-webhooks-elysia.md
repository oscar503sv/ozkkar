---
title: 'Stripe payments without surprises: idempotent webhooks in Bun + Elysia'
description: 'Why I confirm payments in the webhook and not on the redirect, how to verify the signature in Elysia, how to avoid duplicate tickets, and how to generate the QR only once the payment is confirmed.'
pubDate: 2026-09-15
cover: ../../../assets/blog/stripe-webhooks-elysia.webp
coverAlt: 'Payment flow with Stripe Checkout, webhook, idempotency and QR ticket in Bun and Elysia'
tags: [stripe, bun, elysia, typescript, backend]
---

In my [Event Ticket System](https://github.com/oscar503sv/event-ticket-system), users buy tickets with Stripe and receive a ticket with a QR code. Integrating payments is easy; doing it without surprises takes a few details.

## Don't trust the redirect

With Stripe Checkout, when the payment finishes the user returns to your `success_url`. It is tempting to create the ticket there, but:

- The user may close the tab before coming back.
- Anyone can open `/payment/success` by hand.
- Some payment methods are confirmed minutes later.

The source of truth is the **webhook**: Stripe calls your server when the payment is confirmed. The success page only shows a message.

## The flow

1. The user asks to buy. I check that the event is published, that there is capacity, and that they don't already have a ticket.
2. I create the Checkout Session with the `eventId` and `userId` in `metadata`, set to expire in 30 minutes.
3. Stripe sends `checkout.session.completed` to the webhook.
4. I verify the signature, check `payment_status === "paid"`, and create the ticket with its QR.

## Verifying the signature in Elysia

Stripe signs every webhook. To verify it you need **the exact, unparsed body**. Elysia parses JSON automatically, so I capture the raw body in `onRequest`, before the parser runs:

```ts
export const webhookRoutes = new Elysia({ prefix: '/webhooks' })
  .onRequest(async ({ request }) => {
    const url = new URL(request.url);
    if (url.pathname === '/webhooks/stripe' && request.method === 'POST') {
      (request as any).rawBody = await request.text();
    }
  })
  .post('/stripe', handleStripeWebhook);
```

And in the handler:

```ts
const signature = headers['stripe-signature'];
const rawBody = (request as any).rawBody;

let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
} catch {
  set.status = 400;
  return { error: 'Invalid webhook signature' };
}
```

This endpoint has no JWT: the signature **is** the authentication. Without it, anyone could send a fake "payment completed".

## Idempotency: the same event can arrive twice

Stripe retries a webhook if it doesn't get a 2xx, and it may deliver an event more than once. If your handler creates a ticket every time, you end up giving tickets away.

My rule: **one payment = one ticket**. Before creating the ticket, I check whether one already exists for that `payment_intent`:

```ts
const [existing] = await db
  .select()
  .from(tickets)
  .where(eq(tickets.paymentId, paymentId))
  .limit(1);

if (existing) return existing; // already processed, do nothing
```

Since I also listen to `checkout.session.async_payment_succeeded` (payments confirmed later), the same payment could arrive through two different events. Using the `payment_intent` as the key covers both cases.

**One extra tip:** back this rule up in the database with a `UNIQUE` index on `payment_id`, and treat the duplicate error as "already processed". That way, even if two webhooks arrive at the same time, the database guarantees there won't be two tickets.

## The QR, only once the payment is confirmed

The ticket is generated inside the webhook, never before. Before creating it I check capacity again, in case the event filled up while the user was paying. Then I generate a unique code and its QR:

```ts
const ticketCode = await this.generateUniqueTicketCode();
const qrCode = await QRCode.toDataURL(ticketCode, { errorCorrectionLevel: 'M', width: 300 });
```

At the door, staff scan the QR and the ticket is marked as used.

## What to reply to Stripe?

Stripe expects a fast `2xx`; if it doesn't get one, it retries. So it's best to reply quickly and log any processing error. And because the handler is idempotent, a retry never creates a duplicate ticket.

## Testing locally

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
stripe trigger checkout.session.completed
```

The CLI gives you the `whsec_...` for your `.env`. That way you can test the whole flow without deploying.

## Conclusion

Webhook as the source of truth, verified signature and idempotency by `payment_intent`. With those three rules, payments stop surprising you.
