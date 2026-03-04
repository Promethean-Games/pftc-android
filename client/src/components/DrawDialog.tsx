import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CARD_BACK_IMG, type CourseCard } from "@/lib/card-deck";
import { PAR_OPTIONS } from "@/lib/constants";

interface DrawDialogProps {
  onConfirm: (par: number, card: CourseCard) => void;
  drawnCard: CourseCard | null;
  onDraw: () => CourseCard | null;
  isFirstDraw?: boolean;
}

type Phase = "tap" | "flipping" | "revealed" | "joker-select";

export function DrawDialog({ onConfirm, drawnCard, onDraw, isFirstDraw = false }: DrawDialogProps) {
  const [phase, setPhase] = useState<Phase>(drawnCard ? "revealed" : "tap");
  const [card, setCard] = useState<CourseCard | null>(drawnCard);
  const [jokerPar, setJokerPar] = useState<number | null>(null);
  const flipping = useRef(false);

  useEffect(() => {
    if (drawnCard && phase === "tap") {
      setCard(drawnCard);
      setPhase("revealed");
    }
  }, [drawnCard]);

  const handleTapDraw = () => {
    if (flipping.current) return;
    flipping.current = true;

    const drawn = onDraw();
    if (!drawn) {
      flipping.current = false;
      return;
    }

    setCard(drawn);
    setPhase("flipping");

    setTimeout(() => {
      setPhase("revealed");
      flipping.current = false;
    }, 800);
  };

  const handleConfirm = () => {
    if (!card) return;
    if (card.isJoker) {
      setPhase("joker-select");
    } else if (card.par !== null) {
      onConfirm(card.par, card);
    }
  };

  const handleJokerConfirm = () => {
    if (!card || jokerPar === null) return;
    onConfirm(jokerPar, card);
  };

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center space-y-6">
        {isFirstDraw && phase === "tap" && (
          <p className="text-muted-foreground text-lg" data-testid="text-first-draw-tip">
            The tallest player tees off first.
          </p>
        )}

        {phase === "tap" && (
          <>
            <h1 className="text-6xl font-extrabold" data-testid="text-draw">DRAW!</h1>
            <button
              onClick={handleTapDraw}
              className="mx-auto block focus:outline-none"
              data-testid="button-tap-draw"
            >
              <img
                src={CARD_BACK_IMG}
                alt="Card Back - Tap to draw"
                className="w-64 rounded-lg shadow-lg"
              />
              <p className="text-muted-foreground mt-3 text-sm">Tap the card to draw</p>
            </button>
          </>
        )}

        {phase === "flipping" && card && (
          <div className="perspective-[800px] mx-auto w-64">
            <div className="card-flip-container animate-card-flip">
              <div className="card-face card-front">
                <img
                  src={CARD_BACK_IMG}
                  alt="Card Back"
                  className="w-64 rounded-lg shadow-lg"
                />
              </div>
              <div className="card-face card-back">
                <img
                  src={card.img}
                  alt={card.isJoker ? "Joker" : `Par ${card.par}`}
                  className="w-64 rounded-lg shadow-lg"
                />
              </div>
            </div>
          </div>
        )}

        {phase === "revealed" && card && (
          <>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold" data-testid="text-card-reveal">
                {card.isJoker ? "JOKER!" : `Par ${card.par}`}
              </h2>
              {card.isJoker ? (
                <p className="text-muted-foreground" data-testid="text-joker-info">
                  You choose the par for this hole!
                </p>
              ) : (
                <p className="text-muted-foreground" data-testid="text-setup-hint">
                  Set up your table to match the course below.
                </p>
              )}
            </div>
            <img
              src={card.img}
              alt={card.isJoker ? "Joker" : `Par ${card.par}`}
              className="w-64 mx-auto rounded-lg shadow-lg"
              data-testid="img-card-revealed"
            />
            <Button
              className="w-full h-14 text-lg"
              onClick={handleConfirm}
              data-testid="button-confirm-draw"
            >
              {card.isJoker ? "Choose Par" : "Click to Continue"}
            </Button>
          </>
        )}

        {phase === "joker-select" && card && (
          <>
            <h2 className="text-3xl font-bold" data-testid="text-joker-select-title">JOKER!</h2>
            <img
              src={card.img}
              alt="Joker"
              className="w-48 mx-auto rounded-lg shadow-lg"
              data-testid="img-joker-select"
            />
            <div className="space-y-3">
              <label className="text-lg font-semibold block">
                Select Par for This Hole
              </label>
              <Select value={jokerPar?.toString() || ""} onValueChange={(v) => setJokerPar(parseInt(v))}>
                <SelectTrigger className="w-full h-14 text-xl" data-testid="select-joker-par">
                  <SelectValue placeholder="Select Par" />
                </SelectTrigger>
                <SelectContent>
                  {PAR_OPTIONS.map((par) => (
                    <SelectItem key={par} value={par.toString()}>
                      Par {par}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full h-14 text-lg"
              onClick={handleJokerConfirm}
              disabled={jokerPar === null}
              data-testid="button-confirm-joker-par"
            >
              Confirm Par {jokerPar ?? ""}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
