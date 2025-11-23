import { Button } from "@/components/ui/button";
import { LOGO_URL } from "@/lib/constants";

interface SplashScreenProps {
  onNewGame: () => void;
  onLoadGame: () => void;
}

export function SplashScreen({ onNewGame, onLoadGame }: SplashScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="mb-12">
        <img 
          src={LOGO_URL} 
          alt="Par for the Course" 
          className="w-full max-w-[280px] h-auto"
        />
      </div>
      
      <div className="w-full max-w-md space-y-4">
        <Button 
          size="lg"
          className="w-full text-lg h-14"
          onClick={onNewGame}
          data-testid="button-new-game"
        >
          New Game
        </Button>
        <Button 
          size="lg"
          variant="outline"
          className="w-full text-lg h-14"
          onClick={onLoadGame}
          data-testid="button-load-game"
        >
          Load Game
        </Button>
      </div>
    </div>
  );
}
