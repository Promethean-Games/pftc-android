import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Wrench, Ruler, Crosshair } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { LOGO_URL } from "@/lib/constants";
import { TutorialCarousel } from "./TutorialCarousel";
import { TableLeveler } from "./TableLeveler";
import { CueingEmulator } from "./CueingEmulator";

interface SplashScreenProps {
  onNewGame: () => void;
  onLoadGame: () => void;
}

export function SplashScreen({ onNewGame, onLoadGame }: SplashScreenProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLeveler, setShowLeveler] = useState(false);
  const [showEmulatorWarning, setShowEmulatorWarning] = useState(false);
  const [showEmulator, setShowEmulator] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
      <div className="absolute top-4 right-4 z-10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" data-testid="button-cuemaster-tools">
              <Wrench className="w-5 h-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setShowEmulatorWarning(true)} data-testid="menu-cueing-emulator">
              <Crosshair className="w-4 h-4 mr-2" />
              Cueing Emulator
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowLeveler(true)} data-testid="menu-table-leveler">
              <Ruler className="w-4 h-4 mr-2" />
              Table Leveler
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-8 w-full max-w-md">
        <img 
          src={LOGO_URL} 
          alt="Par for the Course" 
          className="w-full h-auto"
        />
      </div>
      
      <div className="w-full max-w-md space-y-4">
        <Button 
          size="lg"
          className="w-full text-lg h-14"
          onClick={onNewGame}
          data-testid="button-new-game"
        >
          New Game
        </Button>
        <Button 
          size="lg"
          variant="outline"
          className="w-full text-lg h-14"
          onClick={onLoadGame}
          data-testid="button-load-game"
        >
          Load Game
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="w-full text-lg h-14 text-muted-foreground"
          onClick={() => setShowTutorial(true)}
          data-testid="button-how-to-play"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          How to Play
        </Button>
      </div>

      {showTutorial && (
        <TutorialCarousel onClose={() => setShowTutorial(false)} />
      )}

      {showLeveler && (
        <TableLeveler onClose={() => setShowLeveler(false)} />
      )}

      <Dialog open={showEmulatorWarning} onOpenChange={setShowEmulatorWarning}>
        <DialogContent className="max-w-md text-center" data-testid="dialog-emulator-warning">
          <h1 className="text-2xl font-bold" data-testid="text-coming-soon">Coming Soon!</h1>
          <h3 className="text-base text-muted-foreground" data-testid="text-warning-message">
            This feature is not fully developed and may not function properly or at all. Updates are published automatically on a regular basis.
          </h3>
          <DialogFooter className="flex flex-row justify-center gap-3 sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setShowEmulatorWarning(false)}
              data-testid="button-go-back"
            >
              Go Back
            </Button>
            <Button
              onClick={() => {
                setShowEmulatorWarning(false);
                setShowEmulator(true);
              }}
              data-testid="button-continue-anyways"
            >
              Continue Anyways
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {showEmulator && (
        <CueingEmulator onClose={() => setShowEmulator(false)} />
      )}
    </div>
  );
}
