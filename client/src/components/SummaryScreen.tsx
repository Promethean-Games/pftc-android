import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Lock } from "lucide-react";
import type { Player, HoleScore } from "@shared/schema";
import { calculatePlayerTotal, getLeaderboard } from "@/lib/game-utils";
import { cn } from "@/lib/utils";
import { useUnlock } from "@/contexts/UnlockContext";
import { UnlockBanner } from "./UnlockBanner";
import { GameAnalytics } from "./GameAnalytics";
import type { TurnTime } from "@/contexts/GameContext";

interface SummaryScreenProps {
  players: Player[];
  scores: Record<string, HoleScore[]>;
  onNewGame: () => void;
  onSubmitToSheets?: () => void;
  isGameOver?: boolean;
  viewOnly?: boolean;
  onUpdateScore?: (playerId: string, hole: number, score: Partial<HoleScore>) => void;
  turnTimes?: TurnTime[];
  gameStartTime?: number;
  gameEndTime?: number | null;
}

export function SummaryScreen({ players, scores, onNewGame, onSubmitToSheets, isGameOver = false, viewOnly = false, onUpdateScore, turnTimes = [], gameStartTime = 0, gameEndTime = null }: SummaryScreenProps) {
  const { isUnlocked, freeHoles } = useUnlock();
  const [isLandscape, setIsLandscape] = useState(false);
  const [editingCell, setEditingCell] = useState<{ playerId: string; hole: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  
  useEffect(() => {
    const checkOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
    };
    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    return () => window.removeEventListener("resize", checkOrientation);
  }, []);

  const leaderboard = getLeaderboard(players, scores);
  const leader = leaderboard[0];

  const allHoles = Array.from(
    new Set(
      Object.values(scores)
        .flat()
        .map((s) => s.hole)
    )
  ).sort((a, b) => a - b);

  return (
    <div className="flex flex-col min-h-screen p-6 pb-8">
      <h1 className="text-3xl font-bold text-center mb-2">Session Summary</h1>
      
      {leader && (
        <p className="text-center text-muted-foreground mb-4">
          {isGameOver ? "Winner" : "Leader"}: <span className="font-bold" style={{ color: leader.player.color }}>{leader.player.name}</span> ({leader.total} strokes)
        </p>
      )}

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between border-b border-dashed pb-2">
            <span>Total Players:</span>
            <span className="font-semibold">{players.length}</span>
          </div>
          <div className="flex justify-between border-b border-dashed pb-2">
            <span>Holes Played:</span>
            <span className="font-semibold">{allHoles.length}</span>
          </div>
          <div className="flex justify-between border-b border-dashed pb-2">
            <span>Total Strokes:</span>
            <span className="font-semibold">
              {Object.values(scores).reduce((sum, playerScores) => 
                sum + calculatePlayerTotal(playerScores).totalStrokes, 0
              )}
            </span>
          </div>
          <div className="flex justify-between border-b border-dashed pb-2">
            <span>Total Scratches:</span>
            <span className="font-semibold">
              {Object.values(scores).reduce((sum, playerScores) => 
                sum + calculatePlayerTotal(playerScores).totalScratches, 0
              )}
            </span>
          </div>
        </div>
      </Card>

      {!isLandscape && (
        <Card className="p-4 mb-6">
          <h3 className="font-bold mb-3">Leaderboard</h3>
          <div className="space-y-2">
            {leaderboard.map((entry, index) => {
              const stats = calculatePlayerTotal(scores[entry.player.id] || []);
              
              return (
                <div
                  key={entry.player.id}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg border",
                    index === 0 && "border-yellow-500 border-2 bg-yellow-500/5",
                    index === 1 && "border-gray-400 border-2 bg-gray-400/5",
                    index === 2 && "border-amber-700 border-2 bg-amber-700/5"
                  )}
                  data-testid={`leaderboard-${entry.player.id}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div 
                      className="w-6 h-6 rounded-full flex-shrink-0" 
                      style={{ backgroundColor: entry.player.color }}
                    />
                    <span className="font-semibold truncate">{entry.player.name}</span>
                  </div>
                  <div className="text-center text-sm flex-shrink-0">
                    <div className="font-bold">{entry.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="text-center text-sm flex-shrink-0">
                    <div>{stats.totalScratches}</div>
                    <div className="text-xs text-muted-foreground">Scratch</div>
                  </div>
                  <div className="text-center text-sm flex-shrink-0">
                    <div>{stats.totalPenalties}</div>
                    <div className="text-xs text-muted-foreground">Penalty</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {isLandscape && (() => {
        const canEdit = !!onUpdateScore && !viewOnly;

        const commitEdit = (playerId: string, hole: number) => {
          const val = parseInt(editValue);
          if (!isNaN(val) && val >= 0 && onUpdateScore) {
            const playerScores = scores[playerId] || [];
            const existing = playerScores.find(s => s.hole === hole);
            const par = existing?.par ?? 3;
            const scratches = existing?.scratches ?? 0;
            const penalties = existing?.penalties ?? 0;
            onUpdateScore(playerId, hole, {
              strokes: val,
              par,
              scratches,
              penalties,
            });
          }
          setEditingCell(null);
          setEditValue("");
        };

        return (
        <Card className="p-4 mb-6">
          <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
            <h3 className="font-bold">Detailed Box Score & Statistics</h3>
            {canEdit && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Pencil className="w-3 h-3" />
                Tap a score to edit
              </span>
            )}
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px] sticky left-0 bg-card z-10">Player</TableHead>
                  {allHoles.map((hole) => (
                    <TableHead key={hole} className="text-center min-w-[50px]">H{hole}</TableHead>
                  ))}
                  <TableHead className="text-center min-w-[60px]">Strokes</TableHead>
                  <TableHead className="text-center min-w-[60px]">Scratch</TableHead>
                  <TableHead className="text-center min-w-[60px]">Penalty</TableHead>
                  <TableHead className="text-center min-w-[60px] font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry, index) => {
                  const playerScores = scores[entry.player.id] || [];
                  const stats = calculatePlayerTotal(playerScores);
                  const rawStrokes = playerScores.reduce((sum, s) => sum + s.strokes, 0);
                  
                  return (
                    <TableRow key={entry.player.id} className={cn(
                      index === 0 && "border-2 border-yellow-500",
                      index === 1 && "border-2 border-gray-400",
                      index === 2 && "border-2 border-amber-700"
                    )}>
                      <TableCell className="font-semibold sticky left-0 bg-card z-10">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: entry.player.color }}
                          />
                          <span className="truncate">{entry.player.name}</span>
                        </div>
                      </TableCell>
                      {allHoles.map((hole) => {
                        const holeScore = playerScores.find((s) => s.hole === hole);
                        const par = holeScore?.par || 0;
                        const strokes = holeScore?.strokes || 0;
                        const diff = strokes - par;
                        const holeLocked = !isUnlocked && hole > freeHoles;
                        const isEditing = editingCell?.playerId === entry.player.id && editingCell?.hole === hole;
                        
                        if (holeLocked) {
                          return (
                            <TableCell key={hole} className="text-center select-none">
                              <Lock className="w-3 h-3 mx-auto text-muted-foreground/50" />
                            </TableCell>
                          );
                        }

                        if (isEditing) {
                          return (
                            <TableCell key={hole} className="text-center p-1">
                              <input
                                type="number"
                                inputMode="numeric"
                                min={0}
                                autoFocus
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => commitEdit(entry.player.id, hole)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") commitEdit(entry.player.id, hole);
                                  if (e.key === "Escape") { setEditingCell(null); setEditValue(""); }
                                }}
                                className="w-12 h-8 text-center text-sm border rounded bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                                data-testid={`input-score-${entry.player.id}-h${hole}`}
                              />
                            </TableCell>
                          );
                        }

                        return (
                          <TableCell 
                            key={hole} 
                            className={cn(
                              "text-center",
                              diff < 0 && "text-green-500 font-semibold",
                              diff > 0 && "text-red-500",
                              canEdit && holeScore && "cursor-pointer hover-elevate"
                            )}
                            onClick={() => {
                              if (canEdit && holeScore) {
                                setEditingCell({ playerId: entry.player.id, hole });
                                setEditValue(String(strokes));
                              }
                            }}
                            data-testid={`cell-score-${entry.player.id}-h${hole}`}
                          >
                            {holeScore ? strokes : "-"}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center">{rawStrokes}</TableCell>
                      <TableCell className="text-center">{stats.totalScratches}</TableCell>
                      <TableCell className="text-center">{stats.totalPenalties}</TableCell>
                      <TableCell className="text-center font-bold">{entry.total}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
        );
      })()}

      {!isLandscape && (
        <Card className="p-4 mb-6">
          <h3 className="font-bold mb-2">Box Score</h3>
          <p className="text-xs text-muted-foreground mb-3">Rotate device to view detailed stats.</p>
          
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[100px]">Player</TableHead>
                  {allHoles.map((hole) => (
                    <TableHead key={hole} className="text-center min-w-[50px]">H{hole}</TableHead>
                  ))}
                  <TableHead className="text-center min-w-[60px]">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaderboard.map((entry, index) => {
                  const playerScores = scores[entry.player.id] || [];
                  const isLeader = index === 0;
                  
                  return (
                    <TableRow key={entry.player.id} className={cn(isLeader && "border-2 border-primary")}>
                      <TableCell className="font-semibold">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: entry.player.color }}
                          />
                          {entry.player.name}
                        </div>
                      </TableCell>
                      {allHoles.map((hole) => {
                        const holeScore = playerScores.find((s) => s.hole === hole);
                        const isLocked = !isUnlocked && hole > freeHoles;
                        return (
                          <TableCell key={hole} className={cn("text-center", isLocked && "select-none")}>
                            {isLocked ? (
                              <Lock className="w-3 h-3 mx-auto text-muted-foreground/50" />
                            ) : (
                              holeScore ? holeScore.strokes : "-"
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-bold">{entry.total}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <GameAnalytics
        players={players}
        scores={scores}
        turnTimes={turnTimes}
        gameStartTime={gameStartTime}
        gameEndTime={gameEndTime}
      />

      {!isUnlocked && allHoles.some(h => h > freeHoles) && (
        <div className="mb-6">
          <UnlockBanner variant="inline" />
        </div>
      )}

      <div className="space-y-3">
        {onSubmitToSheets && (
          <Button 
            variant="outline" 
            className="w-full h-12"
            onClick={onSubmitToSheets}
            data-testid="button-submit-sheets"
          >
            Submit to Google Sheets
          </Button>
        )}
      </div>
    </div>
  );
}
