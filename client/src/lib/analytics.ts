import posthog from "posthog-js";

export const ANALYTICS_OPT_OUT_KEY = "pftc_analytics_opt_out";

let initialized = false;
let resolvedKey: string | null = null;

async function resolveKey(): Promise<{ key: string; host: string } | null> {
  const envKey = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (envKey) {
    const envHost =
      (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ||
      "https://us.i.posthog.com";
    return { key: envKey, host: envHost };
  }
  try {
    const res = await fetch("/api/config");
    const data = await res.json();
    if (data.posthogKey) {
      return { key: data.posthogKey, host: data.posthogHost || "https://us.i.posthog.com" };
    }
  } catch {}
  return null;
}

export async function initAnalytics(): Promise<void> {
  if (initialized) return;
  if (localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true") return;

  const config = await resolveKey();
  if (!config) return;

  resolvedKey = config.key;
  posthog.init(config.key, {
    api_host: config.host,
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
  if (!initialized || !resolvedKey) return;
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
  }
}

export function getAnalyticsOptOut(): boolean {
  return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true";
}
