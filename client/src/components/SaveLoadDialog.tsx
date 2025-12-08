import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Save, FolderOpen, Pencil, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GameSession } from "@shared/schema";

interface SaveLoadDialogProps {
  mode: "save" | "load";
  savedGames: Record<string, GameSession>;
  onSave?: (slot: string) => void;
  onLoad?: (slot: string) => void;
  onRename?: (oldSlot: string, newSlot: string) => void;
  onClose: () => void;
}

export function SaveLoadDialog({ mode, savedGames, onSave, onLoad, onRename, onClose }: SaveLoadDialogProps) {
  const [customSlot, setCustomSlot] = useState("");
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const { toast } = useToast();

  const defaultSlots = ["Slot 1", "Slot 2", "Slot 3"];
  
  // Combine default slots with any custom saves
  const allSlotNames = new Set([...defaultSlots, ...Object.keys(savedGames)]);
  const slots = Array.from(allSlotNames).sort((a, b) => {
    // Keep default slots first in order
    const aDefault = defaultSlots.indexOf(a);
    const bDefault = defaultSlots.indexOf(b);
    if (aDefault !== -1 && bDefault !== -1) return aDefault - bDefault;
    if (aDefault !== -1) return -1;
    if (bDefault !== -1) return 1;
    return a.localeCompare(b);
  });

  const handleRename = (oldSlot: string) => {
    const newName = editingName.trim();
    if (newName && newName !== oldSlot && onRename) {
      onRename(oldSlot, newName);
      toast({ title: "Slot Renamed", description: `Renamed to "${newName}"` });
    }
    setEditingSlot(null);
    setEditingName("");
  };

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
              <Label className="text-sm font-medium mb-2 block">New Save</Label>
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
            const isEditing = editingSlot === slot;

            return (
              <Card key={slot} className="p-4" data-testid={`slot-${slot}`}>
                <div className="flex items-center justify-between mb-2 gap-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(slot);
                          if (e.key === "Escape") {
                            setEditingSlot(null);
                            setEditingName("");
                          }
                        }}
                        data-testid={`input-rename-${slot}`}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRename(slot)}
                        data-testid={`button-confirm-rename-${slot}`}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{slot}</h3>
                        {!isEmpty && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6"
                            onClick={() => {
                              setEditingSlot(slot);
                              setEditingName(slot);
                            }}
                            data-testid={`button-rename-${slot}`}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      {!isEmpty && (
                        <span className="text-xs text-muted-foreground">
                          {new Date(savedGame.updatedAt).toLocaleDateString()}
                        </span>
                      )}
                    </>
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
