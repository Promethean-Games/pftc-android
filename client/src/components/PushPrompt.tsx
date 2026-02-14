import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, X } from "lucide-react";
import { isPushSupported, subscribeToPush, getPermissionState } from "@/lib/pushNotifications";

const PROMPT_DISMISSED_KEY = "pushPromptDismissed";

export function PushPrompt() {
  const [visible, setVisible] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (localStorage.getItem(PROMPT_DISMISSED_KEY)) return;

      const supported = await isPushSupported();
      if (!supported) return;

      const permission = await getPermissionState();
      if (permission === "granted" || permission === "denied") {
        localStorage.setItem(PROMPT_DISMISSED_KEY, "true");
        return;
      }

      setVisible(true);
    };
    const timer = setTimeout(check, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setSubscribing(true);
    const deviceId = localStorage.getItem("deviceId") || undefined;
    const success = await subscribeToPush({ deviceId });
    localStorage.setItem(PROMPT_DISMISSED_KEY, "true");
    setSubscribing(false);
    setVisible(false);
    if (!success) {
      console.log("Push subscription was not granted");
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-500">
      <Card className="max-w-md mx-auto p-4 shadow-lg border-primary/20">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">Stay in the loop?</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              We'll keep you posted on leaderboard shakeups, tee times, and tournament updates. 
              No spam, just the good stuff.
            </p>
            <div className="flex items-center gap-2 mt-3">
              <Button
                size="sm"
                onClick={handleAllow}
                disabled={subscribing}
                data-testid="button-push-allow"
              >
                {subscribing ? "Setting up..." : "Sounds good"}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                data-testid="button-push-dismiss"
              >
                Maybe later
              </Button>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="flex-shrink-0 h-6 w-6"
            onClick={handleDismiss}
            data-testid="button-push-close"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
