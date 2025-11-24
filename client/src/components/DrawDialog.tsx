import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DrawDialogProps {
  onSelectPar: (par: number) => void;
  onClose: () => void;
}

export function DrawDialog({ onSelectPar, onClose }: DrawDialogProps) {
  const [selectedPar, setSelectedPar] = useState<number | null>(null);

  const handleConfirm = () => {
    if (selectedPar) {
      onSelectPar(selectedPar);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-background/95 z-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-8">
        <h1 className="text-8xl font-extrabold" data-testid="text-draw">DRAW!</h1>
        
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

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={onClose}
            data-testid="button-cancel-draw"
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-12"
            onClick={handleConfirm}
            disabled={!selectedPar}
            data-testid="button-confirm-draw"
          >
            Confirm
          </Button>
        </div>
      </div>
    </div>
  );
}
