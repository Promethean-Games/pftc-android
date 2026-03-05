import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Clock, Timer, TrendingUp, TrendingDown, Zap, Target, Award, BarChart3 } from "lucide-react";
import type { Player, HoleScore } from "@shared/schema";
import type { TurnTime } from "@/contexts/GameContext";
import { cn } from "@/lib/utils";

interface GameAnalyticsProps {
  players: Player[];
  scores: Record<string, HoleScore[]>;
  turnTimes: TurnTime[];
  gameStartTime: number;
  gameEndTime: number | null;
  totalPlayTimeMs?: number;
}

function formatDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatShortDuration(ms: number): string {
  if (ms <= 0) return "0s";
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function GameAnalytics({ players, scores, turnTimes, gameStartTime, gameEndTime, totalPlayTimeMs = 0 }: GameAnalyticsProps) {
  const analytics = useMemo(() => {
    if (turnTimes.length === 0 || players.length === 0) return null;

    const sumOfTurnTimes = turnTimes.reduce((sum, t) => sum + (t.endTime - t.startTime), 0);
    const totalGameTime = totalPlayTimeMs > 0
      ? totalPlayTimeMs
      : sumOfTurnTimes > 0
        ? sumOfTurnTimes
        : (gameEndTime || Date.now()) - (gameStartTime > 0 ? gameStartTime : Math.min(...turnTimes.map(t => t.startTime)));

    const playerTimeMap: Record<string, number> = {};
    const playerTurnsByHole: Record<string, Record<number, number>> = {};
    const holeTotalTimes: Record<number, number> = {};

    for (const tt of turnTimes) {
      const duration = tt.endTime - tt.startTime;
      playerTimeMap[tt.playerId] = (playerTimeMap[tt.playerId] || 0) + duration;

      if (!playerTurnsByHole[tt.playerId]) playerTurnsByHole[tt.playerId] = {};
      playerTurnsByHole[tt.playerId][tt.hole] = duration;

      holeTotalTimes[tt.hole] = (holeTotalTimes[tt.hole] || 0) + duration;
    }

    const allHoles = [...new Set(turnTimes.map(t => t.hole))].sort((a, b) => a - b);

    const chartData = allHoles.map(hole => {
      const point: Record<string, number | string> = { hole: `Card ${hole}` };
      for (const p of players) {
        const duration = playerTurnsByHole[p.id]?.[hole];
        if (duration !== undefined) {
          point[p.name] = Math.round(duration / 1000);
        }
      }
      return point;
    });

    const playerFastest: Record<string, { hole: number; time: number }> = {};
    const playerSlowest: Record<string, { hole: number; time: number }> = {};

    for (const p of players) {
      const turns = playerTurnsByHole[p.id];
      if (!turns) continue;
      let fastest = { hole: 0, time: Infinity };
      let slowest = { hole: 0, time: -1 };
      for (const [h, t] of Object.entries(turns)) {
        if (t < fastest.time) fastest = { hole: Number(h), time: t };
        if (t > slowest.time) slowest = { hole: Number(h), time: t };
      }
      playerFastest[p.id] = fastest;
      playerSlowest[p.id] = slowest;
    }

    let groupFastest = { hole: 0, time: Infinity };
    let groupSlowest = { hole: 0, time: -1 };
    for (const [h, t] of Object.entries(holeTotalTimes)) {
      if (t < groupFastest.time) groupFastest = { hole: Number(h), time: t };
      if (t > groupSlowest.time) groupSlowest = { hole: Number(h), time: t };
    }

    const playerAvgTurn: Record<string, number> = {};
    for (const p of players) {
      const turns = Object.values(playerTurnsByHole[p.id] || {});
      if (turns.length > 0) {
        playerAvgTurn[p.id] = turns.reduce((a, b) => a + b, 0) / turns.length;
      }
    }

    const playerScorePerMinute: Record<string, number> = {};
    const playerSecondsPerStroke: Record<string, number> = {};
    for (const p of players) {
      const totalTime = playerTimeMap[p.id] || 0;
      const playerHoleScores = scores[p.id] || [];
      const totalStrokes = playerHoleScores.reduce((sum, s) => sum + s.strokes + s.scratches + s.penalties, 0);
      if (totalTime > 0 && totalStrokes > 0) {
        playerScorePerMinute[p.id] = totalStrokes / (totalTime / 60000);
        playerSecondsPerStroke[p.id] = (totalTime / 1000) / totalStrokes;
      }
    }

    const consistencyScores: Record<string, number> = {};
    for (const p of players) {
      const turns = Object.values(playerTurnsByHole[p.id] || {});
      if (turns.length > 1) {
        const avg = turns.reduce((a, b) => a + b, 0) / turns.length;
        const variance = turns.reduce((sum, t) => sum + Math.pow(t - avg, 2), 0) / turns.length;
        consistencyScores[p.id] = Math.sqrt(variance) / avg;
      }
    }

    const streakData: Record<string, { bestStreak: number; currentStreak: number }> = {};
    for (const p of players) {
      const playerHoleScores = (scores[p.id] || []).sort((a, b) => a.hole - b.hole);
      let bestStreak = 0;
      let currentStreak = 0;
      for (const s of playerHoleScores) {
        const total = s.strokes + s.scratches + s.penalties;
        if (total <= s.par) {
          currentStreak++;
          bestStreak = Math.max(bestStreak, currentStreak);
        } else {
          currentStreak = 0;
        }
      }
      streakData[p.id] = { bestStreak, currentStreak };
    }

    return {
      totalGameTime,
      playerTimeMap,
      playerTurnsByHole,
      chartData,
      allHoles,
      playerFastest,
      playerSlowest,
      groupFastest,
      groupSlowest,
      playerAvgTurn,
      playerScorePerMinute,
      playerSecondsPerStroke,
      consistencyScores,
      streakData,
    };
  }, [players, scores, turnTimes, gameStartTime, gameEndTime, totalPlayTimeMs]);

  if (!analytics) {
    return (
      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" /> Time Analytics
        </h3>
        <p className="text-sm text-muted-foreground">No timing data available for this game.</p>
      </Card>
    );
  }

  const mostConsistentPlayer = players.reduce((best, p) => {
    const score = analytics.consistencyScores[p.id];
    const bestScore = best ? analytics.consistencyScores[best.id] : Infinity;
    if (score !== undefined && score < bestScore) return p;
    return best;
  }, null as Player | null);

  const bestStreakPlayer = players.reduce((best, p) => {
    const streak = analytics.streakData[p.id]?.bestStreak || 0;
    const bestStreak = best ? (analytics.streakData[best.id]?.bestStreak || 0) : 0;
    if (streak > bestStreak) return p;
    return best;
  }, null as Player | null);

  return (
    <>
      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Time Summary
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between border-b border-dashed pb-2">
            <span>Total Game Time:</span>
            <span className="font-semibold" data-testid="text-total-game-time">{formatDuration(analytics.totalGameTime)}</span>
          </div>
          <div className="flex justify-between border-b border-dashed pb-2">
            <span>Cards Played:</span>
            <span className="font-semibold">{analytics.allHoles.length}</span>
          </div>
          {players.map(p => (
            <div key={p.id} className="flex justify-between border-b border-dashed pb-2">
              <span className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: p.color }} />
                {p.name}:
              </span>
              <span className="font-semibold" data-testid={`text-player-time-${p.id}`}>{formatDuration(analytics.playerTimeMap[p.id] || 0)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Timer className="w-5 h-5" /> Turn Duration by Card
        </h3>
        <div className="w-full" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={analytics.chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <XAxis dataKey="hole" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} label={{ value: "sec", angle: -90, position: "insideLeft", offset: 30, style: { fontSize: 11 } }} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
                formatter={(value: number) => [`${value}s`, undefined]}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {players.map(p => (
                <Line
                  key={p.id}
                  type="monotone"
                  dataKey={p.name}
                  stroke={p.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: p.color }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5" /> Speed Records
        </h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between p-2 rounded-lg border border-dashed">
            <span className="flex items-center gap-2"><TrendingDown className="w-4 h-4 text-green-500" /> Fastest Card (Group):</span>
            <span className="font-semibold" data-testid="text-group-fastest">Card {analytics.groupFastest.hole} ({formatShortDuration(analytics.groupFastest.time)})</span>
          </div>
          <div className="flex items-center justify-between p-2 rounded-lg border border-dashed">
            <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-red-500" /> Slowest Card (Group):</span>
            <span className="font-semibold" data-testid="text-group-slowest">Card {analytics.groupSlowest.hole} ({formatShortDuration(analytics.groupSlowest.time)})</span>
          </div>
          {players.map(p => {
            const fastest = analytics.playerFastest[p.id];
            const slowest = analytics.playerSlowest[p.id];
            const avg = analytics.playerAvgTurn[p.id];
            if (!fastest || !slowest) return null;
            return (
              <div key={p.id} className="p-2 rounded-lg border">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-semibold">{p.name}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>
                    <TrendingDown className="w-3 h-3 text-green-500 inline mr-1" />
                    Fastest: Card {fastest.hole} ({formatShortDuration(fastest.time)})
                  </div>
                  <div>
                    <TrendingUp className="w-3 h-3 text-red-500 inline mr-1" />
                    Slowest: Card {slowest.hole} ({formatShortDuration(slowest.time)})
                  </div>
                  <div>
                    <Clock className="w-3 h-3 inline mr-1" />
                    Avg: {avg ? formatShortDuration(avg) : "-"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 mb-6">
        <h3 className="font-bold mb-3 flex items-center gap-2">
          <Award className="w-5 h-5" /> Performance Insights
        </h3>
        <div className="space-y-2 text-sm">
          {mostConsistentPlayer && (
            <div className="flex items-center justify-between p-2 rounded-lg border border-dashed">
              <span className="flex items-center gap-2">
                <Target className="w-4 h-4 text-blue-500" /> Most Consistent Pace:
              </span>
              <span className="font-semibold flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: mostConsistentPlayer.color }} />
                {mostConsistentPlayer.name}
              </span>
            </div>
          )}
          {bestStreakPlayer && analytics.streakData[bestStreakPlayer.id]?.bestStreak > 1 && (
            <div className="flex items-center justify-between p-2 rounded-lg border border-dashed">
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" /> Best Par Streak:
              </span>
              <span className="font-semibold flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: bestStreakPlayer.color }} />
                {bestStreakPlayer.name} ({analytics.streakData[bestStreakPlayer.id].bestStreak} cards)
              </span>
            </div>
          )}
          {players.map(p => {
            const spm = analytics.playerScorePerMinute[p.id];
            const sps = analytics.playerSecondsPerStroke[p.id];
            if (!spm || !sps) return null;
            return (
              <div key={p.id} className="p-2 rounded-lg border border-dashed">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="font-semibold">{p.name}</span>
                </div>
                <div className="flex justify-between gap-4 text-xs text-muted-foreground">
                  <span>{sps.toFixed(2)} sec/stroke</span>
                  <span>{spm.toFixed(1)} strokes/min</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </>
  );
}
