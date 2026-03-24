// ─── Google Play Games Services — Web Bridge ────────────────────────────────
// window.PlayGames is injected by the Android WebView via addJavascriptInterface.
// All calls are safe no-ops when running outside the Android wrapper.

export const ACHIEVEMENT_IDS = {
  OFF_THE_TEE:    "achievement_off_the_tee",
  FRONT_NINE:     "achievement_front_nine",
  FULL_ROUND:     "achievement_full_round",
  BIRDIE:         "achievement_birdie",
  EAGLE:          "achievement_eagle",
  ACE:            "achievement_ace",
  BOGEY_FREE:     "achievement_bogey_free",
  TOUR_CHAMPION:  "achievement_tour_champion",
  SCRATCH_GOLFER: "achievement_scratch_golfer",
  CUEMASTER:      "achievement_cuemaster",
  TABLE_READ:     "achievement_table_read",
} as const;

export type AchievementId = typeof ACHIEVEMENT_IDS[keyof typeof ACHIEVEMENT_IDS];

declare global {
  interface Window {
    PlayGames?: {
      unlockAchievement: (achievementId: string) => void;
      incrementAchievement: (achievementId: string, steps: number) => void;
    };
  }
}

export function unlockAchievement(id: AchievementId): void {
  try {
    window.PlayGames?.unlockAchievement(id);
  } catch {
    // Not in Android context — silently ignored
  }
}

export function incrementAchievement(id: AchievementId, steps = 1): void {
  try {
    window.PlayGames?.incrementAchievement(id, steps);
  } catch {
    // Not in Android context — silently ignored
  }
}

// Fire score-based achievements for a single hole
export function checkHoleScoreAchievements(totalStrokes: number, par: number): void {
  if (par <= 0 || totalStrokes <= 0) return;
  const diff = totalStrokes - par; // negative = under par
  if (diff <= -1) unlockAchievement(ACHIEVEMENT_IDS.BIRDIE);
  if (diff <= -2) unlockAchievement(ACHIEVEMENT_IDS.EAGLE);
  if (diff <= -3) unlockAchievement(ACHIEVEMENT_IDS.ACE);
}

// Fire round-end achievements for a single player's complete 18-hole card
export function checkRoundAchievements(
  holeScores: Array<{ strokes: number; par: number; scratches: number; penalties: number }>,
): void {
  if (holeScores.length < 18) return;
  const totalPar     = holeScores.reduce((s, h) => s + h.par, 0);
  const totalStrokes = holeScores.reduce((s, h) => s + h.strokes + h.scratches + h.penalties, 0);
  const net          = totalStrokes - totalPar;
  const hasBogey     = holeScores.some((h) => h.strokes + h.scratches + h.penalties > h.par);

  if (!hasBogey)  unlockAchievement(ACHIEVEMENT_IDS.BOGEY_FREE);
  if (net <= 0)   unlockAchievement(ACHIEVEMENT_IDS.TOUR_CHAMPION);
  if (net === 0)  unlockAchievement(ACHIEVEMENT_IDS.SCRATCH_GOLFER);
}
