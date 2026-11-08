import { useEffect } from "react";
import type { TrackingConfig } from "@/lib/tracking.functions";

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    gtag?: (...args: any[]) => void;
    ttq?: any;
    dataLayer?: any[];
    _fbqLoaded?: Record<string, boolean>;
    _gtagLoaded?: Record<string, boolean>;
    _ttqLoaded?: Record<string, boolean>;
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
      if (n.callMethod) n.callMethod(...args);
      else n.queue.push(args);
    };
    n.queue = [];
    n.loaded = true;
    n.version = "2.0";
    window.fbq = n;
    loadScript("https://connect.facebook.net/en_US/fbevents.js", "meta-pixel-src");
  }
  window._fbqLoaded = window._fbqLoaded || {};
  if (!window._fbqLoaded[pixelId]) {
    window.fbq?.("init", pixelId);
    window._fbqLoaded[pixelId] = true;
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

function ensureTikTok(pixelId: string) {
  if (!window.ttq) {
    const ttq: any = (window.ttq = []);
    ttq.methods = ["page", "track", "identify", "instances", "debug", "on", "off", "once", "ready", "alias", "group", "enableCookie", "disableCookie"];
    ttq.setAndDefer = (target: any, method: string) => {
      target[method] = (...args: any[]) => target.push([method, ...args]);
    };
    for (const method of ttq.methods) ttq.setAndDefer(ttq, method);
    ttq.instance = (id: string) => {
      const instance = ttq._i?.[id] || [];
      for (const method of ttq.methods) ttq.setAndDefer(instance, method);
      return instance;
    };
    ttq.load = (id: string) => {
      ttq._i = ttq._i || {};
      ttq._i[id] = [];
      ttq._i[id]._u = "https://analytics.tiktok.com/i18n/pixel/events.js";
      ttq._t = ttq._t || {};
      ttq._t[id] = Date.now();
      ttq._o = ttq._o || {};
      ttq._o[id] = {};
      const script = document.createElement("script");
      script.type = "text/javascript";
      script.async = true;
      script.src = `https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=${id}&lib=ttq`;
      const first = document.getElementsByTagName("script")[0];
      first?.parentNode?.insertBefore(script, first);
    };
  }
  window._ttqLoaded = window._ttqLoaded || {};
  if (!window._ttqLoaded[pixelId]) {
    window.ttq.load(pixelId);
    window._ttqLoaded[pixelId] = true;
  }
}

function tiktokInstance(pixelId: string) {
  return window.ttq?.instance?.(pixelId) ?? window.ttq;
}

export type TrackEvent =
  | { type: "ViewContent"; id: string; eventId?: string; name: string; value: number; currency: string }
  | { type: "InitiateCheckout"; id: string; eventId?: string; name: string; value: number; currency: string }
  | { type: "Purchase"; id: string; eventId?: string; name: string; value: number; currency: string };

/** Guarda global (sobrevive a re-renders, refetch e navegação SPA). */
const firedKeys = new Set<string>();

function alreadyFired(key: string, persist: boolean) {
  if (firedKeys.has(key)) return true;
  if (persist && typeof window !== "undefined") {
    try {
      if (window.localStorage.getItem(key) === "1") {
        firedKeys.add(key);
        return true;
      }
      window.localStorage.setItem(key, "1");
    } catch {
      /* storage indisponível */
    }
  }
  firedKeys.add(key);
  return false;
}

/** Instala Meta Pixel, GA4, Google Ads e TikTok Pixel e envia eventos normalizados. */
export function TrackingScripts({
  config,
  event,
}: {
  config: TrackingConfig | null | undefined;
  event?: TrackEvent;
}) {
  useEffect(() => {
    if (!config) return;
    const { meta_pixel_id, ga_measurement_id, google_ads_id, google_ads_label, tiktok_pixel_id } = config;
    const path = typeof window !== "undefined" ? window.location.pathname : "";

    if (meta_pixel_id) {
      ensureMeta(meta_pixel_id);
      if (!alreadyFired(`ip_meta_pv_${meta_pixel_id}_${path}`, false)) {
        window.fbq?.("track", "PageView");
      }
    }
    if (ga_measurement_id) ensureGtag(ga_measurement_id);
    if (google_ads_id) ensureGtag(google_ads_id);

    if (tiktok_pixel_id) {
      ensureTikTok(tiktok_pixel_id);
      if (!alreadyFired(`ip_tiktok_pv_${tiktok_pixel_id}_${path}`, false)) {
        tiktokInstance(tiktok_pixel_id)?.page?.();
      }
    }

    if (!event) return;

    const eventId = event.eventId || `${event.type}_${event.id}`;
    const persist = event.type === "Purchase";
    if (alreadyFired(`ip_ev_${event.type}_${eventId}`, persist)) return;

    const eventParams = {
      content_ids: [event.id],
      content_name: event.name,
      content_type: "product",
      value: event.value,
      currency: event.currency,
    };

    if (meta_pixel_id) {
      window.fbq?.(
        "track",
        event.type,
        eventParams,
        { eventID: eventId },
      );
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
        transaction_id: event.type === "Purchase" ? eventId : undefined,
        value: event.value,
        currency: event.currency,
        items: [{ item_id: event.id, item_name: event.name, price: event.value }],
      });
    }

    if (event.type === "Purchase" && google_ads_id && google_ads_label) {
      window.gtag?.("event", "conversion", {
        send_to: `${google_ads_id}/${google_ads_label}`,
        value: event.value,
        currency: event.currency,
        transaction_id: eventId,
      });
    }

    if (tiktok_pixel_id) {
      const tiktokEvent =
        event.type === "Purchase"
          ? "Purchase"
          : event.type === "InitiateCheckout"
            ? "InitiateCheckout"
            : "ViewContent";
      tiktokInstance(tiktok_pixel_id)?.track?.(
        tiktokEvent,
        {
          content_id: event.id,
          content_name: event.name,
          content_type: "product",
          quantity: 1,
          value: event.value,
          currency: event.currency,
        },
        { event_id: eventId },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, event?.type, event?.id, event?.eventId]);

  return null;
}
