import { X, CircleDot, Crosshair, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CueMasterToolsProps {
  onClose: () => void;
  onOpenCoinFlip: () => void;
  onOpenEmulator: () => void;
  onOpenLeveler: () => void;
}

const TOOLS = [
  {
    key: "coin-flip",
    icon: CircleDot,
    title: "Coin Flip",
    description: "Flip to decide who breaks",
    gradient: "linear-gradient(135deg, #78350f 0%, #b45309 100%)",
    iconColor: "#fde68a",
    pillBg: "rgba(245,158,11,0.12)",
  },
  {
    key: "cueing-emulator",
    icon: Crosshair,
    title: "Cueing Emulator",
    description: "Simulate shots on a virtual table",
    gradient: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)",
    iconColor: "#93c5fd",
    pillBg: "rgba(59,130,246,0.12)",
  },
  {
    key: "table-leveler",
    icon: Ruler,
    title: "Table Leveler",
    description: "Check your table's level with your device",
    gradient: "linear-gradient(135deg, #14532d 0%, #16a34a 100%)",
    iconColor: "#86efac",
    pillBg: "rgba(34,197,94,0.12)",
  },
] as const;

export function CueMasterTools({
  onClose,
  onOpenCoinFlip,
  onOpenEmulator,
  onOpenLeveler,
}: CueMasterToolsProps) {
  const handlers: Record<string, () => void> = {
    "coin-flip": onOpenCoinFlip,
    "cueing-emulator": onOpenEmulator,
    "table-leveler": onOpenLeveler,
  };

  return (
    <div
      className="fixed inset-0 bg-background z-50 flex flex-col"
      data-testid="cuemaster-tools-overlay"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
        <h2
          className="text-lg font-bold tracking-tight"
          data-testid="text-cuemaster-title"
        >
          CueMaster Tools
        </h2>
        <Button
          size="icon"
          variant="ghost"
          onClick={onClose}
          data-testid="button-close-cuemaster-tools"
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-3">
        {TOOLS.map((tool) => (
          <button
            key={tool.key}
            className="w-full text-left rounded-md overflow-hidden hover-elevate active-elevate-2"
            onClick={handlers[tool.key]}
            data-testid={`button-tool-${tool.key}`}
          >
            <div
              className="rounded-md px-4 py-4 flex items-center gap-4"
              style={{ background: tool.gradient }}
            >
              <div className="shrink-0">
                <tool.icon
                  className="w-9 h-9"
                  style={{ color: tool.iconColor }}
                />
              </div>
              <div>
                <p className="font-bold text-white text-base leading-tight">
                  {tool.title}
                </p>
                <p className="text-sm text-white/65 mt-0.5">
                  {tool.description}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
