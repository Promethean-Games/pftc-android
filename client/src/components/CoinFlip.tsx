import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import headsImg from "@assets/image_1773676717898.png";
import tailsImg from "@assets/image_1773670945305.png";

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

        {/* perspective on Y axis so the vertical toss looks 3-D */}
        <div style={{ perspective: "700px" }}>
          <div
            data-testid="coin-face"
            style={{
              width: 200,
              height: 200,
              position: "relative",
              transformStyle: "preserve-3d",
              transition: isFlipping
                ? "transform 1.4s cubic-bezier(0.33,0,0.66,1)"
                : "none",
              transform: `rotateX(${rotation}deg)`,
            }}
          >
            {/* Heads */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                borderRadius: "50%",
                overflow: "hidden",
                boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
              }}
            >
              <img
                src={headsImg}
                alt="Heads"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </div>

            {/* Tails — rotated 180° around X so it shows on the back */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateX(180deg)",
                borderRadius: "50%",
                overflow: "hidden",
                boxShadow: "0 8px 28px rgba(0,0,0,0.5)",
              }}
            >
              <img
                src={tailsImg}
                alt="Tails"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
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
                {result === "heads" ? "Heads — breaks first!" : "Tails — challenger breaks!"}
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
