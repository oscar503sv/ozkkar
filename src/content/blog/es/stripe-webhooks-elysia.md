---
title: 'Pagos con Stripe sin sorpresas: webhooks idempotentes en Bun + Elysia'
description: 'Por qué confirmo el pago en el webhook y no en la redirección, cómo verificar la firma en Elysia, cómo evitar tickets duplicados y generar el QR solo con el pago confirmado.'
pubDate: 2026-11-01
cover: ../../../assets/blog/stripe-webhooks-elysia.webp
coverAlt: 'Flujo de pago con Stripe Checkout, webhook, idempotencia y ticket QR en Bun y Elysia'
tags: [stripe, bun, elysia, typescript, backend]
---

En mi [Event Ticket System](https://github.com/oscar503sv/event-ticket-system) los usuarios compran entradas con Stripe y reciben un ticket con código QR. Integrar el pago es fácil; hacerlo sin sorpresas tiene algunos detalles.

## No confíes en la redirección

Con Stripe Checkout, cuando el pago termina el usuario vuelve a tu `success_url`. Es tentador crear el ticket ahí, pero:

- El usuario puede cerrar la pestaña antes de volver.
- Cualquiera puede abrir `/payment/success` a mano.
- Algunos métodos de pago se confirman minutos después.

La fuente de verdad es el **webhook**: Stripe llama a tu servidor cuando el pago se confirma. La página de éxito solo muestra un mensaje.

## El flujo

1. El usuario pide comprar. Valido que el evento esté publicado, que haya cupo y que no tenga ya un ticket.
2. Creo la Checkout Session con el `eventId` y el `userId` en `metadata`, y que expire en 30 minutos.
3. Stripe envía `checkout.session.completed` al webhook.
4. Verifico la firma, compruebo `payment_status === "paid"` y creo el ticket con su QR.

## Verificar la firma en Elysia

Stripe firma cada webhook. Para verificarlo necesitas **el body exacto, sin parsear**. Elysia parsea el JSON automáticamente, así que capturo el body crudo en `onRequest`, antes del parser:

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

Y en el handler:

```ts
const signature = headers['stripe-signature'];
const rawBody = (request as any).rawBody;

let event: Stripe.Event;
try {
  event = stripe.webhooks.constructEvent(rawBody, signature, STRIPE_WEBHOOK_SECRET);
} catch {
  set.status = 400;
  return { error: 'Firma de webhook inválida' };
}
```

Este endpoint no lleva JWT: la firma **es** la autenticación. Sin ella, cualquiera podría mandar un "pago completado" falso.

## Idempotencia: el mismo evento puede llegar dos veces

Stripe reintenta un webhook si no recibe un 2xx, y puede entregar un evento más de una vez. Si tu handler crea un ticket cada vez, terminas regalando entradas.

Mi regla: **un pago = un ticket**. Antes de crear el ticket busco si ya existe uno con ese `payment_intent`:

```ts
const [existing] = await db
  .select()
  .from(tickets)
  .where(eq(tickets.paymentId, paymentId))
  .limit(1);

if (existing) return existing; // ya procesado, no hago nada
```

Como también escucho `checkout.session.async_payment_succeeded` (pagos que se confirman después), el mismo pago podría llegar por dos eventos distintos. Usar el `payment_intent` como llave cubre los dos casos.

**Un consejo extra:** respalda esta regla en la base de datos con un índice `UNIQUE` en `payment_id` y trata el error de duplicado como "ya procesado". Así, aunque dos webhooks lleguen al mismo tiempo, la base de datos garantiza que no haya dos tickets.

## El QR, solo con el pago confirmado

El ticket se genera dentro del webhook, nunca antes. Antes de crearlo vuelvo a validar el cupo, por si se llenó mientras el usuario pagaba. Luego genero un código único y su QR:

```ts
const ticketCode = await this.generateUniqueTicketCode();
const qrCode = await QRCode.toDataURL(ticketCode, { errorCorrectionLevel: 'M', width: 300 });
```

En la entrada, el staff escanea el QR y el ticket se marca como usado.

## ¿Qué responder a Stripe?

Stripe espera un `2xx` rápido; si no lo recibe, reintenta. Por eso conviene responder pronto y registrar en logs cualquier error al procesar. Y como el handler es idempotente, un reintento nunca crea un ticket duplicado.

## Para probar en local

```bash
stripe listen --forward-to localhost:3000/webhooks/stripe
stripe trigger checkout.session.completed
```

El CLI te da el `whsec_...` para tu `.env`. Así pruebas todo el flujo sin desplegar.

## Conclusión

Webhook como fuente de verdad, firma verificada e idempotencia por `payment_intent`. Con esas tres reglas, los pagos dejan de dar sorpresas.
