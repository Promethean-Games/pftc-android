import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, Undo2, Eye, X, Trophy } from "lucide-react";
import type { Player, HoleScore } from "@shared/schema";
import { PAR_OPTIONS, MAX_HOLES } from "@/lib/constants";
import { getScoreCallout } from "@/lib/game-utils";
import { cn } from "@/lib/utils";
import { DrawDialog } from "./DrawDialog";

import { useUnlock } from "@/contexts/UnlockContext";
import { UnlockBanner } from "./UnlockBanner";
import { useGame } from "@/contexts/GameContext";
import type { CourseCard } from "@/lib/card-deck";
import { trackEvent } from "@/lib/analytics";

interface GameScreenProps {
  players: Player[];
  currentPlayer: Player;
  currentHole: number;
  scores: Record<string, HoleScore[]>;
  isLeader: boolean;
  leftHandedMode?: boolean;
  onPreviousPlayer: () => void;
  onNextPlayer: () => void;
  onUpdateScore: (score: Partial<HoleScore>) => void;
  onNextCard: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onSetParForAll: (par: number) => void;
  onHome?: () => void;
}

export function GameScreen({
  players,
  currentPlayer,
  currentHole,
  scores,
  isLeader,
  leftHandedMode = false,
  onPreviousPlayer,
  onNextPlayer,
  onUpdateScore,
  onNextCard,
  onUndo,
  canUndo,
  onSetParForAll,
  onHome,
}: GameScreenProps) {
  const { isUnlocked, freeHoles } = useUnlock();
  const { drawCard, getDrawnCard, pauseTimer, resumeTimer, recordSetupTime } = useGame();
  const isHoleLocked = !isUnlocked && currentHole > freeHoles;
  const paywallTracked = useRef(false);

  const [showSetupScreen, setShowSetupScreen] = useState(false);
  const [incomingPlayerName, setIncomingPlayerName] = useState("");
  const [pendingNavDirection, setPendingNavDirection] = useState<"next" | "prev" | null>(null);
  const setupStartTime = useRef<number | null>(null);

  const incomingPlayerHasScore = (incomingPlayer: Player) => {
    const s = scores[incomingPlayer.id]?.find((s) => s.hole === currentHole);
    return s && s.strokes > 0;
  };

  const handleNextPlayer = () => {
    const card = getDrawnCard(currentHole);
    const currentIndex = players.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % players.length;
    const nextPlayer = players[nextIndex];
    if (card && players.length > 1 && !isHoleLocked && !incomingPlayerHasScore(nextPlayer)) {
      setIncomingPlayerName(nextPlayer.name);
      setPendingNavDirection("next");
      setupStartTime.current = Date.now();
      pauseTimer();
      setShowSetupScreen(true);
    } else {
      onNextPlayer();
    }
  };

  const handlePreviousPlayer = () => {
    const card = getDrawnCard(currentHole);
    const currentIndex = players.indexOf(currentPlayer);
    const prevIndex = (currentIndex - 1 + players.length) % players.length;
    const prevPlayer = players[prevIndex];
    if (card && players.length > 1 && !isHoleLocked && !incomingPlayerHasScore(prevPlayer)) {
      setIncomingPlayerName(prevPlayer.name);
      setPendingNavDirection("prev");
      setupStartTime.current = Date.now();
      pauseTimer();
      setShowSetupScreen(true);
    } else {
      onPreviousPlayer();
    }
  };

  const handleSetupReady = () => {
    const setupTimeMs = setupStartTime.current ? Date.now() - setupStartTime.current : 0;
    const card = getDrawnCard(currentHole);
    if (card) {
      recordSetupTime({
        hole: currentHole,
        cardId: card.id,
        par: card.par ?? 0,
        setupTimeMs,
        timestamp: new Date().toISOString(),
      });
      trackEvent("setup_time_recorded", {
        hole: currentHole,
        cardId: card.id,
        par: card.par,
        setupTimeMs,
      });
    }
    setShowSetupScreen(false);
    resumeTimer();
    if (pendingNavDirection === "next") onNextPlayer();
    else if (pendingNavDirection === "prev") onPreviousPlayer();
    setPendingNavDirection(null);
  };

  useEffect(() => {
    if (isHoleLocked && !paywallTracked.current) {
      paywallTracked.current = true;
      trackEvent("paywall_encountered", { hole: currentHole });
    }
  }, [isHoleLocked, currentHole]);

  const [showDrawDialog, setShowDrawDialog] = useState(false);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showCourseViewer, setShowCourseViewer] = useState(false);
  const [lastHole, setLastHole] = useState(currentHole);
  const isInitialMount = useRef(true);
  const lastPlayerId = useRef(currentPlayer.id);
  
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNextPlayer();
    } else if (isRightSwipe) {
      handlePreviousPlayer();
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };
  
  const currentScore = scores[currentPlayer.id]?.find((s) => s.hole === currentHole) || {
    hole: currentHole,
    par: 0,
    strokes: 0,
    scratches: 0,
    penalties: 0,
  };

  const [par, setPar] = useState(currentScore.par || 0);
  const [strokes, setStrokes] = useState(currentScore.strokes || 0);
  const [scratches, setScratches] = useState(currentScore.scratches || 0);
  const [penalties, setPenalties] = useState(currentScore.penalties || 0);

  useEffect(() => {
    if (isHoleLocked) return;
    if (currentHole !== lastHole) {
      setLastHole(currentHole);
      const existingPar = scores[currentPlayer.id]?.find((s) => s.hole === currentHole)?.par;
      if (!existingPar || existingPar === 0) {
        setShowDrawDialog(true);
      }
    }
  }, [currentHole, lastHole, scores, currentPlayer.id, isHoleLocked]);

  useEffect(() => {
    if (isHoleLocked) return;
    if (currentScore.par === 0) {
      setShowDrawDialog(true);
    }
  }, []);

  useEffect(() => {
    if (currentPlayer.id !== lastPlayerId.current) {
      lastPlayerId.current = currentPlayer.id;
      isInitialMount.current = true;
    }
    setPar(currentScore.par || 0);
    setStrokes(currentScore.strokes || 0);
    setScratches(currentScore.scratches || 0);
    setPenalties(currentScore.penalties || 0);
  }, [currentPlayer.id, currentHole, currentScore]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onUpdateScore({ par, strokes, scratches, penalties });
  }, [par, strokes, scratches, penalties]);

  useEffect(() => {
    const handler = (e: Event) => {
      const action = (e as CustomEvent<{ action: string }>).detail?.action;
      if (action === "stroke_add") {
        setStrokes((prev) => Math.max(0, prev + 1));
      } else if (action === "next_player") {
        handleNextPlayer();
      } else if (action === "undo") {
        onUndo();
      }
    };
    window.addEventListener("pftc-notif-action", handler as EventListener);
    return () =>
      window.removeEventListener("pftc-notif-action", handler as EventListener);
  }, [handleNextPlayer, onUndo]);

  const playerStats = (scores[currentPlayer.id] || []).reduce((acc, score) => ({
    scratches: acc.scratches + score.scratches,
    strokes: acc.strokes + score.strokes + score.scratches + score.penalties,
    penalties: acc.penalties + score.penalties,
  }), { scratches: 0, strokes: 0, penalties: 0 });

  const handleMercy = () => {
    if (par > 0) {
      setStrokes(par + 5);
      setTimeout(() => onNextCard(), 300);
    }
  };

  const handleDrawConfirm = (selectedPar: number, _card: CourseCard) => {
    setShowDrawDialog(false);
    onSetParForAll(selectedPar);
    setPar(selectedPar);
  };

  const handleDraw = () => {
    return drawCard(currentHole);
  };

  const allPlayersHaveScores = players.every((player) => {
    const playerScore = scores[player.id]?.find((s) => s.hole === currentHole);
    return playerScore && playerScore.strokes > 0;
  });

  const canAdvance = par > 0 && strokes > 0 && allPlayersHaveScores;
  const isLastHole = currentHole >= MAX_HOLES;
  const isLastPlayer = players.indexOf(currentPlayer) === players.length - 1;
  const isFinishingGame = isLastHole && isLastPlayer && allPlayersHaveScores;

  const shootersRemaining = players.filter((player) => {
    const playerScore = scores[player.id]?.find((s) => s.hole === currentHole);
    return !playerScore || playerScore.strokes === 0;
  }).length;
  
  const shooterInfo = `${shootersRemaining} player${shootersRemaining !== 1 ? "s" : ""} remaining`;

  const currentCard = getDrawnCard(currentHole);

  return (
    <div 
      className={cn("flex flex-col p-4 pb-4 relative", leftHandedMode && "left-handed")}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center gap-3 mb-4">
        <Button
          size="icon"
          variant="outline"
          onClick={handlePreviousPlayer}
          className="w-20 h-11 text-xl"
          data-testid="button-prev-player"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        
        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border relative" style={{
          borderColor: currentPlayer.color,
          borderWidth: "2px"
        }}>
          {isLeader && (
            <Trophy className="w-5 h-5 text-yellow-400 flex-shrink-0" data-testid="img-leader" />
          )}
          <span className="text-2xl font-bold" data-testid="text-player-name">{currentPlayer.name}</span>
        </div>
        
        <Button
          size="icon"
          variant="outline"
          onClick={handleNextPlayer}
          className="w-20 h-11 text-xl"
          data-testid="button-next-player"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xs uppercase text-muted-foreground font-semibold">Scratches</div>
          <div className="text-2xl font-bold" data-testid="text-scratches">{playerStats.scratches}</div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase text-muted-foreground font-semibold">Total Strokes</div>
          <div className="text-2xl font-bold" data-testid="text-total-strokes">{playerStats.strokes}</div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase text-muted-foreground font-semibold">Penalties</div>
          <div className="text-2xl font-bold" data-testid="text-penalties">{playerStats.penalties}</div>
        </div>
      </div>

      <div className="h-0.5 mb-4" style={{ backgroundColor: currentPlayer.color }} />

      <div className="flex justify-between items-center mb-1 gap-2">
        <div className="text-lg font-bold" data-testid="text-hole">Hole {currentHole}</div>
        <div className="text-sm text-muted-foreground" data-testid="text-shooters-remaining">{shooterInfo}</div>
      </div>

      <div className="flex justify-end mb-3">
        {currentCard && (
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground"
            onClick={() => setShowCourseViewer(true)}
            data-testid="button-view-course"
          >
            <Eye className="w-4 h-4 mr-1" />
            View Course
          </Button>
        )}
      </div>

      {isHoleLocked ? (
        <div className="flex-1 flex flex-col items-center justify-center py-8" data-testid="locked-hole-overlay">
          <UnlockBanner variant="overlay" onHome={onHome} />
        </div>
      ) : par === 0 ? (
        <button
          className="w-full mb-3 p-4 rounded-md border-2 border-dashed border-primary text-center"
          onClick={() => setShowDrawDialog(true)}
          data-testid="button-set-par-banner"
        >
          <span className="text-lg font-bold text-primary">Tap to Draw a Card</span>
          <span className="block text-sm text-muted-foreground mt-1">Draw a card to set par for this hole</span>
        </button>
      ) : (
        <div className={cn("flex items-center gap-3 mb-3", leftHandedMode && "flex-row-reverse")}>
          <label htmlFor="par-select" className="text-base font-medium">Par:</label>
          <Select value={par.toString()} onValueChange={(v) => setPar(parseInt(v))}>
            <SelectTrigger className="w-32 h-11" id="par-select" data-testid="select-par">
              <SelectValue placeholder="--" />
            </SelectTrigger>
            <SelectContent>
              {PAR_OPTIONS.map((p) => (
                <SelectItem key={p} value={p.toString()}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {strokes >= par + 5 && (
            <Button
              variant="outline"
              onClick={handleMercy}
              className="h-11 px-4"
              data-testid="button-mercy"
            >
              Mercy (+5)
            </Button>
          )}
        </div>
      )}

      {!isHoleLocked && (
        <>
          <div className={cn("flex gap-3 mb-4", leftHandedMode && "flex-row-reverse")}>
            <Button
              variant="destructive"
              className="flex-1 h-12"
              onClick={() => setScratches(scratches + 1)}
              data-testid="button-scratch"
            >
              Scratch (+1)
            </Button>
            <Button
              variant="destructive"
              className="flex-1 h-12"
              onClick={() => setPenalties(penalties + 1)}
              data-testid="button-penalty"
            >
              Penalty (+1)
            </Button>
          </div>

          <div className={cn("flex gap-4 items-center mb-4", leftHandedMode && "flex-row-reverse")}>
            <div className="flex-1 text-center">
              <div className="text-8xl font-extrabold leading-none" data-testid="text-score">
                {strokes + scratches + penalties}
              </div>
              {(scratches > 0 || penalties > 0) && (
                <div className="text-xs text-muted-foreground" data-testid="text-score-breakdown">
                  {strokes} + {scratches > 0 && `${scratches}S`}{scratches > 0 && penalties > 0 && " + "}{penalties > 0 && `${penalties}P`}
                </div>
              )}
              <div className="text-sm font-bold min-h-[20px] mt-1" data-testid="text-callout">
                {par > 0 && strokes > 0 && getScoreCallout(strokes + scratches + penalties, par)}
              </div>
            </div>
            <div className="flex flex-col gap-3 w-28">
              <Button
                className="h-20 text-3xl"
                onClick={() => setStrokes(Math.max(0, strokes + 1))}
                data-testid="button-score-plus"
              >
                ▲
              </Button>
              <Button
                className="h-20 text-3xl"
                onClick={() => setStrokes(Math.max(0, strokes - 1))}
                data-testid="button-score-minus"
              >
                ▼
              </Button>
            </div>
          </div>

          <div className={cn("flex gap-3", leftHandedMode && "flex-row-reverse")}>
            <Button
              variant="destructive"
              className="flex-1 h-12 text-base"
              onClick={onUndo}
              disabled={!canUndo}
              data-testid="button-undo"
            >
              <Undo2 className="w-5 h-5 mr-2" />
              Undo
            </Button>
            <div className="flex-1 flex flex-col gap-1">
              <Button
                className={cn(
                  "w-full h-12 text-base",
                  allPlayersHaveScores && par > 0 && strokes > 0 && "animate-pulse"
                )}
                onClick={() => {
                  if (isFinishingGame) {
                    setShowFinishConfirm(true);
                  } else {
                    onNextCard();
                  }
                }}
                disabled={!canAdvance}
                data-testid="button-next-card"
              >
                {isFinishingGame ? "Finish Game" : "Next Card"}
              </Button>
              {!canAdvance && par === 0 && (
                <span className="text-xs text-center text-destructive" data-testid="text-par-required">Draw a card to continue</span>
              )}
            </div>
          </div>
        </>
      )}

      {showSetupScreen && (() => {
        const card = getDrawnCard(currentHole);
        return card ? (
          <div
            className="fixed inset-0 pb-16 bg-background z-[50] flex flex-col items-center justify-center p-6 gap-6"
            data-testid="setup-screen-overlay"
            onTouchStart={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <img
              src={card.img}
              alt={card.isJoker ? "Joker" : `Par ${card.par}`}
              className="max-w-full max-h-[55vh] rounded-lg object-contain"
              data-testid="img-setup-card"
            />
            <p className="text-center text-lg font-medium text-muted-foreground" data-testid="text-setup-instruction">
              Set up the table to match the card for{" "}
              <span className="text-foreground font-bold">{incomingPlayerName}</span>.
            </p>
            <Button
              className="w-full max-w-xs h-14 text-xl font-bold bg-green-600 text-white"
              onClick={handleSetupReady}
              data-testid="button-setup-ready"
            >
              Ready!
            </Button>
          </div>
        ) : null;
      })()}

      {showCourseViewer && currentCard && (
        <div
          className="fixed inset-0 bg-background/95 z-50 flex flex-col items-center justify-center p-6"
          data-testid="course-viewer-overlay"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <div className="absolute top-4 right-4">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowCourseViewer(false)}
              data-testid="button-close-course-viewer"
            >
              <X className="w-6 h-6" />
            </Button>
          </div>
          <h2 className="text-2xl font-bold mb-4" data-testid="text-course-viewer-title">
            Hole {currentHole} {currentCard.isJoker ? "- Joker" : `- Par ${currentCard.par}`}
          </h2>
          <img
            src={currentCard.img}
            alt={currentCard.isJoker ? "Joker" : `Par ${currentCard.par}`}
            className="max-w-full max-h-[70vh] rounded-lg shadow-lg object-contain"
            data-testid="img-course-viewer"
          />
          <Button
            variant="outline"
            className="mt-6"
            onClick={() => setShowCourseViewer(false)}
            data-testid="button-done-viewing"
          >
            Done
          </Button>
        </div>
      )}

      {showDrawDialog && !isHoleLocked && (
        <DrawDialog
          onConfirm={handleDrawConfirm}
          drawnCard={getDrawnCard(currentHole)}
          onDraw={handleDraw}
          isFirstDraw={currentHole === 1}
        />
      )}

      <Dialog open={showFinishConfirm} onOpenChange={setShowFinishConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Finish Game</DialogTitle>
            <DialogDescription className="pt-2">
              To finalize your score(s), click continue. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setShowFinishConfirm(false)}
              data-testid="button-finish-cancel"
            >
              Go Back
            </Button>
            <Button
              onClick={() => {
                setShowFinishConfirm(false);
                onNextCard();
              }}
              data-testid="button-finish-confirm"
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
