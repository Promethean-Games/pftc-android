import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Player, HoleScore, GameSession, Settings, SetupTime } from "@shared/schema";
import { PLAYER_COLORS, MAX_HOLES } from "@/lib/constants";
import { shuffleDeck, getCardById, type CourseCard } from "@/lib/card-deck";
import {
  ACHIEVEMENT_IDS,
  unlockAchievement,
  checkHoleScoreAchievements,
  checkRoundAchievements,
} from "@/lib/play-games";

export interface TurnTime {
  playerId: string;
  hole: number;
  startTime: number;
  endTime: number;
}

interface GameState {
  players: Player[];
  currentHole: number;
  currentPlayerIndex: number;
  scores: Record<string, HoleScore[]>;
  isComplete: boolean;
  settings: Settings;
  deckIds: string[];
  drawnCardIds: Record<number, string>;
  turnTimes: TurnTime[];
  gameStartTime: number;
  gameEndTime: number | null;
  currentTurnStart: number;
  totalPlayTimeMs: number;
  isPaused: boolean;
  lastResumedAt: number;
}

interface GameContextValue extends GameState {
  addPlayer: (name: string, position?: number) => void;
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
  renameSlot: (oldSlot: string, newSlot: string) => void;
  deleteSlot: (slot: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  undo: () => void;
  setParForAllPlayers: (hole: number, par: number) => void;
  recordSetupTime: (setupTime: SetupTime) => void;
  getSetupTimes: () => SetupTime[];
  drawCard: (hole: number) => CourseCard | null;
  getDrawnCard: (hole: number) => CourseCard | null;
  pauseTimer: () => void;
  resumeTimer: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within GameProvider");
  return context;
}

function createDefaultState(): GameState {
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
    deckIds: [],
    drawnCardIds: {},
    turnTimes: [],
    gameStartTime: 0,
    gameEndTime: null,
    currentTurnStart: 0,
    totalPlayTimeMs: 0,
    isPaused: true,
    lastResumedAt: 0,
  };
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem("currentGame");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...createDefaultState(),
          ...parsed,
          deckIds: parsed.deckIds || [],
          drawnCardIds: parsed.drawnCardIds || {},
          turnTimes: parsed.turnTimes || [],
          gameStartTime: parsed.gameStartTime || 0,
          gameEndTime: parsed.gameEndTime || null,
          currentTurnStart: parsed.currentTurnStart || Date.now(),
          totalPlayTimeMs: parsed.totalPlayTimeMs || 0,
          isPaused: true,
          lastResumedAt: 0,
        };
      } catch {
      }
    }
    return createDefaultState();
  });

  const [history, setHistory] = useState<GameState[]>([]);

  useEffect(() => {
    if (gameState.settings.autoSave && gameState.players.length > 0) {
      localStorage.setItem("currentGame", JSON.stringify(gameState));
      const games = JSON.parse(localStorage.getItem("savedGames") || "{}");
      games["__autosave__"] = {
        id: "autosave",
        ...gameState,
        createdAt: games["__autosave__"]?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem("savedGames", JSON.stringify(games));
    }
  }, [gameState]);

  const saveHistory = (newState: GameState) => {
    setHistory((prev) => [...prev.slice(-9), gameState]);
    setGameState(newState);
  };

  const addPlayer = (name: string, position?: number) => {
    const newPlayer: Player = {
      id: crypto.randomUUID(),
      name,
      color: PLAYER_COLORS[gameState.players.length % PLAYER_COLORS.length],
      order: position ?? gameState.players.length,
    };
    
    setGameState((prev) => {
      let newPlayers: Player[];
      
      if (position !== undefined && position >= 0 && position < prev.players.length) {
        newPlayers = [
          ...prev.players.slice(0, position),
          newPlayer,
          ...prev.players.slice(position),
        ].map((p, i) => ({ ...p, order: i }));
      } else {
        newPlayers = [...prev.players, newPlayer];
      }
      
      return {
        ...prev,
        players: newPlayers,
        scores: { ...prev.scores, [newPlayer.id]: [] },
      };
    });
  };

  const removePlayer = (id: string) => {
    saveHistory(gameState);
    setGameState((prev) => {
      const removedIndex = prev.players.findIndex((p) => p.id === id);
      const newPlayers = prev.players.filter((p) => p.id !== id).map((p, i) => ({ ...p, order: i }));
      let newPlayerIndex = prev.currentPlayerIndex;
      
      if (newPlayers.length === 0) {
        newPlayerIndex = 0;
      } else if (removedIndex <= prev.currentPlayerIndex) {
        newPlayerIndex = Math.max(0, prev.currentPlayerIndex - 1);
      }
      if (newPlayerIndex >= newPlayers.length) {
        newPlayerIndex = 0;
      }
      
      return {
        ...prev,
        players: newPlayers,
        currentPlayerIndex: newPlayerIndex,
      };
    });
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
    const newDeck = shuffleDeck();
    const now = Date.now();
    setGameState((prev) => ({
      ...prev,
      currentHole: 1,
      currentPlayerIndex: 0,
      isComplete: false,
      deckIds: newDeck.map((c) => c.id),
      drawnCardIds: {},
      turnTimes: [],
      gameStartTime: now,
      gameEndTime: null,
      currentTurnStart: now,
      totalPlayTimeMs: 0,
      isPaused: false,
      lastResumedAt: now,
    }));
  };

  const drawCard = (hole: number): CourseCard | null => {
    const existingId = gameState.drawnCardIds[hole];
    if (existingId) {
      return getCardById(existingId) || null;
    }

    let deck = [...(gameState.deckIds || [])];
    if (deck.length === 0) {
      deck = shuffleDeck().map((c) => c.id);
    }

    const drawnId = deck[0];
    const remaining = deck.slice(1);
    const card = getCardById(drawnId);

    setGameState((prev) => ({
      ...prev,
      deckIds: remaining,
      drawnCardIds: { ...prev.drawnCardIds, [hole]: drawnId },
    }));

    return card || null;
  };

  const getDrawnCard = (hole: number): CourseCard | null => {
    const id = gameState.drawnCardIds[hole];
    if (!id) return null;
    return getCardById(id) || null;
  };

  const updateScore = (playerId: string, hole: number, scoreUpdate: Partial<HoleScore>) => {
    if (hole > MAX_HOLES) return;
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

  const sortPlayersByPreviousHole = (players: Player[], scores: Record<string, HoleScore[]>, previousHole: number): Player[] => {
    if (previousHole < 1) return players;
    
    return [...players].sort((a, b) => {
      const aScore = scores[a.id]?.find(s => s.hole === previousHole);
      const bScore = scores[b.id]?.find(s => s.hole === previousHole);
      const aTotal = aScore ? aScore.strokes + aScore.scratches + aScore.penalties : Infinity;
      const bTotal = bScore ? bScore.strokes + bScore.scratches + bScore.penalties : Infinity;
      
      if (aTotal !== bTotal) return aTotal - bTotal;
      
      const aTotalAll = (scores[a.id] || []).reduce((sum, s) => sum + s.strokes + s.scratches + s.penalties, 0);
      const bTotalAll = (scores[b.id] || []).reduce((sum, s) => sum + s.strokes + s.scratches + s.penalties, 0);
      if (aTotalAll !== bTotalAll) return aTotalAll - bTotalAll;
      
      return a.name.localeCompare(b.name);
    }).map((p, i) => ({ ...p, order: i }));
  };

  const nextCard = () => {
    saveHistory(gameState);
    const now = Date.now();

    // ── Play Games achievements ──────────────────────────────────────────────
    const completedHole = gameState.currentHole;

    // Milestone: first hole
    if (completedHole === 1) unlockAchievement(ACHIEVEMENT_IDS.OFF_THE_TEE);
    // Milestone: front nine
    if (completedHole === 9) unlockAchievement(ACHIEVEMENT_IDS.FRONT_NINE);
    // Milestone: full round
    if (completedHole >= MAX_HOLES) unlockAchievement(ACHIEVEMENT_IDS.FULL_ROUND);

    // Score achievements — fire for every player on the just-completed hole
    for (const player of gameState.players) {
      const h = gameState.scores[player.id]?.find((s) => s.hole === completedHole);
      if (h && h.par > 0) {
        checkHoleScoreAchievements(h.strokes + h.scratches + h.penalties, h.par);
      }
    }

    // Round-end achievements — check every player's full card
    if (completedHole >= MAX_HOLES) {
      for (const player of gameState.players) {
        checkRoundAchievements(gameState.scores[player.id] || []);
      }
    }
    // ────────────────────────────────────────────────────────────────────────

    setGameState((prev) => {
      const activeSince = prev.isPaused ? 0 : (now - prev.lastResumedAt);
      const newTotalPlay = prev.totalPlayTimeMs + activeSince;

      const currentPlayer = prev.players[prev.currentPlayerIndex];
      const turnTime: TurnTime = {
        playerId: currentPlayer?.id || "",
        hole: prev.currentHole,
        startTime: prev.currentTurnStart || now,
        endTime: now,
      };
      const newTurnTimes = [...prev.turnTimes, turnTime];

      // Next Card is only enabled when all players have scores, so always advance the hole.
      const nextHole = prev.currentHole + 1;

      if (prev.currentHole >= MAX_HOLES) {
        return {
          ...prev,
          isComplete: true,
          turnTimes: newTurnTimes,
          gameEndTime: now,
          currentTurnStart: now,
          totalPlayTimeMs: newTotalPlay,
          isPaused: true,
          lastResumedAt: 0,
        };
      }

      const sortedPlayers = sortPlayersByPreviousHole(prev.players, prev.scores, prev.currentHole);
      return {
        ...prev,
        players: sortedPlayers,
        currentPlayerIndex: 0,
        currentHole: nextHole,
        turnTimes: newTurnTimes,
        currentTurnStart: now,
        totalPlayTimeMs: newTotalPlay,
        lastResumedAt: now,
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
    const now = Date.now();
    setGameState((prev) => {
      const activeSince = prev.isPaused ? 0 : (now - prev.lastResumedAt);
      const newTotalPlay = prev.totalPlayTimeMs + activeSince;

      const currentPlayer = prev.players[prev.currentPlayerIndex];
      const turnTime: TurnTime = {
        playerId: currentPlayer?.id || "",
        hole: prev.currentHole,
        startTime: prev.currentTurnStart || now,
        endTime: now,
      };
      return {
        ...prev,
        isComplete: true,
        turnTimes: [...prev.turnTimes, turnTime],
        gameEndTime: now,
        totalPlayTimeMs: newTotalPlay,
        isPaused: true,
        lastResumedAt: 0,
      };
    });
  };

  const resetGame = () => {
    setGameState({
      ...createDefaultState(),
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
        ...createDefaultState(),
        players: games[slot].players,
        currentHole: games[slot].currentHole,
        currentPlayerIndex: games[slot].currentPlayerIndex,
        scores: games[slot].scores,
        isComplete: games[slot].isComplete,
        settings: games[slot].settings || gameState.settings,
        deckIds: games[slot].deckIds || [],
        drawnCardIds: games[slot].drawnCardIds || {},
        turnTimes: games[slot].turnTimes || [],
        gameStartTime: games[slot].gameStartTime || 0,
        gameEndTime: games[slot].gameEndTime || null,
        currentTurnStart: games[slot].currentTurnStart || Date.now(),
        totalPlayTimeMs: games[slot].totalPlayTimeMs || 0,
        isPaused: true,
        lastResumedAt: 0,
      });
    }
  };

  const getSavedGames = () => {
    return JSON.parse(localStorage.getItem("savedGames") || "{}");
  };

  const renameSlot = (oldSlot: string, newSlot: string) => {
    const games = JSON.parse(localStorage.getItem("savedGames") || "{}");
    if (games[oldSlot] && oldSlot !== newSlot) {
      games[newSlot] = { ...games[oldSlot], updatedAt: new Date().toISOString() };
      delete games[oldSlot];
      localStorage.setItem("savedGames", JSON.stringify(games));
    }
  };

  const deleteSlot = (slot: string) => {
    const games = JSON.parse(localStorage.getItem("savedGames") || "{}");
    if (games[slot]) {
      delete games[slot];
      localStorage.setItem("savedGames", JSON.stringify(games));
    }
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

  const setParForAllPlayers = (hole: number, par: number) => {
    saveHistory(gameState);
    setGameState((prev) => {
      const newScores = { ...prev.scores };
      
      prev.players.forEach((player) => {
        const playerScores = newScores[player.id] || [];
        const holeIndex = playerScores.findIndex((s) => s.hole === hole);
        
        if (holeIndex >= 0) {
          newScores[player.id] = playerScores.map((s, i) =>
            i === holeIndex ? { ...s, par } : s
          );
        } else {
          newScores[player.id] = [
            ...playerScores,
            { hole, par, strokes: 0, scratches: 0, penalties: 0 },
          ];
        }
      });
      
      return { ...prev, scores: newScores };
    });
  };

  const pauseTimer = () => {
    setGameState((prev) => {
      if (prev.isPaused || prev.isComplete) return prev;
      const now = Date.now();
      const activeSince = now - prev.lastResumedAt;
      return {
        ...prev,
        totalPlayTimeMs: prev.totalPlayTimeMs + activeSince,
        isPaused: true,
        lastResumedAt: 0,
      };
    });
  };

  const resumeTimer = () => {
    setGameState((prev) => {
      if (!prev.isPaused || prev.isComplete) return prev;
      const now = Date.now();
      return {
        ...prev,
        isPaused: false,
        lastResumedAt: now,
        currentTurnStart: now,
      };
    });
  };

  const recordSetupTime = (setupTime: SetupTime) => {
    const times = JSON.parse(localStorage.getItem("setupTimes") || "[]");
    times.push(setupTime);
    localStorage.setItem("setupTimes", JSON.stringify(times));
  };

  const getSetupTimes = (): SetupTime[] => {
    return JSON.parse(localStorage.getItem("setupTimes") || "[]");
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
        renameSlot,
        deleteSlot,
        updateSettings,
        undo,
        setParForAllPlayers,
        recordSetupTime,
        getSetupTimes,
        drawCard,
        getDrawnCard,
        pauseTimer,
        resumeTimer,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}
