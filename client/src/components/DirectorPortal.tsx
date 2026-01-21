import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Users, Trophy, Plus, Trash2, RefreshCw, Power } from "lucide-react";
import { useTournament } from "@/contexts/TournamentContext";

interface DirectorPortalProps {
  onClose: () => void;
}

export function DirectorPortal({ onClose }: DirectorPortalProps) {
  const tournament = useTournament();
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerGroup, setNewPlayerGroup] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      tournament.refreshLeaderboard();
    }, 5000);
    return () => clearInterval(interval);
  }, [tournament]);

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    setIsAdding(true);
    await tournament.addPlayerToTournament(newPlayerName.trim(), newPlayerGroup.trim() || undefined);
    setNewPlayerName("");
    setNewPlayerGroup("");
    setIsAdding(false);
  };

  const handleRemovePlayer = async (playerId: number) => {
    await tournament.removePlayerFromTournament(playerId);
  };

  const handleCloseTournament = async () => {
    await tournament.closeTournament();
    setShowConfirmClose(false);
  };

  const groupedPlayers = tournament.allPlayers.reduce((acc, player) => {
    const group = player.groupName || "Unassigned";
    if (!acc[group]) acc[group] = [];
    acc[group].push(player);
    return acc;
  }, {} as Record<string, typeof tournament.allPlayers>);

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b p-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={onClose}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Tournament Director</h1>
              <p className="text-sm text-muted-foreground">
                {tournament.tournamentInfo?.name} • {tournament.roomCode}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => tournament.refreshLeaderboard()}
              data-testid="button-refresh-leaderboard"
            >
              <RefreshCw className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Tournament Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold">{tournament.allPlayers.length}</p>
              <p className="text-xs text-muted-foreground">Players</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold">{Object.keys(groupedPlayers).length}</p>
              <p className="text-xs text-muted-foreground">Groups</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold">
                {tournament.tournamentInfo?.isActive ? "Live" : "Ended"}
              </p>
              <p className="text-xs text-muted-foreground">Status</p>
            </Card>
          </div>

          {/* Add Player */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Player
            </h3>
            <div className="flex gap-2 mb-2">
              <Input
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Player name"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddPlayer();
                }}
                data-testid="input-director-player-name"
              />
              <Input
                value={newPlayerGroup}
                onChange={(e) => setNewPlayerGroup(e.target.value)}
                placeholder="Group (optional)"
                className="w-32"
                data-testid="input-director-player-group"
              />
              <Button
                onClick={handleAddPlayer}
                disabled={isAdding || !newPlayerName.trim()}
                data-testid="button-director-add-player"
              >
                Add
              </Button>
            </div>
          </Card>

          {/* Leaderboard */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Leaderboard
            </h3>
            <div className="space-y-1">
              {tournament.leaderboard.map((entry, index) => (
                <div
                  key={entry.playerId}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  data-testid={`leaderboard-row-${entry.playerId}`}
                >
                  <span className="w-6 text-center font-bold text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{entry.playerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.groupName || "No group"} • {entry.holesCompleted} holes
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold">
                      {entry.relativeToPar > 0 ? "+" : ""}{entry.relativeToPar}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.totalStrokes} strokes
                    </p>
                  </div>
                </div>
              ))}
              {tournament.leaderboard.length === 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No scores yet
                </p>
              )}
            </div>
          </Card>

          {/* Player Management */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              All Players ({tournament.allPlayers.length})
            </h3>
            {Object.entries(groupedPlayers).map(([groupName, players]) => (
              <div key={groupName} className="mb-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">
                  {groupName} ({players.length})
                </h4>
                <div className="space-y-1">
                  {players.map(player => (
                    <div
                      key={player.id}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <span className="flex-1 truncate">{player.playerName}</span>
                      {player.deviceId && (
                        <span className="text-xs text-muted-foreground">
                          Device assigned
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleRemovePlayer(player.id)}
                        data-testid={`button-remove-player-${player.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </Card>

          {/* Tournament Controls */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Power className="w-4 h-4" />
              Tournament Controls
            </h3>
            {showConfirmClose ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to end this tournament? Players will no longer be able to submit scores.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowConfirmClose(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={handleCloseTournament}
                    data-testid="button-confirm-close-tournament"
                  >
                    End Tournament
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowConfirmClose(true)}
                disabled={!tournament.tournamentInfo?.isActive}
                data-testid="button-close-tournament"
              >
                {tournament.tournamentInfo?.isActive ? "End Tournament" : "Tournament Ended"}
              </Button>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
