import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type TrackingConfig = {
  meta_pixel_id: string | null;
  ga_measurement_id: string | null;
  google_ads_id: string | null;
  google_ads_label: string | null;
};

/** Public: pixel/analytics IDs for a product page (product override > producer defaults). */
export const getProductTracking = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }): Promise<TrackingConfig> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const empty: TrackingConfig = {
      meta_pixel_id: null,
      ga_measurement_id: null,
      google_ads_id: null,
      google_ads_label: null,
    };
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("producer_id, status, meta_pixel_id, ga_measurement_id, google_ads_label")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!product || product.status !== "publicado") return empty;

    const { data: integ } = await supabaseAdmin
      .from("user_integrations")
      .select("meta_pixel_id, ga_measurement_id, google_ads_id, google_ads_label")
      .eq("user_id", product.producer_id)
      .maybeSingle();

    return {
      meta_pixel_id: product.meta_pixel_id || integ?.meta_pixel_id || null,
      ga_measurement_id: product.ga_measurement_id || integ?.ga_measurement_id || null,
      google_ads_id: integ?.google_ads_id || null,
      google_ads_label: product.google_ads_label || integ?.google_ads_label || null,
    };
  });

export type OrderTracking = TrackingConfig & {
  status: string;
  value: number;
  currency: string;
  content_id: string;
  content_name: string;
};

/** Public: tracking payload for the order page + server-side UTMify/CAPI dispatch when paid. */
export const getOrderTracking = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string; notify?: boolean }) =>
    z.object({ token: z.string().min(10), notify: z.boolean().optional() }).parse(d),
  )
  .handler(async ({ data }): Promise<OrderTracking | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sale } = await supabaseAdmin
      .from("sales")
      .select(
        "id, status, gross_cents, currency, buyer_name, buyer_email, buyer_phone, payment_method, created_at, paid_at, producer_id, product:products(id, title, slug, meta_pixel_id, ga_measurement_id, google_ads_label, utmify_token)",
      )
      .eq("access_token", data.token)
      .maybeSingle();
    if (!sale) return null;

    const product = sale.product as any;
    const { data: integ } = await supabaseAdmin
      .from("user_integrations")
      .select(
        "meta_pixel_id, meta_capi_token, ga_measurement_id, google_ads_id, google_ads_label, utmify_token",
      )
      .eq("user_id", sale.producer_id)
      .maybeSingle();

    const cfg: OrderTracking = {
      meta_pixel_id: product?.meta_pixel_id || integ?.meta_pixel_id || null,
      ga_measurement_id: product?.ga_measurement_id || integ?.ga_measurement_id || null,
      google_ads_id: integ?.google_ads_id || null,
      google_ads_label: product?.google_ads_label || integ?.google_ads_label || null,
      status: sale.status,
      value: sale.gross_cents / 100,
      currency: sale.currency,
      content_id: product?.id ?? "",
      content_name: product?.title ?? "",
    };

    if (data.notify && sale.status === "pago") {
      const utmifyToken = product?.utmify_token || integ?.utmify_token || null;
      const capiToken = integ?.meta_capi_token || null;
      await Promise.allSettled([
        utmifyToken
          ? fetch("https://api.utmify.com.br/api-credentials/orders", {
              method: "POST",
              headers: { "content-type": "application/json", "x-api-token": utmifyToken },
              body: JSON.stringify({
                orderId: sale.id,
                platform: "InfroPay",
                paymentMethod: sale.payment_method,
                status: "paid",
                createdAt: sale.created_at,
                approvedDate: sale.paid_at,
                customer: {
                  name: sale.buyer_name,
                  email: sale.buyer_email,
                  phone: sale.buyer_phone,
                  country: "AO",
                },
                products: [
                  {
                    id: product?.id,
                    name: product?.title,
                    quantity: 1,
                    priceInCents: sale.gross_cents,
                  },
                ],
                commission: { totalPriceInCents: sale.gross_cents, currency: sale.currency },
              }),
            }).catch(() => null)
          : null,
        capiToken && cfg.meta_pixel_id
          ? fetch(
              `https://graph.facebook.com/v19.0/${cfg.meta_pixel_id}/events?access_token=${capiToken}`,
              {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  data: [
                    {
                      event_name: "Purchase",
                      event_time: Math.floor(Date.now() / 1000),
                      event_id: sale.id,
                      action_source: "website",
                      custom_data: { value: cfg.value, currency: cfg.currency },
                    },
                  ],
                }),
              },
            ).catch(() => null)
          : null,
      ]);
    }

    return cfg;
  });
