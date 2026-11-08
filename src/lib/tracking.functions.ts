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
  gclid?: string | null;
  gbraid?: string | null;
  wbraid?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
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

function sha256(value: string) {
  return import("node:crypto").then(({ createHash }) =>
    createHash("sha256").update(value.trim().toLowerCase()).digest("hex"),
  );
}

const TIKTOK_SUPPORTED_CURRENCIES = new Set([
  "AED", "ARS", "AUD", "BDT", "BHD", "BIF", "BOB", "BRL", "CAD", "CHF",
  "CLP", "CNY", "COP", "CRC", "CZK", "DKK", "DZD", "EGP", "EUR", "GBP",
  "GTQ", "HKD", "HNL", "HUF", "IDR", "ILS", "INR", "ISK", "JPY", "KES",
  "KHR", "KRW", "KWD", "KZT", "MAD", "MOP", "MXN", "MYR", "NGN", "NIO",
  "NOK", "NZD", "OMR", "PEN", "PHP", "PKR", "PLN", "PYG", "QAR", "RON",
  "RUB", "SAR", "SEK", "SGD", "THB", "TRY", "TWD", "UAH", "USD", "VES",
  "VND", "ZAR",
]);

/**
 * Sends confirmed-sale events from the server. Called when a receipt is
 * approved and also from the order page as a safe fallback. The database claim
 * prevents duplicate server conversions across both paths.
 */
export async function dispatchSaleTracking(saleId: string, context?: TrackingContext) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const db = supabaseAdmin as any;
  const { data: sale, error: saleError } = await db
    .from("sales")
    .select("id, access_token, status, gross_cents, currency, buyer_name, buyer_email, buyer_phone, payment_method, created_at, paid_at, producer_id, tracking_purchase_sent_at, tracking_fbp, tracking_fbc, tracking_ttp, tracking_ttclid, tracking_user_agent, tracking_page_url, tracking_referrer, product:products(id, title, slug, utmify_token)")
    .eq("id", saleId)
    .maybeSingle();
  if (saleError) throw saleError;
  if (!sale || sale.status !== "pago" || sale.tracking_purchase_sent_at) return { sent: false };

  const product = sale.product as any;
  const { data: integ, error: integrationError } = await db
    .from("user_integrations")
    .select("meta_pixel_id, meta_capi_token, utmify_token, tiktok_pixel_id, tiktok_events_api_token")
    .eq("user_id", sale.producer_id)
    .maybeSingle();
  if (integrationError) throw integrationError;

  const metaPixelId = product?.meta_pixel_id || integ?.meta_pixel_id || null;
  const metaToken = integ?.meta_capi_token || null;
  const tiktokPixelId = integ?.tiktok_pixel_id || null;
  const tiktokToken = integ?.tiktok_events_api_token || null;
  const utmifyToken = product?.utmify_token || integ?.utmify_token || null;
  if (!((metaPixelId && metaToken) || (tiktokPixelId && tiktokToken) || utmifyToken))
    return { sent: false };

  const claimTimestamp = new Date().toISOString();
  const { data: claimed, error: claimError } = await db
    .from("sales")
    .update({ tracking_purchase_sent_at: claimTimestamp })
    .eq("id", sale.id)
    .is("tracking_purchase_sent_at", null)
    .select("id");
  if (claimError) throw claimError;
  if (!claimed?.length) return { sent: false };

  const emailHash = sale.buyer_email ? await sha256(sale.buyer_email) : null;
  let phoneDigits = (sale.buyer_phone ?? "").replace(/\D/g, "");
  if (phoneDigits.startsWith("0")) phoneDigits = phoneDigits.slice(1);
  if (phoneDigits.length === 9) phoneDigits = `244${phoneDigits}`;
  const phoneE164 = phoneDigits ? `+${phoneDigits}` : "";
  const phoneHash = phoneE164 ? await sha256(phoneE164) : null;
  const eventTime = sale.paid_at
    ? Math.floor(new Date(sale.paid_at).getTime() / 1000)
    : Math.floor(Date.now() / 1000);
  const value = sale.gross_cents / 100;
  const pageUrl = sale.tracking_page_url || context?.page_url || `https://infropay.vercel.app/pedido/${sale.access_token}`;
  const userAgent = sale.tracking_user_agent || context?.user_agent || "InfroPay";
  const fbp = sale.tracking_fbp || context?.fbp;
  const fbc = sale.tracking_fbc || context?.fbc;
  const ttp = sale.tracking_ttp || context?.ttp;
  const ttclid = sale.tracking_ttclid || context?.ttclid;
  const referrer = sale.tracking_referrer || context?.referrer;
  const tasks: Promise<unknown>[] = [];

  const post = async (url: string, init: RequestInit) => {
    const response = await fetch(url, init);
    if (!response.ok) throw new Error(`Tracking request failed: ${response.status}`);
    const body = await response.json().catch(() => ({}));
    if ((body as any)?.error || ((body as any)?.code != null && (body as any).code !== 0))
      throw new Error("Tracking provider rejected the event.");
    return body;
  };

  if (utmifyToken) {
    tasks.push(
      post("https://api.utmify.com.br/api-credentials/orders", {
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

  if (metaPixelId && metaToken) {
    const userData: Record<string, unknown> = { client_user_agent: userAgent };
    if (emailHash) userData.em = [emailHash];
    if (phoneHash) userData.ph = [phoneHash];
    if (fbp) userData.fbp = fbp;
    if (fbc) userData.fbc = fbc;
    tasks.push(
      post(`https://graph.facebook.com/v27.0/${metaPixelId}/events?access_token=${encodeURIComponent(metaToken)}`, {
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
                value,
                currency: sale.currency,
                content_ids: [product?.id],
                content_name: product?.title,
                content_type: "product",
                order_id: sale.id,
              },
            },
          ],
        }),
      }),
    );
  }

  if (tiktokPixelId && tiktokToken) {
    const tiktokUser: Record<string, unknown> = { user_agent: userAgent };
    const tiktokSupportsValueCurrency = TIKTOK_SUPPORTED_CURRENCIES.has(String(sale.currency).toUpperCase());
    if (emailHash) tiktokUser.email = emailHash;
    if (phoneHash) tiktokUser.phone = phoneHash;
    if (ttclid) tiktokUser.ttclid = ttclid;
    if (ttp) tiktokUser.ttp = ttp;
    tasks.push(
      post("https://business-api.tiktok.com/open_api/v1.3/event/track/", {
        method: "POST",
        headers: { "content-type": "application/json", "Access-Token": tiktokToken },
        body: JSON.stringify({
          event_source: "web",
          event_source_id: tiktokPixelId,
          data: [
            {
              event: "CompletePayment",
              event_time: eventTime,
              event_id: sale.id,
              user: { ...tiktokUser, locale: "pt_AO" },
              page: {
                url: pageUrl,
                referrer: referrer || undefined,
              },
              properties: {
                value,
                currency: sale.currency,
                content_type: "product",
                content_ids: [product?.id],
                description: product?.title,
                order_id: sale.id,
                contents: [
                  {
                    content_id: product?.id,
                    content_name: product?.title,
                    quantity: 1,
                    price: value,
                  },
                ],
              },
            },
          ],
        }),
      }),
    );
  }

  const results = await Promise.allSettled(tasks);
  const failed = results.filter((result) => result.status === "rejected").length;

  // Se algum fornecedor falhar, libertar a marca para permitir nova tentativa
  // na próxima visita/consulta do pedido. Nunca marcar como enviado sem sucesso.
  if (failed > 0) {
    await db
      .from("sales")
      .update({ tracking_purchase_sent_at: null })
      .eq("id", sale.id)
      .eq("tracking_purchase_sent_at", claimTimestamp);
    return { sent: false, failed };
  }

  return { sent: true, failed: 0 };
}

/** Public: tracking payload for the order page; dispatches server events as a fallback. */
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
        gclid: z.string().max(1200).optional().nullable(),
        gbraid: z.string().max(1200).optional().nullable(),
        wbraid: z.string().max(1200).optional().nullable(),
        utm_source: z.string().max(500).optional().nullable(),
        utm_medium: z.string().max(500).optional().nullable(),
        utm_campaign: z.string().max(1000).optional().nullable(),
        utm_content: z.string().max(1000).optional().nullable(),
        utm_term: z.string().max(1000).optional().nullable(),
        user_agent: z.string().max(1000).optional().nullable(),
        page_url: z.string().url().max(2000).optional().nullable(),
        referrer: z.string().url().max(2000).optional().nullable(),
      }).optional(),
    }).parse(d),
  )
  .handler(async ({ data }): Promise<OrderTracking | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin as any;
    const { data: sale, error } = await db
      .from("sales")
      .select("id, status, gross_cents, currency, producer_id, tracking_purchase_sent_at, product:products(id, title, meta_pixel_id, ga_measurement_id, google_ads_label)")
      .eq("access_token", data.token)
      .maybeSingle();
    if (error) throw error;
    if (!sale) return null;

    const product = sale.product as any;
    const { data: integ, error: integrationError } = await db
      .from("user_integrations")
      .select("meta_pixel_id, ga_measurement_id, google_ads_id, google_ads_label, tiktok_pixel_id")
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
      await dispatchSaleTracking(sale.id, data.tracking_context);
    }

    return cfg;
  });
