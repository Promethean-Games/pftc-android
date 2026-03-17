import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import {
  isRunningInTwa,
  getTwaDebugInfo,
  initiatePlayBillingCheckout,
  checkPendingPurchases,
} from "@/lib/play-billing";
import { trackEvent } from "@/lib/analytics";
import { PLAYTESTING_MODE } from "@/lib/constants";

const FREE_HOLES = 3;

interface UnlockContextValue {
  isUnlocked: boolean;
  freeHoles: number;
  isCheckingUnlock: boolean;
  purchaseError: string | null;
  playBillingUnavailable: boolean;
  clearPurchaseError: () => void;
  initiateCheckout: () => Promise<void>;
  initiateStripeCheckout: () => Promise<void>;
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
    if (PLAYTESTING_MODE) return true; // PLAYTESTING_MODE — revert: remove this line
    return localStorage.getItem("pftc_unlocked") === "true";
  });
  const [isCheckingUnlock, setIsCheckingUnlock] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [playBillingUnavailable, setPlayBillingUnavailable] = useState(false);
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
            trackEvent("purchase_completed", { checkout_type: "stripe" });
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

  const initiateStripeCheckout = useCallback(async () => {
    setPurchaseError(null);
    trackEvent("purchase_initiated", { checkout_type: "stripe" });
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

  const initiateCheckout = useCallback(async () => {
    setPurchaseError(null);
    console.log("[PFTC billing]", getTwaDebugInfo());

    // TWA path: Google Play Billing via Digital Goods API
    if (isRunningInTwa() && !playBillingUnavailable) {
      trackEvent("purchase_initiated", { checkout_type: "play" });
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
          trackEvent("purchase_completed", { checkout_type: "play" });
        } else {
          setPurchaseError("Purchase could not be verified. Please try again or contact support.");
        }
      } catch (err: unknown) {
        console.error("Play Billing checkout failed:", err);
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes("Product not found")) {
          setPurchaseError("In-app product not set up yet in Play Console. Use the web payment option below.");
          setPlayBillingUnavailable(true);
        } else if (msg.toLowerCase().includes("unsupported") || msg.toLowerCase().includes("context")) {
          setPurchaseError("Google Play Billing is not available. Use the web payment option below to complete your purchase.");
          setPlayBillingUnavailable(true);
        } else if (msg.includes("cancelled") || msg.includes("AbortError")) {
          setPurchaseError(null);
        } else {
          setPurchaseError(`Purchase failed: ${msg}`);
        }
      } finally {
        setIsCheckingUnlock(false);
      }
      return;
    }

    // Browser path (or TWA fallback): Stripe checkout
    await initiateStripeCheckout();
  }, [playBillingUnavailable, initiateStripeCheckout]);

  return (
    <UnlockContext.Provider
      value={{
        isUnlocked,
        freeHoles: FREE_HOLES,
        isCheckingUnlock,
        purchaseError,
        playBillingUnavailable,
        clearPurchaseError,
        initiateCheckout,
        initiateStripeCheckout,
      }}
    >
      {children}
    </UnlockContext.Provider>
  );
}
