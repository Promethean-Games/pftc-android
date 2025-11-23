import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Player, HoleScore, GameSession, Settings } from "@shared/schema";
import { PLAYER_COLORS } from "@/lib/constants";

interface GameState {
  players: Player[];
  currentHole: number;
  currentPlayerIndex: number;
  scores: Record<string, HoleScore[]>;
  isComplete: boolean;
  settings: Settings;
}

interface GameContextValue extends GameState {
  addPlayer: (name: string) => void;
  removePlayer: (id: string) => void;
  updatePlayerName: (id: string, name: string) => void;
  updatePlayerColor: (id: string, color: string) => void;
  movePlayer: (id: string, direction: "up" | "down") => void;
  startGame: () => void;
  updateScore: (playerId: string, hole: number, score: Partial<HoleScore>) => void;
  nextCard: () => void;
  previousPlayer: () => void;
  nextPlayer: () => void;
  endGame: () => void;
  resetGame: () => void;
  saveGame: (slot: string) => void;
  loadGame: (slot: string) => void;
  getSavedGames: () => Record<string, GameSession>;
  updateSettings: (settings: Partial<Settings>) => void;
  undo: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem("currentGame");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Fallback to default
      }
    }
    return {
      players: [],
      currentHole: 1,
      currentPlayerIndex: 0,
      scores: {},
      isComplete: false,
      settings: {
        theme: "dark",
        leftHandedMode: false,
        autoSave: true,
      },
    };
  });

  const [history, setHistory] = useState<GameState[]>([]);

  useEffect(() => {
    if (gameState.settings.autoSave) {
      localStorage.setItem("currentGame", JSON.stringify(gameState));
    }
  }, [gameState]);

  const saveHistory = (newState: GameState) => {
    setHistory((prev) => [...prev.slice(-9), gameState]);
    setGameState(newState);
  };

  const addPlayer = (name: string) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      color: PLAYER_COLORS[gameState.players.length % PLAYER_COLORS.length],
      order: gameState.players.length,
    };
    setGameState((prev) => ({
      ...prev,
      players: [...prev.players, newPlayer],
      scores: { ...prev.scores, [newPlayer.id]: [] },
    }));
  };

  const removePlayer = (id: string) => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i })),
    }));
  };

  const updatePlayerName = (id: string, name: string) => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === id ? { ...p, name } : p)),
    }));
  };

  const updatePlayerColor = (id: string, color: string) => {
    setGameState((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === id ? { ...p, color } : p)),
    }));
  };

  const movePlayer = (id: string, direction: "up" | "down") => {
    setGameState((prev) => {
      const players = [...prev.players];
      const index = players.findIndex((p) => p.id === id);
      if (index === -1) return prev;
      
      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= players.length) return prev;
      
      [players[index], players[newIndex]] = [players[newIndex], players[index]];
      return {
        ...prev,
        players: players.map((p, i) => ({ ...p, order: i })),
      };
    });
  };

  const startGame = () => {
    setGameState((prev) => ({
      ...prev,
      currentHole: 1,
      currentPlayerIndex: 0,
      isComplete: false,
    }));
  };

  const updateScore = (playerId: string, hole: number, scoreUpdate: Partial<HoleScore>) => {
    saveHistory(gameState);
    setGameState((prev) => {
      const playerScores = prev.scores[playerId] || [];
      const holeIndex = playerScores.findIndex((s) => s.hole === hole);
      
      let newScores;
      if (holeIndex >= 0) {
        newScores = playerScores.map((s, i) =>
          i === holeIndex ? { ...s, ...scoreUpdate } : s
        );
      } else {
        newScores = [
          ...playerScores,
          {
            hole,
            par: scoreUpdate.par ?? 3,
            strokes: scoreUpdate.strokes ?? 0,
            scratches: scoreUpdate.scratches ?? 0,
            penalties: scoreUpdate.penalties ?? 0,
          },
        ];
      }
      
      return {
        ...prev,
        scores: { ...prev.scores, [playerId]: newScores },
      };
    });
  };

  const nextCard = () => {
    saveHistory(gameState);
    setGameState((prev) => {
      const nextPlayerIndex = (prev.currentPlayerIndex + 1) % prev.players.length;
      const nextHole = nextPlayerIndex === 0 ? prev.currentHole + 1 : prev.currentHole;
      
      return {
        ...prev,
        currentPlayerIndex: nextPlayerIndex,
        currentHole: nextHole,
      };
    });
  };

  const previousPlayer = () => {
    setGameState((prev) => ({
      ...prev,
      currentPlayerIndex:
        prev.currentPlayerIndex === 0
          ? prev.players.length - 1
          : prev.currentPlayerIndex - 1,
    }));
  };

  const nextPlayer = () => {
    setGameState((prev) => ({
      ...prev,
      currentPlayerIndex: (prev.currentPlayerIndex + 1) % prev.players.length,
    }));
  };

  const endGame = () => {
    saveHistory(gameState);
    setGameState((prev) => ({ ...prev, isComplete: true }));
  };

  const resetGame = () => {
    setGameState({
      players: [],
      currentHole: 1,
      currentPlayerIndex: 0,
      scores: {},
      isComplete: false,
      settings: gameState.settings,
    });
    setHistory([]);
  };

  const saveGame = (slot: string) => {
    const games = JSON.parse(localStorage.getItem("savedGames") || "{}");
    games[slot] = {
      id: crypto.randomUUID(),
      ...gameState,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem("savedGames", JSON.stringify(games));
  };

  const loadGame = (slot: string) => {
    const games = JSON.parse(localStorage.getItem("savedGames") || "{}");
    if (games[slot]) {
      setGameState({
        players: games[slot].players,
        currentHole: games[slot].currentHole,
        currentPlayerIndex: games[slot].currentPlayerIndex,
        scores: games[slot].scores,
        isComplete: games[slot].isComplete,
        settings: games[slot].settings || gameState.settings,
      });
    }
  };

  const getSavedGames = () => {
    return JSON.parse(localStorage.getItem("savedGames") || "{}");
  };

  const updateSettings = (settings: Partial<Settings>) => {
    setGameState((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...settings },
    }));
  };

  const undo = () => {
    if (history.length > 0) {
      const previousState = history[history.length - 1];
      setGameState(previousState);
      setHistory((prev) => prev.slice(0, -1));
    }
  };

  return (
    <GameContext.Provider
      value={{
        ...gameState,
        addPlayer,
        removePlayer,
        updatePlayerName,
        updatePlayerColor,
        movePlayer,
        startGame,
        updateScore,
        nextCard,
        previousPlayer,
        nextPlayer,
        endGame,
        resetGame,
        saveGame,
        loadGame,
        getSavedGames,
        updateSettings,
        undo,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
