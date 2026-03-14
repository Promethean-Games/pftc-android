import { X, Info, Layers, Circle, Hash, Flag, CheckCircle2, Zap, AlertTriangle, ArrowUpToLine, AlertCircle, ListChecks, Heart, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Rule {
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  title: string;
  body: string;
}

interface Section {
  label: string;
  gradient: string;
  iconColor: string;
  pillBg: string;
  rules: Rule[];
}

const SECTIONS: Section[] = [
  {
    label: "The Game",
    gradient: "linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)",
    iconColor: "#93c5fd",
    pillBg: "rgba(59,130,246,0.12)",
    rules: [
      {
        icon: Info,
        title: "Par for the Course",
        body: "Turns the pool table into a golf course. Each card creates a new layout — a \"hole\". Players clear the table — stripes first, then solids — in fewer shots than the hole's par.",
      },
    ],
  },
  {
    label: "Setup",
    gradient: "linear-gradient(135deg, #065f46 0%, #059669 100%)",
    iconColor: "#6ee7b7",
    pillBg: "rgba(16,185,129,0.12)",
    rules: [
      {
        icon: Layers,
        title: "Draw a Course Card",
        body: "The tallest player draws a card to determine the ball layout. A Joker lets that player design a custom layout or replay a previous card.",
      },
      {
        icon: Circle,
        title: "Set Up the Balls",
        body: "Arrange balls exactly as shown on the card — aligned with table diamonds, cushions, pockets, or other balls.",
      },
      {
        icon: Hash,
        title: "Determine Par",
        body: "Par = total number of balls in the layout.",
      },
      {
        icon: Flag,
        title: "Tee Off",
        body: "Players shoot tallest to shortest on the first hole. Each player starts with ball in hand.",
      },
    ],
  },
  {
    label: "Gameplay",
    gradient: "linear-gradient(135deg, #92400e 0%, #d97706 100%)",
    iconColor: "#fcd34d",
    pillBg: "rgba(245,158,11,0.12)",
    rules: [
      {
        icon: CheckCircle2,
        title: "Clear the Table",
        body: "Stripes must be pocketed first. Solids follow once all stripes are gone. Every shot attempt — made or missed — counts as one stroke.",
      },
      {
        icon: Zap,
        title: "No Called Shots",
        body: "Players do not need to call balls or pockets. Any ball that drops counts.",
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
        icon: AlertTriangle,
        title: "Wrong Ball Order  +1",
        body: "Contacting or disturbing any solid before all stripes are cleared adds one penalty stroke.",
      },
      {
        icon: ArrowUpToLine,
        title: "Ball Off the Table  +1 per ball",
        body: "Each ball that leaves the table counts as pocketed and adds one penalty stroke.",
      },
      {
        icon: AlertCircle,
        title: "Scratch  +1",
        body: "Pocketing the cue ball costs one penalty stroke, but the player continues with ball in hand.",
      },
      {
        icon: ListChecks,
        title: "Fouls Stack",
        body: "Multiple penalties on a single shot all apply and are counted after all balls stop moving.",
      },
      {
        icon: Heart,
        title: "Mercy Rule",
        body: "If a player reaches 5 strokes over par for a hole, they may pick up and record Par + 5.",
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
        title: "Lowest Score Wins",
        body: "After all holes are played, the player with the fewest total strokes wins. Ties are broken by the most holes at or under par.",
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
              {section.rules.map((rule) => (
                <div
                  key={rule.title}
                  className="flex gap-3 items-start rounded-md p-3"
                  style={{ background: section.pillBg }}
                  data-testid={`rule-${rule.title.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")}`}
                >
                  <div className="shrink-0 mt-0.5">
                    <rule.icon
                      className="w-4 h-4"
                      style={{ color: section.iconColor }}
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-sm leading-snug mb-0.5">{rule.title}</p>
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
          data-testid="button-tutorial-done"
        >
          Got It!
        </Button>
      </div>
    </div>
  );
}
