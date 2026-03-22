import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Wrench, ShoppingCart, Shield, AlertCircle, X, MessageSquare } from "lucide-react";
import { LOGO_URL, APP_VERSION } from "@/lib/constants";
import { TutorialCarousel } from "./TutorialCarousel";
import { TableLeveler } from "./TableLeveler";
import { CueingEmulator } from "./CueingEmulator";
import { CoinFlip } from "./CoinFlip";
import { CueMasterTools } from "./CueMasterTools";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { PlaytestBanner } from "./PlaytestBanner"; // PLAYTESTING_MODE — revert: remove this import and usage
import { useUnlock } from "@/contexts/UnlockContext";
import { trackEvent } from "@/lib/analytics";
import { useBackHandler } from "@/hooks/useBackHandler";

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
  const { isUnlocked, initiateCheckout, initiateStripeCheckout, isCheckingUnlock, purchaseError, playBillingUnavailable, clearPurchaseError } = useUnlock();

  // Back-button / Android back-gesture handling.
  // Each overlay level gets its own handler so back navigates one level at a
  // time: sub-tool → CueMasterTools → dismiss.  The innermost registered
  // handler is called first (top of the global stack).

  // Level: sub-tools opened from CueMasterTools
  const subToolOpen = showCoinFlip || showEmulator || showLeveler;
  useBackHandler(subToolOpen ? () => {
    setShowCoinFlip(false);
    setShowEmulator(false);
    setShowLeveler(false);
    setShowCueMasterTools(true);
  } : null);

  // Level: CueMasterTools hub
  useBackHandler(showCueMasterTools ? () => setShowCueMasterTools(false) : null);

  // Level: Tutorial carousel
  useBackHandler(showTutorial ? () => setShowTutorial(false) : null);

  // Level: Privacy / Terms
  useBackHandler(showPrivacy ? () => setShowPrivacy(false) : null);

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
          {isUnlocked ? "New Game" : "Start Demo"}
        </Button>
        <p className="text-xs text-red-500 text-center -mt-2">*Pool table not included.</p>
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
            {playBillingUnavailable && (
              <Button
                size="lg"
                variant="outline"
                className="w-full text-lg h-14"
                onClick={initiateStripeCheckout}
                disabled={isCheckingUnlock}
                data-testid="button-stripe-fallback"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Pay via Web Browser Instead
              </Button>
            )}
          </>
        )}
        <Button
          size="lg"
          className="w-full text-lg h-14 text-white font-bold border-0"
          style={{ background: "#15803d" }}
          onClick={() => { setShowCueMasterTools(true); trackEvent("tool_opened", { tool_name: "cuemaster_tools" }); }}
          data-testid="button-cuemaster-tools"
        >
          <Wrench className="w-5 h-5 mr-2" />
          CueMaster Tools
        </Button>
        <Button
          size="lg"
          variant="ghost"
          className="w-full text-lg h-14 text-muted-foreground"
          onClick={() => { setShowTutorial(true); trackEvent("tutorial_viewed"); }}
          data-testid="button-how-to-play"
        >
          <BookOpen className="w-5 h-5 mr-2" />
          How to Play
        </Button>
        {/* PLAYTESTING_MODE — revert: restore variant="ghost" className="w-full text-sm h-10 text-muted-foreground" */}
        <Button
          size="lg"
          variant="ghost"
          className="w-full text-sm h-10 font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30"
          onClick={() => window.open("https://forms.gle/TgT8YWzdbk7gvJXq6", "_blank")}
          data-testid="button-feedback"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Send Feedback
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
        <TableLeveler onClose={() => { setShowLeveler(false); setShowCueMasterTools(true); }} />
      )}
      {showEmulator && (
        <CueingEmulator onClose={() => { setShowEmulator(false); setShowCueMasterTools(true); }} />
      )}
      {showCoinFlip && (
        <CoinFlip onClose={() => { setShowCoinFlip(false); setShowCueMasterTools(true); }} />
      )}
      {showCueMasterTools && (
        <CueMasterTools
          onClose={() => setShowCueMasterTools(false)}
          onOpenCoinFlip={() => { setShowCueMasterTools(false); setShowCoinFlip(true); trackEvent("tool_opened", { tool_name: "coin_flip" }); }}
          onOpenEmulator={() => { setShowCueMasterTools(false); setShowEmulator(true); trackEvent("tool_opened", { tool_name: "cueing_emulator" }); }}
          onOpenLeveler={() => { setShowCueMasterTools(false); setShowLeveler(true); trackEvent("tool_opened", { tool_name: "table_leveler" }); }}
        />
      )}
      {showPrivacy && (
        <PrivacyPolicy onClose={() => setShowPrivacy(false)} />
      )}
      {/* PLAYTESTING_MODE — revert: remove this line */}
      <PlaytestBanner />
    </div>
  );
}
