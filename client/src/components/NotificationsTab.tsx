import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, CheckCircle, AlertCircle, Zap, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface NotificationsTabProps {
  directorPin: string;
}

interface Tournament {
  id: number;
  name: string;
  roomCode: string;
  isActive: boolean;
  isStarted: boolean;
}

interface LeaderboardEntry {
  playerId: number;
  playerName: string;
  totalStrokes: number;
  totalPar: number;
  holesCompleted: number;
  relativeToPar: number;
}

interface PresetTemplate {
  id: string;
  label: string;
  title: string;
  bodyTemplate: string;
  requiresTournament: boolean;
  needsLeaderboard: boolean;
}

const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "leaderboard_shakeup",
    label: "Leadership Shakeup!",
    title: "Leadership Shakeup!",
    bodyTemplate: "Your new leaders are:\n1st: {first}\n2nd: {second}\n3rd: {third}",
    requiresTournament: true,
    needsLeaderboard: true,
  },
  {
    id: "halftime",
    label: "Halftime Update",
    title: "Halftime Update",
    bodyTemplate: "We're at the halfway mark! Current leader: {first} ({firstScore}). Keep it up!",
    requiresTournament: true,
    needsLeaderboard: true,
  },
  {
    id: "final_holes",
    label: "Final Holes",
    title: "Final Holes!",
    bodyTemplate: "Players are approaching the final holes! Current standings: 1st {first}, 2nd {second}, 3rd {third}. It's anyone's game!",
    requiresTournament: true,
    needsLeaderboard: true,
  },
  {
    id: "tee_time",
    label: "Tee Time Reminder",
    title: "Tee Time Reminder",
    bodyTemplate: "Your tee time is coming up soon. Please head to the starting hole.",
    requiresTournament: true,
    needsLeaderboard: false,
  },
  {
    id: "weather_delay",
    label: "Weather Delay",
    title: "Weather Delay",
    bodyTemplate: "Play is temporarily suspended due to weather conditions. Please stand by for updates.",
    requiresTournament: false,
    needsLeaderboard: false,
  },
  {
    id: "play_resumed",
    label: "Play Resumed",
    title: "Play Resumed!",
    bodyTemplate: "Play has resumed! Please return to your assigned holes.",
    requiresTournament: false,
    needsLeaderboard: false,
  },
  {
    id: "food_drink",
    label: "Food & Drinks",
    title: "Refreshments Available",
    bodyTemplate: "Food and drinks are now available at the clubhouse. Come grab a bite between rounds!",
    requiresTournament: false,
    needsLeaderboard: false,
  },
  {
    id: "merchandise",
    label: "Merchandise",
    title: "Merch Alert!",
    bodyTemplate: "Hats, T-Shirts, and Towels are available now! Limited run \u2014 when they're gone, they're gone. Grab yours before they sell out!",
    requiresTournament: false,
    needsLeaderboard: false,
  },
  {
    id: "custom",
    label: "Custom Message",
    title: "",
    bodyTemplate: "",
    requiresTournament: false,
    needsLeaderboard: false,
  },
];

function formatScore(entry: LeaderboardEntry): string {
  if (entry.relativeToPar === 0) return "E";
  return entry.relativeToPar > 0 ? `+${entry.relativeToPar}` : `${entry.relativeToPar}`;
}

function applyLeaderboardData(template: string, leaderboard: LeaderboardEntry[]): string {
  const first = leaderboard[0];
  const second = leaderboard[1];
  const third = leaderboard[2];

  let result = template;
  result = result.replace("{first}", first?.playerName || "TBD");
  result = result.replace("{second}", second?.playerName || "TBD");
  result = result.replace("{third}", third?.playerName || "TBD");
  result = result.replace("{firstScore}", first ? formatScore(first) : "--");
  result = result.replace("{secondScore}", second ? formatScore(second) : "--");
  result = result.replace("{thirdScore}", third ? formatScore(third) : "--");

  return result;
}

export function NotificationsTab({ directorPin }: NotificationsTabProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRoom, setTargetRoom] = useState<string>("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>("custom");
  const [loadingPreset, setLoadingPreset] = useState(false);

  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments", directorPin],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments?directorPin=${directorPin}`);
      if (!res.ok) throw new Error("Failed to load tournaments");
      return res.json();
    },
  });

  const activeTournaments = tournaments.filter((t) => t.isActive);

  const fetchLeaderboard = useCallback(async (roomCode: string): Promise<LeaderboardEntry[]> => {
    try {
      const res = await fetch(`/api/tournaments/${roomCode}/leaderboard`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.leaderboard || [];
    } catch {
      return [];
    }
  }, []);

  const handlePresetChange = useCallback(async (presetId: string) => {
    setSelectedPreset(presetId);
    setResult(null);

    const preset = PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (!preset || presetId === "custom") {
      setTitle("");
      setBody("");
      return;
    }

    setTitle(preset.title);

    if (preset.needsLeaderboard) {
      const roomCode = targetRoom !== "all" ? targetRoom : activeTournaments[0]?.roomCode;
      if (!roomCode) {
        setBody(preset.bodyTemplate);
        return;
      }

      if (targetRoom === "all" && activeTournaments.length > 0) {
        setTargetRoom(roomCode);
      }

      setLoadingPreset(true);
      const leaderboard = await fetchLeaderboard(roomCode);
      setBody(applyLeaderboardData(preset.bodyTemplate, leaderboard));
      setLoadingPreset(false);
    } else {
      setBody(preset.bodyTemplate);
    }
  }, [targetRoom, activeTournaments, fetchLeaderboard]);

  const handleTargetChange = useCallback(async (newTarget: string) => {
    setTargetRoom(newTarget);
    setResult(null);

    const preset = PRESET_TEMPLATES.find((p) => p.id === selectedPreset);
    if (preset && preset.needsLeaderboard && newTarget !== "all") {
      setLoadingPreset(true);
      const leaderboard = await fetchLeaderboard(newTarget);
      setBody(applyLeaderboardData(preset.bodyTemplate, leaderboard));
      setLoadingPreset(false);
    }
  }, [selectedPreset, fetchLeaderboard]);

  const handleSend = async () => {
    if (!title.trim() || !body.trim()) return;

    setSending(true);
    setResult(null);
    try {
      const res = await apiRequest("POST", "/api/push/send", {
        directorPin,
        title: title.trim(),
        body: body.trim(),
        tournamentRoomCode: targetRoom === "all" ? null : targetRoom,
      });
      const data = await res.json();
      setResult({ success: true, message: data.message || `Notification sent to ${data.sentCount || 0} device(s)` });
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Failed to send notification" });
    } finally {
      setSending(false);
    }
  };

  const currentPreset = PRESET_TEMPLATES.find((p) => p.id === selectedPreset);
  const needsTournament = currentPreset?.requiresTournament && targetRoom === "all";

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-lg" data-testid="text-notifications-heading">Send Push Notification</h3>

        <div className="space-y-2">
          <Label htmlFor="notif-preset">Quick Presets</Label>
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger id="notif-preset" data-testid="select-notification-preset">
              <SelectValue placeholder="Choose a preset..." />
            </SelectTrigger>
            <SelectContent>
              {PRESET_TEMPLATES.map((preset) => (
                <SelectItem key={preset.id} value={preset.id}>
                  <span className="flex items-center gap-2">
                    {preset.id !== "custom" && <Zap className="w-3 h-3 text-amber-500" />}
                    {preset.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notif-target">Send To</Label>
          <Select value={targetRoom} onValueChange={handleTargetChange}>
            <SelectTrigger id="notif-target" data-testid="select-notification-target">
              <SelectValue placeholder="Select target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subscribers</SelectItem>
              {activeTournaments.map((t) => (
                <SelectItem key={t.roomCode} value={t.roomCode}>
                  {t.name} ({t.roomCode})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {needsTournament && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              This preset works best when sent to a specific tournament.
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="notif-title">Title</Label>
          <Input
            id="notif-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
            maxLength={100}
            data-testid="input-notification-title"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="notif-body">Message</Label>
            {loadingPreset && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
          <Textarea
            id="notif-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notification message"
            maxLength={500}
            className="resize-none"
            rows={4}
            data-testid="input-notification-body"
          />
          {selectedPreset !== "custom" && (
            <p className="text-xs text-muted-foreground">
              You can edit the text above before sending.
            </p>
          )}
        </div>

        <Button
          onClick={handleSend}
          disabled={sending || !title.trim() || !body.trim()}
          className="w-full"
          data-testid="button-send-notification"
        >
          <Send className="w-4 h-4 mr-2" />
          {sending ? "Sending..." : "Send Notification"}
        </Button>

        {result && (
          <div
            className={`flex items-center gap-2 p-3 rounded-md text-sm ${
              result.success
                ? "bg-green-500/10 text-green-700 dark:text-green-400"
                : "bg-destructive/10 text-destructive"
            }`}
            data-testid="text-notification-result"
          >
            {result.success ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {result.message}
          </div>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>Players must enable notifications in their Settings to receive them.</li>
          <li>Notifications are sent automatically when tournaments start or finish.</li>
          <li>Presets with live data auto-fill when you select a tournament.</li>
          <li>You can always edit the pre-filled text before sending.</li>
        </ul>
      </Card>
    </div>
  );
}
