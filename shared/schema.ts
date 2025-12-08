import { z } from "zod";

// Player schema
export const playerSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  color: z.string(),
  order: z.number(),
});

export type Player = z.infer<typeof playerSchema>;

// Hole score schema
export const holeScoreSchema = z.object({
  hole: z.number(),
  par: z.number(),
  strokes: z.number(),
  scratches: z.number(),
  penalties: z.number(),
});

export type HoleScore = z.infer<typeof holeScoreSchema>;

// Game session schema
export const gameSessionSchema = z.object({
  id: z.string(),
  players: z.array(playerSchema),
  currentHole: z.number(),
  currentPlayerIndex: z.number(),
  scores: z.record(z.string(), z.array(holeScoreSchema)), // playerId -> hole scores
  isComplete: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GameSession = z.infer<typeof gameSessionSchema>;

// Insert schemas
export const insertPlayerSchema = playerSchema.omit({ id: true });
export const insertHoleScoreSchema = holeScoreSchema;
export const insertGameSessionSchema = gameSessionSchema.omit({ id: true, createdAt: true, updatedAt: true });

export type InsertPlayer = z.infer<typeof insertPlayerSchema>;
export type InsertHoleScore = z.infer<typeof insertHoleScoreSchema>;
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;

// Settings schema
export const settingsSchema = z.object({
  theme: z.enum(["light", "dark"]),
  leftHandedMode: z.boolean(),
  autoSave: z.boolean(),
});

export type Settings = z.infer<typeof settingsSchema>;

// Setup time tracking schema (for analytics)
export const setupTimeSchema = z.object({
  hole: z.number(),
  par: z.number(),
  setupTimeMs: z.number(), // Time in milliseconds from draw confirm to table ready
  timestamp: z.string(),
});

export type SetupTime = z.infer<typeof setupTimeSchema>;
