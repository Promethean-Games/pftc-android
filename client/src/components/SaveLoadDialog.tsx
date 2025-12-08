import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { X, Save, FolderOpen, Pencil, Check, Trash2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { GameSession } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SaveLoadDialogProps {
  mode: "save" | "load";
  savedGames: Record<string, GameSession>;
  onSave?: (slot: string) => void;
  onLoad?: (slot: string) => void;
  onRename?: (oldSlot: string, newSlot: string) => void;
  onDelete?: (slot: string) => void;
  onClose: () => void;
}

const AUTOSAVE_KEY = "__autosave__";
const MANUAL_SLOTS = ["Slot 1", "Slot 2", "Slot 3"];

export function SaveLoadDialog({ mode, savedGames, onSave, onLoad, onRename, onDelete, onClose }: SaveLoadDialogProps) {
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ type: "overwrite" | "delete"; slot: string } | null>(null);
  const { toast } = useToast();

  const autosave = savedGames[AUTOSAVE_KEY];
  
  // Get all manual slots (default 3 + any custom named ones that aren't autosave)
  const allSlotNames = new Set([...MANUAL_SLOTS]);
  Object.keys(savedGames).forEach((key) => {
    if (key !== AUTOSAVE_KEY) {
      allSlotNames.add(key);
    }
  });
  
  const slots = Array.from(allSlotNames).sort((a, b) => {
    const aDefault = MANUAL_SLOTS.indexOf(a);
    const bDefault = MANUAL_SLOTS.indexOf(b);
    if (aDefault !== -1 && bDefault !== -1) return aDefault - bDefault;
    if (aDefault !== -1) return -1;
    if (bDefault !== -1) return 1;
    return a.localeCompare(b);
  });

  const handleRename = (oldSlot: string) => {
    const newName = editingName.trim();
    if (newName && newName !== oldSlot && newName !== AUTOSAVE_KEY && onRename) {
      onRename(oldSlot, newName);
      toast({ title: "Slot Renamed", description: `Renamed to "${newName}"` });
    }
    setEditingSlot(null);
    setEditingName("");
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    
    if (confirmAction.type === "overwrite") {
      onSave?.(confirmAction.slot);
      toast({ title: "Game Overwritten", description: `Overwrote ${confirmAction.slot}` });
      onClose();
    } else if (confirmAction.type === "delete") {
      onDelete?.(confirmAction.slot);
      toast({ title: "Save Deleted", description: `Deleted ${confirmAction.slot}` });
    }
    setConfirmAction(null);
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
          {/* Autosave Section - Load Only */}
          {autosave && (
            <Card className="p-4 border-dashed" data-testid="slot-autosave">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold">Autosave</h3>
                <span className="text-xs text-muted-foreground ml-auto">
                  {new Date(autosave.updatedAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {autosave.players.length} players • Hole {autosave.currentHole}
              </p>
              <Button
                variant="outline"
                className="w-full h-12"
                onClick={() => {
                  onLoad?.(AUTOSAVE_KEY);
                  toast({ title: "Game Loaded", description: "Loaded from autosave" });
                  onClose();
                }}
                disabled={mode === "save"}
                data-testid="button-load-autosave"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                {mode === "save" ? "Autosave (Load Only)" : "Load Autosave"}
              </Button>
            </Card>
          )}

          {/* Manual Save Slots */}
          <div className="pt-2">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">
              {mode === "save" ? "Save Slots" : "Saved Games"}
            </h3>
          </div>

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
                      <div className="flex items-center gap-2">
                        {!isEmpty && (
                          <>
                            <span className="text-xs text-muted-foreground">
                              {new Date(savedGame.updatedAt).toLocaleDateString()}
                            </span>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6 text-destructive hover:text-destructive"
                              onClick={() => setConfirmAction({ type: "delete", slot })}
                              data-testid={`button-delete-${slot}`}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
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
                          setConfirmAction({ type: "overwrite", slot });
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

      {/* Confirmation Modal */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "overwrite" ? "Overwrite Save?" : "Delete Save?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "overwrite"
                ? `This will overwrite the saved game in "${confirmAction.slot}". This action cannot be undone.`
                : `This will permanently delete the saved game "${confirmAction?.slot}". This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-confirm">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmAction}
              className={confirmAction?.type === "delete" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
              data-testid="button-confirm-action"
            >
              {confirmAction?.type === "overwrite" ? "Overwrite" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
