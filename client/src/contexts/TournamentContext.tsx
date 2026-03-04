import { type ReactNode } from "react";

interface TournamentContextValue {
  roomCode: string | null;
  tournamentInfo: any;
  myPlayers: any[];
  allPlayers: any[];
  leaderboard: any[];
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  deviceId: string;
  isDirector: boolean;
  directorPin: string | null;
  joinRoom: (code: string, allowInactive?: boolean) => Promise<boolean>;
  leaveRoom: () => void;
  setIsDirector: (value: boolean) => void;
  setDirectorCredentials: (pin: string) => void;
  assignPlayersToDevice: (playerIds: number[]) => Promise<void>;
  syncScore: (tournamentPlayerId: number, hole: number, par: number, strokes: number, scratches: number, penalties: number) => Promise<void>;
  refreshLeaderboard: () => Promise<void>;
  refreshPlayers: () => Promise<void>;
  verifyDirectorPin: (pin: string) => Promise<boolean>;
  createTournament: (name: string, directorPin: string, isHandicapped?: boolean) => Promise<any>;
  addPlayerToTournament: (playerName: string, groupName?: string, universalId?: string, contactInfo?: string) => Promise<any>;
  updatePlayer: (playerId: number, data: Record<string, unknown>) => Promise<any>;
  removePlayerFromTournament: (playerId: number) => Promise<void>;
  closeTournament: () => Promise<void>;
  startTournament: () => Promise<boolean>;
  batchUpdatePlayerGroups: (updates: { playerId: number; groupName: string | null }[]) => Promise<boolean>;
}

const noopAsync = async () => {};

const stubValue: TournamentContextValue = {
  roomCode: null,
  tournamentInfo: null,
  myPlayers: [],
  allPlayers: [],
  leaderboard: [],
  isConnected: false,
  isLoading: false,
  error: null,
  deviceId: "",
  isDirector: false,
  directorPin: null,
  joinRoom: async () => false,
  leaveRoom: () => {},
  setIsDirector: () => {},
  setDirectorCredentials: () => {},
  assignPlayersToDevice: noopAsync,
  syncScore: noopAsync,
  refreshLeaderboard: noopAsync,
  refreshPlayers: noopAsync,
  verifyDirectorPin: async () => false,
  createTournament: async () => null,
  addPlayerToTournament: async () => null,
  updatePlayer: async () => null,
  removePlayerFromTournament: noopAsync,
  closeTournament: noopAsync,
  startTournament: async () => false,
  batchUpdatePlayerGroups: async () => false,
};

export function useTournament(): TournamentContextValue {
  return stubValue;
}

export function TournamentProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
