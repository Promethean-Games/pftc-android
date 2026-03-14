import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Wrench, Ruler, Crosshair, ShoppingCart, Shield } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOGO_URL, APP_VERSION } from "@/lib/constants";
import { TutorialCarousel } from "./TutorialCarousel";
import { TableLeveler } from "./TableLeveler";
import { CueingEmulator } from "./CueingEmulator";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { useUnlock } from "@/contexts/UnlockContext";

interface SplashScreenProps {
  onNewGame: () => void;
  onLoadGame: () => void;
}

export function SplashScreen({ onNewGame, onLoadGame }: SplashScreenProps) {
  const [showTutorial, setShowTutorial] = useState(false);
  const [showLeveler, setShowLeveler] = useState(false);
  const [showEmulator, setShowEmulator] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { isUnlocked, initiateCheckout } = useUnlock();

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
            <DropdownMenuItem onClick={() => setShowEmulator(true)} data-testid="menu-cueing-emulator">
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

      <div className="mb-6 flex justify-center">
        <img 
          src={LOGO_URL} 
          alt="Par for the Course" 
          className="w-auto max-w-full"
          style={{ maxHeight: "36vh" }}
        />
      </div>
      
      <div className="w-full max-w-md space-y-4">
        <Button 
          size="lg"
          className="w-full text-lg h-14"
          onClick={onNewGame}
          data-testid="button-new-game"
        >
          {isUnlocked ? "New Game" : "Start Demo"}
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
        {!isUnlocked && (
          <Button
            size="lg"
            className="w-full text-lg h-14 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-700 hover:to-green-600 border-0 text-white font-bold shadow-lg"
            onClick={initiateCheckout}
            data-testid="button-buy-now"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Buy Now — Unlock All 18 Courses
          </Button>
        )}
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
        <Button
          size="lg"
          variant="ghost"
          className="w-full text-sm h-10 text-muted-foreground"
          onClick={() => setShowPrivacy(true)}
          data-testid="button-privacy-policy"
        >
          <Shield className="w-4 h-4 mr-2" />
          Privacy Policy & Terms
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground" data-testid="text-app-version">{APP_VERSION}</p>

      {showTutorial && (
        <TutorialCarousel onClose={() => setShowTutorial(false)} />
      )}

      {showLeveler && (
        <TableLeveler onClose={() => setShowLeveler(false)} />
      )}

      {showEmulator && (
        <CueingEmulator onClose={() => setShowEmulator(false)} />
      )}

      {showPrivacy && (
        <PrivacyPolicy onClose={() => setShowPrivacy(false)} />
      )}
    </div>
  );
}
