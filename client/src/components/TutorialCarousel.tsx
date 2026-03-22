import { X, PlayCircle, LayoutDashboard, AlertCircle, AlertTriangle, ArrowUpToLine, ListChecks, Heart, Trophy, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Rule {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title?: string;
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
    label: "To Begin",
    gradient: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)",
    iconColor: "#93c5fd",
    pillBg: "rgba(59,130,246,0.12)",
    rules: [
      {
        icon: PlayCircle,
        body: (
          <>
            Turn your pool table into a golf course! Each card creates a new layout or
            {" "}"hole". Players clear the table; stripes first, then solids. Players tee
            off with <B>ball-in-hand</B> and are{" "}
            <B>not required to call their shot or pocket.</B>
          </>
        ),
      },
      {
        icon: PlayCircle,
        body: (
          <>
            Play solo or challenge your friends. Add player names to begin. Each player
            may be assigned a unique identifying <B>DASHBOARD</B> color.
          </>
        ),
      },
    ],
  },
  {
    label: "Dashboard",
    gradient: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
    iconColor: "#6ee7b7",
    pillBg: "rgba(16,185,129,0.12)",
    rules: [
      {
        icon: LayoutDashboard,
        body: (
          <>
            Draw a card at random (by tapping the back of the card). Set up the table to
            match the card as shown. A Joker lets the leader design a custom layout or
            replay a previous card.
          </>
        ),
      },
      {
        icon: LayoutDashboard,
        body: (
          <>
            Tally each player's score for the respective hole. When all players have a
            score recorded (non-zero), proceed to <B>NEXT CARD.</B>
          </>
        ),
      },
      {
        icon: Smartphone,
        title: "Tip",
        body: (
          <>
            The <B>Advanced Cueing Emulator</B> (in CueMaster Tools) works best in{" "}
            <B>landscape mode.</B> Rotate your device sideways for the most table space.
          </>
        ),
      },
    ],
  },
  {
    label: "Penalties",
    gradient: "linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)",
    iconColor: "#fca5a5",
    pillBg: "rgba(239,68,68,0.12)",
    rules: [
      {
        icon: AlertCircle,
        title: "Scratch",
        body: (
          <>
            Pocketing the cue ball costs one penalty stroke{" "}
            <B>(added to the stroke attempt = +2)</B>, but the player continues with{" "}
            <B>ball-in-hand</B>.
          </>
        ),
      },
      {
        icon: AlertTriangle,
        title: "Wrong Order",
        body: (
          <>
            Contacting or disturbing a solid before all stripes are pocketed is a foul
            and results in one penalty stroke{" "}
            <B>(added to the stroke attempt = +2)</B>. Play resumes where the balls lay.
          </>
        ),
      },
      {
        icon: ArrowUpToLine,
        title: "Off Table",
        body: (
          <>
            An <B>object ball</B> that comes off the table is considered pocketed, but
            results in a one stroke penalty{" "}
            <B>(added to the stroke attempt = +2)</B>.
          </>
        ),
      },
      {
        icon: ListChecks,
        body: (
          <>
            Scratches, Wrong Order, and Off-Table penalties can only be assessed once per
            stroke but are stacked when applicable.
          </>
        ),
      },
    ],
  },
  {
    label: "Mercy",
    gradient: "linear-gradient(135deg, #92400e 0%, #d97706 100%)",
    iconColor: "#fcd34d",
    pillBg: "rgba(245,158,11,0.12)",
    rules: [
      {
        icon: Heart,
        body: (
          <>
            A player whose score exceeds 5 over par may declare{" "}
            <B>"mercy"</B> and accept a score of +5 over par (regardless of the number
            of strokes or balls still on the table).
          </>
        ),
      },
    ],
  },
  {
    label: "Winning",
    gradient: "linear-gradient(135deg, #713f12 0%, #ca8a04 100%)",
    iconColor: "#fde68a",
    pillBg: "rgba(234,179,8,0.12)",
    rules: [
      {
        icon: Trophy,
        body: (
          <>
            The lowest score at the end of the game (strokes + penalties) is the winner!
          </>
        ),
      },
    ],
  },
];

interface TutorialCarouselProps {
  onClose: () => void;
}

export function TutorialCarousel({ onClose }: TutorialCarouselProps) {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col" data-testid="tutorial-overlay">
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2 className="text-lg font-bold tracking-tight" data-testid="text-tutorial-title">How to Play</h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          data-testid="button-close-tutorial"
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
                  data-testid={`rule-${section.label.toLowerCase()}-${idx}`}
                >
                  <div className="shrink-0 mt-0.5">
                    <rule.icon
                      className="w-4 h-4"
                      style={{ color: section.iconColor }}
                    />
                  </div>
                  <div>
                    {rule.title && (
                      <p className="font-bold text-sm leading-snug mb-1">{rule.title}</p>
                    )}
                    <p className="text-sm text-muted-foreground leading-relaxed">{rule.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div data-testid="section-special-thanks">
          <div
            className="rounded-md px-4 py-2.5 mb-3"
            style={{ background: "linear-gradient(135deg, #1c1917 0%, #292524 100%)" }}
          >
            <span className="text-sm font-bold uppercase tracking-widest text-white/70">
              Special Thanks
            </span>
          </div>
          <div className="rounded-md p-3" style={{ background: "rgba(120,113,108,0.08)" }}>
            <p className="text-xs text-muted-foreground/70 leading-relaxed mb-3">
              To our friends and family who have supported the development of Promethean Games
            </p>
            <div className="grid grid-cols-3 gap-x-3 gap-y-0.5 mb-4">
              {[
                "Francine A.","Rey A.","Anita B.","Joy A.","Lorenzo L.","Joss H.",
                "Eric B.","Donavan T.","Jimmy G.","Shawn A.","Jim P.","Anna P.","Kyle C.","Forrest C.","Keven F.",
                "Reese S.","Nate R.","Caleb R.","Amy V.","Jerry L.","Jesus G.",
                "Dylan G.","Floyd A.","Chris S.","Rob W.","Kristin W.","Eric R.",
                "Bobby B.","Blake K.","Rob B.","Sidney C.","Issac V.","Lauren C.",
                "Caleb M.","Katie H.","Jason B.","Matt R.","Jo R.","Kelsey B.",
                "Irving G.","Peter L.",
              ].map((name) => (
                <span key={name} className="text-xs text-muted-foreground/60 leading-5">
                  {name}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted-foreground/50 leading-relaxed">
              Made with love by Promethean Games
            </p>
            <p className="text-xs text-muted-foreground/40 mt-0.5">
              &copy; 2026 All rights reserved
            </p>
          </div>
        </div>

        <Button
          className="w-full mt-2"
          onClick={onClose}
          data-testid="button-tutorial-done"
        >
          Got It!
        </Button>
      </div>
    </div>
  );
}
