import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Home, Shield } from "lucide-react";
import type { Settings, Player } from "@shared/schema";

interface SettingsPanelProps {
  settings: Settings;
  players: Player[];
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onAddPlayer: (name: string, position?: number) => void;
  onEndGame: () => void;
  onHome?: () => void;
  onLogout?: () => void;
  viewOnly?: boolean;
  onShowPrivacy?: () => void;
}

export function SettingsPanel({ settings, players, onUpdateSettings, onAddPlayer, onEndGame, onHome, onLogout, viewOnly = false, onShowPrivacy }: SettingsPanelProps) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [insertPosition, setInsertPosition] = useState<string>("end");

  const handleAddPlayer = () => {
    const name = newPlayerName.trim() || `Player ${players.length + 1}`;
    const position = insertPosition === "end" ? undefined : parseInt(insertPosition);
    onAddPlayer(name, position);
    setNewPlayerName("");
    setInsertPosition("end");
  };

  return (
    <div className="flex flex-col min-h-screen pb-16">
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <h2 
            className="text-2xl font-bold cursor-default select-none" 
            data-testid="text-settings-title"
          >
            Settings
          </h2>
        </div>

        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <UserPlus className="w-4 h-4" />
              Add Player
            </h3>
            <div className="flex gap-2">
              <Input
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                placeholder="Player name"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddPlayer();
                }}
                data-testid="input-settings-new-player"
              />
              <Select value={insertPosition} onValueChange={setInsertPosition}>
                <SelectTrigger className="w-28" data-testid="select-settings-position">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="end">At End</SelectItem>
                  {players.map((player, index) => (
                    <SelectItem key={player.id} value={index.toString()}>
                      Before {index + 1}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddPlayer}
                data-testid="button-settings-add-player"
              >
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Current players: {players.length}
            </p>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold mb-4">Display</h3>
            
            <div className="flex items-center justify-between py-3 border-b">
              <Label htmlFor="theme-toggle" className="flex-1">
                <div className="font-medium">Dark Theme</div>
                <div className="text-sm text-muted-foreground">Use dark mode for better outdoor visibility</div>
              </Label>
              <Switch
                id="theme-toggle"
                checked={settings.theme === "dark"}
                onCheckedChange={(checked) => onUpdateSettings({ theme: checked ? "dark" : "light" })}
                data-testid="switch-theme"
              />
            </div>

            <div className="flex items-center justify-between py-3">
              <Label htmlFor="left-handed-toggle" className="flex-1">
                <div className="font-medium">Left-Handed Mode</div>
                <div className="text-sm text-muted-foreground">Optimized layout for left-handed use</div>
              </Label>
              <Switch
                id="left-handed-toggle"
                checked={settings.leftHandedMode}
                onCheckedChange={(checked) => onUpdateSettings({ leftHandedMode: checked })}
                data-testid="switch-left-handed"
              />
            </div>
          </Card>

          {!viewOnly && (
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Game</h3>
              
              <div className="flex items-center justify-between py-3">
                <Label htmlFor="autosave-toggle" className="flex-1">
                  <div className="font-medium">Auto-Save</div>
                  <div className="text-sm text-muted-foreground">Automatically save game progress</div>
                </Label>
                <Switch
                  id="autosave-toggle"
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => onUpdateSettings({ autoSave: checked })}
                  data-testid="switch-autosave"
                />
              </div>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="font-semibold mb-3">About</h3>
            <p className="text-sm text-muted-foreground mb-2">Par for the Course</p>
            <p className="text-xs text-muted-foreground mb-3">Version 2.1.0</p>
            {onShowPrivacy && (
              <Button
                variant="ghost"
                className="w-full justify-start text-muted-foreground"
                onClick={onShowPrivacy}
                data-testid="button-settings-privacy"
              >
                <Shield className="w-4 h-4 mr-2" />
                Privacy Policy & Terms
              </Button>
            )}
          </Card>

          <div className="pt-4 space-y-3">
            {onHome && (
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={onHome}
                data-testid="button-home"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
            )}
            <Button
              variant="destructive"
              className="w-full h-12"
              onClick={onEndGame}
              data-testid="button-end-game"
            >
              End Game
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
