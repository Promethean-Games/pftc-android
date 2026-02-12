import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, CheckCircle, AlertCircle } from "lucide-react";
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

export function NotificationsTab({ directorPin }: NotificationsTabProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [targetRoom, setTargetRoom] = useState<string>("all");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: tournaments = [] } = useQuery<Tournament[]>({
    queryKey: ["/api/tournaments", directorPin],
    queryFn: async () => {
      const res = await fetch(`/api/tournaments?directorPin=${directorPin}`);
      if (!res.ok) throw new Error("Failed to load tournaments");
      return res.json();
    },
  });

  const activeTournaments = tournaments.filter((t) => t.isActive);

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
      setTitle("");
      setBody("");
    } catch (err: any) {
      setResult({ success: false, message: err.message || "Failed to send notification" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4 space-y-4">
        <h3 className="font-semibold text-lg" data-testid="text-notifications-heading">Send Push Notification</h3>

        <div className="space-y-2">
          <Label htmlFor="notif-target">Send To</Label>
          <Select value={targetRoom} onValueChange={setTargetRoom}>
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
          <Label htmlFor="notif-body">Message</Label>
          <Textarea
            id="notif-body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Notification message"
            maxLength={500}
            className="resize-none"
            rows={3}
            data-testid="input-notification-body"
          />
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
          <li>Use custom notifications for announcements, delays, or special updates.</li>
        </ul>
      </Card>
    </div>
  );
}
