import { X, Crosshair, Zap, CircleDot, SlidersHorizontal, Move, LayoutGrid, Plus, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Rule {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  body: React.ReactNode;
}

interface Section {
  label: string;
  gradient: string;
  iconColor: string;
  pillBg: string;
  rules: Rule[];
}

const B = ({ children }: { children: React.ReactNode }) => (
  <strong className="font-semibold text-foreground">{children}</strong>
);

const SECTIONS: Section[] = [
  {
    label: "Aiming",
    gradient: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)",
    iconColor: "#93c5fd",
    pillBg: "rgba(59,130,246,0.10)",
    rules: [
      {
        icon: Crosshair,
        title: "Setting Your Line",
        body: (
          <>
            <B>Press and drag</B> anywhere on or near the cue ball to draw an aim line.
            Drag further out for a more visible angle. Release to lock your direction.
          </>
        ),
      },
      {
        icon: Crosshair,
        title: "Cut Angle Readout",
        body: (
          <>
            When your aim line intersects an object ball, a <B>cut angle</B> readout
            appears at the top — showing degrees and a plain-English description
            like "½ ball" or "Thin cut."
          </>
        ),
      },
    ],
  },
  {
    label: "Taking a Shot",
    gradient: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
    iconColor: "#6ee7b7",
    pillBg: "rgba(16,185,129,0.10)",
    rules: [
      {
        icon: Zap,
        title: "Shoot Button",
        body: (
          <>
            Once an aim line is set, tap <B>Shoot</B> in the top toolbar. The cue ball
            and all object balls will move through the full simulated shot in one step.
          </>
        ),
      },
      {
        icon: Zap,
        title: "Shot Speed",
        body: (
          <>
            Set power with the <B>Speed slider</B> in the control strip at the bottom
            before shooting. 1 is a gentle roll; 10 is a power break. The slider
            snaps to whole numbers but can be fine-tuned to <B>quarter increments</B> —
            look for ¼, ½, and ¾ in the label.
          </>
        ),
      },
    ],
  },
  {
    label: "English & Spin",
    gradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)",
    iconColor: "#c4b5fd",
    pillBg: "rgba(124,58,237,0.10)",
    rules: [
      {
        icon: CircleDot,
        title: "Cue Ball Diagram",
        body: (
          <>
            The small ball face in the bottom-left corner shows where your cue tip
            contacts the ball. <B>Tap anywhere inside it</B> to set spin. Center is
            a center-ball hit — no spin.
          </>
        ),
      },
      {
        icon: CircleDot,
        title: "Miscue Limit",
        body: (
          <>
            The <B>red dashed ring</B> marks the miscue limit. Keeping your tip inside
            it produces valid english. Tapping outside is still accepted but represents
            a high-risk contact point.
          </>
        ),
      },
      {
        icon: CircleDot,
        title: "Center Button",
        body: (
          <>
            When spin is active, a <B>Center</B> button appears to the right of the
            diagram. Tap it to instantly zero out all english.
          </>
        ),
      },
    ],
  },
  {
    label: "Fine-Tune Angle",
    gradient: "linear-gradient(135deg, #92400e 0%, #d97706 100%)",
    iconColor: "#fcd34d",
    pillBg: "rgba(217,119,6,0.10)",
    rules: [
      {
        icon: SlidersHorizontal,
        title: "Angle Slider",
        body: (
          <>
            After setting your aim on the table, use the <B>Angle slider</B> to nudge
            the shot left or right by up to <B>±5°</B>. Useful for fine adjustments
            without re-dragging the aim line.
          </>
        ),
      },
    ],
  },
  {
    label: "Ball in Hand",
    gradient: "linear-gradient(135deg, #1e3a5f 0%, #1e6091 100%)",
    iconColor: "#7dd3fc",
    pillBg: "rgba(14,116,144,0.10)",
    rules: [
      {
        icon: Move,
        title: "Move Cue Ball",
        body: (
          <>
            Toggle <B>Move Cue Ball</B> in the top toolbar. While active, drag the
            cue ball anywhere on the table to reposition it. Toggle off to return
            to aiming mode.
          </>
        ),
      },
      {
        icon: Move,
        title: "Ball in Hand Footer",
        body: (
          <>
            The <B>Ball in Hand</B> banner at the bottom reminds you the cue ball
            hasn't been played yet. It disappears the first time you shoot or
            reposition the cue ball, and resets when you load a new layout.
          </>
        ),
      },
    ],
  },
  {
    label: "Course Layouts",
    gradient: "linear-gradient(135deg, #14532d 0%, #16a34a 100%)",
    iconColor: "#86efac",
    pillBg: "rgba(22,163,74,0.10)",
    rules: [
      {
        icon: LayoutGrid,
        title: "Loading a Preset",
        body: (
          <>
            Open <B>Settings</B> (gear icon) and scroll to <B>Course Layouts</B>.
            Tap any hole number (e.g. 3-02) to instantly place that card's ball
            arrangement on the table — cue ball included.
          </>
        ),
      },
      {
        icon: LayoutGrid,
        title: "Snap to Grid",
        body: (
          <>
            The <B>Snap</B> toggle in the toolbar aligns ball positions to a grid
            when dragging. Useful for recreating precise layouts by hand.
          </>
        ),
      },
    ],
  },
  {
    label: "Balls & Undo",
    gradient: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)",
    iconColor: "#fca5a5",
    pillBg: "rgba(220,38,38,0.10)",
    rules: [
      {
        icon: Plus,
        title: "Adding Balls",
        body: (
          <>
            Tap <B>Add Ball</B> in the toolbar to drop a new solid or stripe onto
            the table. Select any object ball to reveal the <B>Remove</B> button
            for removing it.
          </>
        ),
      },
      {
        icon: Undo2,
        title: "Undo & Reset",
        body: (
          <>
            <B>Undo</B> steps back one shot at a time — handy for replaying a
            tricky position. <B>Reset</B> returns the table to the very first shot
            of the current layout. Both appear after the first shot is taken.
          </>
        ),
      },
    ],
  },
];

interface CueingEmulatorTutorialProps {
  onClose: () => void;
}

export function CueingEmulatorTutorial({ onClose }: CueingEmulatorTutorialProps) {
  return (
    <div className="fixed inset-0 bg-background z-[60] flex flex-col" data-testid="emulator-tutorial-overlay">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-lg font-bold tracking-tight" data-testid="text-emulator-tutorial-title">
          Cueing Emulator Guide
        </h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          data-testid="button-close-emulator-tutorial"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 pb-8">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div
              className="rounded-md px-4 py-2.5 mb-3"
              style={{ background: section.gradient }}
            >
              <span className="text-sm font-bold uppercase tracking-widest text-white">
                {section.label}
              </span>
            </div>
            <div className="space-y-2">
              {section.rules.map((rule, idx) => (
                <div
                  key={idx}
                  className="flex gap-3 items-start rounded-md p-3"
                  style={{ background: section.pillBg }}
                  data-testid={`emulator-rule-${section.label.toLowerCase().replace(/\s+/g, "-")}-${idx}`}
                >
                  <div className="shrink-0 mt-0.5">
                    <rule.icon className="w-4 h-4" style={{ color: section.iconColor }} />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-snug mb-1">{rule.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{rule.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <Button
          className="w-full mt-2"
          onClick={onClose}
          data-testid="button-emulator-tutorial-done"
        >
          Got It!
        </Button>
      </div>
    </div>
  );
}
