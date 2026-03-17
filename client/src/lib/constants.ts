export const PLAYER_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#22c55e", // green
  "#f59e0b", // amber
  "#a855f7", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f97316", // orange
];

export const PAR_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

export const MAX_PLAYERS = 8;

export const MAX_HOLES = 18;

export const LOGO_URL = "/splash-logo.png";

export const APP_VERSION = "v3.1.4.0";

// ─── PLAYTESTING_MODE ────────────────────────────────────────────────────────
// Set to false (or remove entirely) when playtesting ends to restore paid access.
// Also revert:
//   • UnlockContext.tsx  — remove the PLAYTESTING_MODE early-return in useState
//   • SplashScreen.tsx   — remove PlaytestBanner import/render; revert feedback button
//   • Delete client/src/components/PlaytestBanner.tsx
// ─────────────────────────────────────────────────────────────────────────────
export const PLAYTESTING_MODE = true;

