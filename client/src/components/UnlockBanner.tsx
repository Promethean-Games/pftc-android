import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lock, Unlock } from "lucide-react";
import { useUnlock } from "@/contexts/UnlockContext";

interface UnlockBannerProps {
  variant?: "overlay" | "inline";
}

export function UnlockBanner({ variant = "inline" }: UnlockBannerProps) {
  const { initiateCheckout, isCheckingUnlock } = useUnlock();

  if (variant === "overlay") {
    return (
      <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md p-6 text-center space-y-4">
          <div className="flex justify-center">
            <Lock className="w-12 h-12 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-bold">Cards 4-18 Locked</h2>
          <p className="text-muted-foreground">
            You've played the first 3 free cards. Unlock all 18 cards to continue your game.
          </p>
          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={initiateCheckout}
            disabled={isCheckingUnlock}
            data-testid="button-unlock-overlay"
          >
            <Unlock className="w-5 h-5 mr-2" />
            {isCheckingUnlock ? "Checking..." : "Unlock All 18 Cards"}
          </Button>
          <p className="text-xs text-muted-foreground">
            One-time purchase. Unlocks permanently on this device.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <Card className="p-4 border-dashed border-primary/50">
      <div className="flex items-center gap-3">
        <Lock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">Cards 4-18 are locked</p>
          <p className="text-xs text-muted-foreground">Unlock all 18 cards to view full scores</p>
        </div>
        <Button
          size="sm"
          onClick={initiateCheckout}
          disabled={isCheckingUnlock}
          data-testid="button-unlock-inline"
        >
          <Unlock className="w-4 h-4 mr-1" />
          Unlock
        </Button>
      </div>
    </Card>
  );
}
