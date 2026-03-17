export const ANALYTICS_OPT_OUT_KEY = "pftc_analytics_opt_out";
const SESSION_KEY = "pftc_session_id";

function getSessionId(): string {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    return "anonymous";
  }
}

export function initAnalytics(): void {
}

export function trackEvent(
  name: string,
  props?: Record<string, unknown>
): void {
  try {
    if (localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true") return;
  } catch {}

  const sessionId = getSessionId();

  fetch("/api/analytics/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: name, properties: props, sessionId }),
  }).catch(() => {});
}

export function setAnalyticsOptOut(optOut: boolean): void {
  try {
    if (optOut) {
      localStorage.setItem(ANALYTICS_OPT_OUT_KEY, "true");
    } else {
      localStorage.removeItem(ANALYTICS_OPT_OUT_KEY);
    }
  } catch {}
}

export function getAnalyticsOptOut(): boolean {
  try {
    return localStorage.getItem(ANALYTICS_OPT_OUT_KEY) === "true";
  } catch {
    return false;
  }
}
