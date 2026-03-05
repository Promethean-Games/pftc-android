import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-bold" data-testid="text-leveler-title">Table Leveler</h2>
        <Button size="icon" variant="ghost" onClick={onClose} data-testid="button-close-leveler">
          <X className="w-5 h-5" />
        </Button>
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
    </div>
  );
}
