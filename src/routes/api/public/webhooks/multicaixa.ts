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

        let event: any;
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const eventId = String(event.event_id ?? event.reference ?? crypto.randomUUID());
        const reference = String(event.reference ?? "");
        const status = String(event.status ?? "").toLowerCase();

        if (!reference) return new Response("missing reference", { status: 400 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { error: dupErr } = await supabaseAdmin
          .from("webhook_events" as any)
          .insert({ provider: "multicaixa", event_id: eventId, payload: event });
        if (dupErr && !String(dupErr.message).includes("duplicate")) {
          return new Response("db error", { status: 500 });
        }
        if (dupErr) return new Response("ok (duplicate)", { status: 200 });

        if (status === "paid" || status === "success") {
          await supabaseAdmin
            .from("sales")
            .update({
              status: "pago",
              paid_at: new Date().toISOString(),
              provider: "multicaixa",
            })
            .eq("access_token", reference);
        } else if (status === "failed" || status === "cancelled") {
          await supabaseAdmin
            .from("sales")
            .update({
              status: "cancelado",
              provider: "multicaixa",
            })
            .eq("access_token", reference);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
