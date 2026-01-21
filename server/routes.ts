import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTournamentSchema, insertTournamentPlayerSchema, insertTournamentScoreSchema } from "@shared/schema";
import { z } from "zod";

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
      const { name, directorPin } = req.body;
      if (!name || !directorPin) {
        return res.status(400).json({ error: "Name and director PIN are required" });
      }

      let roomCode = generateRoomCode();
      let attempts = 0;
      while (await storage.getTournamentByCode(roomCode) && attempts < 10) {
        roomCode = generateRoomCode();
        attempts++;
      }

      const tournament = await storage.createTournament({
        roomCode,
        name,
        directorPin,
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
      const { pin } = req.body;
      const isValid = await storage.verifyDirectorPin(req.params.roomCode, pin);
      res.json({ isValid });
    } catch (error) {
      console.error("Error verifying PIN:", error);
      res.status(500).json({ error: "Failed to verify PIN" });
    }
  });

  // Close tournament
  app.post("/api/tournaments/:roomCode/close", async (req, res) => {
    try {
      const tournament = await storage.getTournamentByCode(req.params.roomCode);
      if (!tournament) {
        return res.status(404).json({ error: "Tournament not found" });
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

      const { playerName, deviceId, groupName } = req.body;
      if (!playerName) {
        return res.status(400).json({ error: "Player name is required" });
      }

      const player = await storage.addPlayerToTournament({
        tournamentId: tournament.id,
        playerName,
        deviceId: deviceId || null,
        groupName: groupName || null,
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
      const { deviceId } = req.body;
      await storage.assignDeviceToPlayer(parseInt(req.params.playerId), deviceId);
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

  // Remove player from tournament
  app.delete("/api/tournaments/:roomCode/players/:playerId", async (req, res) => {
    try {
      await storage.removePlayerFromTournament(parseInt(req.params.playerId));
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

      const { tournamentPlayerId, hole, par, strokes, scratches, penalties } = req.body;
      if (!tournamentPlayerId || hole === undefined) {
        return res.status(400).json({ error: "Player ID and hole are required" });
      }

      const score = await storage.upsertScore({
        tournamentPlayerId,
        hole,
        par: par || 0,
        strokes: strokes || 0,
        scratches: scratches || 0,
        penalties: penalties || 0,
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

      const { scores } = req.body;
      if (!Array.isArray(scores)) {
        return res.status(400).json({ error: "Scores array required" });
      }

      const results = [];
      for (const score of scores) {
        const saved = await storage.upsertScore({
          tournamentPlayerId: score.tournamentPlayerId,
          hole: score.hole,
          par: score.par || 0,
          strokes: score.strokes || 0,
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
