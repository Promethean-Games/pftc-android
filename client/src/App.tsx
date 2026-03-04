import { useState, useEffect } from "react";
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
import { SaveLoadDialog } from "@/components/SaveLoadDialog";
import { BottomNav } from "@/components/BottomNav";
import { isLeader } from "@/lib/game-utils";

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
    setScreen("game");
  };

  useEffect(() => {
    if (game.isComplete && screen === "game" && !viewOnly) {
      setViewOnly(true);
      setActiveTab("summary");
    }
  }, [game.isComplete]);

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
          onEndGame={handleEndGame}
          onHome={() => setScreen("splash")}
          viewOnly={viewOnly}
          onLogout={() => {
            game.endGame();
            setViewOnly(false);
            setActiveTab("game");
            setScreen("splash");
          }}
        />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
}
