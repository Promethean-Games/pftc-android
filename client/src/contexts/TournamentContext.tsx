import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { TournamentPlayer, LeaderboardEntry } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";

interface TournamentInfo {
  id: number;
  name: string;
  roomCode: string;
  isActive: boolean;
}

interface TournamentContextValue {
  roomCode: string | null;
  tournamentInfo: TournamentInfo | null;
  myPlayers: TournamentPlayer[];
  allPlayers: TournamentPlayer[];
  leaderboard: LeaderboardEntry[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  deviceId: string;
  isDirector: boolean;

  joinRoom: (code: string) => Promise<boolean>;
  leaveRoom: () => void;
  assignPlayersToDevice: (playerIds: number[]) => Promise<void>;
  syncScore: (tournamentPlayerId: number, hole: number, par: number, strokes: number, scratches: number, penalties: number) => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
  verifyDirectorPin: (pin: string) => Promise<boolean>;
  createTournament: (name: string, directorPin: string) => Promise<TournamentInfo | null>;
  addPlayerToTournament: (playerName: string, groupName?: string) => Promise<TournamentPlayer | null>;
  removePlayerFromTournament: (playerId: number) => Promise<void>;
  closeTournament: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

export function useTournament() {
  const context = useContext(TournamentContext);
  if (!context) throw new Error("useTournament must be used within TournamentProvider");
  return context;
}

function getDeviceId(): string {
  let deviceId = localStorage.getItem("deviceId");
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("deviceId", deviceId);
  }
  return deviceId;
}

export function TournamentProvider({ children }: { children: ReactNode }) {
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    return localStorage.getItem("tournamentRoomCode");
  });
  const [tournamentInfo, setTournamentInfo] = useState<TournamentInfo | null>(null);
  const [myPlayers, setMyPlayers] = useState<TournamentPlayer[]>([]);
  const [allPlayers, setAllPlayers] = useState<TournamentPlayer[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirector, setIsDirector] = useState(false);
  const deviceId = getDeviceId();

  const refreshLeaderboard = useCallback(async () => {
    if (!roomCode) return;
    try {
      const response = await fetch(`/api/tournaments/${roomCode}/leaderboard`);
      if (response.ok) {
        const data = await response.json();
        setTournamentInfo(data.tournament);
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error("Failed to refresh leaderboard:", err);
    }
  }, [roomCode]);

  const refreshPlayers = useCallback(async () => {
    if (!roomCode) return;
    try {
      const [allRes, myRes] = await Promise.all([
        fetch(`/api/tournaments/${roomCode}/players`),
        fetch(`/api/tournaments/${roomCode}/my-players?deviceId=${deviceId}`)
      ]);
      if (allRes.ok) {
        setAllPlayers(await allRes.json());
      }
      if (myRes.ok) {
        setMyPlayers(await myRes.json());
      }
    } catch (err) {
      console.error("Failed to refresh players:", err);
    }
  }, [roomCode, deviceId]);

  useEffect(() => {
    if (roomCode) {
      refreshLeaderboard();
      refreshPlayers();
    }
  }, [roomCode, refreshLeaderboard, refreshPlayers]);

  const joinRoom = async (code: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tournaments/${code.toUpperCase()}`);
      if (!response.ok) {
        setError("Tournament not found");
        setIsLoading(false);
        return false;
      }
      const tournament = await response.json();
      if (!tournament.isActive) {
        setError("Tournament has ended");
        setIsLoading(false);
        return false;
      }
      setRoomCode(code.toUpperCase());
      setTournamentInfo(tournament);
      localStorage.setItem("tournamentRoomCode", code.toUpperCase());
      await refreshPlayers();
      await refreshLeaderboard();
      setIsLoading(false);
      return true;
    } catch (err) {
      setError("Failed to join tournament");
      setIsLoading(false);
      return false;
    }
  };

  const leaveRoom = () => {
    setRoomCode(null);
    setTournamentInfo(null);
    setMyPlayers([]);
    setAllPlayers([]);
    setLeaderboard([]);
    setIsDirector(false);
    localStorage.removeItem("tournamentRoomCode");
  };

  const assignPlayersToDevice = async (playerIds: number[]) => {
    if (!roomCode) return;
    try {
      for (const playerId of playerIds) {
        await apiRequest("POST", `/api/tournaments/${roomCode}/players/${playerId}/assign`, { deviceId });
      }
      await refreshPlayers();
    } catch (err) {
      console.error("Failed to assign players:", err);
    }
  };

  const syncScore = async (
    tournamentPlayerId: number,
    hole: number,
    par: number,
    strokes: number,
    scratches: number,
    penalties: number
  ) => {
    if (!roomCode) return;
    try {
      await apiRequest("POST", `/api/tournaments/${roomCode}/scores`, {
        tournamentPlayerId,
        hole,
        par,
        strokes,
        scratches,
        penalties,
      });
    } catch (err) {
      console.error("Failed to sync score:", err);
    }
  };

  const verifyDirectorPin = async (pin: string): Promise<boolean> => {
    if (!roomCode) return false;
    try {
      const response = await apiRequest("POST", `/api/tournaments/${roomCode}/verify-director`, { pin });
      const data = await response.json();
      if (data.isValid) {
        setIsDirector(true);
      }
      return data.isValid;
    } catch (err) {
      return false;
    }
  };

  const createTournament = async (name: string, directorPin: string): Promise<TournamentInfo | null> => {
    try {
      const response = await apiRequest("POST", "/api/tournaments", { name, directorPin });
      const tournament = await response.json();
      setRoomCode(tournament.roomCode);
      setTournamentInfo(tournament);
      setIsDirector(true);
      localStorage.setItem("tournamentRoomCode", tournament.roomCode);
      return tournament;
    } catch (err) {
      setError("Failed to create tournament");
      return null;
    }
  };

  const addPlayerToTournament = async (playerName: string, groupName?: string): Promise<TournamentPlayer | null> => {
    if (!roomCode) return null;
    try {
      const response = await apiRequest("POST", `/api/tournaments/${roomCode}/players`, {
        playerName,
        groupName,
      });
      const player = await response.json();
      await refreshPlayers();
      return player;
    } catch (err) {
      console.error("Failed to add player:", err);
      return null;
    }
  };

  const removePlayerFromTournament = async (playerId: number) => {
    if (!roomCode) return;
    try {
      await apiRequest("DELETE", `/api/tournaments/${roomCode}/players/${playerId}`);
      await refreshPlayers();
      await refreshLeaderboard();
    } catch (err) {
      console.error("Failed to remove player:", err);
    }
  };

  const closeTournament = async () => {
    if (!roomCode) return;
    try {
      await apiRequest("POST", `/api/tournaments/${roomCode}/close`);
      if (tournamentInfo) {
        setTournamentInfo({ ...tournamentInfo, isActive: false });
      }
    } catch (err) {
      console.error("Failed to close tournament:", err);
    }
  };

  return (
    <TournamentContext.Provider
      value={{
        roomCode,
        tournamentInfo,
        myPlayers,
        allPlayers,
        leaderboard,
        isConnected: !!roomCode && !!tournamentInfo,
        isLoading,
        error,
        deviceId,
        isDirector,
        joinRoom,
        leaveRoom,
        assignPlayersToDevice,
        syncScore,
        refreshLeaderboard,
        verifyDirectorPin,
        createTournament,
        addPlayerToTournament,
        removePlayerFromTournament,
        closeTournament,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}
