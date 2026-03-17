import posthog from "posthog-js";

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ||
  "https://us.i.posthog.com";

export const ANALYTICS_OPT_OUT_KEY = "pftc_analytics_opt_out";

let initialized = false;

export function initAnalytics(): void {
  if (!KEY || initialized) return;
  if (localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true") return;

  posthog.init(KEY, {
    api_host: HOST,
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: false,
    disable_session_recording: true,
    persistence: "memory",
    ip: false,
  });
  initialized = true;
}

export function trackEvent(
  name: string,
  props?: Record<string, unknown>
): void {
  if (!KEY || !initialized) return;
  if (localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true") return;
  try {
    posthog.capture(name, props);
  } catch {}
}

export function setAnalyticsOptOut(optOut: boolean): void {
  if (optOut) {
    localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "true");
    try {
      posthog.opt_out_capturing();
    } catch {}
  } else {
    localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
    try {
      posthog.opt_in_capturing();
    } catch {}
    if (KEY && !initialized) {
      initAnalytics();
    }
  }
}

export function getAnalyticsOptOut(): boolean {
  return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true";
}
