import {
  tournaments,
  tournamentPlayers,
  tournamentScores,
  type Tournament,
  type InsertTournament,
  type TournamentPlayer,
  type InsertTournamentPlayer,
  type TournamentScore,
  type InsertTournamentScore,
  type LeaderboardEntry,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql, desc } from "drizzle-orm";

export interface IStorage {
  // Tournament operations
  createTournament(tournament: InsertTournament): Promise<Tournament>;
  getAllTournaments(): Promise<Tournament[]>;
  getTournamentByCode(roomCode: string): Promise<Tournament | undefined>;
  getTournament(id: number): Promise<Tournament | undefined>;
  closeTournament(id: number): Promise<void>;
  startTournament(id: number): Promise<void>;
  deleteTournament(id: number): Promise<void>;
  verifyDirectorPin(roomCode: string, pin: string): Promise<boolean>;
  getTournamentBackup(tournamentId: number): Promise<{ tournament: Tournament; players: TournamentPlayer[]; scores: TournamentScore[] }>;

  // Tournament player operations
  addPlayerToTournament(player: InsertTournamentPlayer): Promise<TournamentPlayer>;
  getPlayersInTournament(tournamentId: number): Promise<TournamentPlayer[]>;
  getPlayersByDevice(tournamentId: number, deviceId: string): Promise<TournamentPlayer[]>;
  assignDeviceToPlayer(playerId: number, deviceId: string): Promise<void>;
  updatePlayer(playerId: number, data: Partial<Pick<TournamentPlayer, "playerName" | "groupName" | "universalId" | "contactInfo">>): Promise<TournamentPlayer>;
  removePlayerFromTournament(playerId: number): Promise<void>;

  // Score operations
  upsertScore(score: InsertTournamentScore): Promise<TournamentScore>;
  getPlayerScores(tournamentPlayerId: number): Promise<TournamentScore[]>;
  getLeaderboard(tournamentId: number): Promise<LeaderboardEntry[]>;
}

export class DatabaseStorage implements IStorage {
  async createTournament(tournament: InsertTournament): Promise<Tournament> {
    const [created] = await db.insert(tournaments).values(tournament).returning();
    return created;
  }

  async getAllTournaments(): Promise<Tournament[]> {
    return db.select().from(tournaments).orderBy(desc(tournaments.createdAt));
  }

  async getTournamentByCode(roomCode: string): Promise<Tournament | undefined> {
    const [tournament] = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.roomCode, roomCode.toUpperCase()));
    return tournament || undefined;
  }

  async getTournament(id: number): Promise<Tournament | undefined> {
    const [tournament] = await db.select().from(tournaments).where(eq(tournaments.id, id));
    return tournament || undefined;
  }

  async closeTournament(id: number): Promise<void> {
    await db.update(tournaments).set({ isActive: false }).where(eq(tournaments.id, id));
  }

  async startTournament(id: number): Promise<void> {
    await db.update(tournaments).set({ isStarted: true }).where(eq(tournaments.id, id));
  }

  async deleteTournament(id: number): Promise<void> {
    const players = await this.getPlayersInTournament(id);
    for (const player of players) {
      await db.delete(tournamentScores).where(eq(tournamentScores.tournamentPlayerId, player.id));
    }
    await db.delete(tournamentPlayers).where(eq(tournamentPlayers.tournamentId, id));
    await db.delete(tournaments).where(eq(tournaments.id, id));
  }

  async verifyDirectorPin(roomCode: string, pin: string): Promise<boolean> {
    const tournament = await this.getTournamentByCode(roomCode);
    return tournament?.directorPin === pin;
  }

  async getTournamentBackup(tournamentId: number): Promise<{ tournament: Tournament; players: TournamentPlayer[]; scores: TournamentScore[] }> {
    const tournament = await this.getTournament(tournamentId);
    if (!tournament) {
      throw new Error("Tournament not found");
    }
    const players = await this.getPlayersInTournament(tournamentId);
    const scores: TournamentScore[] = [];
    for (const player of players) {
      const playerScores = await this.getPlayerScores(player.id);
      scores.push(...playerScores);
    }
    return { tournament, players, scores };
  }

  async addPlayerToTournament(player: InsertTournamentPlayer): Promise<TournamentPlayer> {
    const [created] = await db.insert(tournamentPlayers).values(player).returning();
    return created;
  }

  async getPlayersInTournament(tournamentId: number): Promise<TournamentPlayer[]> {
    return db
      .select()
      .from(tournamentPlayers)
      .where(eq(tournamentPlayers.tournamentId, tournamentId));
  }

  async getPlayersByDevice(tournamentId: number, deviceId: string): Promise<TournamentPlayer[]> {
    return db
      .select()
      .from(tournamentPlayers)
      .where(
        and(
          eq(tournamentPlayers.tournamentId, tournamentId),
          eq(tournamentPlayers.deviceId, deviceId)
        )
      );
  }

  async assignDeviceToPlayer(playerId: number, deviceId: string): Promise<void> {
    await db
      .update(tournamentPlayers)
      .set({ deviceId })
      .where(eq(tournamentPlayers.id, playerId));
  }

  async updatePlayer(playerId: number, data: Partial<Pick<TournamentPlayer, "playerName" | "groupName" | "universalId" | "contactInfo">>): Promise<TournamentPlayer> {
    const updateData: Record<string, string | null | undefined> = {};
    if (data.playerName !== undefined) updateData.playerName = data.playerName;
    if (data.groupName !== undefined) updateData.groupName = data.groupName;
    if (data.universalId !== undefined) updateData.universalId = data.universalId;
    if (data.contactInfo !== undefined) updateData.contactInfo = data.contactInfo;
    
    const [updated] = await db
      .update(tournamentPlayers)
      .set(updateData)
      .where(eq(tournamentPlayers.id, playerId))
      .returning();
    return updated;
  }

  async removePlayerFromTournament(playerId: number): Promise<void> {
    await db.delete(tournamentScores).where(eq(tournamentScores.tournamentPlayerId, playerId));
    await db.delete(tournamentPlayers).where(eq(tournamentPlayers.id, playerId));
  }

  async upsertScore(score: InsertTournamentScore): Promise<TournamentScore> {
    const existing = await db
      .select()
      .from(tournamentScores)
      .where(
        and(
          eq(tournamentScores.tournamentPlayerId, score.tournamentPlayerId),
          eq(tournamentScores.hole, score.hole)
        )
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(tournamentScores)
        .set({
          par: score.par,
          strokes: score.strokes,
          scratches: score.scratches,
          penalties: score.penalties,
        })
        .where(eq(tournamentScores.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(tournamentScores).values(score).returning();
    return created;
  }

  async getPlayerScores(tournamentPlayerId: number): Promise<TournamentScore[]> {
    return db
      .select()
      .from(tournamentScores)
      .where(eq(tournamentScores.tournamentPlayerId, tournamentPlayerId));
  }

  async getLeaderboard(tournamentId: number): Promise<LeaderboardEntry[]> {
    const players = await this.getPlayersInTournament(tournamentId);
    const leaderboard: LeaderboardEntry[] = [];

    for (const player of players) {
      const scores = await this.getPlayerScores(player.id);
      const totalStrokes = scores.reduce((sum, s) => sum + s.strokes + s.scratches + s.penalties, 0);
      const totalPar = scores.reduce((sum, s) => sum + s.par, 0);

      leaderboard.push({
        playerId: player.id,
        playerName: player.playerName,
        groupName: player.groupName,
        totalStrokes,
        totalPar,
        holesCompleted: scores.length,
        relativeToPar: totalStrokes - totalPar,
      });
    }

    return leaderboard.sort((a, b) => {
      if (a.holesCompleted !== b.holesCompleted) {
        return b.holesCompleted - a.holesCompleted;
      }
      return a.relativeToPar - b.relativeToPar;
    });
  }
}

export const storage = new DatabaseStorage();
