import { useState, useEffect, useLayoutEffect, useCallback } from "react";
import { X, Plus, Move, Crosshair, CircleDot, Zap, CheckCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type TourTrigger = "next" | "ball_added" | "cue_moved" | "aim_set" | "shot_taken" | "done";

interface StepDef {
  id: string;
  title: string;
  body: string;
  targetTestId: string | null;
  trigger: TourTrigger;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  ringColor: string;
  circular?: boolean;
}

const STEPS: StepDef[] = [
  {
    id: "welcome",
    title: "Quick tour",
    body: "Tap the highlighted controls as we go.",
    targetTestId: null,
    trigger: "next",
    Icon: Crosshair,
    ringColor: "#3b82f6",
  },
  {
    id: "add_ball",
    title: "Add a Ball",
    body: "Tap Add Ball → Solid or Stripe to place a ball on the table.",
    targetTestId: "button-add-ball",
    trigger: "ball_added",
    Icon: Plus,
    ringColor: "#f59e0b",
  },
  {
    id: "move_cue",
    title: "Position the Cue Ball",
    body: "Toggle this, then drag the white ball to your starting spot.",
    targetTestId: "button-move-cue",
    trigger: "cue_moved",
    Icon: Move,
    ringColor: "#8b5cf6",
  },
  {
    id: "aim",
    title: "Aim",
    body: "Press and drag outward from the cue ball to set your shot direction.",
    targetTestId: null,
    trigger: "aim_set",
    Icon: Crosshair,
    ringColor: "#22c55e",
    circular: true,
  },
  {
    id: "english",
    title: "Spin Diagram",
    body: "Tap inside to set tip contact. Center = no spin. Off-center adds spin.",
    targetTestId: "english-diagram",
    trigger: "next",
    Icon: CircleDot,
    ringColor: "#ec4899",
    circular: true,
  },
  {
    id: "speed",
    title: "Shot Speed",
    body: "Drag to set power. Snaps to whole numbers; \u00bc-step fine-tuning available.",
    targetTestId: "slider-speed",
    trigger: "next",
    Icon: Zap,
    ringColor: "#f97316",
  },
  {
    id: "shoot",
    title: "Shoot",
    body: "Tap Shoot to fire the shot and watch the physics play out.",
    targetTestId: "button-shoot",
    trigger: "shot_taken",
    Icon: Zap,
    ringColor: "#ef4444",
  },
  {
    id: "done",
    title: "You're all set!",
    body: "Gear icon \u2192 course layouts & table physics. Undo/Reset appear after your first shot.",
    targetTestId: null,
    trigger: "done",
    Icon: CheckCircle,
    ringColor: "#22c55e",
  },
];

interface RingBox {
  top: number;
  left: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
  circular?: boolean;
}

interface TooltipPos {
  top: number;
  left: number;
}

const TOOLTIP_W = 252;
const TOOLTIP_OFFSET = 14;

function computeTooltipPos(ring: RingBox | null): TooltipPos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (!ring) {
    return { top: vh / 2 - 60, left: (vw - TOOLTIP_W) / 2 };
  }

  const spaceBelow = vh - (ring.top + ring.height);
  const spaceAbove = ring.top;

  let top: number;
  if (spaceBelow >= 120 || spaceBelow >= spaceAbove) {
    top = ring.top + ring.height + TOOLTIP_OFFSET;
  } else {
    top = ring.top - TOOLTIP_OFFSET - 148;
  }

  // Clamp so tooltip never goes off-screen
  top = Math.max(8, Math.min(vh - 160, top));

  const idealLeft = ring.centerX - TOOLTIP_W / 2;
  const left = Math.max(8, Math.min(vw - TOOLTIP_W - 8, idealLeft));

  return { top, left };
}

export const TOUR_STEP_COUNT = STEPS.length;

export function getTourTrigger(stepIndex: number): TourTrigger | null {
  return STEPS[stepIndex]?.trigger ?? null;
}

interface CueingEmulatorTourProps {
  currentStepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onDismiss: () => void;
  /** Viewport-coordinate position of the cue ball — used for the aim step spotlight */
  cueBallCanvasPos?: { x: number; y: number; r: number };
}

export function CueingEmulatorTour({
  currentStepIndex,
  onNext,
  onDismiss,
  cueBallCanvasPos,
}: CueingEmulatorTourProps) {
  const [ringBox, setRingBox] = useState<RingBox | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPos>({ top: 0, left: 0 });

  const step = STEPS[currentStepIndex];
  const isLast = currentStepIndex === STEPS.length - 1;
  const isActionStep = step?.trigger !== "next" && step?.trigger !== "done";

  const update = useCallback(() => {
    if (!step) return;

    // Aim step: target the cue ball circle directly
    if (step.id === "aim" && cueBallCanvasPos) {
      const pad = 10;
      const { x, y, r } = cueBallCanvasPos;
      const box: RingBox = {
        top: y - r - pad,
        left: x - r - pad,
        width: (r + pad) * 2,
        height: (r + pad) * 2,
        centerX: x,
        centerY: y,
        circular: true,
      };
      setRingBox(box);
      setTooltipPos(computeTooltipPos(box));
      return;
    }

    if (!step.targetTestId) {
      setRingBox(null);
      setTooltipPos(computeTooltipPos(null));
      return;
    }

    const el = document.querySelector(`[data-testid="${step.targetTestId}"]`);
    if (!el) {
      setRingBox(null);
      setTooltipPos(computeTooltipPos(null));
      return;
    }
    const rect = el.getBoundingClientRect();
    const pad = 6;
    const box: RingBox = {
      top: rect.top - pad,
      left: rect.left - pad,
      width: rect.width + pad * 2,
      height: rect.height + pad * 2,
      centerX: rect.left + rect.width / 2,
      centerY: rect.top + rect.height / 2,
      circular: step.circular,
    };
    setRingBox(box);
    setTooltipPos(computeTooltipPos(box));
  }, [step, cueBallCanvasPos]);

  useLayoutEffect(() => { update(); }, [update]);
  useEffect(() => {
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [update]);

  if (!step) return null;

  const { Icon, ringColor, title, body } = step;
  const borderRadius = ringBox?.circular ? "50%" : "8px";

  return (
    <>
      {/* Overlay strategy:
          - WITH a target: the ring element itself casts a 9999px box-shadow that acts
            as the dark overlay, leaving the target area fully visible (spotlight effect).
          - WITHOUT a target: a simple full-screen dim overlay. */}
      {ringBox ? (
        <div
          className="fixed z-40 tour-ring"
          style={{
            top: ringBox.top,
            left: ringBox.left,
            width: ringBox.width,
            height: ringBox.height,
            borderRadius,
            border: `2px solid ${ringColor}`,
            boxShadow: `0 0 0 9999px rgba(0,0,0,0.6), 0 0 0 4px ${ringColor}44, 0 0 20px ${ringColor}66`,
            pointerEvents: "none",
          }}
          data-testid="tour-highlight-ring"
        />
      ) : (
        <div
          className="fixed inset-0 z-40 bg-black/60"
          style={{ pointerEvents: "none" }}
          data-testid="tour-overlay"
        />
      )}

      {/* Floating tooltip card */}
      <div
        className="fixed z-50 rounded-lg border bg-popover shadow-xl"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_W,
          pointerEvents: "all",
        }}
        data-testid="tour-card"
      >
        {/* Progress dots + dismiss */}
        <div className="flex items-center justify-between px-3 pt-2.5">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === currentStepIndex ? 14 : 6,
                  height: 6,
                  background: i <= currentStepIndex ? ringColor : "hsl(var(--muted))",
                }}
              />
            ))}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onDismiss}
            className="h-6 w-6 -mt-1 -mr-1"
            data-testid="button-tour-dismiss"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>

        <div className="px-3 pt-2 pb-3">
          {/* Title row */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: ringColor }} />
            <span className="font-semibold text-sm leading-tight">{title}</span>
          </div>

          {/* Body */}
          <p className="text-xs text-muted-foreground leading-relaxed mb-2.5">{body}</p>

          {/* Nav */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground/60 tabular-nums">
              {currentStepIndex + 1}/{STEPS.length}
            </span>
            {isLast ? (
              <Button
                size="sm"
                onClick={onDismiss}
                className="h-7 text-xs px-3"
                data-testid="button-tour-done"
                style={{ background: ringColor, borderColor: ringColor }}
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                Done
              </Button>
            ) : isActionStep ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={onNext}
                className="h-7 text-xs px-2 text-muted-foreground"
                data-testid="button-tour-skip-action"
              >
                Skip
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onNext}
                className="h-7 text-xs px-3"
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
    </>
  );
}
