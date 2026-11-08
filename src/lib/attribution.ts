const ATTRIBUTION_KEYS = [
  "ttclid",
  "gclid",
  "gbraid",
  "wbraid",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
] as const;

type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];

export function captureAttribution() {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    for (const key of ATTRIBUTION_KEYS) {
      const value = params.get(key);
      if (value) window.sessionStorage.setItem(`infropay_attr_${key}`, value);
    }
  } catch {
    // Tracking is optional; storage restrictions must never block checkout.
  }
}

export function readAttribution(): Partial<Record<AttributionKey, string>> {
  if (typeof window === "undefined") return {};
  captureAttribution();
  try {
    const params = new URLSearchParams(window.location.search);
    const values: Partial<Record<AttributionKey, string>> = {};
    for (const key of ATTRIBUTION_KEYS) {
      const value = params.get(key) || window.sessionStorage.getItem(`infropay_attr_${key}`);
      if (value) values[key] = value;
    }
    return values;
  } catch {
    return {};
  }
}
