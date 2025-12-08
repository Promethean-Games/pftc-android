import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/ThemeProvider";
import { GameProvider, useGame } from "@/contexts/GameContext";
import { SplashScreen } from "@/components/SplashScreen";
import { PlayerSetup } from "@/components/PlayerSetup";
import { GameScreen } from "@/components/GameScreen";
import { SummaryScreen } from "@/components/SummaryScreen";
import { SettingsPanel } from "@/components/SettingsPanel";
import { SaveLoadDialog } from "@/components/SaveLoadDialog";
import { BottomNav } from "@/components/BottomNav";
import { isLeader } from "@/lib/game-utils";

type Screen = "splash" | "setup" | "game" | "summary";
type ActiveTab = "game" | "summary" | "settings" | "save";

function GameApp() {
  const game = useGame();
  const { theme, setTheme } = useTheme();
  
  const [screen, setScreen] = useState<Screen>("splash");
  const [activeTab, setActiveTab] = useState<ActiveTab>("game");
  const [showSettings, setShowSettings] = useState(false);
  const [showSaveLoad, setShowSaveLoad] = useState<"save" | "load" | null>(null);

  // Sync theme with game settings
  useEffect(() => {
    setTheme(game.settings.theme);
  }, [game.settings.theme, setTheme]);

  const handleNewGame = () => {
    game.resetGame();
    setScreen("setup");
  };

  const handleLoadGame = () => {
    setShowSaveLoad("load");
  };

  const handleStartGame = () => {
    game.startGame();
    setScreen("game");
  };

  const handleEndGame = () => {
    game.endGame();
    setScreen("summary");
    setShowSettings(false);
  };

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    
    if (tab === "settings") {
      setShowSettings(true);
    } else if (tab === "save") {
      setShowSaveLoad("save");
    } else if (tab === "summary") {
      setScreen("summary");
    } else if (tab === "game") {
      setScreen("game");
    }
  };

  const handleLoadSlot = (slot: string) => {
    game.loadGame(slot);
    setShowSaveLoad(null);
    setScreen("game");
  };

  const handleSaveSlot = (slot: string) => {
    game.saveGame(slot);
    setShowSaveLoad(null);
  };

  const handleRenameSlot = (oldSlot: string, newSlot: string) => {
    game.renameSlot(oldSlot, newSlot);
  };

  const currentPlayer = game.players[game.currentPlayerIndex];
  const playerIsLeader = currentPlayer ? isLeader(currentPlayer.id, game.players, game.scores) : false;

  // Splash Screen
  if (screen === "splash") {
    return (
      <>
        <SplashScreen onNewGame={handleNewGame} onLoadGame={handleLoadGame} />
        {showSaveLoad === "load" && (
          <SaveLoadDialog
            mode="load"
            savedGames={game.getSavedGames()}
            onLoad={handleLoadSlot}
            onRename={handleRenameSlot}
            onClose={() => setShowSaveLoad(null)}
          />
        )}
      </>
    );
  }

  // Setup Screen
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
      />
    );
  }

  // Game/Summary with Bottom Nav
  return (
    <div className="pb-16">
      {screen === "game" && currentPlayer && (
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

      {screen === "summary" && (
        <SummaryScreen
          players={game.players}
          scores={game.scores}
          onNewGame={handleNewGame}
          isGameOver={game.isComplete}
        />
      )}

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />

      {showSettings && (
        <SettingsPanel
          settings={game.settings}
          onUpdateSettings={game.updateSettings}
          onClose={() => setShowSettings(false)}
          onEndGame={handleEndGame}
        />
      )}

      {showSaveLoad && (
        <SaveLoadDialog
          mode={showSaveLoad}
          savedGames={game.getSavedGames()}
          onSave={handleSaveSlot}
          onLoad={handleLoadSlot}
          onRename={handleRenameSlot}
          onClose={() => setShowSaveLoad(null)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <GameProvider>
            <GameApp />
          </GameProvider>
        </ThemeProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
