import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";

const FREE_HOLES = 3;

interface UnlockContextValue {
  isUnlocked: boolean;
  freeHoles: number;
  isCheckingUnlock: boolean;
  initiateCheckout: () => Promise<void>;
}

const UnlockContext = createContext<UnlockContextValue | null>(null);

export function useUnlock() {
  const context = useContext(UnlockContext);
  if (!context) throw new Error("useUnlock must be used within UnlockProvider");
  return context;
}

export function UnlockProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem("pftc_unlocked") === "true";
  });
  const [isCheckingUnlock, setIsCheckingUnlock] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const unlockStatus = params.get("unlock");
    const sessionId = params.get("session_id");

    if (unlockStatus === "success" && sessionId && !isUnlocked) {
      setIsCheckingUnlock(true);
      fetch(`/api/check-unlock-status?session_id=${encodeURIComponent(sessionId)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.unlocked) {
            localStorage.setItem("pftc_unlocked", "true");
            setIsUnlocked(true);
          }
        })
        .catch((err) => {
          console.error("Failed to verify unlock:", err);
        })
        .finally(() => {
          setIsCheckingUnlock(false);
          window.history.replaceState({}, "", window.location.pathname);
        });
    } else if (unlockStatus === "cancelled") {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const initiateCheckout = useCallback(async () => {
    try {
      const res = await apiRequest("POST", "/api/create-checkout-session");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to create checkout session:", err);
    }
  }, []);

  return (
    <UnlockContext.Provider
      value={{
        isUnlocked,
        freeHoles: FREE_HOLES,
        isCheckingUnlock,
        initiateCheckout,
      }}
    >
      {children}
    </UnlockContext.Provider>
  );
}
