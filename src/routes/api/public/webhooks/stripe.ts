import { createFileRoute } from "@tanstack/react-router";

// Fail closed until the provider adapter verifies signatures, amounts and
// atomically commits the event together with its accounting transition.

export const Route = createFileRoute("/api/public/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!request.headers.get("stripe-signature")) {
          return new Response("Missing signature", { status: 401 });
        }
        return Response.json({ ok: false, reason: "payment_adapter_not_ready" }, { status: 503 });
      },
    },
  },
});
