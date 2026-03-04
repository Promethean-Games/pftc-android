import type { PlayerProfile, TournamentHistoryEntry } from "./PlayerLoginDialog";

export function PlayerProfilePage(_props: {
  player: PlayerProfile;
  history: TournamentHistoryEntry[];
  playerPin: string;
  onLogout: () => void;
  onBack: () => void;
  onPlayerUpdated?: (player: PlayerProfile) => void;
}) {
  return null;
}
