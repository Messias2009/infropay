import { useEffect } from "react";
import type { TrackingConfig } from "@/lib/tracking.functions";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    _fbqLoaded?: boolean;
    _gtagLoaded?: Record<string, boolean>;
  }
}

function loadScript(src: string, id: string) {
  if (document.getElementById(id)) return;
  const s = document.createElement("script");
  s.id = id;
  s.async = true;
  s.src = src;
  document.head.appendChild(s);
}

function ensureMeta(pixelId: string) {
  if (!window.fbq) {
    const n: any = (...args: any[]) => {
      if (n.callMethod) {
        n.callMethod(...args);
      } else {
        n.queue.push(args);
      }
    };
    n.queue = [];
    n.loaded = true;
    n.version = "2.0";
    window.fbq = n;
    loadScript("https://connect.facebook.net/en_US/fbevents.js", "meta-pixel-src");
  }
  if (!window._fbqLoaded) {
    window.fbq?.("init", pixelId);
    window._fbqLoaded = true;
  }
}

function ensureGtag(id: string) {
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag(...args: any[]) {
      window.dataLayer!.push(args);
    } as any;
    window.gtag!("js", new Date());
  }
  window._gtagLoaded = window._gtagLoaded || {};
  if (!window._gtagLoaded[id]) {
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${id}`, `gtag-src-${id}`);
    window.gtag!("config", id);
    window._gtagLoaded[id] = true;
  }
}

export type TrackEvent =
  | { type: "ViewContent"; id: string; name: string; value: number; currency: string }
  | { type: "InitiateCheckout"; id: string; name: string; value: number; currency: string }
  | { type: "Purchase"; id: string; name: string; value: number; currency: string };

/** Guarda global (sobrevive a re-renders, refetch e navegação SPA). */
const firedKeys = new Set<string>();

function alreadyFired(key: string, persist: boolean) {
  if (firedKeys.has(key)) return true;
  if (persist && typeof window !== "undefined") {
    try {
      if (window.sessionStorage.getItem(key) === "1") {
        firedKeys.add(key);
        return true;
      }
      window.sessionStorage.setItem(key, "1");
    } catch {
      /* storage indisponível */
    }
  }
  firedKeys.add(key);
  return false;
}

/**
 * Injects the producer's Meta Pixel / GA4 / Google Ads tags and fires
 * PageView + the given event exactly once per user action.
 */
export function TrackingScripts({
  config,
  event,
}: {
  config: TrackingConfig | null | undefined;
  event?: TrackEvent;
}) {
  useEffect(() => {
    if (!config) return;
    const { meta_pixel_id, ga_measurement_id, google_ads_id, google_ads_label } = config;

    const path = typeof window !== "undefined" ? window.location.pathname : "";

    if (meta_pixel_id) {
      ensureMeta(meta_pixel_id);
      if (!alreadyFired(`ip_pv_${meta_pixel_id}_${path}`, false)) {
        window.fbq?.("track", "PageView");
      }
    }
    if (ga_measurement_id) ensureGtag(ga_measurement_id);
    if (google_ads_id) ensureGtag(google_ads_id);

    if (!event) return;

    // Purchase é único por pedido (persistido); os restantes, únicos por sessão de página.
    const persist = event.type === "Purchase";
    if (alreadyFired(`ip_ev_${event.type}_${event.id}`, persist)) return;

    if (meta_pixel_id) {
      window.fbq?.("track", event.type, {
        content_ids: [event.id],
        content_name: event.name,
        content_type: "product",
        value: event.value,
        currency: event.currency,
      });
    }
    if (ga_measurement_id) {
      const gaEvent =
        event.type === "Purchase"
          ? "purchase"
          : event.type === "InitiateCheckout"
            ? "begin_checkout"
            : "view_item";
      window.gtag?.("event", gaEvent, {
        send_to: ga_measurement_id,
        transaction_id: event.type === "Purchase" ? event.id : undefined,
        value: event.value,
        currency: event.currency,
        items: [{ item_id: event.id, item_name: event.name, price: event.value }],
      });
    }
    if (event.type === "Purchase" && google_ads_id) {
      window.gtag?.("event", "conversion", {
        send_to: google_ads_label ? `${google_ads_id}/${google_ads_label}` : google_ads_id,
        value: event.value,
        currency: event.currency,
        transaction_id: event.id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, event?.type, event?.id]);

  return null;
}
