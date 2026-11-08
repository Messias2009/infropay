import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type TrackingConfig = {
  meta_pixel_id: string | null;
  ga_measurement_id: string | null;
  google_ads_id: string | null;
  google_ads_label: string | null;
  tiktok_pixel_id: string | null;
};

/** Public: pixel/analytics IDs for a product page (product override > producer defaults). */
export const getProductTracking = createServerFn({ method: "GET" })
  .validator((d: { slug: string }) => z.object({ slug: z.string().min(1) }).parse(d))
  .handler(async ({ data }): Promise<TrackingConfig> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const empty: TrackingConfig = {
      meta_pixel_id: null,
      ga_measurement_id: null,
      google_ads_id: null,
      google_ads_label: null,
      tiktok_pixel_id: null,
    };
    const { data: product } = await supabaseAdmin
      .from("products")
      .select("producer_id, status, meta_pixel_id, ga_measurement_id, google_ads_label")
      .eq("slug", data.slug)
      .maybeSingle();
    if (!product || product.status !== "publicado") return empty;

    const { data: integ } = await (supabaseAdmin as any)
      .from("user_integrations")
      .select("meta_pixel_id, ga_measurement_id, google_ads_id, google_ads_label, tiktok_pixel_id")
      .eq("user_id", product.producer_id)
      .maybeSingle();

    return {
      meta_pixel_id: product.meta_pixel_id || integ?.meta_pixel_id || null,
      ga_measurement_id: product.ga_measurement_id || integ?.ga_measurement_id || null,
      google_ads_id: integ?.google_ads_id || null,
      google_ads_label: product.google_ads_label || integ?.google_ads_label || null,
      tiktok_pixel_id: integ?.tiktok_pixel_id || null,
    };
  });

export type TrackingContext = {
  fbp?: string | null;
  fbc?: string | null;
  ttp?: string | null;
  ttclid?: string | null;
  user_agent?: string | null;
  page_url?: string | null;
  referrer?: string | null;
};

export type OrderTracking = TrackingConfig & {
  status: string;
  value: number;
  currency: string;
  content_id: string;
  content_name: string;
  event_id: string;
};

/** Public: order tracking payload + server-side UTMify, Meta CAPI and TikTok Events API dispatch. */
export const getOrderTracking = createServerFn({ method: "GET" })
  .validator((d: unknown) =>
    z.object({
      token: z.string().min(10),
      notify: z.boolean().optional(),
      tracking_context: z.object({
        fbp: z.string().max(500).optional().nullable(),
        fbc: z.string().max(1000).optional().nullable(),
        ttp: z.string().max(500).optional().nullable(),
        ttclid: z.string().max(1200).optional().nullable(),
        user_agent: z.string().max(1000).optional().nullable(),
        page_url: z.string().url().max(2000).optional().nullable(),
        referrer: z.string().url().max(2000).optional().nullable(),
      }).optional(),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<OrderTracking | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { data: sale, error: saleError } = await db
      .from("sales")
      .select(
        "id, status, gross_cents, currency, buyer_name, buyer_email, buyer_phone, payment_method, created_at, paid_at, producer_id, tracking_purchase_sent_at, product:products(id, title, slug, meta_pixel_id, ga_measurement_id, google_ads_label, utmify_token)",
      )
      .eq("access_token", data.token)
      .maybeSingle();
    if (saleError) throw saleError;
    if (!sale) return null;

    const product = sale.product as any;
    const { data: integ, error: integrationError } = await db
      .from("user_integrations")
      .select(
        "meta_pixel_id, meta_capi_token, ga_measurement_id, google_ads_id, google_ads_label, utmify_token, tiktok_pixel_id, tiktok_events_api_token",
      )
      .eq("user_id", sale.producer_id)
      .maybeSingle();
    if (integrationError) throw integrationError;

    const cfg: OrderTracking = {
      meta_pixel_id: product?.meta_pixel_id || integ?.meta_pixel_id || null,
      ga_measurement_id: product?.ga_measurement_id || integ?.ga_measurement_id || null,
      google_ads_id: integ?.google_ads_id || null,
      google_ads_label: product?.google_ads_label || integ?.google_ads_label || null,
      tiktok_pixel_id: integ?.tiktok_pixel_id || null,
      status: sale.status,
      value: sale.gross_cents / 100,
      currency: sale.currency,
      content_id: product?.id ?? "",
      content_name: product?.title ?? "",
      event_id: sale.id,
    };

    if (data.notify && sale.status === "pago") {
      const utmifyToken = product?.utmify_token || integ?.utmify_token || null;
      const capiToken = integ?.meta_capi_token || null;
      const tiktokToken = integ?.tiktok_events_api_token || null;
      const trackingContext = data.tracking_context ?? {};
      const pageUrl = trackingContext.page_url || `https://infropay.vercel.app/pedido/${data.token}`;
      const eventTime = sale.paid_at
        ? Math.floor(new Date(sale.paid_at).getTime() / 1000)
        : Math.floor(Date.now() / 1000);

      const serverPlatformsConfigured = Boolean(
        (capiToken && cfg.meta_pixel_id) || (tiktokToken && cfg.tiktok_pixel_id),
      );
      let maySendServerEvents = false;

      // Claim the purchase once in the database so refreshes or parallel
      // requests cannot send duplicate server-side conversions.
      if (serverPlatformsConfigured && !sale.tracking_purchase_sent_at) {
        const { data: claimed, error: claimError } = await db
          .from("sales")
          .update({ tracking_purchase_sent_at: new Date().toISOString() })
          .eq("id", sale.id)
          .is("tracking_purchase_sent_at", null)
          .select("id");
        if (claimError) throw claimError;
        maySendServerEvents = Boolean(claimed?.length);
      }

      const { createHash } = await import("node:crypto");
      const hash = (value: string) =>
        createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
      const emailHash = sale.buyer_email ? hash(sale.buyer_email) : null;
      let phoneDigits = (sale.buyer_phone ?? "").replace(/\D/g, "");
      if (phoneDigits.startsWith("0")) phoneDigits = phoneDigits.slice(1);
      if (phoneDigits.length === 9) phoneDigits = `244${phoneDigits}`;
      const phoneE164 = phoneDigits ? `+${phoneDigits}` : "";
      const phoneHash = phoneE164 ? hash(phoneE164) : null;
      const ua = trackingContext.user_agent || "InfroPay";
      const tasks: Promise<unknown>[] = [];

      if (utmifyToken) {
        tasks.push(
          fetch("https://api.utmify.com.br/api-credentials/orders", {
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
          }),
        );
      }

      if (maySendServerEvents && capiToken && cfg.meta_pixel_id) {
        const userData: Record<string, unknown> = { client_user_agent: ua };
        if (emailHash) userData.em = [emailHash];
        if (phoneHash) userData.ph = [phoneHash];
        if (trackingContext.fbp) userData.fbp = trackingContext.fbp;
        if (trackingContext.fbc) userData.fbc = trackingContext.fbc;

        tasks.push(
          fetch(`https://graph.facebook.com/v27.0/${cfg.meta_pixel_id}/events?access_token=${encodeURIComponent(capiToken)}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              data: [
                {
                  event_name: "Purchase",
                  event_time: eventTime,
                  event_id: sale.id,
                  action_source: "website",
                  event_source_url: pageUrl,
                  user_data: userData,
                  custom_data: {
                    value: cfg.value,
                    currency: cfg.currency,
                    content_ids: [cfg.content_id],
                    content_name: cfg.content_name,
                    content_type: "product",
                    order_id: sale.id,
                  },
                },
              ],
            }),
          }),
        );
      }

      if (maySendServerEvents && tiktokToken && cfg.tiktok_pixel_id) {
        const tiktokUser: Record<string, unknown> = {};
        if (emailHash) tiktokUser.email = emailHash;
        if (phoneHash) tiktokUser.phone_number = phoneHash;
        if (trackingContext.ttclid) tiktokUser.ttclid = trackingContext.ttclid;
        if (trackingContext.ttp) tiktokUser.ttp = trackingContext.ttp;

        tasks.push(
          fetch("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
            method: "POST",
            headers: {
              "content-type": "application/json",
              "Access-Token": tiktokToken,
            },
            body: JSON.stringify({
              event_source: "web",
              event_source_id: cfg.tiktok_pixel_id,
              data: [
                {
                  event: "Purchase",
                  event_time: eventTime,
                  event_id: sale.id,
                  user: {
                    ...tiktokUser,
                    user_agent: ua,
                    locale: "pt_AO",
                  },
                  page: {
                    url: pageUrl,
                    referrer: trackingContext.referrer || undefined,
                  },
                  properties: {
                    value: cfg.value,
                    currency: cfg.currency,
                    content_type: "product",
                    content_ids: [cfg.content_id],
                    description: cfg.content_name,
                    order_id: sale.id,
                    contents: [
                      {
                        content_id: cfg.content_id,
                        content_name: cfg.content_name,
                        quantity: 1,
                        price: cfg.value,
                      },
                    ],
                  },
                },
              ],
            }),
          }),
        );
      }

      await Promise.allSettled(tasks);
    }

    return cfg;
  });
