import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Tournament/Room table - for live leaderboard sync
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  roomCode: text("room_code").notNull().unique(),
  name: text("name").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  directorPin: text("director_pin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tournamentsRelations = relations(tournaments, ({ many }) => ({
  players: many(tournamentPlayers),
}));

// Tournament players - players registered to a tournament
export const tournamentPlayers = pgTable("tournament_players", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").notNull().references(() => tournaments.id),
  playerName: text("player_name").notNull(),
  deviceId: text("device_id"),
  groupName: text("group_name"),
  universalId: text("universal_id"),
  contactInfo: text("contact_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tournamentPlayersRelations = relations(tournamentPlayers, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [tournamentPlayers.tournamentId],
    references: [tournaments.id],
  }),
  scores: many(tournamentScores),
}));

// Tournament scores - synced scores for leaderboard
export const tournamentScores = pgTable("tournament_scores", {
  id: serial("id").primaryKey(),
  tournamentPlayerId: integer("tournament_player_id").notNull().references(() => tournamentPlayers.id),
  hole: integer("hole").notNull(),
  par: integer("par").notNull(),
  strokes: integer("strokes").notNull(),
  scratches: integer("scratches").notNull().default(0),
  penalties: integer("penalties").notNull().default(0),
});

export const tournamentScoresRelations = relations(tournamentScores, ({ one }) => ({
  player: one(tournamentPlayers, {
    fields: [tournamentScores.tournamentPlayerId],
    references: [tournamentPlayers.id],
  }),
}));

// Insert schemas for database operations
export const insertTournamentSchema = createInsertSchema(tournaments).omit({ id: true, createdAt: true });
export const insertTournamentPlayerSchema = createInsertSchema(tournamentPlayers).omit({ id: true, createdAt: true });
export const insertTournamentScoreSchema = createInsertSchema(tournamentScores).omit({ id: true });

// Types from database
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type TournamentPlayer = typeof tournamentPlayers.$inferSelect;
export type InsertTournamentPlayer = z.infer<typeof insertTournamentPlayerSchema>;
export type TournamentScore = typeof tournamentScores.$inferSelect;
export type InsertTournamentScore = z.infer<typeof insertTournamentScoreSchema>;

// Zod schemas for local game state (not stored in DB - kept in localStorage)
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
  par: z.number(),
  setupTimeMs: z.number(),
  timestamp: z.string(),
});

export type SetupTime = z.infer<typeof setupTimeSchema>;

// Leaderboard entry type for API responses
export const leaderboardEntrySchema = z.object({
  playerId: z.number(),
  playerName: z.string(),
  groupName: z.string().nullable(),
  totalStrokes: z.number(),
  totalPar: z.number(),
  holesCompleted: z.number(),
  relativeToPar: z.number(),
});

export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
