import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Wrench, ShoppingCart, Shield, AlertCircle, X } from "lucide-react";
import { LOGO_URL, APP_VERSION } from "@/lib/constants";
import { TutorialCarousel } from "./TutorialCarousel";
import { TableLeveler } from "./TableLeveler";
import { CueingEmulator } from "./CueingEmulator";
import { CoinFlip } from "./CoinFlip";
import { CueMasterTools } from "./CueMasterTools";
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
  const [showCoinFlip, setShowCoinFlip] = useState(false);
  const [showCueMasterTools, setShowCueMasterTools] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const { isUnlocked, initiateCheckout, isCheckingUnlock, purchaseError, clearPurchaseError } = useUnlock();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 relative">
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
          Start Game
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
          <>
            <Button
              size="lg"
              className="w-full text-lg h-14 bg-gradient-to-r from-emerald-600 to-green-500 border-0 text-white font-bold shadow-lg"
              onClick={initiateCheckout}
              disabled={isCheckingUnlock}
              data-testid="button-buy-now"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {isCheckingUnlock ? "Processing…" : "Buy Now — Unlock All 18 Courses"}
            </Button>
            {purchaseError && (
              <div
                className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                data-testid="text-purchase-error"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span className="flex-1">{purchaseError}</span>
                <button
                  onClick={clearPurchaseError}
                  className="shrink-0 opacity-60 hover:opacity-100"
                  data-testid="button-dismiss-error"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
        <Button
          size="lg"
          className="w-full text-lg h-14 text-white font-bold border-0"
          style={{ background: "#15803d" }}
          onClick={() => setShowCueMasterTools(true)}
          data-testid="button-cuemaster-tools"
        >
          <Wrench className="w-5 h-5 mr-2" />
          CueMaster Tools
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
        <Button
          size="lg"
          variant="ghost"
          className="w-full text-sm h-10 text-muted-foreground"
          onClick={() => setShowPrivacy(true)}
          data-testid="button-privacy-policy"
        >
          <Shield className="w-4 h-4 mr-2" />
          Privacy Policy &amp; Terms
        </Button>
      </div>

      <p className="mt-6 text-xs text-muted-foreground" data-testid="text-app-version">
        {APP_VERSION}
      </p>

      {showTutorial && (
        <TutorialCarousel onClose={() => setShowTutorial(false)} />
      )}
      {showLeveler && (
        <TableLeveler onClose={() => setShowLeveler(false)} />
      )}
      {showEmulator && (
        <CueingEmulator onClose={() => setShowEmulator(false)} />
      )}
      {showCoinFlip && (
        <CoinFlip onClose={() => setShowCoinFlip(false)} />
      )}
      {showCueMasterTools && (
        <CueMasterTools
          onClose={() => setShowCueMasterTools(false)}
          onOpenCoinFlip={() => { setShowCueMasterTools(false); setShowCoinFlip(true); }}
          onOpenEmulator={() => { setShowCueMasterTools(false); setShowEmulator(true); }}
          onOpenLeveler={() => { setShowCueMasterTools(false); setShowLeveler(true); }}
        />
      )}
      {showPrivacy && (
        <PrivacyPolicy onClose={() => setShowPrivacy(false)} />
      )}
    </div>
  );
}
