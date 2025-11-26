import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Save, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GameSession } from "@shared/schema";

interface SaveLoadDialogProps {
  mode: "save" | "load";
  savedGames: Record<string, GameSession>;
  onSave?: (slot: string) => void;
  onLoad?: (slot: string) => void;
  onClose: () => void;
}

export function SaveLoadDialog({ mode, savedGames, onSave, onLoad, onClose }: SaveLoadDialogProps) {
  const [customSlot, setCustomSlot] = useState("");
  const { toast } = useToast();

  const slots = ["Slot 1", "Slot 2", "Slot 3"];

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      <div className="p-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{mode === "save" ? "Save Game" : "Load Game"}</h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-dialog"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="space-y-3">
          {mode === "save" && (
            <Card className="p-4">
              <Label className="text-sm font-medium mb-2 block">Custom Save Name</Label>
              <div className="flex gap-2">
                <Input
                  value={customSlot}
                  onChange={(e) => setCustomSlot(e.target.value)}
                  placeholder="Enter save name"
                  data-testid="input-save-name"
                />
                <Button
                  onClick={() => {
                    if (customSlot.trim() && onSave) {
                      onSave(customSlot.trim());
                      toast({ title: "Game Saved", description: `Saved to "${customSlot.trim()}"` });
                      setCustomSlot("");
                      onClose();
                    }
                  }}
                  disabled={!customSlot.trim()}
                  data-testid="button-save-custom"
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          )}

          {slots.map((slot) => {
            const savedGame = savedGames[slot];
            const isEmpty = !savedGame;

            return (
              <Card key={slot} className="p-4" data-testid={`slot-${slot}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{slot}</h3>
                  {!isEmpty && (
                    <span className="text-xs text-muted-foreground">
                      {new Date(savedGame.updatedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                {isEmpty ? (
                  <Button
                    variant="outline"
                    className="w-full h-14"
                    onClick={() => {
                      if (mode === "save") {
                        onSave?.(slot);
                        toast({ title: "Game Saved", description: `Saved to ${slot}` });
                        onClose();
                      }
                    }}
                    disabled={mode === "load"}
                    data-testid={`button-${mode}-${slot}`}
                  >
                    {mode === "save" ? "Save Here" : "Empty Slot"}
                  </Button>
                ) : (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {savedGame.players.length} players • Hole {savedGame.currentHole}
                    </p>
                    <Button
                      className="w-full h-12"
                      onClick={() => {
                        if (mode === "save") {
                          onSave?.(slot);
                          toast({ title: "Game Overwritten", description: `Overwrote ${slot}` });
                          onClose();
                        } else {
                          onLoad?.(slot);
                          toast({ title: "Game Loaded", description: `Loaded from ${slot}` });
                          onClose();
                        }
                      }}
                      data-testid={`button-${mode}-${slot}`}
                    >
                      {mode === "save" ? (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Overwrite
                        </>
                      ) : (
                        <>
                          <FolderOpen className="w-4 h-4 mr-2" />
                          Load
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}
