import { useState, useEffect } from "react";
import { useGameNotification, requestNotificationPermission } from "@/hooks/useGameNotification";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { UnlockProvider } from "@/contexts/UnlockContext";
import { SplashScreen } from "@/components/SplashScreen";
import { PlayerSetup } from "@/components/PlayerSetup";
import { GameScreen } from "@/components/GameScreen";
import { SummaryScreen } from "@/components/SummaryScreen";
import { SettingsPanel } from "@/components/SettingsPanel";
import { PrivacyPolicy } from "@/components/PrivacyPolicy";
import { SaveLoadDialog } from "@/components/SaveLoadDialog";
import { BottomNav } from "@/components/BottomNav";
import { isLeader } from "@/lib/game-utils";
import { initAnalytics, trackEvent } from "@/lib/analytics";
import { APP_VERSION } from "@/lib/constants";
import { isRunningInTwa } from "@/lib/play-billing";
import { useBackHandler } from "@/hooks/useBackHandler";

type Screen = "splash" | "load" | "setup" | "game" | "summary";
type ActiveTab = "game" | "summary" | "settings" | "save";

function GameApp() {
  const game = useGame();
  const { theme, setTheme } = useTheme();
  
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = localStorage.getItem("appScreen");
    if (saved && ["splash", "setup", "game", "summary"].includes(saved)) {
      if (saved === "game" || saved === "summary") {
        const hasGame = localStorage.getItem("currentGame");
        if (hasGame) return saved as Screen;
        return "splash";
      }
      if (saved === "setup") return "setup" as Screen;
    }
    return "splash";
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const saved = localStorage.getItem("appActiveTab");
    if (saved && ["game", "summary", "settings", "save"].includes(saved)) return saved as ActiveTab;
    return "game";
  });
  const [viewOnly, setViewOnly] = useState(() => {
    return localStorage.getItem("appViewOnly") === "true";
  });
  const [showPrivacy, setShowPrivacy] = useState(false);

  useEffect(() => {
    initAnalytics();
    trackEvent("app_opened", {
      platform: isRunningInTwa() ? "android" : "web",
      version: APP_VERSION,
    });
  }, []);

  useEffect(() => {
    localStorage.setItem("appScreen", screen);
  }, [screen]);

  useEffect(() => {
    localStorage.setItem("appActiveTab", activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem("appViewOnly", viewOnly ? "true" : "false");
  }, [viewOnly]);

  useEffect(() => {
    setTheme(game.settings.theme);
  }, [game.settings.theme, setTheme]);

  useEffect(() => {
    if (screen === "game" && activeTab === "game" && !game.isComplete) {
      game.resumeTimer();
    } else {
      game.pauseTimer();
    }
  }, [screen, activeTab, game.isComplete]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        game.pauseTimer();
      } else if (screen === "game" && activeTab === "game" && !game.isComplete) {
        game.resumeTimer();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [screen, activeTab, game.isComplete]);

  // Back-button / Android back-gesture handling for screen-level navigation.
  // Each registered handler intercepts one back-press and navigates one step up.

  // Load dialog → splash
  useBackHandler(screen === "load" ? () => setScreen("splash") : null);

  // Player setup → splash
  useBackHandler(screen === "setup" ? () => setScreen("splash") : null);

  // In-game: non-default tab (settings / save / summary) → game tab
  useBackHandler(
    screen === "game" && activeTab !== "game" && !viewOnly
      ? () => setActiveTab("game")
      : null
  );

  const handleNewGame = () => {
    game.resetGame();
    setViewOnly(false);
    setScreen("setup");
  };

  const handleLoadGame = () => {
    setScreen("load");
  };

  const handleStartGame = () => {
    game.startGame();
    setActiveTab("game");
    setScreen("game");
    trackEvent("game_started", {
      player_count: game.players.length,
      mode: "full",
    });
  };

  useEffect(() => {
    if (game.isComplete && screen === "game" && !viewOnly) {
      setViewOnly(true);
      setActiveTab("summary");
      const durationMs = game.totalPlayTimeMs || 0;
      const durationMin5 = Math.round(durationMs / 300000) * 5;
      trackEvent("game_completed", {
        holes_played: game.currentHole,
        player_count: game.players.length,
        duration_minutes: durationMin5,
      });
    }
  }, [game.isComplete]);

  useEffect(() => {
    if (screen === "game") {
      requestNotificationPermission().catch(() => {});
    }
  }, [screen]);

  const handleEndGame = () => {
    game.endGame();
    setActiveTab("summary");
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (viewOnly && (tab === "game" || tab === "save")) return;
    setActiveTab(tab);
  };

  const handleLoadSlot = (slot: string) => {
    game.loadGame(slot);
    setViewOnly(false);
    setScreen("game");
    setActiveTab("game");
  };

  const handleSaveSlot = (slot: string) => {
    game.saveGame(slot);
  };

  const handleRenameSlot = (oldSlot: string, newSlot: string) => {
    game.renameSlot(oldSlot, newSlot);
  };

  const handleDeleteSlot = (slot: string) => {
    game.deleteSlot(slot);
  };

  const currentPlayer = game.players[game.currentPlayerIndex];
  const playerIsLeader = currentPlayer ? isLeader(currentPlayer.id, game.players, game.scores) : false;

  const _notifScore = currentPlayer
    ? game.scores[currentPlayer.id]?.find((s) => s.hole === game.currentHole)
    : undefined;
  useGameNotification({
    isActive:
      screen === "game" &&
      activeTab === "game" &&
      !viewOnly &&
      !!currentPlayer &&
      !game.isComplete,
    playerName: currentPlayer?.name ?? "",
    hole: game.currentHole,
    strokes: _notifScore?.strokes ?? 0,
    par: _notifScore?.par ?? 0,
    penalties: _notifScore?.penalties ?? 0,
  });

  if (screen === "splash") {
    return (
      <SplashScreen 
        onNewGame={handleNewGame} 
        onLoadGame={handleLoadGame}
      />
    );
  }

  if (screen === "load") {
    return (
      <SaveLoadDialog
        mode="load"
        savedGames={game.getSavedGames()}
        onLoad={handleLoadSlot}
        onRename={handleRenameSlot}
        onDelete={handleDeleteSlot}
        onClose={() => setScreen("splash")}
      />
    );
  }

  if (screen === "setup") {
    return (
      <PlayerSetup
        players={game.players}
        onAddPlayer={game.addPlayer}
        onRemovePlayer={game.removePlayer}
        onUpdatePlayerName={game.updatePlayerName}
        onUpdatePlayerColor={game.updatePlayerColor}
        onMovePlayer={game.movePlayer}
        onStartGame={handleStartGame}
        onBack={() => setScreen("splash")}
      />
    );
  }

  return (
    <div className="pb-16">
      {activeTab === "game" && currentPlayer && (
        <GameScreen
          players={game.players}
          currentPlayer={currentPlayer}
          currentHole={game.currentHole}
          scores={game.scores}
          isLeader={playerIsLeader}
          leftHandedMode={game.settings.leftHandedMode}
          onPreviousPlayer={game.previousPlayer}
          onNextPlayer={game.nextPlayer}
          onUpdateScore={(score) => game.updateScore(currentPlayer.id, game.currentHole, score)}
          onNextCard={game.nextCard}
          onUndo={game.undo}
          canUndo={true}
          onSetParForAll={(par) => game.setParForAllPlayers(game.currentHole, par)}
          onHome={() => setScreen("splash")}
        />
      )}

      {activeTab === "summary" && (
        <SummaryScreen
          players={game.players}
          scores={game.scores}
          onNewGame={handleNewGame}
          isGameOver={game.isComplete}
          viewOnly={viewOnly}
          onUpdateScore={(playerId, hole, score) => game.updateScore(playerId, hole, score)}
          turnTimes={game.turnTimes}
          gameStartTime={game.gameStartTime}
          gameEndTime={game.gameEndTime}
          totalPlayTimeMs={game.totalPlayTimeMs}
        />
      )}

      {activeTab === "save" && (
        <SaveLoadDialog
          mode="save"
          savedGames={game.getSavedGames()}
          onSave={handleSaveSlot}
          onLoad={handleLoadSlot}
          onRename={handleRenameSlot}
          onDelete={handleDeleteSlot}
          onEndGame={handleEndGame}
          onNewGame={handleNewGame}
          onClose={() => setActiveTab("game")}
        />
      )}

      {activeTab === "settings" && (
        <SettingsPanel
          settings={game.settings}
          players={game.players}
          onUpdateSettings={game.updateSettings}
          onAddPlayer={game.addPlayer}
          onDropPlayer={game.removePlayer}
          onEndGame={handleEndGame}
          onHome={() => setScreen("splash")}
          viewOnly={viewOnly}
          isGameOver={game.isComplete}
          onLogout={() => {
            game.endGame();
            setViewOnly(false);
            setActiveTab("game");
            setScreen("splash");
          }}
        />
      )}

      {showPrivacy && (
        <PrivacyPolicy onClose={() => setShowPrivacy(false)} />
      )}

      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        viewOnly={viewOnly}
        onGoHome={() => {
          game.endGame();
          setViewOnly(false);
          setActiveTab("game");
          setScreen("splash");
        }}
      />
    </div>
  );
}

export default function App() {
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    const handler = () => setUpdateReady(true);
    window.addEventListener("swUpdateReady", handler);
    return () => window.removeEventListener("swUpdateReady", handler);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <UnlockProvider>
            <GameProvider>
              <GameApp />
            </GameProvider>
          </UnlockProvider>
        </ThemeProvider>
        <Toaster />
        {updateReady && (
          <div
            className="fixed inset-x-0 bottom-0 z-[9999] flex items-center justify-between gap-3 bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg"
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            <span>A new version is ready.</span>
            <button
              onClick={() => window.location.reload()}
              className="rounded bg-white/20 px-3 py-1 text-xs font-bold transition-colors hover:bg-white/30 active:bg-white/40"
            >
              Refresh
            </button>
          </div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}
