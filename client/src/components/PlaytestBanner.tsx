// PLAYTESTING_MODE — delete this entire file when playtesting ends.
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Star, Unlock, Trophy, MessageSquare } from "lucide-react";

const SHOWN_KEY = "pftc_playtest_shown_date";

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PlaytestBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const today = getTodayString();
    if (localStorage.getItem(SHOWN_KEY) !== today) {
      setOpen(true);
    }
  }, []);

  function handleClose() {
    localStorage.setItem(SHOWN_KEY, getTodayString());
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Welcome, Play Tester!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong>Thank you for helping shape this game.</strong> You're part of a small group getting early access, and your feedback is directly driving what we build next.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Unlock className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-sm">
              <strong>All 18 holes are unlocked for you.</strong> No paywall, no purchase needed — play the full course freely and put it through its paces.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <Trophy className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm">
              We're close to launch. Multiplayer enhancements, handicap tracking, and tournament modes are all on the roadmap — your testing is making them better.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <p className="text-sm">
              Spotted something? Have an idea? Tap <strong>Send Feedback</strong> on the home screen — we read every single submission.
            </p>
          </div>
        </div>

        <Button
          className="w-full mt-2 font-bold"
          size="lg"
          onClick={handleClose}
          data-testid="button-playtest-close"
        >
          Let's Play
        </Button>
      </DialogContent>
    </Dialog>
  );
}
