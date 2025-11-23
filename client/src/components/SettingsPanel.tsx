import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import type { Settings } from "@shared/schema";

interface SettingsPanelProps {
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onClose: () => void;
  onEndGame: () => void;
}

export function SettingsPanel({ settings, onUpdateSettings, onClose, onEndGame }: SettingsPanelProps) {
  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Settings</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-settings"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="space-y-4">
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

          <Card className="p-4">
            <h3 className="font-semibold mb-3">About</h3>
            <p className="text-sm text-muted-foreground mb-2">Par for the Course</p>
            <p className="text-xs text-muted-foreground">Version 2.0.0</p>
          </Card>
        </div>

        <div className="mt-8">
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
  );
}
