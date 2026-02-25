import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trophy, Users, Settings, Palette, DollarSign, Minus, Plus, GripVertical } from "lucide-react";
import { TournamentManagementTab } from "./TournamentManagementTab";
import { PlayerDirectoryTab } from "./PlayerDirectoryTab";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TDDashboardProps {
  onClose: () => void;
  directorPin: string;
}

type DirectorTheme = "default" | "dark-green" | "dark-blue" | "light";

const PLACE_COLORS = [
  "bg-yellow-500",
  "bg-gray-400",
  "bg-amber-700",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-cyan-500",
  "bg-rose-500",
];

const PLACE_COLORS_HEX = [
  "#eab308",
  "#9ca3af",
  "#b45309",
  "#3b82f6",
  "#10b981",
  "#a855f7",
  "#ec4899",
  "#f97316",
  "#06b6d4",
  "#f43f5e",
];

function ordinal(n: number): string {
  if (n === 1) return "1st";
  if (n === 2) return "2nd";
  if (n === 3) return "3rd";
  return `${n}th`;
}

interface MultiHandleSliderProps {
  percentages: number[];
  onChange: (newPercentages: number[]) => void;
}

function MultiHandleSlider({ percentages, onChange }: MultiHandleSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<number | null>(null);
  const startXRef = useRef(0);
  const startPercentsRef = useRef<number[]>([]);

  const cumulative = percentages.reduce<number[]>((acc, pct, i) => {
    acc.push((acc[i - 1] || 0) + pct);
    return acc;
  }, []);

  const handlePositions = cumulative.slice(0, -1);

  const getPercentFromX = useCallback((clientX: number): number => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  }, []);

  const handlePointerDown = useCallback((handleIndex: number, e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    draggingRef.current = handleIndex;
    startXRef.current = getPercentFromX(e.clientX);
    startPercentsRef.current = [...percentages];
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [percentages, getPercentFromX]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (draggingRef.current === null) return;
    e.preventDefault();

    const handleIndex = draggingRef.current;
    const currentPercent = getPercentFromX(e.clientX);
    const delta = currentPercent - startXRef.current;
    const startPerc = startPercentsRef.current;

    const leftIdx = handleIndex;
    const rightIdx = handleIndex + 1;

    let newLeft = startPerc[leftIdx] + delta;
    let newRight = startPerc[rightIdx] - delta;

    if (newLeft < 1) {
      newRight += (newLeft - 1);
      newLeft = 1;
    }
    if (newRight < 1) {
      newLeft += (newRight - 1);
      newRight = 1;
    }

    newLeft = Math.max(1, Math.round(newLeft));
    newRight = Math.max(1, Math.round(newRight));

    const combined = startPerc[leftIdx] + startPerc[rightIdx];
    if (newLeft + newRight !== combined) {
      newRight = combined - newLeft;
    }
    if (newRight < 1) {
      newRight = 1;
      newLeft = combined - 1;
    }

    const updated = [...startPerc];
    updated[leftIdx] = newLeft;
    updated[rightIdx] = newRight;
    onChange(updated);
  }, [getPercentFromX, onChange]);

  const handlePointerUp = useCallback(() => {
    draggingRef.current = null;
  }, []);

  return (
    <div className="space-y-2">
      <div
        ref={trackRef}
        className="relative h-12 rounded-md overflow-visible flex select-none touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        data-testid="slider-track"
      >
        {percentages.map((pct, i) => (
          <div
            key={i}
            className={cn(
              "h-full flex items-center justify-center relative",
              PLACE_COLORS[i % PLACE_COLORS.length],
              i === 0 && "rounded-l-md",
              i === percentages.length - 1 && "rounded-r-md"
            )}
            style={{ width: `${pct}%`, minWidth: pct > 0 ? "2px" : "0px" }}
          >
            {pct >= 8 && (
              <span className="text-xs font-bold text-white drop-shadow-md truncate px-1" data-testid={`text-segment-pct-${i}`}>
                {Math.round(pct)}%
              </span>
            )}
          </div>
        ))}

        {handlePositions.map((pos, i) => (
          <div
            key={`handle-${i}`}
            className="absolute top-0 h-full flex items-center z-10"
            style={{ left: `${pos}%`, transform: "translateX(-50%)" }}
          >
            <div
              className="w-6 h-14 rounded-md bg-background border-2 border-foreground/30 flex items-center justify-center cursor-ew-resize shadow-md"
              onPointerDown={(e) => handlePointerDown(i, e)}
              data-testid={`handle-payout-${i}`}
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PayoutCalculator() {
  const [numPlayers, setNumPlayers] = useState(16);
  const [entryFee, setEntryFee] = useState(20);
  const [addedPrize, setAddedPrize] = useState(0);
  const [numSpots, setNumSpots] = useState(3);
  const [percentages, setPercentages] = useState<number[]>([50, 30, 20]);

  const totalPrizePool = numPlayers * entryFee + addedPrize;

  const adjustSpots = (newCount: number) => {
    const clamped = Math.max(1, Math.min(10, newCount));
    const newPercentages: number[] = [];
    const basePercent = Math.floor(100 / clamped);
    let remainder = 100 - basePercent * clamped;
    for (let i = 0; i < clamped; i++) {
      newPercentages.push(basePercent + (i < remainder ? 1 : 0));
    }
    setNumSpots(clamped);
    setPercentages(newPercentages);
  };

  const payouts = percentages.map((pct, i) => ({
    place: i + 1,
    percentage: pct,
    amount: Math.round((pct / 100) * totalPrizePool * 100) / 100,
  }));

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <DollarSign className="w-4 h-4" />
        Payout Calculator
      </h3>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="numPlayers" className="text-xs">Number of Players</Label>
            <Input
              id="numPlayers"
              type="number"
              inputMode="numeric"
              min={1}
              value={numPlayers}
              onChange={(e) => setNumPlayers(Math.max(1, parseInt(e.target.value) || 0))}
              data-testid="input-num-players"
            />
          </div>
          <div>
            <Label htmlFor="entryFee" className="text-xs">Entry Fee ($)</Label>
            <Input
              id="entryFee"
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              value={entryFee}
              onChange={(e) => setEntryFee(Math.max(0, parseFloat(e.target.value) || 0))}
              data-testid="input-entry-fee"
            />
          </div>
          <div>
            <Label htmlFor="addedPrize" className="text-xs">Added Prize Money ($)</Label>
            <Input
              id="addedPrize"
              type="number"
              inputMode="decimal"
              min={0}
              step={1}
              value={addedPrize}
              onChange={(e) => setAddedPrize(Math.max(0, parseFloat(e.target.value) || 0))}
              data-testid="input-added-prize"
            />
          </div>
          <div>
            <Label className="text-xs">Spots to Pay</Label>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustSpots(numSpots - 1)}
                disabled={numSpots <= 1}
                data-testid="button-decrease-spots"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-lg font-bold w-8 text-center" data-testid="text-num-spots">{numSpots}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustSpots(numSpots + 1)}
                disabled={numSpots >= 10}
                data-testid="button-increase-spots"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground">Total Prize Pool</p>
          <p className="text-2xl font-bold" data-testid="text-total-prize-pool">
            ${totalPrizePool.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          {addedPrize > 0 && (
            <p className="text-xs text-muted-foreground">
              ({numPlayers} x ${entryFee} + ${addedPrize} added)
            </p>
          )}
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-semibold">Drag handles to adjust payout split</Label>
          <MultiHandleSlider
            percentages={percentages}
            onChange={setPercentages}
          />
        </div>

        <div className="space-y-2">
          {payouts.map((payout) => (
            <div key={payout.place} className="flex items-center gap-2">
              <div
                className={cn("w-3 h-3 rounded-full flex-shrink-0", PLACE_COLORS[(payout.place - 1) % PLACE_COLORS.length])}
              />
              <span className="text-sm font-medium w-8">{ordinal(payout.place)}</span>
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", PLACE_COLORS[(payout.place - 1) % PLACE_COLORS.length])}
                  style={{ width: `${payout.percentage}%` }}
                />
              </div>
              <span className="text-sm font-mono w-10 text-right text-muted-foreground" data-testid={`text-payout-pct-${payout.place - 1}`}>
                {payout.percentage}%
              </span>
              <span className="text-sm font-bold w-20 text-right" data-testid={`text-payout-amount-${payout.place - 1}`}>
                ${payout.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total distributed:</span>
            <span className={cn(
              "font-bold",
              percentages.reduce((s, v) => s + v, 0) === 100 ? "text-green-600" : "text-destructive"
            )} data-testid="text-total-distributed">
              {percentages.reduce((s, v) => s + v, 0)}%
              {" "}(${payouts.reduce((s, p) => s + p.amount, 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function TDDashboard({ onClose, directorPin }: TDDashboardProps) {
  const [activeTab, setActiveTab] = useState<"tournaments" | "players" | "settings">("tournaments");
  const [directorTheme, setDirectorTheme] = useState<DirectorTheme>(() => {
    const saved = localStorage.getItem("directorTheme");
    return (saved as DirectorTheme) || "default";
  });

  const handleThemeChange = (theme: DirectorTheme) => {
    setDirectorTheme(theme);
    localStorage.setItem("directorTheme", theme);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" data-testid="td-dashboard">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-3">
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          className="text-primary-foreground"
          data-testid="button-back"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-bold flex-1">Tournament Director Dashboard</h1>
      </header>

      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as "tournaments" | "players" | "settings")}
        className="flex-1 flex flex-col"
      >
        <TabsList className="w-full h-auto rounded-none border-b bg-background p-0">
          <TabsTrigger 
            value="tournaments"
            className="flex-1 flex items-center gap-2 py-4 data-[state=active]:bg-muted rounded-none"
            data-testid="tab-tournaments"
          >
            <Trophy className="h-5 w-5" />
            Tournaments
          </TabsTrigger>
          <TabsTrigger 
            value="players"
            className="flex-1 flex items-center gap-2 py-4 data-[state=active]:bg-muted rounded-none"
            data-testid="tab-players"
          >
            <Users className="h-5 w-5" />
            Players
          </TabsTrigger>
          <TabsTrigger 
            value="settings"
            className="flex-1 flex items-center gap-2 py-4 data-[state=active]:bg-muted rounded-none"
            data-testid="tab-settings"
          >
            <Settings className="h-5 w-5" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments" className="flex-1 m-0 p-0 overflow-auto">
          <TournamentManagementTab directorPin={directorPin} />
        </TabsContent>

        <TabsContent value="players" className="flex-1 m-0 p-0 overflow-auto">
          <PlayerDirectoryTab directorPin={directorPin} />
        </TabsContent>

        <TabsContent value="settings" className="flex-1 m-0 p-0 overflow-auto">
          <div className="p-4 space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Director Portal Theme
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  className={`p-4 rounded-lg border-2 transition-all ${
                    directorTheme === "default" 
                      ? "border-green-500 bg-green-500/10" 
                      : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => handleThemeChange("default")}
                  data-testid="theme-default"
                >
                  <div className="w-full h-8 rounded bg-gradient-to-r from-gray-800 to-gray-600 mb-2" />
                  <p className="text-sm font-medium">PftC Default</p>
                </button>
                <button
                  className={`p-4 rounded-lg border-2 transition-all ${
                    directorTheme === "dark-green" 
                      ? "border-green-500 bg-green-500/10" 
                      : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => handleThemeChange("dark-green")}
                  data-testid="theme-dark-green"
                >
                  <div className="w-full h-8 rounded bg-gradient-to-r from-emerald-900 to-emerald-700 mb-2" />
                  <p className="text-sm font-medium">Dark Green</p>
                </button>
                <button
                  className={`p-4 rounded-lg border-2 transition-all ${
                    directorTheme === "dark-blue" 
                      ? "border-green-500 bg-green-500/10" 
                      : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => handleThemeChange("dark-blue")}
                  data-testid="theme-dark-blue"
                >
                  <div className="w-full h-8 rounded bg-gradient-to-r from-slate-900 to-slate-700 mb-2" />
                  <p className="text-sm font-medium">Dark Blue</p>
                </button>
                <button
                  className={`p-4 rounded-lg border-2 transition-all ${
                    directorTheme === "light" 
                      ? "border-green-500 bg-green-500/10" 
                      : "border-transparent hover:border-gray-300"
                  }`}
                  onClick={() => handleThemeChange("light")}
                  data-testid="theme-light"
                >
                  <div className="w-full h-8 rounded bg-gradient-to-r from-gray-100 to-gray-300 mb-2" />
                  <p className="text-sm font-medium">Light</p>
                </button>
              </div>
            </Card>

            <PayoutCalculator />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
