import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnlock } from "@/contexts/UnlockContext";
import headsImg from "@assets/image_1773676717898.png";
import tailsImg from "@assets/image_1773670945305.png";

const HISTORY_KEY = "pftc_coin_flip_history";
const MAX_HISTORY = 99;

interface FlipRecord {
  id: number;
  outcome: "heads" | "tails";
  timestamp: Date;
}

interface StoredRecord {
  id: number;
  outcome: "heads" | "tails";
  timestamp: string; // ISO string in storage
}

function loadHistory(): FlipRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: StoredRecord[] = JSON.parse(raw);
    return parsed.map((r) => ({ ...r, timestamp: new Date(r.timestamp) }));
  } catch {
    return [];
  }
}

function saveHistory(history: FlipRecord[]) {
  try {
    const toStore: StoredRecord[] = history.map((r) => ({
      ...r,
      timestamp: r.timestamp.toISOString(),
    }));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(toStore));
  } catch {
    // storage full — silently skip
  }
}

interface CoinFlipProps {
  onClose: () => void;
}

export function CoinFlip({ onClose }: CoinFlipProps) {
  const { isUnlocked } = useUnlock();
  const [rotation, setRotation] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [result, setResult] = useState<"heads" | "tails" | null>(null);
  const [flipCount, setFlipCount] = useState(0);
  const [history, setHistory] = useState<FlipRecord[]>(loadHistory);

  useEffect(() => {
    saveHistory(history);
  }, [history]);

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
      if (isUnlocked) {
        setHistory((h) =>
          [{ id: Date.now(), outcome, timestamp: new Date() }, ...h].slice(0, MAX_HISTORY)
        );
      }
    }, 1400);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(HISTORY_KEY);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatDate = (d: Date) =>
    d.toLocaleDateString([], { month: "short", day: "numeric" });

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col" data-testid="coin-flip-overlay">
      {/* Header */}
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

      {/* Body */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Coin section — always visible, never scrolls */}
        <div className="flex flex-col items-center gap-6 pt-6 pb-4 px-6 shrink-0">
          <p className="text-xl font-bold tracking-wide text-foreground" data-testid="text-odds-header">
            50/50 Odds
          </p>

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

              {/* Tails */}
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

          {/* Result */}
          <div style={{ minHeight: 52, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {result && !isFlipping && (
              <div className="text-center" data-testid="coin-result">
                <p className="text-4xl font-black tracking-widest" data-testid="text-flip-result">
                  {result === "heads" ? "HEADS" : "TAILS"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
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

        {/* Flip History — paid users only */}
        {isUnlocked && (
          <div className="flex-1 flex flex-col overflow-hidden border-t mx-0">
            <div className="flex items-center justify-between px-4 py-2 shrink-0">
              <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Flip History
              </p>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-xs text-muted-foreground underline underline-offset-2"
                  data-testid="button-clear-history"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {history.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No flips yet — results will appear here.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {history.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-md border bg-card px-4 py-3"
                      data-testid={`tile-flip-history-${record.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={record.outcome === "heads" ? headsImg : tailsImg}
                          alt={record.outcome}
                          className="w-9 h-9 rounded-full object-cover shrink-0"
                        />
                        <span
                          className="font-bold tracking-widest text-sm uppercase"
                          data-testid={`text-history-outcome-${record.id}`}
                        >
                          {record.outcome}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-medium text-foreground" data-testid={`text-history-time-${record.id}`}>
                          {formatTime(record.timestamp)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(record.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
