import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Player, HoleScore } from "@shared/schema";
import { calculatePlayerTotal, getLeaderboard } from "@/lib/game-utils";
import { cn } from "@/lib/utils";

interface SummaryScreenProps {
  players: Player[];
  scores: Record<string, HoleScore[]>;
  onNewGame: () => void;
  onSubmitToSheets?: () => void;
}

export function SummaryScreen({ players, scores, onNewGame, onSubmitToSheets }: SummaryScreenProps) {
  const leaderboard = getLeaderboard(players, scores);
  const winner = leaderboard[0];

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
      
      {winner && (
        <p className="text-center text-muted-foreground mb-6">
          Winner: <span className="font-bold" style={{ color: winner.player.color }}>{winner.player.name}</span> ({winner.total} strokes)
        </p>
      )}

      {/* Summary Stats */}
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

      {/* Leaderboard - Collapsed View */}
      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-3">Leaderboard</h3>
        <div className="space-y-2">
          {leaderboard.map((entry, index) => {
            const stats = calculatePlayerTotal(scores[entry.player.id] || []);
            const isWinner = index === 0;
            
            return (
              <div
                key={entry.player.id}
                className={cn(
                  "grid grid-cols-[1.5fr_repeat(4,1fr)] gap-2 items-center p-3 rounded-lg border",
                  isWinner && "border-primary border-2"
                )}
                data-testid={`leaderboard-${entry.player.id}`}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: entry.player.color }}
                  />
                  <span className="font-semibold truncate">{entry.player.name}</span>
                </div>
                <div className="text-center text-sm">
                  <div className="font-bold">{entry.total}</div>
                  <div className="text-xs text-muted-foreground">Total</div>
                </div>
                <div className="text-center text-sm">
                  <div>{stats.totalScratches}</div>
                  <div className="text-xs text-muted-foreground">Scratch</div>
                </div>
                <div className="text-center text-sm">
                  <div>{stats.totalPenalties}</div>
                  <div className="text-xs text-muted-foreground">Penalty</div>
                </div>
                <div className="text-center text-sm font-bold">
                  #{index + 1}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Box Score */}
      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-2">Box Score</h3>
        <p className="text-xs text-muted-foreground mb-3">Rotate device to view expanded box score.</p>
        
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
                const isWinner = index === 0;
                
                return (
                  <TableRow key={entry.player.id} className={cn(isWinner && "border-2 border-primary")}>
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
                      return (
                        <TableCell key={hole} className="text-center">
                          {holeScore ? holeScore.strokes : "-"}
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
        <Button 
          className="w-full h-12 text-lg"
          onClick={onNewGame}
          data-testid="button-new-game"
        >
          New Game
        </Button>
      </div>
    </div>
  );
}
