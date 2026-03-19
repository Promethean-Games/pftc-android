import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { X, Plus, Move, Crosshair, CircleDot, Zap, CheckCircle, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TourTrigger = "next" | "ball_added" | "cue_moved" | "aim_set" | "shot_taken" | "done";

interface StepDef {
  id: string;
  title: string;
  body: string;
  targetTestId: string | null;
  trigger: TourTrigger;
  Icon: React.ComponentType<{ className?: string }>;
  ringColor: string;
  actionHint?: string;
}

const STEPS: StepDef[] = [
  {
    id: "welcome",
    title: "Welcome to the Cueing Emulator",
    body: "This is a physics simulator for practicing pool shots. Let's take 60 seconds to walk through the basics together — you'll actually perform each action as we go.",
    targetTestId: null,
    trigger: "next",
    Icon: Crosshair,
    ringColor: "#3b82f6",
  },
  {
    id: "add_ball",
    title: "Add a Ball",
    body: "Think of this like setting up a practice drill — you pick which balls go on the table. Tap Add Ball and choose Solid or Stripe to drop one onto the felt.",
    targetTestId: "button-add-ball",
    trigger: "ball_added",
    Icon: Plus,
    ringColor: "#f59e0b",
    actionHint: "Tap Add Ball above to continue →",
  },
  {
    id: "move_cue",
    title: "Position the Cue Ball",
    body: "This is your ball-in-hand moment. Tap Move Cue Ball, then drag the white ball anywhere on the table to set your starting position. Tap the button again to lock it in.",
    targetTestId: "button-move-cue",
    trigger: "cue_moved",
    Icon: Move,
    ringColor: "#8b5cf6",
    actionHint: "Toggle Move Cue Ball and drag the white ball →",
  },
  {
    id: "aim",
    title: "Line Up Your Shot",
    body: "Like a laser pointer showing where your cue will travel — press and drag from the cue ball outward on the table. The longer the drag, the more precise your angle. Release to lock it in.",
    targetTestId: "canvas-container",
    trigger: "aim_set",
    Icon: Crosshair,
    ringColor: "#22c55e",
    actionHint: "Drag from the cue ball on the table above →",
  },
  {
    id: "english",
    title: "The Spin Diagram",
    body: "This diagram is the face of your cue ball. Tap anywhere inside it to set where your cue tip makes contact. Dead center means a straight roll — off-center adds spin. The dashed red ring is the edge of safe contact.",
    targetTestId: "english-diagram",
    trigger: "next",
    Icon: CircleDot,
    ringColor: "#ec4899",
  },
  {
    id: "speed",
    title: "Shot Speed",
    body: "Drag this slider to set how hard you hit. Think of 1 as a gentle lag putt and 10 as a break shot. You can fine-tune to quarter increments — look for ¼, ½, ¾ in the label.",
    targetTestId: "slider-speed",
    trigger: "next",
    Icon: Zap,
    ringColor: "#f97316",
  },
  {
    id: "shoot",
    title: "Take the Shot",
    body: "Everything is set. Tap Shoot and watch the physics play out — the cue ball travels, deflects off rails, and transfers energy to any ball it contacts.",
    targetTestId: "button-shoot",
    trigger: "shot_taken",
    Icon: Zap,
    ringColor: "#ef4444",
    actionHint: "Tap Shoot above to finish →",
  },
  {
    id: "done",
    title: "You're Ready to Practice!",
    body: "That's everything. Use the gear icon to load preset course layouts from the card deck, or dial in table physics. Undo and Reset appear after your first shot so you can replay positions.",
    targetTestId: null,
    trigger: "done",
    Icon: CheckCircle,
    ringColor: "#22c55e",
  },
];

interface RingStyle {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface CueingEmulatorTourProps {
  currentStepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onDismiss: () => void;
}

export const TOUR_STEP_COUNT = STEPS.length;

export function getTourTrigger(stepIndex: number): TourTrigger | null {
  return STEPS[stepIndex]?.trigger ?? null;
}

export function CueingEmulatorTour({
  currentStepIndex,
  onNext,
  onBack,
  onDismiss,
}: CueingEmulatorTourProps) {
  const [ringStyle, setRingStyle] = useState<RingStyle | null>(null);

  const step = STEPS[currentStepIndex];
  const isFirst = currentStepIndex === 0;
  const isLast = currentStepIndex === STEPS.length - 1;
  const isActionStep = step?.trigger !== "next" && step?.trigger !== "done";

  const updateRing = useCallback(() => {
    if (!step?.targetTestId) {
      setRingStyle(null);
      return;
    }
    const el = document.querySelector(`[data-testid="${step.targetTestId}"]`);
    if (!el) {
      setRingStyle(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    const pad = step.targetTestId === "canvas-container" ? 0 : 6;
    setRingStyle({
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
    });
  }, [step]);

  useLayoutEffect(() => {
    updateRing();
  }, [updateRing]);

  useEffect(() => {
    window.addEventListener("resize", updateRing);
    return () => window.removeEventListener("resize", updateRing);
  }, [updateRing]);

  if (!step) return null;

  const { Icon, ringColor, title, body, actionHint } = step;

  return (
    <>
      {/* Dark overlay — pointer-events: none so all emulator controls remain tappable */}
      <div
        className="fixed inset-0 z-40 bg-black/60"
        style={{ pointerEvents: "none" }}
        data-testid="tour-overlay"
      />

      {/* Highlight ring around the target element */}
      {ringStyle && (
        <div
          className="fixed z-50 rounded-lg tour-ring"
          style={{
            top: ringStyle.top,
            left: ringStyle.left,
            width: ringStyle.width,
            height: ringStyle.height,
            border: `2px solid ${ringColor}`,
            boxShadow: `0 0 0 3px ${ringColor}33, 0 0 20px ${ringColor}66`,
            pointerEvents: "none",
          }}
          data-testid="tour-highlight-ring"
        />
      )}

      {/* Instruction card — bottom-anchored, always interactive */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg"
        data-testid="tour-card"
        style={{ pointerEvents: "all" }}
      >
        {/* Progress bar */}
        <div className="flex gap-1 px-4 pt-3">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full transition-all duration-300"
              style={{
                background: i <= currentStepIndex ? ringColor : "hsl(var(--muted))",
              }}
            />
          ))}
        </div>

        <div className="px-4 pt-3 pb-4">
          {/* Step header */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: `${ringColor}22`, color: ringColor }}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span className="font-bold text-sm leading-tight">{title}</span>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={onDismiss}
              className="shrink-0 -mt-1 -mr-1"
              data-testid="button-tour-dismiss"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Body text */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">{body}</p>

          {/* Action hint for interactive steps */}
          {isActionStep && actionHint && (
            <p
              className="text-xs font-medium mb-3 animate-pulse"
              style={{ color: ringColor }}
            >
              {actionHint}
            </p>
          )}

          {/* Navigation row */}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground tabular-nums">
              {currentStepIndex + 1} / {STEPS.length}
            </span>

            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onBack}
                  data-testid="button-tour-back"
                >
                  <ChevronLeft className="w-3 h-3 mr-1" />
                  Back
                </Button>
              )}

              {isLast ? (
                <Button
                  size="sm"
                  onClick={onDismiss}
                  data-testid="button-tour-done"
                  style={{ background: ringColor, borderColor: ringColor }}
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Done
                </Button>
              ) : isActionStep ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onNext}
                  data-testid="button-tour-skip-action"
                >
                  Skip step
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={onNext}
                  data-testid="button-tour-next"
                  style={{ background: ringColor, borderColor: ringColor }}
                >
                  Next
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
