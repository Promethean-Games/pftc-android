import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import drawImage from "@assets/draw-image.png";

interface DrawDialogProps {
  onSelectPar: (par: number) => void;
  isFirstDraw?: boolean;
}

export function DrawDialog({ onSelectPar, isFirstDraw = false }: DrawDialogProps) {
  const [selectedPar, setSelectedPar] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedPar) {
      onSelectPar(selectedPar);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-8">
        {isFirstDraw && (
          <div className="space-y-2">
            <p className="text-muted-foreground text-lg" data-testid="text-first-draw-tip">
              To begin, the tallest player draws a card at random.
            </p>
            <a 
              href="https://www.thegamecrafter.com/games/par-for-the-course-classic"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline text-sm"
              data-testid="link-buy-cards"
            >
              I don't have cards yet.
            </a>
          </div>
        )}
        
        {isFirstDraw ? (
          <img 
            src={drawImage} 
            alt="DRAW!" 
            className="w-full max-w-sm mx-auto rounded-lg"
            data-testid="img-draw-first"
          />
        ) : (
          <div className="space-y-2">
            <h1 className="text-8xl font-extrabold" data-testid="text-draw">DRAW!</h1>
            <p className="text-muted-foreground text-lg" data-testid="text-lowest-score-tip">
              Select par for the next course. (The player with the lowest score plays first)
            </p>
          </div>
        )}
        
        <div className="space-y-4">
          <label htmlFor="par-select-draw" className="text-xl font-semibold block">
            Select Par for This Hole
          </label>
          <Select value={selectedPar?.toString() || ""} onValueChange={(v) => setSelectedPar(parseInt(v))}>
            <SelectTrigger className="w-full h-14 text-xl" id="par-select-draw" data-testid="select-par-draw">
              <SelectValue placeholder="Select Par" />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 15 }, (_, i) => i + 1).map((par) => (
                <SelectItem key={par} value={par.toString()}>
                  Par {par}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          className="w-full h-14 text-lg"
          onClick={handleConfirm}
          disabled={!selectedPar}
          data-testid="button-confirm-draw"
        >
          Confirm Par
        </Button>
      </div>
    </div>
  );
}
