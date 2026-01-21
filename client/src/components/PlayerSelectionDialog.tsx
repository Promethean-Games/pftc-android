import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Users, Check } from "lucide-react";
import { useTournament } from "@/contexts/TournamentContext";

interface PlayerSelectionDialogProps {
  onClose: () => void;
}

export function PlayerSelectionDialog({ onClose }: PlayerSelectionDialogProps) {
  const tournament = useTournament();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setSelectedPlayerIds(tournament.myPlayers.map(p => p.id));
  }, [tournament.myPlayers]);

  const handleTogglePlayer = (playerId: number) => {
    setSelectedPlayerIds(prev => 
      prev.includes(playerId)
        ? prev.filter(id => id !== playerId)
        : [...prev, playerId]
    );
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    await tournament.assignPlayersToDevice(selectedPlayerIds);
    setIsSaving(false);
    onClose();
  };

  const groupedPlayers = tournament.allPlayers.reduce((acc, player) => {
    const group = player.groupName || "Unassigned";
    if (!acc[group]) acc[group] = [];
    acc[group].push(player);
    return acc;
  }, {} as Record<string, typeof tournament.allPlayers>);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Select Your Players</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-muted-foreground mb-4">
            Choose which players you'll be scoring for on this device.
          </p>

          {Object.entries(groupedPlayers).map(([groupName, players]) => (
            <div key={groupName} className="mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">
                {groupName}
              </h3>
              <div className="space-y-2">
                {players.map(player => {
                  const isAssignedToOther = !!(player.deviceId && player.deviceId !== tournament.deviceId);
                  return (
                    <label
                      key={player.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPlayerIds.includes(player.id)
                          ? "bg-primary/10 border-primary"
                          : "hover:bg-muted/50"
                      } ${isAssignedToOther ? "opacity-50" : ""}`}
                    >
                      <Checkbox
                        checked={selectedPlayerIds.includes(player.id)}
                        onCheckedChange={() => handleTogglePlayer(player.id)}
                        disabled={isAssignedToOther}
                        data-testid={`checkbox-player-${player.id}`}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{player.playerName}</p>
                        {isAssignedToOther && (
                          <p className="text-xs text-muted-foreground">
                            Assigned to another device
                          </p>
                        )}
                      </div>
                      {selectedPlayerIds.includes(player.id) && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {tournament.allPlayers.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No players in this tournament yet.
              <br />
              The tournament director needs to add players first.
            </p>
          )}
        </div>

        <div className="p-4 border-t flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="flex-1" 
            onClick={handleConfirm}
            disabled={isSaving}
            data-testid="button-confirm-players"
          >
            {isSaving ? "Saving..." : `Confirm (${selectedPlayerIds.length})`}
          </Button>
        </div>
      </Card>
    </div>
  );
}
