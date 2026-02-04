import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft, Trophy, Target, TrendingUp, Lock, Calendar, LogOut, Loader2, AlertTriangle, Ban } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { PlayerProfile, TournamentHistoryEntry } from "./PlayerLoginDialog";

interface PlayerProfilePageProps {
  player: PlayerProfile;
  history: TournamentHistoryEntry[];
  onLogout: () => void;
  onBack: () => void;
}

export function PlayerProfilePage({ player, history, onLogout, onBack }: PlayerProfilePageProps) {
  const [showChangePinDialog, setShowChangePinDialog] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatRelativeToPar = (rel: number) => {
    if (rel === 0) return "E";
    return rel > 0 ? `+${rel}` : rel.toString();
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" size="icon" onClick={onBack} data-testid="button-back-profile">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">My Profile</h1>
          <Button variant="ghost" size="icon" onClick={onLogout} data-testid="button-logout">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">{player.name}</CardTitle>
              <Badge variant="outline" className="font-mono text-lg" data-testid="badge-player-code">
                {player.uniqueCode}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Target className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-2xl font-bold" data-testid="text-handicap">
                  {player.handicap}
                </p>
                <p className="text-xs text-muted-foreground">
                  Handicap
                  {player.isProvisional && (
                    <Badge variant="secondary" className="ml-1 text-xs">Prov</Badge>
                  )}
                </p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Trophy className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                <p className="text-2xl font-bold" data-testid="text-tournaments-played">
                  {history.length}
                </p>
                <p className="text-xs text-muted-foreground">Tournaments</p>
              </div>
            </div>

            {player.email && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Email:</span> {player.email}
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowChangePinDialog(true)}
              data-testid="button-change-pin"
            >
              <Lock className="w-4 h-4 mr-2" />
              Change PIN
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5" />
              Recent Tournaments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No tournament history yet
              </p>
            ) : (
              <div className="space-y-3">
                {history.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    data-testid={`history-entry-${entry.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{entry.tournamentName}</p>
                      {entry.courseName && (
                        <p className="text-xs text-muted-foreground">{entry.courseName}</p>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(entry.completedAt)}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{entry.totalStrokes}</p>
                      <Badge
                        variant={entry.relativeToPar <= 0 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {formatRelativeToPar(entry.relativeToPar)}
                      </Badge>
                      {((entry.totalScratches ?? 0) > 0 || (entry.totalPenalties ?? 0) > 0) && (
                        <div className="flex items-center justify-end gap-2 mt-1 text-xs text-muted-foreground">
                          {(entry.totalScratches ?? 0) > 0 && (
                            <span className="flex items-center gap-0.5" title="Scratches">
                              <Ban className="w-3 h-3" />
                              {entry.totalScratches}
                            </span>
                          )}
                          {(entry.totalPenalties ?? 0) > 0 && (
                            <span className="flex items-center gap-0.5" title="Penalties">
                              <AlertTriangle className="w-3 h-3" />
                              {entry.totalPenalties}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ChangePinDialog
        isOpen={showChangePinDialog}
        onClose={() => setShowChangePinDialog(false)}
        playerCode={player.uniqueCode}
      />
    </div>
  );
}

interface ChangePinDialogProps {
  isOpen: boolean;
  onClose: () => void;
  playerCode: string;
}

function ChangePinDialog({ isOpen, onClose, playerCode }: ChangePinDialogProps) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetState = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setError(null);
    setSuccess(false);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    if (newPin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    if (!/^\d{4}$/.test(newPin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest("POST", "/api/player/set-pin", {
        playerCode,
        currentPin,
        newPin
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to change PIN");
        return;
      }

      setSuccess(true);
      setTimeout(() => handleClose(), 1500);
    } catch (err) {
      setError("Failed to change PIN");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Change PIN
          </DialogTitle>
          <DialogDescription>
            Enter your current PIN and choose a new 4-digit PIN
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="text-center py-4">
            <p className="text-green-600 font-medium">PIN changed successfully!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPinChange">Current PIN</Label>
              <Input
                id="currentPinChange"
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Current PIN"
                className="font-mono text-center tracking-widest"
                maxLength={4}
                data-testid="input-current-pin"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPinChange">New PIN</Label>
              <Input
                id="newPinChange"
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="New 4-digit PIN"
                className="font-mono text-center tracking-widest"
                maxLength={4}
                data-testid="input-new-pin-change"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPinChange">Confirm New PIN</Label>
              <Input
                id="confirmPinChange"
                type="password"
                inputMode="numeric"
                pattern="\d{4}"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="Re-enter new PIN"
                className="font-mono text-center tracking-widest"
                maxLength={4}
                data-testid="input-confirm-pin-change"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive text-center">{error}</p>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel-pin-change">
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={isLoading || currentPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}
                data-testid="button-save-new-pin"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save New PIN
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
