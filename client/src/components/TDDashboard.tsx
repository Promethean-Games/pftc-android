import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Users, Bell } from "lucide-react";
import { TournamentManagementTab } from "./TournamentManagementTab";
import { PlayerDirectoryTab } from "./PlayerDirectoryTab";
import { NotificationsTab } from "./NotificationsTab";

interface TDDashboardProps {
  onClose: () => void;
  directorPin: string;
}

export function TDDashboard({ onClose, directorPin }: TDDashboardProps) {
  const [activeTab, setActiveTab] = useState<"tournaments" | "players" | "notifications">("tournaments");
  const [notifyPlayerId, setNotifyPlayerId] = useState<number | null>(null);
  const [notifyPlayerName, setNotifyPlayerName] = useState<string | null>(null);

  const handleNotifyPlayer = useCallback((playerId: number, playerName: string) => {
    setNotifyPlayerId(playerId);
    setNotifyPlayerName(playerName);
    setActiveTab("notifications");
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    if (tab !== "notifications") {
      setNotifyPlayerId(null);
      setNotifyPlayerName(null);
    }
    setActiveTab(tab as "tournaments" | "players" | "notifications");
  }, []);

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
        onValueChange={handleTabChange}
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
            value="notifications"
            className="flex-1 flex items-center gap-2 py-4 data-[state=active]:bg-muted rounded-none"
            data-testid="tab-notifications"
          >
            <Bell className="h-5 w-5" />
            Notify
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tournaments" className="flex-1 m-0 p-0 overflow-auto">
          <TournamentManagementTab directorPin={directorPin} />
        </TabsContent>

        <TabsContent value="players" className="flex-1 m-0 p-0 overflow-auto">
          <PlayerDirectoryTab directorPin={directorPin} onNotifyPlayer={handleNotifyPlayer} />
        </TabsContent>

        <TabsContent value="notifications" className="flex-1 m-0 p-0 overflow-auto">
          <NotificationsTab directorPin={directorPin} initialPlayerId={notifyPlayerId} initialPlayerName={notifyPlayerName} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
