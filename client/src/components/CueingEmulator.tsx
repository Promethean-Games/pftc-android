import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { X, Plus, Trash2, Undo2, Crosshair, Grid3x3, Move, Settings, RefreshCw, Copy, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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
  stripe: "#22c55e",
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
    { type: "stripe", x: 50, y: 2 },
    { type: "solid", x: 50, y: 25 },
    { type: "stripe", x: 50, y: 48 },
  ]},
  { id: "3-04", label: "3-04", par: 3, balls: [
    { type: "solid", x: 75, y: 25 },
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
    { type: "solid", x: 37.5, y: 25 },
    { type: "stripe", x: 50, y: 25 },
    { type: "stripe", x: 62.5, y: 25 },
    { type: "stripe", x: 75, y: 25 },
  ]},
  { id: "4-03", label: "4-03", par: 4, balls: [
    { type: "stripe", x: 25, y: 25 },
    { type: "stripe", x: 62.5, y: 12.5 },
    { type: "solid", x: 98, y: 2 },
    { type: "solid", x: 98, y: 48 },
  ]},
  { id: "4-04", label: "4-04", par: 4, balls: [
    { type: "stripe", x: 37.5, y: 37.5 },
    { type: "stripe", x: 50, y: 25 },
    { type: "stripe", x: 75, y: 12.5 },
    { type: "solid", x: 75, y: 25 },
  ]},
  { id: "4-05", label: "4-05", par: 4, balls: [
    { type: "solid", x: 50, y: 12.5 },
    { type: "stripe", x: 50, y: 25 },
    { type: "solid", x: 50, y: 37.5 },
    { type: "stripe", x: 62.5, y: 12.5 },
  ]},
  { id: "5-01", label: "5-01", par: 5, balls: [
    { type: "solid", x: 62.5, y: 12.5 },
    { type: "solid", x: 62.5, y: 37.5 },
    { type: "stripe", x: 75, y: 25 },
    { type: "solid", x: 87.5, y: 2 },
    { type: "solid", x: 87.5, y: 48 },
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
  const [copiedLayout, setCopiedLayout] = useState(false);

  const [tableConfig, setTableConfig] = useState<TableConfig>({
    tableSpeed: "medium",
    equipment: "average",
    rails: "medium",
  });

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
    const result = simulateShot(balls, params, tableConfig);
    return result.trajectories;
  }, [hasAimLine, balls, aimAngle, angleFine, shotSpeed, englishX, englishY, tableConfig]);

  const cutAngleInfo = useMemo<{ angle: number; label: string } | null>(() => {
    if (!hasAimLine) return null;
    const cueBall = balls.find((b) => b.type === "cue" && !b.pocketed);
    if (!cueBall) return null;
    const totalAngle = aimAngle + (angleFine * Math.PI) / 180;
    const dirX = Math.cos(totalAngle);
    const dirY = Math.sin(totalAngle);
    const br2 = TABLE_DIMENSIONS.ballRadius * 2;

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
  }, [hasAimLine, balls, aimAngle, angleFine]);

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
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      setCanvasSize({
        width: rect.width * dpr,
        height: rect.height * dpr,
      });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { scale, offsetX, offsetY } = getScale();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const tw = TABLE_DIMENSIONS.width * scale;
    const th = TABLE_DIMENSIONS.height * scale;

    const railW = Math.max(16, TABLE_DIMENSIONS.pocketRadius * scale + 4);

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
      const pr = TABLE_DIMENSIONS.pocketRadius * scale;
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
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.7;
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
      const draggedBall = balls.find((b) => b.id === dragRef.current!.ballId);
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

    for (const ball of balls) {
      if (ball.pocketed) continue;
      const bp = tableToCanvas(ball.pos.x, ball.pos.y);
      const br = TABLE_DIMENSIONS.ballRadius * scale;

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
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1;
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
  ]);

  useEffect(() => {
    draw();
  }, [draw]);

  const getEventPos = (
    e: React.TouchEvent | React.MouseEvent
  ): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
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

  const findBallAt = (cx: number, cy: number): Ball | null => {
    const tp = canvasToTable(cx, cy);
    const { scale } = getScale();
    const hitRadius = TABLE_DIMENSIONS.ballRadius + 4 / scale;
    for (let i = balls.length - 1; i >= 0; i--) {
      const b = balls[i];
      if (b.pocketed) continue;
      const dx = tp.x - b.pos.x;
      const dy = tp.y - b.pos.y;
      if (Math.sqrt(dx * dx + dy * dy) < hitRadius) return b;
    }
    return null;
  };

  const handlePointerDown = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    const pos = getEventPos(e);
    const hitBall = findBallAt(pos.x, pos.y);

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
      const newX = Math.max(
        TABLE_DIMENSIONS.ballRadius,
        Math.min(TABLE_DIMENSIONS.width - TABLE_DIMENSIONS.ballRadius, rawX)
      );
      const newY = Math.max(
        TABLE_DIMENSIONS.ballRadius,
        Math.min(TABLE_DIMENSIONS.height - TABLE_DIMENSIONS.ballRadius, rawY)
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

  const handleClose = () => {
    try {
      localStorage.setItem("pftc_emulator_layout", JSON.stringify(balls));
    } catch {}
    onClose();
  };

  const handleShoot = () => {
    const cueBall = balls.find((b) => b.type === "cue" && !b.pocketed);
    if (!cueBall || !hasAimLine) return;

    setShotHistory((prev) => [...prev, balls.map((b) => ({ ...b, pos: { ...b.pos }, vel: { ...b.vel }, spin: { ...b.spin } }))]);

    const params: ShotParams = {
      speed: shotSpeed,
      angle: aimAngle,
      angleFine,
      englishX,
      englishY,
    };

    const result = simulateShot(balls, params, tableConfig);
    setBalls(result.finalBalls);
    setHasAimLine(false);
    setSelectedBallId(null);
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

  const handleEnglishDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 4 - 2;
    const y = ((e.clientY - rect.top) / rect.height) * 4 - 2;
    setEnglishX(snapEnglish(Math.max(ENG_MIN, Math.min(ENG_MAX, x))));
    setEnglishY(snapEnglish(Math.max(ENG_MIN, Math.min(ENG_MAX, y))));
  };

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
            Move Cue
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="default"
            onClick={handleShoot}
            disabled={!hasAimLine}
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

      {cutAngleInfo && (
        <div className="flex items-center gap-3 px-3 py-1 border-b bg-muted/50 text-sm" data-testid="cut-angle-info">
          <span className="text-muted-foreground">Cut Angle:</span>
          <span className="font-mono font-bold" data-testid="text-cut-angle">{cutAngleInfo.angle.toFixed(2)}°</span>
          <span className="text-muted-foreground">({cutAngleInfo.label})</span>
        </div>
      )}

      <div className="flex-1 min-h-0 relative overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0 bg-[#1a1a2e] dark:bg-[#0a0a1a]"
          style={{ touchAction: "none" }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            style={{ width: "100%", height: "100%" }}
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
          <div className="p-3">
            <Accordion type="multiple" defaultValue={["speed", "english"]}>
              <AccordionItem value="speed">
                <AccordionTrigger className="text-sm py-2">
                  Shot Speed: {shotSpeed}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Soft</span>
                      <span>Power</span>
                    </div>
                    <Slider
                      value={[shotSpeed]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={([v]) => setShotSpeed(v)}
                      data-testid="slider-speed"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="angle">
                <AccordionTrigger className="text-sm py-2">
                  Fine-Tune Angle: {angleFine > 0 ? "+" : ""}
                  {angleFine.toFixed(1)}°
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-3">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>-5°</span>
                      <span>+5°</span>
                    </div>
                    <Slider
                      value={[angleFine]}
                      min={-5}
                      max={5}
                      step={0.1}
                      onValueChange={([v]) => setAngleFine(Math.round(v * 10) / 10)}
                      data-testid="slider-angle"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="english">
                <AccordionTrigger className="text-sm py-2">
                  English: H {englishX > 0 ? "+" : ""}{englishX.toFixed(1)}, V {englishY > 0 ? "+" : ""}{englishY.toFixed(1)}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-3 space-y-3">
                    <div
                      className="relative cursor-pointer mx-auto"
                      style={{ width: 120, height: 120 }}
                      onClick={handleEnglishDiagramClick}
                      data-testid="english-diagram"
                    >
                      <svg width="120" height="120" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="58" fill="white" stroke="#ccc" strokeWidth="1" />
                        <circle cx="60" cy="60" r="43.5" fill="none" stroke="#ef4444" strokeWidth="1" strokeDasharray="4 3" opacity="0.5" />
                        <line x1="60" y1="2" x2="60" y2="118" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
                        <line x1="2" y1="60" x2="118" y2="60" stroke="rgba(0,0,0,0.15)" strokeWidth="0.5" />
                        {[-2,-1.75,-1.5,-1.25,-1,-0.75,-0.5,-0.25,0,0.25,0.5,0.75,1,1.25,1.5,1.75,2].map((vx) =>
                          [-2,-1.75,-1.5,-1.25,-1,-0.75,-0.5,-0.25,0,0.25,0.5,0.75,1,1.25,1.5,1.75,2].map((vy) => {
                            const px = 60 + (vx / 2) * 58;
                            const py = 60 + (vy / 2) * 58;
                            return (
                              <circle
                                key={`${vx}-${vy}`}
                                cx={px}
                                cy={py}
                                r={1.2}
                                fill="rgba(0,0,0,0.12)"
                              />
                            );
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
                      <span className="absolute text-muted-foreground" style={{ fontSize: 8, bottom: -2, right: 0, opacity: 0.6 }}>miscue limit</span>
                    </div>
                    <div className="text-xs text-center text-muted-foreground" data-testid="english-readout">
                      Horizontal: {englishX >= 0 ? "+" : ""}{englishX.toFixed(2)} tips · Vertical: {englishY >= 0 ? "+" : ""}{englishY.toFixed(2)} tips
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>-2</span>
                        <span>0</span>
                        <span>+2</span>
                      </div>
                      <Slider
                        value={[englishX]}
                        min={-2}
                        max={2}
                        step={0.25}
                        onValueChange={([v]) => setEnglishX(snapEnglish(v))}
                        data-testid="slider-english-x"
                      />
                      <span className="text-xs text-muted-foreground">Horizontal (side spin)</span>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>-2</span>
                        <span>0</span>
                        <span>+2</span>
                      </div>
                      <Slider
                        value={[englishY]}
                        min={-2}
                        max={2}
                        step={0.25}
                        onValueChange={([v]) => setEnglishY(snapEnglish(v))}
                        data-testid="slider-english-y"
                      />
                      <span className="text-xs text-muted-foreground">Vertical (top/draw)</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEnglishX(0);
                        setEnglishY(0);
                      }}
                      data-testid="button-reset-english"
                    >
                      Center
                    </Button>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="physics">
                <AccordionTrigger className="text-sm py-2">
                  Table Physics
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 pb-3">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">
                        Table Speed
                      </span>
                      <ToggleGroup
                        value={tableConfig.tableSpeed}
                        options={[
                          { label: "Slow", value: "slow" },
                          { label: "Medium", value: "medium" },
                          { label: "Fast", value: "fast" },
                        ]}
                        onChange={(v) =>
                          setTableConfig((p) => ({
                            ...p,
                            tableSpeed: v as TableConfig["tableSpeed"],
                          }))
                        }
                      />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">
                        Equipment
                      </span>
                      <ToggleGroup
                        value={tableConfig.equipment}
                        options={[
                          { label: "Dirty", value: "dirty" },
                          { label: "Average", value: "average" },
                          { label: "Clean", value: "clean" },
                        ]}
                        onChange={(v) =>
                          setTableConfig((p) => ({
                            ...p,
                            equipment: v as TableConfig["equipment"],
                          }))
                        }
                      />
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1">
                        Rails
                      </span>
                      <ToggleGroup
                        value={tableConfig.rails}
                        options={[
                          { label: "Soft", value: "soft" },
                          { label: "Medium", value: "medium" },
                          { label: "Firm", value: "firm" },
                        ]}
                        onChange={(v) =>
                          setTableConfig((p) => ({
                            ...p,
                            rails: v as TableConfig["rails"],
                          }))
                        }
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="course-tools">
                <AccordionTrigger className="text-sm py-2" data-testid="accordion-course-layouts">
                  <span className="flex items-center gap-2">
                    Course Layouts
                    <Badge variant="secondary" className="text-xs no-default-active-elevate">
                      In Active Development...
                    </Badge>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pb-3 space-y-4" data-testid="course-layouts-content">
                    <div className="space-y-3">
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
                                  onClick={() => loadPreset(preset)}
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

                    <div className="border-t pt-3 space-y-2">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Position balls on the table, then copy this to report the layout.
                      </p>
                      <textarea
                        readOnly
                        className="w-full rounded-md border bg-muted px-2 py-1.5 text-xs font-mono leading-relaxed resize-none focus:outline-none"
                        rows={Math.max(3, balls.filter((b) => b.type !== "cue" && !b.pocketed).length + 1)}
                        value={(() => {
                          const objectBalls = balls.filter((b) => b.type !== "cue" && !b.pocketed);
                          if (objectBalls.length === 0) return "(no object balls placed)";
                          return objectBalls
                            .map((b) => {
                              const rx = Math.round(b.pos.x * 100) / 100;
                              const ry = Math.round(b.pos.y * 100) / 100;
                              return `{ type: "${b.type}", x: ${rx}, y: ${ry} },`;
                            })
                            .join("\n");
                        })()}
                        data-testid="textarea-export-layout"
                        onFocus={(e) => e.currentTarget.select()}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        data-testid="button-copy-layout"
                        onClick={() => {
                          const objectBalls = balls.filter((b) => b.type !== "cue" && !b.pocketed);
                          if (objectBalls.length === 0) return;
                          const text = objectBalls
                            .map((b) => {
                              const rx = Math.round(b.pos.x * 100) / 100;
                              const ry = Math.round(b.pos.y * 100) / 100;
                              return `{ type: "${b.type}", x: ${rx}, y: ${ry} },`;
                            })
                            .join("\n");
                          navigator.clipboard.writeText(text).then(() => {
                            setCopiedLayout(true);
                            setTimeout(() => setCopiedLayout(false), 2000);
                          });
                        }}
                      >
                        {copiedLayout ? (
                          <><Check className="w-3 h-3 mr-1" />Copied!</>
                        ) : (
                          <><Copy className="w-3 h-3 mr-1" />Copy to Clipboard</>
                        )}
                      </Button>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
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
