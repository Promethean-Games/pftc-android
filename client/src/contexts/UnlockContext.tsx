import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import {
  isRunningInTwa,
  initiatePlayBillingCheckout,
  checkPendingPurchases,
} from "@/lib/play-billing";

const FREE_HOLES = 3;

interface UnlockContextValue {
  isUnlocked: boolean;
  freeHoles: number;
  isCheckingUnlock: boolean;
  purchaseError: string | null;
  clearPurchaseError: () => void;
  initiateCheckout: () => Promise<void>;
}

const UnlockContext = createContext<UnlockContextValue | null>(null);

export function useUnlock() {
  const context = useContext(UnlockContext);
  if (!context) throw new Error("useUnlock must be used within UnlockProvider");
  return context;
}

async function verifyPlayPurchase(purchaseToken: string, productId: string): Promise<boolean> {
  try {
    const res = await apiRequest("POST", "/api/verify-play-purchase", {
      purchaseToken,
      productId,
    });
    const data = await res.json();
    return data.unlocked === true;
  } catch (err) {
    console.error("Failed to verify Play purchase:", err);
    return false;
  }
}

export function UnlockProvider({ children }: { children: ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    return localStorage.getItem("pftc_unlocked") === "true";
  });
  const [isCheckingUnlock, setIsCheckingUnlock] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const clearPurchaseError = useCallback(() => setPurchaseError(null), []);

  // Handle Stripe redirect callback (existing flow)
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

  // Check for unconsumed Play purchases on mount (TWA only)
  // Handles the case where the user purchased but the app crashed before
  // the token was verified and acknowledged server-side.
  useEffect(() => {
    if (isUnlocked || !isRunningInTwa()) return;

    checkPendingPurchases().then(async (pending) => {
      if (!pending) return;
      setIsCheckingUnlock(true);
      try {
        const verified = await verifyPlayPurchase(pending.purchaseToken, pending.productId);
        if (verified) {
          localStorage.setItem("pftc_unlocked", "true");
          setIsUnlocked(true);
        }
      } finally {
        setIsCheckingUnlock(false);
      }
    });
  }, []);

  const initiateCheckout = useCallback(async () => {
    setPurchaseError(null);

    // TWA path: Google Play Billing via Digital Goods API
    if (isRunningInTwa()) {
      try {
        setIsCheckingUnlock(true);
        const result = await initiatePlayBillingCheckout();
        if (!result) {
          setPurchaseError("Purchase was cancelled.");
          return;
        }
        const verified = await verifyPlayPurchase(result.purchaseToken, result.productId);
        if (verified) {
          localStorage.setItem("pftc_unlocked", "true");
          setIsUnlocked(true);
        } else {
          setPurchaseError("Purchase could not be verified. Please try again or contact support.");
        }
      } catch (err: unknown) {
        console.error("Play Billing checkout failed:", err);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Product not found")) {
          setPurchaseError("In-app product not available. Make sure 'full_unlock' is Active (not Draft) in Play Console.");
        } else if (msg.toLowerCase().includes("unsupported") || msg.toLowerCase().includes("context")) {
          setPurchaseError("Play Billing unavailable. Install the app via the Play Store testing link — sideloaded APKs do not support in-app purchases.");
        } else if (msg.includes("cancelled") || msg.includes("AbortError")) {
          setPurchaseError(null); // user dismissed — no error to show
        } else {
          setPurchaseError(`Purchase failed: ${msg}`);
        }
      } finally {
        setIsCheckingUnlock(false);
      }
      return;
    }

    // Browser path: Stripe checkout (existing flow)
    try {
      const res = await apiRequest("POST", "/api/create-checkout-session");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Failed to create checkout session:", err);
      setPurchaseError("Checkout failed. Please check your connection and try again.");
    }
  }, []);

  return (
    <UnlockContext.Provider
      value={{
        isUnlocked,
        freeHoles: FREE_HOLES,
        isCheckingUnlock,
        purchaseError,
        clearPurchaseError,
        initiateCheckout,
      }}
    >
      {children}
    </UnlockContext.Provider>
  );
}
