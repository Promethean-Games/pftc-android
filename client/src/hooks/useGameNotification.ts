import { useEffect, useRef } from "react";

export interface GameNotifState {
  isActive: boolean;
  playerName: string;
  hole: number;
  strokes: number;
  par: number;
  penalties: number;
}

const NOTIF_TAG = "pftc-game";

async function showGameNotification(state: GameNotifState) {
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const strokeLine =
      state.strokes === 0
        ? "No strokes yet"
        : `${state.strokes} stroke${state.strokes !== 1 ? "s" : ""}`;
    const parLine = state.par > 0 ? `  ·  Par ${state.par}` : "";
    const penLine = state.penalties > 0 ? `  ·  +${state.penalties} pen` : "";
    await reg.showNotification(`${state.playerName} — Hole ${state.hole}`, {
      body: `${strokeLine}${parLine}${penLine}`,
      tag: NOTIF_TAG,
      renotify: false,
      silent: true,
      icon: "/icon-192x192.png",
      badge: "/icon-72x72.png",
      actions: [
        { action: "stroke_add", title: "+1 Stroke" },
        { action: "next_player", title: "Next Player" },
        { action: "undo", title: "Undo" },
      ],
    } as NotificationOptions);
  } catch {
    // Notifications not supported or blocked
  }
}

async function clearGameNotification() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    const notifs = await reg.getNotifications({ tag: NOTIF_TAG });
    notifs.forEach((n) => n.close());
  } catch {
    // Ignore
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function useGameNotification(state: GameNotifState) {
  const activeRef = useRef(state.isActive);
  activeRef.current = state.isActive;

  // Show/update notification when active state changes
  useEffect(() => {
    if (!state.isActive) {
      clearGameNotification();
      return;
    }
    showGameNotification(state);
  }, [
    state.isActive,
    state.playerName,
    state.hole,
    state.strokes,
    state.par,
    state.penalties,
  ]);

  // Listen for service worker messages and re-dispatch as window events
  // so GameScreen can route them through its own state management
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "NOTIF_ACTION" && event.data.action) {
        window.dispatchEvent(
          new CustomEvent("pftc-notif-action", {
            detail: { action: event.data.action as string },
          })
        );
      }
    };
    navigator.serviceWorker.addEventListener("message", handleMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handleMessage);
  }, []);

  // Clean up notification when hook unmounts
  useEffect(() => {
    return () => {
      if (!activeRef.current) clearGameNotification();
    };
  }, []);
}
