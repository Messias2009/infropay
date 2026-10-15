import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Webhook Multicaixa (genérico, HMAC-SHA256).
// Configura no painel do provedor:
//   URL: https://<teu-dominio>/api/public/webhooks/multicaixa
//   Assinatura: HMAC-SHA256(body, MULTICAIXA_WEBHOOK_SECRET)  → header x-multicaixa-signature
// Payload esperado (JSON): { event_id, reference, status: "paid"|"failed", amount, currency }

export const Route = createFileRoute("/api/public/webhooks/multicaixa")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.MULTICAIXA_WEBHOOK_SECRET;
        if (!secret) {
          return Response.json({ ok: false, reason: "payment_adapter_not_ready" }, { status: 503 });
        }
        const raw = await request.text();

        if (secret) {
          const provided = request.headers.get("x-multicaixa-signature") ?? "";
          const expected = createHmac("sha256", secret).update(raw).digest("hex");
          const a = Buffer.from(provided);
          const b = Buffer.from(expected);
          if (a.length !== b.length || !timingSafeEqual(a, b)) {
            return new Response("invalid signature", { status: 401 });
          }
        }

        // The actual provider protocol is not configured. Do not acknowledge
        // or mutate orders until amount checks and atomic accounting exist.
        return Response.json({ ok: false, reason: "payment_adapter_not_ready" }, { status: 503 });
      },
    },
  },
});
