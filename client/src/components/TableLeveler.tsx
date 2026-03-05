import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, RotateCcw, ChevronLeft, ChevronRight, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const TUTORIAL_SLIDES = [
  {
    title: "Place Your Device",
    icon: "phone",
    description: "Lay your phone flat on the pool table surface. The leveler works best when the device is centered on the table.",
  },
  {
    title: "Read the Bubble",
    icon: "bubble",
    description: "The bubble shows how level the surface is. Green means level, yellow means slightly off, and red means the table needs adjustment.",
  },
  {
    title: "Calibrate a Preset",
    icon: "calibrate",
    description: "Choose Home, League, or Tournament. Place your device on a known-level surface and tap Calibrate to set that preset's zero point.",
  },
  {
    title: "Switch Presets",
    icon: "presets",
    description: "Each preset saves its own calibration. Switch between them when you move to a different table or venue.",
  },
  {
    title: "Tilt Readout",
    icon: "readout",
    description: "The L/R and F/B values show exact tilt in degrees. Aim for less than 0.5\u00B0 in both directions for a truly level table.",
  },
];

function TutorialIcon({ type }: { type: string }) {
  const size = "w-12 h-12 mx-auto mb-3 text-primary";
  switch (type) {
    case "phone":
      return (
        <svg className={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="12" y="4" width="24" height="40" rx="4" />
          <line x1="20" y1="38" x2="28" y2="38" />
          <line x1="24" y1="10" x2="24" y2="30" strokeDasharray="2 3" opacity="0.4" />
        </svg>
      );
    case "bubble":
      return (
        <svg className={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="24" cy="24" r="18" />
          <circle cx="24" cy="24" r="10" opacity="0.3" />
          <circle cx="24" cy="24" r="5" fill="currentColor" opacity="0.6" />
        </svg>
      );
    case "calibrate":
      return (
        <svg className={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="24" cy="24" r="18" />
          <line x1="24" y1="6" x2="24" y2="14" />
          <line x1="24" y1="34" x2="24" y2="42" />
          <line x1="6" y1="24" x2="14" y2="24" />
          <line x1="34" y1="24" x2="42" y2="24" />
          <circle cx="24" cy="24" r="3" fill="currentColor" />
        </svg>
      );
    case "presets":
      return (
        <svg className={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="18" width="12" height="12" rx="2" />
          <rect x="18" y="18" width="12" height="12" rx="2" fill="currentColor" opacity="0.2" />
          <rect x="32" y="18" width="12" height="12" rx="2" />
          <line x1="10" y1="34" x2="10" y2="38" />
          <line x1="24" y1="34" x2="24" y2="38" />
          <line x1="38" y1="34" x2="38" y2="38" />
        </svg>
      );
    case "readout":
      return (
        <svg className={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="6" y="10" width="36" height="28" rx="3" />
          <text x="14" y="28" fontSize="10" fill="currentColor" fontFamily="monospace">0.3°</text>
        </svg>
      );
    default:
      return null;
  }
}

function LevelerTutorial({ onClose }: { onClose: () => void }) {
  const [page, setPage] = useState(0);
  const slide = TUTORIAL_SLIDES[page];

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6" data-testid="leveler-tutorial">
      <Card className="w-full max-w-sm p-6 relative">
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-2 right-2"
          onClick={onClose}
          data-testid="button-close-leveler-tutorial"
        >
          <X className="w-4 h-4" />
        </Button>

        <div className="text-center pt-2">
          <TutorialIcon type={slide.icon} />
          <h3 className="text-lg font-bold mb-2" data-testid="text-tutorial-slide-title">{slide.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-6">{slide.description}</p>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4" data-testid="tutorial-dots">
          {TUTORIAL_SLIDES.map((_, i) => (
            <button
              key={i}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-colors",
                i === page ? "bg-primary" : "bg-muted-foreground/30"
              )}
              onClick={() => setPage(i)}
              data-testid={`button-tutorial-dot-${i}`}
            />
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setPage(page - 1)}
            disabled={page === 0}
            data-testid="button-tutorial-prev"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          {page < TUTORIAL_SLIDES.length - 1 ? (
            <Button
              className="flex-1"
              onClick={() => setPage(page + 1)}
              data-testid="button-tutorial-next"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={() => {
                localStorage.setItem("pftc_leveler_tutorial_seen", "true");
                onClose();
              }}
              data-testid="button-tutorial-done"
            >
              Got It
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

type Preset = "home" | "league" | "tournament";

interface CalibrationData {
  beta: number;
  gamma: number;
}

const PRESET_LABELS: Record<Preset, string> = {
  home: "Home",
  league: "League",
  tournament: "Tournament",
};

const STORAGE_KEYS: Record<Preset, string> = {
  home: "pftc_level_home",
  league: "pftc_level_league",
  tournament: "pftc_level_tournament",
};

function loadCalibration(preset: Preset): CalibrationData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS[preset]);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveCalibration(preset: Preset, data: CalibrationData) {
  localStorage.setItem(STORAGE_KEYS[preset], JSON.stringify(data));
}

const LEVEL_RADIUS = 120;
const BUBBLE_RADIUS = 18;
const MAX_OFFSET = LEVEL_RADIUS - BUBBLE_RADIUS - 4;
const DEADZONE = 0.5;
const WARN_THRESHOLD = 2;
const DANGER_THRESHOLD = 5;

interface TableLevelerProps {
  onClose: () => void;
}

export function TableLeveler({ onClose }: TableLevelerProps) {
  const [activePreset, setActivePreset] = useState<Preset>("home");
  const [calibration, setCalibration] = useState<CalibrationData | null>(() => loadCalibration("home"));
  const [rawBeta, setRawBeta] = useState(0);
  const [rawGamma, setRawGamma] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [showTutorial, setShowTutorial] = useState(() => {
    return localStorage.getItem("pftc_leveler_tutorial_seen") !== "true";
  });
  const listenerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  const tiltX = rawGamma - (calibration?.gamma ?? 0);
  const tiltY = rawBeta - (calibration?.beta ?? 0);

  const bubbleX = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, (tiltX / 15) * MAX_OFFSET));
  const bubbleY = Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, (tiltY / 15) * MAX_OFFSET));

  const absTilt = Math.sqrt(tiltX * tiltX + tiltY * tiltY);
  const bubbleColor =
    absTilt <= DEADZONE
      ? "bg-green-500"
      : absTilt <= WARN_THRESHOLD
        ? "bg-green-400"
        : absTilt <= DANGER_THRESHOLD
          ? "bg-yellow-400"
          : "bg-red-500";

  const ringColor =
    absTilt <= DEADZONE
      ? "ring-green-500/30"
      : absTilt <= WARN_THRESHOLD
        ? "ring-green-400/20"
        : absTilt <= DANGER_THRESHOLD
          ? "ring-yellow-400/20"
          : "ring-red-500/20";

  const handleOrientation = useCallback((e: DeviceOrientationEvent) => {
    if (e.beta !== null) setRawBeta(e.beta);
    if (e.gamma !== null) setRawGamma(e.gamma);
  }, []);

  const startListening = useCallback(() => {
    if (listenerRef.current) {
      window.removeEventListener("deviceorientation", listenerRef.current);
    }
    listenerRef.current = handleOrientation;
    window.addEventListener("deviceorientation", handleOrientation);
    setPermissionGranted(true);
  }, [handleOrientation]);

  const isSupported = typeof window !== "undefined" && "DeviceOrientationEvent" in window;

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      setPermissionGranted(false);
      return;
    }
    const DOE = window.DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === "function") {
      try {
        const result = await DOE.requestPermission();
        if (result === "granted") {
          startListening();
        } else {
          setPermissionGranted(false);
        }
      } catch {
        setPermissionGranted(false);
      }
    } else {
      startListening();
    }
  }, [startListening, isSupported]);

  useEffect(() => {
    if (!isSupported) {
      setPermissionGranted(false);
      return;
    }
    const DOE = window.DeviceOrientationEvent as any;
    if (typeof DOE.requestPermission === "function") {
      setNeedsPermission(true);
    } else {
      startListening();
    }
    return () => {
      if (listenerRef.current) {
        window.removeEventListener("deviceorientation", listenerRef.current);
      }
    };
  }, [startListening, isSupported]);

  const handlePresetChange = (preset: Preset) => {
    setActivePreset(preset);
    setCalibration(loadCalibration(preset));
  };

  const handleCalibrate = () => {
    const data: CalibrationData = { beta: rawBeta, gamma: rawGamma };
    saveCalibration(activePreset, data);
    setCalibration(data);
  };

  const handleResetCalibration = () => {
    localStorage.removeItem(STORAGE_KEYS[activePreset]);
    setCalibration(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col" data-testid="table-leveler">
      <div className="flex items-center justify-between gap-2 p-4 border-b">
        <h2 className="text-lg font-bold" data-testid="text-leveler-title">Table Leveler</h2>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={() => setShowTutorial(true)} data-testid="button-leveler-help">
            <HelpCircle className="w-5 h-5" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-leveler">
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-6 overflow-y-auto">
        {needsPermission && permissionGranted === null && (
          <Card className="p-6 text-center max-w-sm">
            <p className="text-sm text-muted-foreground mb-4">
              This tool needs access to your device's motion sensors to detect table tilt.
            </p>
            <Button onClick={requestPermission} data-testid="button-request-permission">
              Enable Motion Sensors
            </Button>
          </Card>
        )}

        {permissionGranted === false && (
          <Card className="p-6 text-center max-w-sm">
            <p className="text-sm text-muted-foreground mb-2">
              {isSupported
                ? "Motion sensor access was denied. Please enable it in your device settings and try again."
                : "Motion sensors are not available on this device. The Table Leveler requires a mobile device with an accelerometer."}
            </p>
          </Card>
        )}

        {(permissionGranted === true || (!needsPermission && permissionGranted === null)) && (
          <>
            <div
              className={cn("relative rounded-full ring-8 transition-all duration-300", ringColor)}
              style={{
                width: LEVEL_RADIUS * 2,
                height: LEVEL_RADIUS * 2,
                background: "radial-gradient(circle, hsl(var(--muted)) 0%, hsl(var(--muted)/0.3) 100%)",
              }}
              data-testid="level-container"
            >
              <div
                className="absolute rounded-full border border-muted-foreground/20"
                style={{
                  width: LEVEL_RADIUS * 2 - 8,
                  height: LEVEL_RADIUS * 2 - 8,
                  top: 4,
                  left: 4,
                }}
              />
              <div
                className="absolute rounded-full border border-muted-foreground/10"
                style={{
                  width: LEVEL_RADIUS,
                  height: LEVEL_RADIUS,
                  top: LEVEL_RADIUS / 2,
                  left: LEVEL_RADIUS / 2,
                }}
              />

              <div
                className="absolute w-3 h-[1px] bg-muted-foreground/30"
                style={{ top: LEVEL_RADIUS, left: LEVEL_RADIUS - 6 }}
              />
              <div
                className="absolute h-3 w-[1px] bg-muted-foreground/30"
                style={{ left: LEVEL_RADIUS, top: LEVEL_RADIUS - 6 }}
              />

              <div
                className={cn(
                  "absolute rounded-full shadow-lg transition-colors duration-300",
                  bubbleColor
                )}
                style={{
                  width: BUBBLE_RADIUS * 2,
                  height: BUBBLE_RADIUS * 2,
                  left: LEVEL_RADIUS + bubbleX - BUBBLE_RADIUS,
                  top: LEVEL_RADIUS + bubbleY - BUBBLE_RADIUS,
                  boxShadow: "inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)",
                }}
                data-testid="level-bubble"
              />
            </div>

            <div className="flex gap-6 text-center" data-testid="tilt-values">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">L/R Tilt</div>
                <div className="text-2xl font-mono font-bold">{tiltX.toFixed(1)}°</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider">F/B Tilt</div>
                <div className="text-2xl font-mono font-bold">{tiltY.toFixed(1)}°</div>
              </div>
            </div>

            <div className="w-full max-w-sm space-y-3">
              <div className="flex gap-1 p-1 rounded-lg bg-muted" data-testid="preset-tabs">
                {(Object.keys(PRESET_LABELS) as Preset[]).map((preset) => (
                  <button
                    key={preset}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors",
                      activePreset === preset
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground"
                    )}
                    onClick={() => handlePresetChange(preset)}
                    data-testid={`button-preset-${preset}`}
                  >
                    {PRESET_LABELS[preset]}
                  </button>
                ))}
              </div>

              <div className="text-center text-xs text-muted-foreground">
                {calibration
                  ? `Calibrated (offset: ${calibration.gamma.toFixed(1)}°, ${calibration.beta.toFixed(1)}°)`
                  : "Not calibrated — place device on table and tap Calibrate"}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleCalibrate} data-testid="button-calibrate">
                  Calibrate {PRESET_LABELS[activePreset]}
                </Button>
                {calibration && (
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleResetCalibration}
                    data-testid="button-reset-calibration"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {showTutorial && (
        <LevelerTutorial onClose={() => {
          localStorage.setItem("pftc_leveler_tutorial_seen", "true");
          setShowTutorial(false);
        }} />
      )}
    </div>
  );
}
