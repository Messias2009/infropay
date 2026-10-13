import { createFileRoute } from "@tanstack/react-router";

// Stripe webhook — placeholder pronto para receber eventos.
// Quando ativares Stripe Payments, este endpoint marca a venda correspondente como paga
// (procurando por stripe_session_id ou por access_token nos metadata).

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.STRIPE_WEBHOOK_SECRET;
        const sig = request.headers.get("stripe-signature") ?? "";
        const raw = await request.text();

        // Enquanto Stripe não está ativado, aceitamos apenas quando o secret existe.
        if (!secret) {
          return new Response(JSON.stringify({ ok: false, reason: "stripe_not_configured" }), {
            status: 202,
            headers: { "content-type": "application/json" },
          });
        }
        if (!sig) return new Response("missing signature", { status: 400 });

        let event: any;
        try {
          // Verificação leve — quando Stripe SDK for instalado, trocar por stripe.webhooks.constructEvent
          event = JSON.parse(raw);
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotência
        if (event.id) {
          const { error: dupErr } = await supabaseAdmin
            .from("webhook_events" as any)
            .insert({ provider: "stripe", event_id: event.id, payload: event });
          if (dupErr && !String(dupErr.message).includes("duplicate")) {
            return new Response("db error", { status: 500 });
          }
          if (dupErr) return new Response("ok (duplicate)", { status: 200 });
        }

        if (
          event.type === "checkout.session.completed" ||
          event.type === "payment_intent.succeeded"
        ) {
          const session = event.data?.object ?? {};
          const token = session.metadata?.access_token as string | undefined;
          const stripeSessionId = session.id as string | undefined;
          const query = supabaseAdmin.from("sales").update({
            status: "pago",
            paid_at: new Date().toISOString(),
            provider: "stripe",
            ...(stripeSessionId ? { stripe_session_id: stripeSessionId } : {}),
          });
          if (token) await query.eq("access_token", token);
          else if (stripeSessionId) await query.eq("stripe_session_id", stripeSessionId);
        }

        return new Response("ok", { status: 200 });
      },
    },
  },
});
