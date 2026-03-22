import { z } from "zod";

export const playerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  color: z.string(),
  order: z.number(),
});

export type Player = z.infer<typeof playerSchema>;

export const holeScoreSchema = z.object({
  hole: z.number(),
  par: z.number(),
  strokes: z.number(),
  scratches: z.number(),
  penalties: z.number(),
});

export type HoleScore = z.infer<typeof holeScoreSchema>;

export const gameSessionSchema = z.object({
  id: z.string(),
  players: z.array(playerSchema),
  currentHole: z.number(),
  currentPlayerIndex: z.number(),
  scores: z.record(z.string(), z.array(holeScoreSchema)),
  isComplete: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GameSession = z.infer<typeof gameSessionSchema>;

export const insertPlayerSchema = playerSchema.omit({ id: true });
export const insertHoleScoreSchema = holeScoreSchema;
export const insertGameSessionSchema = gameSessionSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertHoleScore = z.infer<typeof insertHoleScoreSchema>;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

export const settingsSchema = z.object({
  theme: z.enum(["light", "dark"]),
  leftHandedMode: z.boolean(),
  autoSave: z.boolean(),
});

export type Settings = z.infer<typeof settingsSchema>;

export const setupTimeSchema = z.object({
  hole: z.number(),
  cardId: z.string(),
  par: z.number(),
  setupTimeMs: z.number(),
  timestamp: z.string(),
});

export type SetupTime = z.infer<typeof setupTimeSchema>;
