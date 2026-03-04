export interface PlayerProfile {
  id: number;
  uniqueCode: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  tShirtSize: string | null;
  contactInfo: string | null;
  handicap: string;
  isProvisional: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TournamentHistoryEntry {
  id: number;
  universalPlayerId: number;
  tournamentName: string;
  courseName: string | null;
  totalStrokes: number;
  totalPar: number;
  relativeToPar: number;
  holesPlayed: number;
  totalScratches: number | null;
  totalPenalties: number | null;
  completedAt: string;
}

export function PlayerLoginDialog(_props: { isOpen: boolean; onClose: () => void; onLoginSuccess: (player: PlayerProfile, history: TournamentHistoryEntry[], pin: string) => void }) {
  return null;
}
