import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Undo2 } from "lucide-react";
import type { Player, HoleScore } from "@shared/schema";
import { PAR_OPTIONS, LEADER_ICON_URL } from "@/lib/constants";
import { getScoreCallout } from "@/lib/game-utils";
import { cn } from "@/lib/utils";
import { DrawDialog } from "./DrawDialog";

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
}: GameScreenProps) {
  const [showDrawDialog, setShowDrawDialog] = useState(false);
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
    setPar(currentScore.par || 0);
    setStrokes(currentScore.strokes || 0);
    setScratches(currentScore.scratches || 0);
    setPenalties(currentScore.penalties || 0);
  }, [currentPlayer.id, currentHole, currentScore]);

  useEffect(() => {
    onUpdateScore({ par, strokes, scratches, penalties });
  }, [par, strokes, scratches, penalties]);

  const totalStats = players.reduce((acc, player) => {
    const playerScores = scores[player.id] || [];
    return playerScores.reduce((sum, score) => ({
      scratches: sum.scratches + score.scratches,
      strokes: sum.strokes + score.strokes,
      penalties: sum.penalties + score.penalties,
    }), acc);
  }, { scratches: 0, strokes: 0, penalties: 0 });

  const handleMercy = () => {
    if (par > 0) {
      setStrokes(par + 5);
      setTimeout(() => onNextCard(), 300);
    }
  };

  const handleDrawPar = (selectedPar: number) => {
    onSetParForAll(selectedPar);
    setPar(selectedPar);
  };

  // Check if all players have non-zero scores for current hole
  const allPlayersHaveScores = players.every((player) => {
    const playerScore = scores[player.id]?.find((s) => s.hole === currentHole);
    return playerScore && playerScore.strokes > 0;
  });

  const canAdvance = par > 0 && strokes > 0 && allPlayersHaveScores;

  const batterIndex = players.findIndex((p) => p.id === currentPlayer.id);
  const batterInfo = `Batter ${batterIndex + 1} of ${players.length}`;

  return (
    <div className={cn("flex flex-col min-h-screen p-4 pb-6", leftHandedMode && "left-handed")}>
      {/* Player Navigation */}
      <div className="flex items-center gap-3 mb-4">
        <Button
          size="icon"
          variant="outline"
          onClick={onPreviousPlayer}
          className="w-20 h-11 text-xl"
          data-testid="button-prev-player"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        
        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border" style={{
          borderColor: currentPlayer.color,
          borderWidth: "2px"
        }}>
          {isLeader && (
            <img src={LEADER_ICON_URL} alt="Leader" className="w-5 h-5" data-testid="img-leader" />
          )}
          <span className="text-2xl font-bold" data-testid="text-player-name">{currentPlayer.name}</span>
        </div>
        
        <Button
          size="icon"
          variant="outline"
          onClick={onNextPlayer}
          className="w-20 h-11 text-xl"
          data-testid="button-next-player"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-xs uppercase text-muted-foreground font-semibold">Scratches</div>
          <div className="text-2xl font-bold" data-testid="text-scratches">{totalStats.scratches}</div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase text-muted-foreground font-semibold">Total Strokes</div>
          <div className="text-2xl font-bold" data-testid="text-total-strokes">{totalStats.strokes}</div>
        </div>
        <div className="text-center">
          <div className="text-xs uppercase text-muted-foreground font-semibold">Penalties</div>
          <div className="text-2xl font-bold" data-testid="text-penalties">{totalStats.penalties}</div>
        </div>
      </div>

      <div className="h-0.5 mb-4" style={{ backgroundColor: currentPlayer.color }} />

      {/* Hole & Batter Info */}
      <div className="flex justify-between items-center mb-3">
        <div className="text-lg font-bold" data-testid="text-hole">Hole {currentHole}</div>
        <div className="text-sm text-muted-foreground" data-testid="text-batter">{batterInfo}</div>
      </div>

      {/* Par Selection */}
      <div className={cn("flex items-center gap-3 mb-3", leftHandedMode && "flex-row-reverse")}>
        <Button
          variant="outline"
          onClick={() => setShowDrawDialog(true)}
          className="h-11 px-4"
          data-testid="button-draw"
        >
          DRAW
        </Button>
        <label htmlFor="par-select" className="text-base font-medium">Par:</label>
        <Select value={par > 0 ? par.toString() : ""} onValueChange={(v) => setPar(parseInt(v))}>
          <SelectTrigger className="w-32 h-11" id="par-select" data-testid="select-par">
            <SelectValue placeholder="--" />
          </SelectTrigger>
          <SelectContent>
            {PAR_OPTIONS.map((p) => (
              <SelectItem key={p} value={p.toString()}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {par > 0 && (
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

      {/* Scratch & Penalty */}
      <div className={cn("flex gap-3 mb-4", leftHandedMode && "flex-row-reverse")}>
        <Button
          variant="destructive"
          className="flex-1 h-12"
          onClick={() => setScratches(scratches + 1)}
          data-testid="button-scratch"
        >
          Scratch (+2)
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

      {/* Score Display & Controls */}
      <div className={cn("flex gap-4 items-center mb-4", leftHandedMode && "flex-row-reverse")}>
        <div className="flex-1 text-center">
          <div className="text-8xl font-extrabold leading-none" data-testid="text-score">{strokes}</div>
          <div className="text-sm font-bold min-h-[20px] mt-1" data-testid="text-callout">
            {par > 0 && strokes > 0 && getScoreCallout(strokes, par)}
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

      {/* Undo & Next Card */}
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
        <Button
          className="flex-1 h-12 text-base"
          onClick={onNextCard}
          disabled={!canAdvance}
          data-testid="button-next-card"
        >
          Next Card
        </Button>
      </div>

      {showDrawDialog && (
        <DrawDialog
          onSelectPar={handleDrawPar}
          onClose={() => setShowDrawDialog(false)}
        />
      )}
    </div>
  );
}
