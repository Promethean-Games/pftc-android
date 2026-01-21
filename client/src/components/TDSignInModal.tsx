import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Shield, Trophy } from "lucide-react";

interface TDSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (roomCode: string, isNewTournament: boolean, pin: string) => void;
}

export function TDSignInModal({ isOpen, onClose, onSuccess }: TDSignInModalProps) {
  const [step, setStep] = useState<"code" | "pin">("code");
  const [tournamentCode, setTournamentCode] = useState("");
  const [tournamentExists, setTournamentExists] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCodeSubmit = async () => {
    if (!tournamentCode.trim()) {
      setError("Please enter a tournament code");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      // Check if tournament exists
      const response = await fetch(`/api/tournaments/${tournamentCode.trim().toUpperCase()}`);
      setTournamentExists(response.ok);
      setStep("pin");
    } catch (err) {
      setError("Failed to check tournament");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinSubmit = async () => {
    if (!pin.trim()) {
      setError("Please enter the director PIN");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      const code = tournamentCode.trim().toUpperCase();
      
      if (tournamentExists) {
        // Verify PIN server-side for existing tournament
        const response = await fetch(`/api/tournaments/${code}/verify-director`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.isValid) {
            onSuccess(code, false, pin);
            handleClose();
          } else {
            setError("Invalid director PIN");
          }
        } else {
          setError("Failed to verify PIN");
        }
      } else {
        // Create new tournament with this PIN
        const response = await fetch("/api/tournaments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `Tournament ${code}`,
            directorPin: pin,
          }),
        });
        
        if (response.ok) {
          const newTournament = await response.json();
          onSuccess(newTournament.roomCode, true, pin);
          handleClose();
        } else {
          setError("Failed to create tournament");
        }
      }
    } catch (err) {
      setError("Verification failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep("code");
    setTournamentCode("");
    setPin("");
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-green-600" />
            Tournament Director Sign-In
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {step === "code" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="tournament-code">Tournament Code</Label>
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-muted-foreground" />
                  <Input
                    id="tournament-code"
                    value={tournamentCode}
                    onChange={(e) => setTournamentCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-character code"
                    className="flex-1 font-mono text-center tracking-widest text-lg"
                    maxLength={6}
                    onKeyDown={(e) => e.key === "Enter" && handleCodeSubmit()}
                    data-testid="input-td-tournament-code"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter an existing tournament code or create a new one
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button 
                  onClick={handleCodeSubmit} 
                  className="flex-1"
                  data-testid="button-td-next"
                >
                  Next
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="director-pin">Director PIN</Label>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <Input
                    id="director-pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter secret PIN"
                    className="flex-1 text-center tracking-widest"
                    onKeyDown={(e) => e.key === "Enter" && handlePinSubmit()}
                    data-testid="input-td-pin"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Tournament: <span className="font-mono font-bold">{tournamentCode}</span>
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => { setStep("code"); setPin(""); setError(null); }}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handlePinSubmit}
                  disabled={isLoading}
                  className="flex-1"
                  data-testid="button-td-signin"
                >
                  {isLoading ? "Verifying..." : "Sign In"}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
