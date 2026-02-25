import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Trophy, Users, Settings, Palette, DollarSign, Minus, Plus } from "lucide-react";
import { TournamentManagementTab } from "./TournamentManagementTab";
import { PlayerDirectoryTab } from "./PlayerDirectoryTab";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface TDDashboardProps {
  onClose: () => void;
  directorPin: string;
}

type DirectorTheme = "default" | "dark-green" | "dark-blue" | "light";

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

  const handleSliderChange = (index: number, newValue: number) => {
    const updated = [...percentages];
    const oldValue = updated[index];
    const diff = newValue - oldValue;

    if (diff === 0) return;

    updated[index] = newValue;

    const otherIndices = updated.map((_, i) => i).filter(i => i !== index);
    const otherTotal = otherIndices.reduce((s, i) => s + updated[i], 0);

    if (otherTotal === 0) {
      const share = Math.floor(-diff / otherIndices.length);
      const leftover = -diff - share * otherIndices.length;
      otherIndices.forEach((i, idx) => {
        updated[i] = share + (idx < leftover ? 1 : 0);
      });
    } else {
      let remaining = -diff;
      for (let pass = 0; remaining !== 0 && pass < 10; pass++) {
        const availableIndices = otherIndices.filter(i => remaining > 0 ? updated[i] > 0 : true);
        if (availableIndices.length === 0) break;
        const perItem = remaining > 0 ? Math.min(1, Math.ceil(remaining / availableIndices.length)) : Math.max(-1, Math.floor(remaining / availableIndices.length));
        for (const i of availableIndices) {
          if (remaining === 0) break;
          const change = remaining > 0 ? Math.min(perItem, remaining, updated[i]) : Math.max(perItem, remaining);
          updated[i] -= change;
          remaining -= change;
        }
      }
    }

    const total = updated.reduce((s, v) => s + v, 0);
    if (total !== 100) {
      const adjustIdx = otherIndices.find(i => updated[i] > 0) ?? otherIndices[0];
      if (adjustIdx !== undefined) {
        updated[adjustIdx] += 100 - total;
      }
    }

    setPercentages(updated.map(v => Math.max(0, Math.min(100, v))));
  };

  const payouts = percentages.map(pct => ({
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
          <Label className="text-xs font-semibold">Payout Distribution</Label>
          {payouts.map((payout, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium w-12">
                  {index === 0 ? "1st" : index === 1 ? "2nd" : index === 2 ? "3rd" : `${index + 1}th`}
                </span>
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={payout.percentage}
                    onChange={(e) => handleSliderChange(index, parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-primary"
                    data-testid={`slider-payout-${index}`}
                  />
                </div>
                <span className="text-sm font-mono w-12 text-right" data-testid={`text-payout-pct-${index}`}>
                  {payout.percentage}%
                </span>
                <span className="text-sm font-bold w-20 text-right" data-testid={`text-payout-amount-${index}`}>
                  ${payout.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Total distributed:</span>
            <span className={cn(
              "font-bold",
              percentages.reduce((s, v) => s + v, 0) === 100 ? "text-green-600" : "text-destructive"
            )}>
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
