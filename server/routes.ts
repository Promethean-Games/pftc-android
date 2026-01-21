import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTournamentSchema, insertTournamentPlayerSchema, insertTournamentScoreSchema } from "@shared/schema";
import { z } from "zod";

const createTournamentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  directorPin: z.string().min(1, "Director PIN is required"),
});

const addPlayerSchema = z.object({
  playerName: z.string().min(1, "Player name is required"),
  deviceId: z.string().nullable().optional(),
  groupName: z.string().nullable().optional(),
  universalId: z.string().nullable().optional(),
  contactInfo: z.string().nullable().optional(),
});

const syncScoreSchema = z.object({
  tournamentPlayerId: z.number().int().positive(),
  hole: z.number().int().positive(),
  par: z.number().int().min(0),
  strokes: z.number().int().min(0),
  scratches: z.number().int().min(0).optional(),
  penalties: z.number().int().min(0).optional(),
});

const verifyDirectorSchema = z.object({
  pin: z.string().min(1, "PIN is required"),
});

const assignDeviceSchema = z.object({
  deviceId: z.string().min(1, "Device ID is required"),
});

const batchScoreSchema = z.object({
  scores: z.array(syncScoreSchema),
});

const directorActionSchema = z.object({
  directorPin: z.string().min(1, "Director PIN is required"),
});

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a new tournament room
  app.post("/api/tournaments", async (req, res) => {
    try {
      const parsed = createTournamentSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid request" });
      }

      let roomCode = generateRoomCode();
      let attempts = 0;
      while (await storage.getTournamentByCode(roomCode) && attempts < 10) {
        roomCode = generateRoomCode();
        attempts++;
      }
      if (attempts >= 10 && await storage.getTournamentByCode(roomCode)) {
        return res.status(500).json({ error: "Failed to generate unique room code" });
      }

      const tournament = await storage.createTournament({
        roomCode,
        name: parsed.data.name,
        directorPin: parsed.data.directorPin,
        isActive: true,
      });

      res.json(tournament);
    } catch (error) {
      console.error("Error creating tournament:", error);
      res.status(500).json({ error: "Failed to create tournament" });
    }
  });

  // Get tournament by room code
  app.get("/api/tournaments/:roomCode", async (req, res) => {
    try {
      const tournament = await storage.getTournamentByCode(req.params.roomCode);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      const { directorPin, ...safe } = tournament;
      res.json(safe);
    } catch (error) {
      console.error("Error getting tournament:", error);
      res.status(500).json({ error: "Failed to get tournament" });
    }
  });

  // Verify director PIN
  app.post("/api/tournaments/:roomCode/verify-director", async (req, res) => {
    try {
      const parsed = verifyDirectorSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid request" });
      }
      const isValid = await storage.verifyDirectorPin(req.params.roomCode, parsed.data.pin);
      res.json({ isValid });
    } catch (error) {
      console.error("Error verifying PIN:", error);
      res.status(500).json({ error: "Failed to verify PIN" });
    }
  });

  // Close tournament (director only)
  app.post("/api/tournaments/:roomCode/close", async (req, res) => {
    try {
      const tournament = await storage.getTournamentByCode(req.params.roomCode);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      
      // Verify director PIN
      const { directorPin } = req.body;
      const isDirector = await storage.verifyDirectorPin(req.params.roomCode, directorPin);
      if (!isDirector) {
        return res.status(403).json({ error: "Invalid director credentials" });
      }
      
      await storage.closeTournament(tournament.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error closing tournament:", error);
      res.status(500).json({ error: "Failed to close tournament" });
    }
  });

  // Get players in tournament
  app.get("/api/tournaments/:roomCode/players", async (req, res) => {
    try {
      const tournament = await storage.getTournamentByCode(req.params.roomCode);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      const players = await storage.getPlayersInTournament(tournament.id);
      res.json(players);
    } catch (error) {
      console.error("Error getting players:", error);
      res.status(500).json({ error: "Failed to get players" });
    }
  });

  // Add player to tournament
  app.post("/api/tournaments/:roomCode/players", async (req, res) => {
    try {
      const tournament = await storage.getTournamentByCode(req.params.roomCode);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      const parsed = addPlayerSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid request" });
      }

      const player = await storage.addPlayerToTournament({
        tournamentId: tournament.id,
        playerName: parsed.data.playerName,
        deviceId: parsed.data.deviceId || null,
        groupName: parsed.data.groupName || null,
        universalId: parsed.data.universalId || null,
        contactInfo: parsed.data.contactInfo || null,
      });

      res.json(player);
    } catch (error) {
      console.error("Error adding player:", error);
      res.status(500).json({ error: "Failed to add player" });
    }
  });

  // Assign device to player
  app.post("/api/tournaments/:roomCode/players/:playerId/assign", async (req, res) => {
    try {
      const parsed = assignDeviceSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid request" });
      }
      await storage.assignDeviceToPlayer(parseInt(req.params.playerId), parsed.data.deviceId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error assigning device:", error);
      res.status(500).json({ error: "Failed to assign device" });
    }
  });

  // Get players assigned to this device
  app.get("/api/tournaments/:roomCode/my-players", async (req, res) => {
    try {
      const tournament = await storage.getTournamentByCode(req.params.roomCode);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      const deviceId = req.query.deviceId as string;
      if (!deviceId) {
        return res.status(400).json({ error: "Device ID required" });
      }

      const players = await storage.getPlayersByDevice(tournament.id, deviceId);
      res.json(players);
    } catch (error) {
      console.error("Error getting device players:", error);
      res.status(500).json({ error: "Failed to get players" });
    }
  });

  // Update player info (director only)
  app.patch("/api/tournaments/:roomCode/players/:playerId", async (req, res) => {
    try {
      // Get tournament and verify director PIN
      const tournament = await storage.getTournamentByCode(req.params.roomCode);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      
      const { directorPin, ...playerData } = req.body;
      const isDirector = await storage.verifyDirectorPin(req.params.roomCode, directorPin);
      if (!isDirector) {
        return res.status(403).json({ error: "Invalid director credentials" });
      }
      
      // Verify player belongs to this tournament
      const players = await storage.getPlayersInTournament(tournament.id);
      const playerId = parseInt(req.params.playerId);
      const playerExists = players.some(p => p.id === playerId);
      if (!playerExists) {
        return res.status(404).json({ error: "Player not found in this tournament" });
      }
      
      const parsed = addPlayerSchema.partial().safeParse(playerData);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid request" });
      }
      
      const player = await storage.updatePlayer(playerId, {
        playerName: parsed.data.playerName,
        groupName: parsed.data.groupName,
        universalId: parsed.data.universalId,
        contactInfo: parsed.data.contactInfo,
      });
      res.json(player);
    } catch (error) {
      console.error("Error updating player:", error);
      res.status(500).json({ error: "Failed to update player" });
    }
  });

  // Remove player from tournament (director only)
  app.delete("/api/tournaments/:roomCode/players/:playerId", async (req, res) => {
    try {
      // Get tournament and verify director PIN
      const tournament = await storage.getTournamentByCode(req.params.roomCode);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }
      
      const directorPin = req.query.directorPin as string;
      const isDirector = await storage.verifyDirectorPin(req.params.roomCode, directorPin);
      if (!isDirector) {
        return res.status(403).json({ error: "Invalid director credentials" });
      }
      
      // Verify player belongs to this tournament
      const players = await storage.getPlayersInTournament(tournament.id);
      const playerId = parseInt(req.params.playerId);
      const playerExists = players.some(p => p.id === playerId);
      if (!playerExists) {
        return res.status(404).json({ error: "Player not found in this tournament" });
      }
      
      await storage.removePlayerFromTournament(playerId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing player:", error);
      res.status(500).json({ error: "Failed to remove player" });
    }
  });

  // Update/sync score
  app.post("/api/tournaments/:roomCode/scores", async (req, res) => {
    try {
      const tournament = await storage.getTournamentByCode(req.params.roomCode);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      const parsed = syncScoreSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid request" });
      }

      const score = await storage.upsertScore({
        tournamentPlayerId: parsed.data.tournamentPlayerId,
        hole: parsed.data.hole,
        par: parsed.data.par,
        strokes: parsed.data.strokes,
        scratches: parsed.data.scratches || 0,
        penalties: parsed.data.penalties || 0,
      });

      res.json(score);
    } catch (error) {
      console.error("Error syncing score:", error);
      res.status(500).json({ error: "Failed to sync score" });
    }
  });

  // Get leaderboard
  app.get("/api/tournaments/:roomCode/leaderboard", async (req, res) => {
    try {
      const tournament = await storage.getTournamentByCode(req.params.roomCode);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      const leaderboard = await storage.getLeaderboard(tournament.id);
      res.json({
        tournament: {
          id: tournament.id,
          name: tournament.name,
          roomCode: tournament.roomCode,
          isActive: tournament.isActive,
        },
        leaderboard,
      });
    } catch (error) {
      console.error("Error getting leaderboard:", error);
      res.status(500).json({ error: "Failed to get leaderboard" });
    }
  });

  // Batch sync multiple scores at once
  app.post("/api/tournaments/:roomCode/scores/batch", async (req, res) => {
    try {
      const tournament = await storage.getTournamentByCode(req.params.roomCode);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
      }

      const parsed = batchScoreSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.errors[0]?.message || "Invalid request" });
      }

      const results = [];
      for (const score of parsed.data.scores) {
        const saved = await storage.upsertScore({
          tournamentPlayerId: score.tournamentPlayerId,
          hole: score.hole,
          par: score.par,
          strokes: score.strokes,
          scratches: score.scratches || 0,
          penalties: score.penalties || 0,
        });
        results.push(saved);
      }

      res.json(results);
    } catch (error) {
      console.error("Error batch syncing scores:", error);
      res.status(500).json({ error: "Failed to batch sync scores" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
