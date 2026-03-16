import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CoinFlipProps {
  onClose: () => void;
}

export function CoinFlip({ onClose }: CoinFlipProps) {
  const [rotation, setRotation] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [flipCount, setFlipCount] = useState(0);

  const doFlip = () => {
    if (isFlipping) return;
    const outcome: "heads" | "tails" = Math.random() < 0.5 ? "heads" : "tails";
    const addedRotation = 1800 + (outcome === "tails" ? 180 : 0);
    setRotation((r) => r + addedRotation);
    setIsFlipping(true);
    setResult(null);
    setFlipCount((c) => c + 1);
    setTimeout(() => {
      setIsFlipping(false);
      setResult(outcome);
    }, 1400);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col" data-testid="coin-flip-overlay">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-lg font-bold tracking-tight" data-testid="text-coin-flip-title">
          Coin Flip
        </h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          data-testid="button-close-coin-flip"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-10 p-6">
        <p className="text-sm text-muted-foreground text-center">
          Flip to decide who breaks!
        </p>

        <div style={{ perspective: "700px" }}>
          <div
            data-testid="coin-face"
            style={{
              width: 160,
              height: 160,
              position: "relative",
              transformStyle: "preserve-3d",
              transition: isFlipping
                ? "transform 1.4s cubic-bezier(0.33,0,0.66,1)"
                : "none",
              transform: `rotateY(${rotation}deg)`,
            }}
          >
            {/* Heads — 8-ball */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                borderRadius: "50%",
                background: "radial-gradient(circle at 38% 32%, #444, #000)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 28px rgba(0,0,0,0.55), inset 0 0 0 4px rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 38% 32%, #fff, #d8d8d8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: "#111",
                    lineHeight: 1,
                  }}
                >
                  8
                </span>
              </div>
              <span
                style={{
                  position: "absolute",
                  bottom: 26,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                HEADS
              </span>
            </div>

            {/* Tails — cue ball */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                borderRadius: "50%",
                background: "radial-gradient(circle at 38% 32%, #ffffff, #c8c8c8)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 28px rgba(0,0,0,0.25), inset 0 0 0 4px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "rgba(180,180,180,0.45)",
                  boxShadow: "inset 0 1px 4px rgba(0,0,0,0.18)",
                }}
              />
              <span
                style={{
                  position: "absolute",
                  bottom: 26,
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "rgba(0,0,0,0.35)",
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                }}
              >
                TAILS
              </span>
            </div>
          </div>
        </div>

        <div style={{ minHeight: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {result && !isFlipping && (
            <div className="text-center" data-testid="coin-result">
              <p
                className="text-4xl font-black tracking-widest"
                data-testid="text-flip-result"
              >
                {result === "heads" ? "HEADS" : "TAILS"}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {result === "heads" ? "8-Ball — breaks first!" : "Cue Ball — challenger breaks!"}
              </p>
            </div>
          )}
        </div>

        <Button
          size="lg"
          className="w-44 h-14 text-lg font-bold"
          onClick={doFlip}
          disabled={isFlipping}
          data-testid="button-flip-coin"
        >
          {isFlipping ? "Flipping…" : flipCount === 0 ? "Flip!" : "Flip Again"}
        </Button>
      </div>
    </div>
  );
}
