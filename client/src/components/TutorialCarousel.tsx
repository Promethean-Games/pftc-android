import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface TutorialSlide {
  title: string;
  body: string;
}

const SLIDES: TutorialSlide[] = [
  {
    title: "Draw a Course Card",
    body: "The tallest player draws a card to determine the ball layout. If a Joker is drawn, the player may create a custom layout or replay a previous card.",
  },
  {
    title: "Set Up the Table",
    body: "Arrange the balls on the table exactly as shown on the card. Layouts often align with table diamonds, cushions, other balls, or pocket edges.",
  },
  {
    title: "Determine Par",
    body: "Par equals the total number of balls used on that card.",
  },
  {
    title: "Tee Off",
    body: "Players shoot in order from tallest to shortest on the first hole. Each player begins with ball in hand.",
  },
  {
    title: "Objective",
    body: "Pocket all striped balls first, then all solid balls, using the fewest strokes possible.",
  },
  {
    title: "No Called Shots",
    body: "Players do not need to call balls or pockets.",
  },
  {
    title: "Stroke Counting",
    body: "Every shot attempt counts as one stroke, whether successful or not.",
  },
  {
    title: "Round Order",
    body: "On the next hole, players shoot from lowest score to highest score (ties revert to tallest-to-shortest order).",
  },
  {
    title: "Next Card",
    body: "The first player to tee off draws the next card or may delegate the draw (which also transfers Joker layout control).",
  },
  {
    title: "Penalty \u2014 Wrong Ball Contact",
    body: "Hitting or disturbing solids before all stripes are pocketed results in a 1-stroke penalty per shot.",
  },
  {
    title: "Penalty \u2014 Balls Leaving the Table",
    body: "Any ball knocked off the table counts as pocketed and adds 1 penalty stroke per ball.",
  },
  {
    title: "Penalty \u2014 Scratch",
    body: "Pocketing the cue ball results in a 2-stroke penalty, but the player continues their turn with ball in hand.",
  },
  {
    title: "Penalty Timing",
    body: "Fouls are assessed after all balls stop moving and penalties can stack.",
  },
  {
    title: "Ending a Bad Hole",
    body: "If a player reaches 5 strokes over par, they may stop and record Par + 5.",
  },
  {
    title: "Winning the Game",
    body: "After all cards are played, the player with the lowest total strokes wins.",
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
