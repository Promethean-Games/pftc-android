import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X, Plus, Trash2, Undo2, Crosshair, Grid3x3, Move, Settings, RefreshCw, BookOpen, Target } from "lucide-react";
import { CueingEmulatorTour, getTourTrigger, TOUR_STEP_COUNT } from "./CueingEmulatorTour";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  simulateShot,
  createBall,
  TABLE_DIMENSIONS,
  type Ball,
  type ShotParams,
  type TableConfig,
  type TrajectorySegment,
} from "@/lib/billiards-physics";

interface CueingEmulatorProps {
  onClose: () => void;
}

const TRAJ_COLORS: Record<string, string> = {
  cue: "#60a5fa",
  solid: "#eab308",
  stripe: "#000000",
};

const BALL_FILL: Record<string, string> = {
  cue: "#ffffff",
  solid: "#eab308",
  stripe: "#ffffff",
};

interface PresetBall {
  type: "solid" | "stripe";
  x: number;
  y: number;
}

interface CoursePreset {
  id: string;
  label: string;
  par: number;
  balls: PresetBall[];
}

const COURSE_PRESETS: CoursePreset[] = [
  { id: "2-01", label: "2-01", par: 2, balls: [
    { type: "stripe", x: 50, y: 2 },
    { type: "stripe", x: 50, y: 48 },
  ]},
  { id: "2-02", label: "2-02", par: 2, balls: [
    { type: "stripe", x: 12.5, y: 48 },
    { type: "stripe", x: 87.5, y: 2 },
  ]},
  { id: "2-03", label: "2-03", par: 2, balls: [
    { type: "stripe", x: 75, y: 1.13 },
    { type: "stripe", x: 98.88, y: 48.88 },
  ]},
  { id: "3-01", label: "3-01", par: 3, balls: [
    { type: "stripe", x: 87.5, y: 12.5 },
    { type: "stripe", x: 75, y: 25 },
    { type: "solid", x: 98, y: 2 },
  ]},
  { id: "3-02", label: "3-02", par: 3, balls: [
    { type: "stripe", x: 25, y: 25 },
    { type: "solid", x: 75, y: 25 },
    { type: "stripe", x: 87.5, y: 25 },
  ]},
  { id: "3-03", label: "3-03", par: 3, balls: [
    { type: "stripe", x: 50, y: 12.5 },
    { type: "solid", x: 50, y: 25 },
    { type: "stripe", x: 50, y: 37.5 },
  ]},
  { id: "3-04", label: "3-04", par: 3, balls: [
    { type: "solid", x: 87.5, y: 25 },
    { type: "stripe", x: 98, y: 2 },
    { type: "stripe", x: 98, y: 48 },
  ]},
  { id: "4-01", label: "4-01", par: 4, balls: [
    { type: "stripe", x: 25, y: 25 },
    { type: "solid", x: 50, y: 12.5 },
    { type: "solid", x: 50, y: 37.5 },
    { type: "stripe", x: 75, y: 25 },
  ]},
  { id: "4-02", label: "4-02", par: 4, balls: [
    { type: "solid", x: 50, y: 25 },
    { type: "stripe", x: 62.5, y: 25 },
    { type: "stripe", x: 75, y: 25 },
    { type: "stripe", x: 87.5, y: 25 },
  ]},
  { id: "4-03", label: "4-03", par: 4, balls: [
    { type: "stripe", x: 25, y: 25 },
    { type: "stripe", x: 75, y: 37.5 },
    { type: "solid", x: 98, y: 2 },
    { type: "solid", x: 98, y: 48 },
  ]},
  { id: "4-04", label: "4-04", par: 4, balls: [
    { type: "stripe", x: 50, y: 12.5 },
    { type: "stripe", x: 62.5, y: 25 },
    { type: "stripe", x: 75, y: 37.5 },
    { type: "solid", x: 75, y: 25 },
  ]},
  { id: "4-05", label: "4-05", par: 4, balls: [
    { type: "solid", x: 62.5, y: 12.5 },
    { type: "stripe", x: 62.5, y: 25 },
    { type: "solid", x: 62.5, y: 37.5 },
    { type: "stripe", x: 75, y: 37.5 },
  ]},
  { id: "5-01", label: "5-01", par: 5, balls: [
    { type: "solid", x: 62.5, y: 12.5 },
    { type: "solid", x: 62.5, y: 37.5 },
    { type: "stripe", x: 75, y: 25 },
    { type: "solid", x: 98.88, y: 1.13 },
    { type: "solid", x: 98.88, y: 48.88 },
  ]},
  { id: "5-02", label: "5-02", par: 5, balls: [
    { type: "solid", x: 12.5, y: 25 },
    { type: "stripe", x: 25, y: 12.5 },
    { type: "solid", x: 25, y: 25 },
    { type: "stripe", x: 25, y: 37.5 },
    { type: "solid", x: 37.5, y: 25 },
  ]},
  { id: "5-03", label: "5-03", par: 5, balls: [
    { type: "stripe", x: 25, y: 12.5 },
    { type: "stripe", x: 25, y: 37.5 },
    { type: "solid", x: 50, y: 25 },
    { type: "stripe", x: 75, y: 12.5 },
    { type: "stripe", x: 75, y: 37.5 },
  ]},
  { id: "6-01", label: "6-01", par: 6, balls: [
    { type: "stripe", x: 2, y: 2 },
    { type: "stripe", x: 2, y: 48 },
    { type: "stripe", x: 50, y: 2 },
    { type: "stripe", x: 50, y: 48 },
    { type: "stripe", x: 98, y: 2 },
    { type: "stripe", x: 98, y: 48 },
  ]},
];

function findCueBallPosition(presetBalls: PresetBall[]): { x: number; y: number } {
  const defaultPos = { x: 25, y: 25 };
  const ballRadius = 1.125;
  const minDist = ballRadius * 3;
  const occupied = (cx: number, cy: number) =>
    presetBalls.some(
      (b) => Math.abs(b.x - cx) < minDist && Math.abs(b.y - cy) < minDist
    );
  if (!occupied(defaultPos.x, defaultPos.y)) return defaultPos;
  const gridX = [12.5, 25, 37.5, 50, 62.5, 75, 87.5];
  const gridY = [12.5, 25, 37.5];
  let best = defaultPos;
  let bestDist = Infinity;
  for (const gx of gridX) {
    for (const gy of gridY) {
      if (occupied(gx, gy)) continue;
      const d = Math.hypot(gx - defaultPos.x, gy - defaultPos.y);
      if (d < bestDist) {
        bestDist = d;
        best = { x: gx, y: gy };
      }
    }
  }
  return best;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

function formatSpeed(v: number): string {
  const whole = Math.floor(v);
  const frac = Math.round((v - whole) * 4);
  if (frac === 0) return `${whole}`;
  if (frac === 1) return `${whole}¼`;
  if (frac === 2) return `${whole}½`;
  if (frac === 3) return `${whole}¾`;
  return `${whole + 1}`;
}

// ── Table Size ────────────────────────────────────────────────────────────────

interface TableSizeState {
  preset: "7ft" | "8ft" | "9ft" | "custom";
  customLength: number; // inches
  customWidth: number;  // inches
}

const TABLE_SIZE_PRESETS: Record<"7ft" | "8ft" | "9ft", { lengthIn: number; widthIn: number; ballScale: number }> = {
  "7ft": { lengthIn: 76, widthIn: 38, ballScale: 100 / 76 },
  "8ft": { lengthIn: 88, widthIn: 44, ballScale: 100 / 88 },
  "9ft": { lengthIn: 100, widthIn: 50, ballScale: 1.0 },
};


const DIAL_ITEM_H = 36;
const DIAL_VISIBLE = 5;

interface ScrollDialProps {
  values: number[];
  value: number;
  onChange: (v: number) => void;
  label: string;
}

function ScrollDial({ values, value, onChange, label }: ScrollDialProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedIdx = values.indexOf(value);
  const containerH = DIAL_ITEM_H * DIAL_VISIBLE;
  const padding = DIAL_ITEM_H * 2;

  useEffect(() => {
    const el = containerRef.current;
    if (!el || scrollingRef.current) return;
    const target = Math.max(0, selectedIdx) * DIAL_ITEM_H;
    el.scrollTop = target;
  }, [selectedIdx]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const idx = Math.round(el.scrollTop / DIAL_ITEM_H);
      const clamped = Math.max(0, Math.min(values.length - 1, idx));
      onChange(values[clamped]);
      scrollingRef.current = false;
    }, 80);
    scrollingRef.current = true;
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="relative" style={{ width: 80, height: containerH }}>
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            background: "linear-gradient(to bottom, var(--background) 0%, transparent 35%, transparent 65%, var(--background) 100%)",
          }}
        />
        <div
          className="absolute left-0 right-0 z-0 rounded border border-border bg-muted/30"
          style={{
            top: DIAL_ITEM_H * 2,
            height: DIAL_ITEM_H,
          }}
        />
        <div
          ref={containerRef}
          className="absolute inset-0 overflow-y-scroll"
          style={{ scrollSnapType: "y mandatory", WebkitOverflowScrolling: "touch" as never }}
          onScroll={handleScroll}
          data-testid={`dial-${label.toLowerCase()}`}
        >
          <div style={{ paddingTop: padding, paddingBottom: padding }}>
            {values.map((v) => (
              <div
                key={v}
                style={{ height: DIAL_ITEM_H, scrollSnapAlign: "center" }}
                className="flex items-center justify-center text-sm font-medium select-none"
              >
                {v}"
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const DIAL_LENGTHS = Array.from({ length: 73 }, (_, i) => 60 + i); // 60"–132" (5'–11')
const DIAL_WIDTHS  = Array.from({ length: 37 }, (_, i) => 30 + i); // 30"–66" (2'6"–5'6")

// ─────────────────────────────────────────────────────────────────────────────

export function CueingEmulator({ onClose }: CueingEmulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [balls, setBalls] = useState<Ball[]>(() => {
    try {
      const saved = localStorage.getItem("pftc_emulator_layout");
      if (saved) {
        const parsed: Ball[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [createBall("cue", "cue", 25, 25)];
  });
  const [shotHistory, setShotHistory] = useState<Ball[][]>([]);
  const [selectedBallId, setSelectedBallId] = useState<string | null>(null);

  const [aimAngle, setAimAngle] = useState<number>(0);
  const [isAiming, setIsAiming] = useState(false);
  const [hasAimLine, setHasAimLine] = useState(false);

  const [shotSpeed, setShotSpeed] = useState(5);
  const [angleFine, setAngleFine] = useState(0);
  const [englishX, setEnglishX] = useState(0);
  const [englishY, setEnglishY] = useState(0);

  const [snapToGrid, setSnapToGrid] = useState(true);
  const [moveCueBall, setMoveCueBall] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [cueBallMoved, setCueBallMoved] = useState(false);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const animFrameRef = useRef<number | null>(null);
  const animBallsRef = useRef<Ball[] | null>(null);
  const drawRef = useRef<(() => void) | null>(null);

  const [showEnglishPopup, setShowEnglishPopup] = useState(false);
  const englishPopupRef = useRef<HTMLDivElement>(null);

  // Auto-start tour on first visit
  useEffect(() => {
    const seen = localStorage.getItem("pftc_emulator_tutorial_seen");
    if (!seen) setTourStep(0);
  }, []);

  const advanceTour = useCallback(() => {
    setTourStep((s) => {
      if (s === null) return null;
      const next = s + 1;
      return next >= TOUR_STEP_COUNT ? null : next;
    });
  }, []);

  const dismissTour = useCallback(() => {
    localStorage.setItem("pftc_emulator_tutorial_seen", "1");
    setTourStep(null);
  }, []);

  const backTour = useCallback(() => {
    setTourStep((s) => (s !== null && s > 0 ? s - 1 : s));
  }, []);

  // Auto-advance tour on action completion
  const prevBallCount = useRef<number | null>(null);
  useEffect(() => {
    if (tourStep === null) { prevBallCount.current = null; return; }
    if (getTourTrigger(tourStep) !== "ball_added") return;
    if (prevBallCount.current === null) { prevBallCount.current = balls.length; return; }
    if (balls.length > prevBallCount.current) advanceTour();
    prevBallCount.current = balls.length;
  }, [balls.length, tourStep, advanceTour]);

  useEffect(() => {
    if (tourStep === null) return;
    if (getTourTrigger(tourStep) !== "cue_moved") return;
    if (cueBallMoved) advanceTour();
  }, [cueBallMoved, tourStep, advanceTour]);

  useEffect(() => {
    if (tourStep === null) return;
    if (getTourTrigger(tourStep) !== "aim_set") return;
    if (hasAimLine) advanceTour();
  }, [hasAimLine, tourStep, advanceTour]);

  useEffect(() => {
    return () => { if (animFrameRef.current !== null) cancelAnimationFrame(animFrameRef.current); };
  }, []);

  const [tableConfig, setTableConfig] = useState<TableConfig>({
    tableSpeed: "medium",
    equipment: "average",
    rails: "medium",
  });

  const [tableSizeState, setTableSizeState] = useState<TableSizeState>({
    preset: "9ft",
    customLength: 88,
    customWidth: 44,
  });

  const ballScale = useMemo(() => {
    if (tableSizeState.preset === "custom") {
      return 100 / Math.max(60, tableSizeState.customLength);
    }
    return TABLE_SIZE_PRESETS[tableSizeState.preset].ballScale;
  }, [tableSizeState]);

  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const dragRef = useRef<{
    ballId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const aimStartRef = useRef<{ x: number; y: number } | null>(null);

  const previewTrajectories = useMemo<TrajectorySegment[]>(() => {
    if (!hasAimLine) return [];
    const cueBall = balls.find((b) => b.type === "cue" && !b.pocketed);
    if (!cueBall) return [];
    const params: ShotParams = {
      speed: shotSpeed,
      angle: aimAngle,
      angleFine,
      englishX,
      englishY,
    };
    const result = simulateShot(balls, params, { ...tableConfig, ballScale });
    return result.trajectories;
  }, [hasAimLine, balls, aimAngle, angleFine, shotSpeed, englishX, englishY, tableConfig, ballScale]);

  const cutAngleInfo = useMemo<{ angle: number; label: string } | null>(() => {
    if (!hasAimLine) return null;
    const cueBall = balls.find((b) => b.type === "cue" && !b.pocketed);
    if (!cueBall) return null;
    const totalAngle = aimAngle + (angleFine * Math.PI) / 180;
    const dirX = Math.cos(totalAngle);
    const dirY = Math.sin(totalAngle);
    const br2 = TABLE_DIMENSIONS.ballRadius * ballScale * 2;

    let closestDist = Infinity;
    let closestBall: Ball | null = null;

    for (const b of balls) {
      if (b.type === "cue" || b.pocketed) continue;
      const dx = b.pos.x - cueBall.pos.x;
      const dy = b.pos.y - cueBall.pos.y;
      const proj = dx * dirX + dy * dirY;
      if (proj <= 0) continue;
      const perpX = dx - proj * dirX;
      const perpY = dy - proj * dirY;
      const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);
      if (perpDist < br2 && proj < closestDist) {
        closestDist = proj;
        closestBall = b;
      }
    }

    if (!closestBall) return null;

    const dx = closestBall.pos.x - cueBall.pos.x;
    const dy = closestBall.pos.y - cueBall.pos.y;
    const centerAngle = Math.atan2(dy, dx);
    let cutAngle = Math.abs(totalAngle - centerAngle);
    if (cutAngle > Math.PI) cutAngle = 2 * Math.PI - cutAngle;
    const cutDeg = (cutAngle * 180) / Math.PI;
    const fullness = 1 - Math.sin(cutAngle);

    let label: string;
    if (fullness >= 0.875) label = "Full ball";
    else if (fullness >= 0.625) label = "3/4 ball";
    else if (fullness >= 0.375) label = "1/2 ball";
    else if (fullness >= 0.125) label = "1/4 ball";
    else label = "Thin cut";

    return { angle: Math.round(cutDeg * 100) / 100, label };
  }, [hasAimLine, balls, aimAngle, angleFine, ballScale]);

  const getScale = useCallback(() => {
    if (canvasSize.width === 0) return { scale: 1, offsetX: 0, offsetY: 0 };
    const railMargin = 40;
    const availW = canvasSize.width - railMargin * 2;
    const availH = canvasSize.height - railMargin * 2;
    const scaleX = availW / TABLE_DIMENSIONS.width;
    const scaleY = availH / TABLE_DIMENSIONS.height;
    const scale = Math.min(scaleX, scaleY);
    const tableW = TABLE_DIMENSIONS.width * scale;
    const tableH = TABLE_DIMENSIONS.height * scale;
    const offsetX = (canvasSize.width - tableW) / 2;
    const offsetY = (canvasSize.height - tableH) / 2;
    return { scale, offsetX, offsetY };
  }, [canvasSize]);

  const tableToCanvas = useCallback(
    (tx: number, ty: number) => {
      const { scale, offsetX, offsetY } = getScale();
      return { x: offsetX + tx * scale, y: offsetY + ty * scale };
    },
    [getScale]
  );

  const canvasToTable = useCallback(
    (cx: number, cy: number) => {
      const { scale, offsetX, offsetY } = getScale();
      return { x: (cx - offsetX) / scale, y: (cy - offsetY) / scale };
    },
    [getScale]
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      setCanvasSize({
        width: rect.width * dpr,
        height: rect.height * dpr,
      });
    };
    updateSize();
    // ResizeObserver fires whenever the container changes size (e.g. cut-angle
    // bar appearing / disappearing), not just on window resize events.
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const ballsToDraw = animBallsRef.current ?? balls;
    const { scale, offsetX, offsetY } = getScale();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tw = TABLE_DIMENSIONS.width * scale;
    const th = TABLE_DIMENSIONS.height * scale;

    const railW = Math.max(16, TABLE_DIMENSIONS.pocketRadius * ballScale * scale + 4);

    ctx.fillStyle = "#5a3825";
    ctx.fillRect(offsetX - railW, offsetY - railW, tw + railW * 2, th + railW * 2);

    ctx.fillStyle = "#1a7a3a";
    ctx.fillRect(offsetX, offsetY, tw, th);

    if (snapToGrid) {
      ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
      ctx.lineWidth = 1;
      ctx.setLineDash([]);
      const gridStepX = TABLE_DIMENSIONS.width / 8;
      const gridStepY = TABLE_DIMENSIONS.height / 4;
      for (let i = 1; i < 8; i++) {
        const p1 = tableToCanvas(i * gridStepX, 0);
        const p2 = tableToCanvas(i * gridStepX, TABLE_DIMENSIONS.height);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
      for (let j = 1; j < 4; j++) {
        const p1 = tableToCanvas(0, j * gridStepY);
        const p2 = tableToCanvas(TABLE_DIMENSIONS.width, j * gridStepY);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = "#2d8a4a";
    ctx.lineWidth = 0.5;
    const headStringX = TABLE_DIMENSIONS.width * 0.25;
    const cp = tableToCanvas(headStringX, 0);
    const cp2 = tableToCanvas(headStringX, TABLE_DIMENSIONS.height);
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(cp.x, cp.y);
    ctx.lineTo(cp2.x, cp2.y);
    ctx.stroke();
    ctx.setLineDash([]);

    for (const pocket of TABLE_DIMENSIONS.pockets) {
      const pp = tableToCanvas(pocket.x, pocket.y);
      const pr = TABLE_DIMENSIONS.pocketRadius * ballScale * scale;
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, pr, 0, Math.PI * 2);
      ctx.fillStyle = "#111";
      ctx.fill();
    }

    ctx.fillStyle = "#d4a853";
    const longRailFracs = [1/8, 2/8, 3/8, 5/8, 6/8, 7/8];
    for (const frac of longRailFracs) {
      const topD = tableToCanvas(TABLE_DIMENSIONS.width * frac, 0);
      const botD = tableToCanvas(TABLE_DIMENSIONS.width * frac, TABLE_DIMENSIONS.height);
      drawDiamond(ctx, topD.x, offsetY - railW / 2, 3);
      drawDiamond(ctx, botD.x, offsetY + th + railW / 2, 3);
    }
    const shortRailFracs = [0.25, 0.5, 0.75];
    for (const frac of shortRailFracs) {
      const leftD = tableToCanvas(0, TABLE_DIMENSIONS.height * frac);
      const rightD = tableToCanvas(TABLE_DIMENSIONS.width, TABLE_DIMENSIONS.height * frac);
      drawDiamond(ctx, offsetX - railW / 2, leftD.y, 3);
      drawDiamond(ctx, offsetX + tw + railW / 2, rightD.y, 3);
    }

    for (const traj of previewTrajectories) {
      if (traj.points.length < 2) continue;
      ctx.beginPath();
      ctx.strokeStyle = TRAJ_COLORS[traj.ballType] || "#fff";
      ctx.lineWidth = 3;
      ctx.globalAlpha = 1.0;
      const first = tableToCanvas(traj.points[0].x, traj.points[0].y);
      ctx.moveTo(first.x, first.y);
      for (let i = 1; i < traj.points.length; i++) {
        const pt = tableToCanvas(traj.points[i].x, traj.points[i].y);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Crosshairs for the ball currently being dragged
    if (dragRef.current) {
      const draggedBall = ballsToDraw.find((b) => b.id === dragRef.current!.ballId);
      if (draggedBall && !draggedBall.pocketed) {
        const bp = tableToCanvas(draggedBall.pos.x, draggedBall.pos.y);
        ctx.save();
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(offsetX, bp.y);
        ctx.lineTo(offsetX + tw, bp.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(bp.x, offsetY);
        ctx.lineTo(bp.x, offsetY + th);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
      }
    }

    for (const ball of ballsToDraw) {
      if (ball.pocketed) continue;
      const bp = tableToCanvas(ball.pos.x, ball.pos.y);
      const br = TABLE_DIMENSIONS.ballRadius * ballScale * scale;

      ctx.beginPath();
      ctx.arc(bp.x + 1, bp.y + 1, br, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.fill();

      ctx.beginPath();
      ctx.arc(bp.x, bp.y, br, 0, Math.PI * 2);
      ctx.fillStyle = BALL_FILL[ball.type];
      ctx.fill();
      ctx.strokeStyle = "#333";
      ctx.lineWidth = 0.5;
      ctx.stroke();

      if (ball.type === "stripe") {
        ctx.save();
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, br, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = "#16a34a";
        ctx.fillRect(bp.x - br, bp.y - br * 0.35, br * 2, br * 0.7);
        ctx.restore();
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, br, 0, Math.PI * 2);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }

      if (ball.type === "cue") {
        const grad = ctx.createRadialGradient(
          bp.x - br * 0.3,
          bp.y - br * 0.3,
          br * 0.1,
          bp.x,
          bp.y,
          br
        );
        grad.addColorStop(0, "rgba(255,255,255,0.6)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, br, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      if (ball.id === selectedBallId) {
        ctx.beginPath();
        ctx.arc(bp.x, bp.y, br + 3, 0, Math.PI * 2);
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    if (hasAimLine) {
      const cueBall = balls.find((b) => b.type === "cue" && !b.pocketed);
      if (cueBall) {
        const totalAngle = aimAngle + (angleFine * Math.PI) / 180;
        const cueCanvas = tableToCanvas(cueBall.pos.x, cueBall.pos.y);
        const lineLen = Math.max(tw, th);
        const endX = cueCanvas.x + Math.cos(totalAngle) * lineLen;
        const endY = cueCanvas.y + Math.sin(totalAngle) * lineLen;

        ctx.beginPath();
        ctx.setLineDash([8, 5]);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5;
        ctx.moveTo(cueCanvas.x, cueCanvas.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(
          cueCanvas.x + Math.cos(totalAngle) * 20,
          cueCanvas.y + Math.sin(totalAngle) * 20,
          3,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fill();
      }
    }
  }, [
    balls,
    previewTrajectories,
    selectedBallId,
    hasAimLine,
    aimAngle,
    angleFine,
    getScale,
    tableToCanvas,
    canvasSize,
    snapToGrid,
    ballScale,
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => { drawRef.current = draw; }, [draw]);

  const getEventPos = (
    e: React.TouchEvent | React.MouseEvent
  ): { x: number; y: number } => {
    // Use containerRef (the same element canvasSize is measured from) so that
    // the coordinate origin is consistent with canvasToTable / tableToCanvas.
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0 };
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    if ("touches" in e && e.touches.length > 0) {
      return {
        x: (e.touches[0].clientX - rect.left) * dpr,
        y: (e.touches[0].clientY - rect.top) * dpr,
      };
    }
    if ("clientX" in e) {
      return {
        x: (e.clientX - rect.left) * dpr,
        y: (e.clientY - rect.top) * dpr,
      };
    }
    return { x: 0, y: 0 };
  };

  const findBallAt = (cx: number, cy: number, touchTarget = false): Ball | null => {
    const tp = canvasToTable(cx, cy);
    const { scale } = getScale();
    // Touch targets need ~44px of hit area for comfortable finger use.
    // extraPx is in canvas-pixel units; dividing by scale converts to table units.
    const extraPx = touchTarget ? 18 : 4;
    const hitRadius = TABLE_DIMENSIONS.ballRadius * ballScale * 2 + extraPx / scale;
    // Prefer the closest ball when multiple overlap within the hit zone
    let closest: Ball | null = null;
    let closestDist = Infinity;
    for (const b of balls) {
      if (b.pocketed) continue;
      const dx = tp.x - b.pos.x;
      const dy = tp.y - b.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < hitRadius && dist < closestDist) {
        closest = b;
        closestDist = dist;
      }
    }
    return closest;
  };

  const handlePointerDown = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const pos = getEventPos(e);
    const isTouch = "touches" in e;
    const hitBall = findBallAt(pos.x, pos.y, isTouch);

    if (hitBall) {
      if (hitBall.type === "cue" && !moveCueBall) {
        setIsAiming(true);
        aimStartRef.current = pos;
        setSelectedBallId("cue");
      } else {
        setSelectedBallId(hitBall.id);
        const tp = canvasToTable(pos.x, pos.y);
        dragRef.current = {
          ballId: hitBall.id,
          offsetX: hitBall.pos.x - tp.x,
          offsetY: hitBall.pos.y - tp.y,
        };
      }
    } else {
      setSelectedBallId(null);
    }
  };

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const pos = getEventPos(e);

    if (isAiming && aimStartRef.current) {
      const cueBall = balls.find((b) => b.type === "cue" && !b.pocketed);
      if (cueBall) {
        const cueCanvas = tableToCanvas(cueBall.pos.x, cueBall.pos.y);
        const dx = pos.x - cueCanvas.x;
        const dy = pos.y - cueCanvas.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          setAimAngle(Math.atan2(dy, dx));
          setHasAimLine(true);
        }
      }
    }

    if (dragRef.current) {
      const tp = canvasToTable(pos.x, pos.y);
      let rawX = tp.x + dragRef.current.offsetX;
      let rawY = tp.y + dragRef.current.offsetY;
      const snapped = snapPos(rawX, rawY);
      rawX = snapped.x;
      rawY = snapped.y;
      const effBR = TABLE_DIMENSIONS.ballRadius * ballScale;
      const newX = Math.max(
        effBR,
        Math.min(TABLE_DIMENSIONS.width - effBR, rawX)
      );
      const newY = Math.max(
        effBR,
        Math.min(TABLE_DIMENSIONS.height - effBR, rawY)
      );
      setBalls((prev) =>
        prev.map((b) =>
          b.id === dragRef.current!.ballId
            ? { ...b, pos: { x: newX, y: newY } }
            : b
        )
      );
    }
  };

  const handlePointerUp = () => {
    if (dragRef.current) {
      const dragged = balls.find((b) => b.id === dragRef.current!.ballId);
      if (dragged?.type === "cue") setCueBallMoved(true);
    }
    setIsAiming(false);
    aimStartRef.current = null;
    dragRef.current = null;
  };

  const addBall = (type: "solid" | "stripe") => {
    const id = generateId();
    const cx = 60 + Math.random() * 20;
    const cy = 15 + Math.random() * 20;
    setBalls((prev) => [...prev, createBall(id, type, cx, cy)]);
  };

  const removeSelected = () => {
    if (!selectedBallId || selectedBallId === "cue") return;
    setBalls((prev) => prev.filter((b) => b.id !== selectedBallId));
    setSelectedBallId(null);
  };

  const resetCueBall = useCallback(() => {
    const br = TABLE_DIMENSIONS.ballRadius * ballScale;
    const minClearance = br * 2 + 0.25;
    const otherBalls = balls.filter((b) => b.type !== "cue" && !b.pocketed);

    const isOccupied = (x: number, y: number) =>
      otherBalls.some((b) => Math.hypot(b.pos.x - x, b.pos.y - y) < minClearance);

    const pocketClear = TABLE_DIMENSIONS.pocketRadius * ballScale + br + 0.5;
    const isNearPocket = (x: number, y: number) =>
      TABLE_DIMENSIONS.pockets.some((p) => Math.hypot(p.x - x, p.y - y) < pocketClear);

    const railClear = br + 2;
    const isNearRail = (x: number, y: number) =>
      x < railClear || x > TABLE_DIMENSIONS.width - railClear ||
      y < railClear || y > TABLE_DIMENSIONS.height - railClear;

    const HEADSTRING_X = TABLE_DIMENSIONS.width * 0.25;
    const CENTER_Y = TABLE_DIMENSIONS.height / 2;

    // Priority 1: headstring positions — center then spread outward
    const headstringCandidates = [0, -12.5, 12.5, -6.25, 6.25, -18.75, 18.75].map(
      (dy) => ({ x: HEADSTRING_X, y: CENTER_Y + dy })
    );

    // Priority 2: safe grid behind/near headstring (avoid rails and pockets)
    const safeGrid: { x: number; y: number }[] = [];
    for (let gx = HEADSTRING_X; gx >= railClear; gx -= 6.25) {
      for (let gy = 6.25; gy <= TABLE_DIMENSIONS.height - 6.25; gy += 6.25) {
        if (!isNearRail(gx, gy) && !isNearPocket(gx, gy)) {
          safeGrid.push({ x: gx, y: gy });
        }
      }
    }

    // Priority 3: full playfield grid (avoid pockets only)
    const anyGrid: { x: number; y: number }[] = [];
    for (let gx = railClear; gx <= TABLE_DIMENSIONS.width - railClear; gx += 6.25) {
      for (let gy = railClear; gy <= TABLE_DIMENSIONS.height - railClear; gy += 6.25) {
        if (!isNearPocket(gx, gy)) anyGrid.push({ x: gx, y: gy });
      }
    }

    const target =
      [...headstringCandidates, ...safeGrid, ...anyGrid].find((c) => !isOccupied(c.x, c.y)) ??
      { x: HEADSTRING_X, y: CENTER_Y };

    setBalls((prev) =>
      prev.map((b) =>
        b.type === "cue" ? { ...b, pos: { x: target.x, y: target.y }, pocketed: false } : b
      )
    );
    setHasAimLine(false);
    setSelectedBallId(null);
  }, [balls, ballScale]);

  const handleClose = () => {
    try {
      localStorage.setItem("pftc_emulator_layout", JSON.stringify(balls));
    } catch {}
    onClose();
  };

  const handleShoot = () => {
    const cueBall = balls.find((b) => b.type === "cue" && !b.pocketed);
    if (!cueBall || !hasAimLine || isAnimating) return;

    // Snapshot current balls for history
    const snapshot = balls.map((b) => ({ ...b, pos: { ...b.pos }, vel: { ...b.vel }, spin: { ...b.spin } }));
    setShotHistory((prev) => [...prev, snapshot]);

    const params: ShotParams = {
      speed: shotSpeed,
      angle: aimAngle,
      angleFine,
      englishX,
      englishY,
    };

    const result = simulateShot(balls, params, tableConfig);

    // Build trajectory lookup: ballId -> points[]
    const trajMap: Record<string, { x: number; y: number }[]> = {};
    for (const traj of result.trajectories) {
      trajMap[traj.ballId] = traj.points;
    }
    const maxFrames = Math.max(...result.trajectories.map((t) => t.points.length), 1);
    const ANIM_DURATION_MS = Math.min(1200, Math.max(500, maxFrames * 1.8));

    // Preserve any balls that were already pocketed before this shot
    const alreadyPocketed = balls.filter((b) => b.pocketed);
    // Final state: simulation result merged with pre-pocketed balls
    const mergedFinal = [
      ...result.finalBalls,
      ...alreadyPocketed.filter((pb) => !result.finalBalls.find((fb) => fb.id === pb.id)),
    ];

    // Capture current balls for animation closure
    const preShotBalls = balls.map((b) => ({ ...b, pos: { ...b.pos } }));

    setHasAimLine(false);
    setSelectedBallId(null);
    setIsAnimating(true);
    // Seed the animation ref so draw() immediately shows starting positions
    animBallsRef.current = preShotBalls;

    const startTime = performance.now();

    const animate = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / ANIM_DURATION_MS, 1);
      const frameIndex = Math.floor(progress * (maxFrames - 1));

      animBallsRef.current = preShotBalls.map((b) => {
        const pts = trajMap[b.id];
        if (!pts || pts.length === 0) return b;
        const idx = Math.min(frameIndex, pts.length - 1);
        const finalBall = result.finalBalls.find((fb) => fb.id === b.id);
        // Pocket the ball as soon as its own trajectory is exhausted
        const reachedEnd = frameIndex >= pts.length - 1;
        const pocketed = reachedEnd && (finalBall?.pocketed ?? false);
        return { ...b, pos: { ...pts[idx] }, pocketed };
      });

      // Draw directly — no React re-render per frame
      drawRef.current?.();

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        animBallsRef.current = null;
        setBalls(mergedFinal);
        setIsAnimating(false);
        setCueBallMoved(true);
        setAngleFine(0);
        setShotSpeed(5);
        setEnglishX(0);
        setEnglishY(0);
        if (tourStep !== null && getTourTrigger(tourStep) === "shot_taken") advanceTour();
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  };

  const handleUndo = () => {
    if (shotHistory.length === 0) return;
    const prev = shotHistory[shotHistory.length - 1];
    setBalls(prev);
    setShotHistory((h) => h.slice(0, -1));
    setHasAimLine(false);
  };

  const handleReset = () => {
    const initial =
      shotHistory.length > 0
        ? shotHistory[0]
        : [createBall("cue", "cue", 25, 25)];
    setBalls(initial);
    setShotHistory([]);
    setHasAimLine(false);
    setSelectedBallId(null);
    setCueBallMoved(false);
  };

  const handleClearTable = () => {
    setBalls([createBall("cue", "cue", 25, 25)]);
    setShotHistory([]);
    setHasAimLine(false);
    setSelectedBallId(null);
    setCueBallMoved(false);
    setAngleFine(0);
    setShotSpeed(5);
    setEnglishX(0);
    setEnglishY(0);
  };

  const loadPreset = (preset: CoursePreset) => {
    const cuePos = findCueBallPosition(preset.balls);
    const newBalls: Ball[] = [
      createBall("cue", "cue", cuePos.x, cuePos.y),
      ...preset.balls.map((pb) =>
        createBall(generateId(), pb.type, pb.x, pb.y)
      ),
    ];
    setBalls(newBalls);
    setShotHistory([]);
    setHasAimLine(false);
    setSelectedBallId(null);
    setCueBallMoved(false);
  };

  const GRID_X = TABLE_DIMENSIONS.width / 8;
  const GRID_Y = TABLE_DIMENSIONS.height / 4;
  const SNAP_BUFFER_PX = 20;

  const snapPos = (x: number, y: number): { x: number; y: number } => {
    if (!snapToGrid) return { x, y };
    const { scale } = getScale();
    const bufferTable = SNAP_BUFFER_PX / scale;
    const nearestX = Math.round(x / GRID_X) * GRID_X;
    const nearestY = Math.round(y / GRID_Y) * GRID_Y;
    const snappedX = Math.abs(x - nearestX) <= bufferTable ? nearestX : x;
    const snappedY = Math.abs(y - nearestY) <= bufferTable ? nearestY : y;
    return { x: snappedX, y: snappedY };
  };

  const ENG_MIN = -2;
  const ENG_MAX = 2;
  const ENG_SNAP = 0.25;

  const snapEnglish = (val: number): number => {
    return Math.round(val / ENG_SNAP) * ENG_SNAP;
  };

  const updateEnglishFromPointer = useCallback((clientX: number, clientY: number) => {
    const el = englishPopupRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 4 - 2;
    const y = ((clientY - rect.top) / rect.height) * 4 - 2;
    setEnglishX(snapEnglish(Math.max(ENG_MIN, Math.min(ENG_MAX, x))));
    setEnglishY(snapEnglish(Math.max(ENG_MIN, Math.min(ENG_MAX, y))));
  }, []);

  // No global listeners needed — the popup now uses direct React event handlers.

  const ToggleGroup = ({
    value,
    options,
    onChange,
  }: {
    value: string;
    options: { label: string; value: string }[];
    onChange: (v: string) => void;
  }) => (
    <div className="flex gap-1" data-testid="toggle-group">
      {options.map((opt) => (
        <Button
          key={opt.value}
          variant={value === opt.value ? "default" : "outline"}
          size="sm"
          onClick={() => onChange(opt.value)}
          data-testid={`toggle-${opt.value}`}
        >
          {opt.label}
        </Button>
      ))}
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col"
      data-testid="cueing-emulator"
    >
      <div className="flex items-center justify-between gap-2 p-2 border-b flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-sm">Cueing Emulator</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" data-testid="button-add-ball">
                <Plus className="w-3 h-3 mr-1" />
                Add Ball
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => addBall("solid")} data-testid="button-add-solid">
                Solid
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => addBall("stripe")} data-testid="button-add-stripe">
                Stripe
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {selectedBallId && selectedBallId !== "cue" && (
            <Button
              size="sm"
              variant="outline"
              onClick={removeSelected}
              data-testid="button-remove-ball"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Remove
            </Button>
          )}
          <Button
            size="sm"
            variant={snapToGrid ? "default" : "outline"}
            onClick={() => setSnapToGrid((v) => !v)}
            className="toggle-elevate"
            data-testid="button-snap-grid"
          >
            <Grid3x3 className="w-3 h-3 mr-1" />
            Snap
          </Button>
          <Button
            size="sm"
            variant={moveCueBall ? "default" : "outline"}
            onClick={() => setMoveCueBall((v) => !v)}
            className="toggle-elevate"
            data-testid="button-move-cue"
          >
            <Move className="w-3 h-3 mr-1" />
            Move Cue Ball
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={resetCueBall}
            data-testid="button-reset-cue"
          >
            <Target className="w-3 h-3 mr-1" />
            Reset Cue
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={handleShoot}
            disabled={!hasAimLine || isAnimating}
            data-testid="button-shoot"
          >
            <Crosshair className="w-3 h-3 mr-1" />
            Shoot
          </Button>
          {shotHistory.length > 0 && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
                data-testid="button-undo"
              >
                <Undo2 className="w-3 h-3 mr-1" />
                Undo
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
                data-testid="button-reset-layout"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </>
          )}
          <Button
            size="icon"
            variant={showSettings ? "default" : "ghost"}
            onClick={() => setShowSettings((v) => !v)}
            data-testid="button-toggle-settings"
          >
            <Settings />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleClose}
            data-testid="button-close-emulator"
          >
            <X />
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative overflow-hidden">
        {/* Cut-angle info bar — absolute overlay so the canvas container never
            changes size (avoids the ResizeObserver → canvas-clear flicker). */}
        {cutAngleInfo && (
          <div
            className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-3 py-1 text-sm pointer-events-none"
            style={{ background: "rgba(0,0,0,0.55)" }}
            data-testid="cut-angle-info"
          >
            <span className="text-white/70">Cut Angle:</span>
            <span className="font-mono font-bold text-white" data-testid="text-cut-angle">{cutAngleInfo.angle.toFixed(2)}°</span>
            <span className="text-white/70">({cutAngleInfo.label})</span>
          </div>
        )}

        {/* English spin popup — click thumbnail to open; stays open until user
            taps the cue ball to set a contact point, or taps thumbnail to close. */}
        {showEnglishPopup && (
          <div
            className="absolute inset-0 z-[45] flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.82)", touchAction: "none" }}
            data-testid="english-popup-overlay"
            onClick={() => setShowEnglishPopup(false)}
          >
            <div
              ref={englishPopupRef}
              style={{ width: "min(72vw, 72vh)", height: "min(72vw, 72vh)" }}
              data-testid="english-popup-diagram"
              onPointerMove={(e) => {
                e.stopPropagation();
                updateEnglishFromPointer(e.clientX, e.clientY);
              }}
              onClick={(e) => {
                e.stopPropagation();
                updateEnglishFromPointer(e.clientX, e.clientY);
                setShowEnglishPopup(false);
              }}
            >
              <svg width="100%" height="100%" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="58" fill="white" stroke="#aaa" strokeWidth="1.5" />
                <circle cx="60" cy="60" r="43.5" fill="none" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.6" />
                <line x1="60" y1="2" x2="60" y2="118" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                <line x1="2" y1="60" x2="118" y2="60" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
                {([-1.5,-1,-0.5,0,0.5,1,1.5] as number[]).map((vx) =>
                  ([-1.5,-1,-0.5,0,0.5,1,1.5] as number[]).map((vy) => {
                    const px = 60 + (vx / 2) * 58;
                    const py = 60 + (vy / 2) * 58;
                    return <circle key={`${vx}-${vy}`} cx={px} cy={py} r={2} fill="rgba(0,0,0,0.18)" />;
                  })
                )}
                <circle
                  cx={60 + (englishX / 2) * 58}
                  cy={60 + (englishY / 2) * 58}
                  r={Math.max(7, 58 / 3)}
                  fill="rgba(59,130,246,0.28)"
                  stroke="#3b82f6"
                  strokeWidth="2"
                />
                <circle
                  cx={60 + (englishX / 2) * 58}
                  cy={60 + (englishY / 2) * 58}
                  r={5}
                  fill="#3b82f6"
                />
                <text x="60" y="14" textAnchor="middle" fontSize="9" fill="rgba(0,0,0,0.4)">Top</text>
                <text x="60" y="112" textAnchor="middle" fontSize="9" fill="rgba(0,0,0,0.4)">Bottom</text>
                <text x="10" y="63" textAnchor="middle" fontSize="9" fill="rgba(0,0,0,0.4)">L</text>
                <text x="110" y="63" textAnchor="middle" fontSize="9" fill="rgba(0,0,0,0.4)">R</text>
              </svg>
              <p className="text-center text-white/80 text-sm mt-2 select-none">
                H{englishX >= 0 ? "+" : ""}{englishX.toFixed(2)} &nbsp; V{englishY >= 0 ? "+" : ""}{englishY.toFixed(2)}
              </p>
              <p className="text-center text-white/50 text-xs mt-1 select-none">Tap the ball to set · tap outside to close</p>
            </div>
          </div>
        )}

        <div
          ref={containerRef}
          className="absolute inset-0 bg-[#1a1a2e] dark:bg-[#0a0a1a]"
          style={{ touchAction: "none" }}
          data-testid="canvas-container"
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{ width: "100%", height: "100%", display: "block" }}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
            data-testid="canvas-table"
          />
        </div>

        <div
          className="absolute top-0 right-0 bottom-0 bg-background border-l overflow-y-auto transition-transform duration-200 z-10"
          style={{
            width: 280,
            transform: showSettings ? "translateX(0)" : "translateX(100%)",
          }}
          data-testid="settings-sidebar"
        >
          <div className="flex items-center justify-between p-3 border-b">
            <span className="font-bold text-sm">Settings</span>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowSettings(false)}
              data-testid="button-close-settings"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <div className="p-3 space-y-5">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => { setShowSettings(false); setTourStep(0); }}
              data-testid="button-open-emulator-tutorial"
            >
              <BookOpen className="w-4 h-4" />
              How to Use the Emulator
            </Button>

            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => { handleClearTable(); setShowSettings(false); }}
              data-testid="button-clear-table"
            >
              <Trash2 className="w-4 h-4" />
              Clear Table
            </Button>

            <div className="space-y-3">
              <span className="font-semibold text-sm">Table Size</span>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Preset</span>
                <ToggleGroup
                  value={tableSizeState.preset}
                  options={[
                    { label: "7ft", value: "7ft" },
                    { label: "8ft", value: "8ft" },
                    { label: "9ft", value: "9ft" },
                    { label: "Custom", value: "custom" },
                  ]}
                  onChange={(v) =>
                    setTableSizeState((p) => ({
                      ...p,
                      preset: v as TableSizeState["preset"],
                    }))
                  }
                />
              </div>

              {tableSizeState.preset === "custom" && (
                <div className="space-y-2">
                  <span className="text-xs text-muted-foreground block">Nose to nose (inches)</span>
                  <div className="flex gap-4 justify-center">
                    <ScrollDial
                      label="Length"
                      values={DIAL_LENGTHS}
                      value={tableSizeState.customLength}
                      onChange={(v) =>
                        setTableSizeState((p) => ({ ...p, customLength: v }))
                      }
                    />
                    <ScrollDial
                      label="Width"
                      values={DIAL_WIDTHS}
                      value={tableSizeState.customWidth}
                      onChange={(v) =>
                        setTableSizeState((p) => ({ ...p, customWidth: v }))
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {tableSizeState.customLength}" &times; {tableSizeState.customWidth}"
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <span className="font-semibold text-sm">Table Physics</span>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Table Speed</span>
                <ToggleGroup
                  value={tableConfig.tableSpeed}
                  options={[
                    { label: "Slow", value: "slow" },
                    { label: "Medium", value: "medium" },
                    { label: "Fast", value: "fast" },
                  ]}
                  onChange={(v) => setTableConfig((p) => ({ ...p, tableSpeed: v as TableConfig["tableSpeed"] }))}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Equipment</span>
                <ToggleGroup
                  value={tableConfig.equipment}
                  options={[
                    { label: "Dirty", value: "dirty" },
                    { label: "Average", value: "average" },
                    { label: "Clean", value: "clean" },
                  ]}
                  onChange={(v) => setTableConfig((p) => ({ ...p, equipment: v as TableConfig["equipment"] }))}
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground block">Rails</span>
                <ToggleGroup
                  value={tableConfig.rails}
                  options={[
                    { label: "Soft", value: "soft" },
                    { label: "Medium", value: "medium" },
                    { label: "Firm", value: "firm" },
                  ]}
                  onChange={(v) => setTableConfig((p) => ({ ...p, rails: v as TableConfig["rails"] }))}
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <span className="font-semibold text-sm" data-testid="accordion-course-layouts">Course Layouts</span>
              <div className="space-y-3" data-testid="course-layouts-content">
                {[2, 3, 4, 5, 6].map((par) => {
                  const parPresets = COURSE_PRESETS.filter((p) => p.par === par);
                  return (
                    <div key={par}>
                      <span className="text-xs text-muted-foreground block mb-1">Par {par}</span>
                      <div className="flex flex-wrap gap-1">
                        {parPresets.map((preset) => (
                          <Button
                            key={preset.id}
                            size="sm"
                            variant="outline"
                            onClick={() => { loadPreset(preset); setShowSettings(false); }}
                            data-testid={`button-preset-${preset.id}`}
                          >
                            {preset.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="border-t bg-background px-3 py-2 flex items-center gap-3" data-testid="shot-controls-strip">
        <div className="flex flex-col items-center gap-1 flex-shrink-0">
          <div
            className="relative cursor-pointer select-none"
            style={{ width: 64, height: 64 }}
            onClick={() => setShowEnglishPopup((v) => !v)}
            data-testid="english-diagram"
          >
            <svg width="64" height="64" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="58" fill="white" stroke="#ccc" strokeWidth="1" />
              <circle cx="60" cy="60" r="43.5" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
              <line x1="60" y1="2" x2="60" y2="118" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
              <line x1="2" y1="60" x2="118" y2="60" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
              {([-1.5,-1,-0.5,0,0.5,1,1.5] as number[]).map((vx) =>
                ([-1.5,-1,-0.5,0,0.5,1,1.5] as number[]).map((vy) => {
                  const px = 60 + (vx / 2) * 58;
                  const py = 60 + (vy / 2) * 58;
                  return <circle key={`${vx}-${vy}`} cx={px} cy={py} r={1.5} fill="rgba(0,0,0,0.12)" />;
                })
              )}
              <circle
                cx={60 + (englishX / 2) * 58}
                cy={60 + (englishY / 2) * 58}
                r={Math.max(5, 58 / 4)}
                fill="rgba(59,130,246,0.25)"
                stroke="#3b82f6"
                strokeWidth="1.5"
                data-testid="english-tip-circle"
              />
              <circle
                cx={60 + (englishX / 2) * 58}
                cy={60 + (englishY / 2) * 58}
                r={3}
                fill="#3b82f6"
                data-testid="english-dot"
              />
            </svg>
          </div>
          <span className="text-xs text-muted-foreground" data-testid="english-readout">
            H{englishX >= 0 ? "+" : ""}{englishX.toFixed(1)} V{englishY >= 0 ? "+" : ""}{englishY.toFixed(1)}
          </span>
        </div>

        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
              Speed: {formatSpeed(shotSpeed)}
            </span>
            <Slider
              value={[shotSpeed]}
              min={1}
              max={10}
              step={0.25}
              onValueChange={([v]) => setShotSpeed(v)}
              data-testid="slider-speed"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 flex-shrink-0">
              Fine Tune: {angleFine > 0 ? "+" : ""}{angleFine.toFixed(1)}°
            </span>
            <Slider
              value={[angleFine]}
              min={-5}
              max={5}
              step={0.1}
              onValueChange={([v]) => setAngleFine(Math.round(v * 10) / 10)}
              data-testid="slider-angle"
            />
          </div>
        </div>

        {(englishX !== 0 || englishY !== 0) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setEnglishX(0); setEnglishY(0); }}
            data-testid="button-reset-english"
          >
            Center
          </Button>
        )}
      </div>

      {!cueBallMoved && (
        <div
          className="border-t bg-muted/50 py-3 flex items-center justify-center"
          data-testid="footer-ball-in-hand"
        >
          <span className="text-2xl font-bold tracking-widest uppercase text-muted-foreground select-none">
            Ball in Hand
          </span>
        </div>
      )}

      {tourStep !== null && (
        <CueingEmulatorTour
          currentStepIndex={tourStep}
          onNext={advanceTour}
          onBack={backTour}
          onDismiss={dismissTour}
          cueBallCanvasPos={(() => {
            const cueBall = balls.find((b) => b.type === "cue" && !b.pocketed);
            const container = containerRef.current;
            if (!cueBall || !container || canvasSize.width === 0) return undefined;
            // Use containerRef (same element canvasSize was measured from) so
            // rect.top matches the coordinate origin used by getScale/tableToCanvas.
            const rect = container.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const { scale, offsetX, offsetY } = getScale();
            return {
              x: rect.left + (offsetX + cueBall.pos.x * scale) / dpr,
              y: rect.top + (offsetY + cueBall.pos.y * scale) / dpr,
              r: Math.max(12, (TABLE_DIMENSIONS.ballRadius * ballScale * scale) / dpr),
            };
          })()}
        />
      )}
    </div>
  );
}

function drawDiamond(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number
) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size, y);
  ctx.closePath();
  ctx.fill();
}
