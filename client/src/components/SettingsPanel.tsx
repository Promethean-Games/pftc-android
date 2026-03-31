import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, UserMinus, Home } from "lucide-react";
import type { Settings, Player } from "@shared/schema";
import { getAnalyticsOptOut, setAnalyticsOptOut } from "@/lib/analytics";
import OneSignal from "react-onesignal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SettingsPanelProps {
  settings: Settings;
  players: Player[];
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onAddPlayer: (name: string, position?: number) => void;
  onDropPlayer: (id: string) => void;
  onEndGame: () => void;
  onHome?: () => void;
  onLogout?: () => void;
  viewOnly?: boolean;
  isGameOver?: boolean;
}

export function SettingsPanel({ settings, players, onUpdateSettings, onAddPlayer, onDropPlayer, onEndGame, onHome, onLogout, viewOnly = false, isGameOver = false }: SettingsPanelProps) {
  const [newPlayerName, setNewPlayerName] = useState("");
  const [insertPosition, setInsertPosition] = useState<string>("end");
  const [analyticsOptOut, setAnalyticsOptOutState] = useState(() => getAnalyticsOptOut());
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>("default");
  const [dropTarget, setDropTarget] = useState<string>("");

  useEffect(() => {
    if ("Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  const handleAnalyticsToggle = (enabled: boolean) => {
    setAnalyticsOptOut(!enabled);
    setAnalyticsOptOutState(!enabled);
  };

  const handleNotifToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        await OneSignal.Slidedown.promptPush();
        if ("Notification" in window) setNotifPermission(Notification.permission);
      } catch {
        // User dismissed or browser blocked
      }
    } else {
      try {
        await OneSignal.User.PushSubscription.optOut();
        setNotifPermission("denied");
      } catch {
        // Silently ignore
      }
    }
  };

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
          {!isGameOver && (
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
          )}

          {!isGameOver && players.length > 1 && (
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <UserMinus className="w-4 h-4" />
              Drop Player
            </h3>
            <div className="flex gap-2">
              <Select value={dropTarget} onValueChange={setDropTarget}>
                <SelectTrigger className="flex-1" data-testid="select-settings-drop-player">
                  <SelectValue placeholder="Select player to drop…" />
                </SelectTrigger>
                <SelectContent>
                  {players.map((player) => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    disabled={!dropTarget}
                    data-testid="button-settings-drop-player"
                  >
                    Drop
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Drop {players.find((p) => p.id === dropTarget)?.name ?? "player"}?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      They will be removed from the active roster and won't play any further holes. Their scores to date will be kept, but future holes will show no score for them. This may affect their analytics.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel data-testid="button-drop-player-cancel">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        onDropPlayer(dropTarget);
                        setDropTarget("");
                      }}
                      data-testid="button-drop-player-confirm"
                    >
                      Drop Player
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Scores to date are preserved — only future holes are affected.
            </p>
          </Card>
          )}

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

            <div className="flex items-center justify-between py-3 border-b">
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

            <div className="flex items-center justify-between py-3 border-b">
              <Label htmlFor="analytics-toggle" className="flex-1">
                <div className="font-medium">Help Improve the App</div>
                <div className="text-sm text-muted-foreground">Send anonymous usage data to help us improve</div>
              </Label>
              <Switch
                id="analytics-toggle"
                checked={!analyticsOptOut}
                onCheckedChange={handleAnalyticsToggle}
                data-testid="switch-analytics"
              />
            </div>

            {"Notification" in window && (
              <div className="flex items-center justify-between py-3">
                <Label htmlFor="notif-toggle" className="flex-1">
                  <div className="font-medium">Push Notifications</div>
                  <div className="text-sm text-muted-foreground">
                    {notifPermission === "denied"
                      ? "Blocked by browser — enable in device settings"
                      : "Get notified about new courses and updates"}
                  </div>
                </Label>
                <Switch
                  id="notif-toggle"
                  checked={notifPermission === "granted"}
                  disabled={notifPermission === "denied"}
                  onCheckedChange={handleNotifToggle}
                  data-testid="switch-notifications"
                />
              </div>
            )}
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="w-full"
                  data-testid="button-end-game"
                >
                  End Game
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End the game?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will finish the current round and take you to the summary screen. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-end-game-cancel">
                    Keep Playing
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onEndGame}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-end-game-confirm"
                  >
                    End Game
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}
