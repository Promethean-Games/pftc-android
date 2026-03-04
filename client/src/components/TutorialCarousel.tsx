import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface TutorialSlide {
  title: string;
  body: string;
}

const SLIDES: TutorialSlide[] = [
  {
    title: "Par for the Course",
    body: "Par for the Course turns the pool table into a golf course. Each card creates a new layout (\u201Chole\u201D). Players try to clear the table\u2014stripes first, then solids\u2014in fewer strokes than the hole\u2019s par.",
  },
  {
    title: "Draw a Course Card",
    body: "The tallest player draws a card to determine the ball layout. A Joker allows that player to design a custom layout or replay a previous card.",
  },
  {
    title: "Set Up the Balls",
    body: "Arrange the balls exactly as shown on the card, typically aligned with table diamonds, cushions, pockets, or other balls.",
  },
  {
    title: "Determine Par",
    body: "Par = total number of balls in the layout.",
  },
  {
    title: "Tee Off",
    body: "Players shoot tallest to shortest on the first hole. Each player starts with ball in hand.",
  },
  {
    title: "Clear the Table",
    body: "Stripes must be pocketed first. Solids come after all stripes are gone. Every shot attempt counts as one stroke.",
  },
  {
    title: "No Called Shots",
    body: "Players do not need to call balls or pockets.",
  },
  {
    title: "Penalty \u2014 Wrong Ball Order",
    body: "Contacting or disturbing solids before stripes are cleared: +1 stroke.",
  },
  {
    title: "Penalty \u2014 Ball Off the Table",
    body: "Counts as pocketed and adds +1 stroke per ball.",
  },
  {
    title: "Penalty \u2014 Scratch",
    body: "Pocketing the cue ball costs +1 stroke, but the player continues with ball in hand.",
  },
  {
    title: "Multiple Fouls Stack",
    body: "Penalties apply after all balls stop moving.",
  },
  {
    title: "Mercy Rule",
    body: "If a player reaches 5 strokes over par, they may stop the hole and record Par + 5.",
  },
  {
    title: "Winning",
    body: "After all holes are played, the player with the fewest total strokes wins.",
  },
];

interface TutorialCarouselProps {
  onClose: () => void;
}

export function TutorialCarousel({ onClose }: TutorialCarouselProps) {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isFirst = index === 0;
  const isLast = index === SLIDES.length - 1;

  const prev = () => setIndex((i) => Math.max(0, i - 1));
  const next = () => setIndex((i) => Math.min(SLIDES.length - 1, i + 1));

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex flex-col items-center justify-center p-6">
      <div className="absolute top-4 right-4">
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          data-testid="button-close-tutorial"
        >
          <X className="w-6 h-6" />
        </Button>
      </div>

      <div className="w-full max-w-md flex flex-col items-center text-center flex-1 justify-center">
        <div className="text-xs uppercase text-muted-foreground font-semibold mb-2" data-testid="text-tutorial-progress">
          {index + 1} / {SLIDES.length}
        </div>

        <h2 className="text-2xl font-bold mb-4" data-testid="text-tutorial-title">
          {slide.title}
        </h2>

        <p className="text-lg text-muted-foreground leading-relaxed mb-8" data-testid="text-tutorial-body">
          {slide.body}
        </p>

        <div className="flex items-center gap-4 w-full">
          <Button
            variant="outline"
            className="flex-1"
            onClick={prev}
            disabled={isFirst}
            data-testid="button-tutorial-prev"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>

          {isLast ? (
            <Button
              className="flex-1"
              onClick={onClose}
              data-testid="button-tutorial-done"
            >
              Got It!
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={next}
              data-testid="button-tutorial-next"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 mt-6">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`w-2 h-2 rounded-full transition-colors ${
              i === index ? "bg-primary" : "bg-muted-foreground/30"
            }`}
            data-testid={`button-tutorial-dot-${i}`}
          />
        ))}
      </div>
    </div>
  );
}
