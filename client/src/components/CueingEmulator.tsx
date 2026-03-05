import { useState, useRef, useEffect, useCallback } from "react";
import { X, Plus, Trash2, RotateCcw, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  simulateShot,
  createBall,
  TABLE_DIMENSIONS,
  type Ball,
  type ShotParams,
  type TableConfig,
  type TrajectorySegment,
  type SimulationResult,
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

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function CueingEmulator({ onClose }: CueingEmulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [balls, setBalls] = useState<Ball[]>(() => [
    createBall("cue", "cue", 25, 25),
  ]);
  const [preShotBalls, setPreShotBalls] = useState<Ball[] | null>(null);
  const [selectedBallId, setSelectedBallId] = useState<string | null>(null);
  const [trajectories, setTrajectories] = useState<TrajectorySegment[]>([]);

  const [aimAngle, setAimAngle] = useState<number>(0);
  const [isAiming, setIsAiming] = useState(false);
  const [hasAimLine, setHasAimLine] = useState(false);

  const [shotSpeed, setShotSpeed] = useState(5);
  const [angleFine, setAngleFine] = useState(0);
  const [englishX, setEnglishX] = useState(0);
  const [englishY, setEnglishY] = useState(0);

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

  const getScale = useCallback(() => {
    if (canvasSize.width === 0) return { scale: 1, offsetX: 0, offsetY: 0 };
    const pad = 10;
    const availW = canvasSize.width - pad * 2;
    const availH = canvasSize.height - pad * 2;
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

    ctx.fillStyle = "#5a3825";
    ctx.fillRect(offsetX - 8, offsetY - 8, tw + 16, th + 16);

    ctx.fillStyle = "#1a7a3a";
    ctx.fillRect(offsetX, offsetY, tw, th);

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

    const diamondPositions = [0.25, 0.5, 0.75];
    ctx.fillStyle = "#d4a853";
    for (const frac of diamondPositions) {
      const topD = tableToCanvas(TABLE_DIMENSIONS.width * frac, 0);
      const botD = tableToCanvas(TABLE_DIMENSIONS.width * frac, TABLE_DIMENSIONS.height);
      drawDiamond(ctx, topD.x, offsetY - 4, 3);
      drawDiamond(ctx, botD.x, offsetY + th + 4, 3);
    }
    const sideDiamondPositions = [0.25, 0.5, 0.75];
    for (const frac of sideDiamondPositions) {
      const leftD = tableToCanvas(0, TABLE_DIMENSIONS.height * frac);
      const rightD = tableToCanvas(TABLE_DIMENSIONS.width, TABLE_DIMENSIONS.height * frac);
      drawDiamond(ctx, offsetX - 4, leftD.y, 3);
      drawDiamond(ctx, offsetX + tw + 4, rightD.y, 3);
    }

    for (const traj of trajectories) {
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
        const cp = tableToCanvas(cueBall.pos.x, cueBall.pos.y);
        const lineLen = Math.max(tw, th);
        const endX = cp.x + Math.cos(totalAngle) * lineLen;
        const endY = cp.y + Math.sin(totalAngle) * lineLen;

        ctx.beginPath();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1;
        ctx.moveTo(cp.x, cp.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.beginPath();
        ctx.arc(
          cp.x + Math.cos(totalAngle) * 20,
          cp.y + Math.sin(totalAngle) * 20,
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
    trajectories,
    selectedBallId,
    hasAimLine,
    aimAngle,
    angleFine,
    getScale,
    tableToCanvas,
    canvasSize,
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
      if (hitBall.type === "cue") {
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
        const cp = tableToCanvas(cueBall.pos.x, cueBall.pos.y);
        const dx = pos.x - cp.x;
        const dy = pos.y - cp.y;
        if (Math.sqrt(dx * dx + dy * dy) > 10) {
          setAimAngle(Math.atan2(dy, dx));
          setHasAimLine(true);
        }
      }
    }

    if (dragRef.current) {
      const tp = canvasToTable(pos.x, pos.y);
      const newX = Math.max(
        TABLE_DIMENSIONS.ballRadius,
        Math.min(TABLE_DIMENSIONS.width - TABLE_DIMENSIONS.ballRadius, tp.x + dragRef.current.offsetX)
      );
      const newY = Math.max(
        TABLE_DIMENSIONS.ballRadius,
        Math.min(TABLE_DIMENSIONS.height - TABLE_DIMENSIONS.ballRadius, tp.y + dragRef.current.offsetY)
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

  const handleShoot = () => {
    const cueBall = balls.find((b) => b.type === "cue" && !b.pocketed);
    if (!cueBall || !hasAimLine) return;

    setPreShotBalls(balls.map((b) => ({ ...b, pos: { ...b.pos }, vel: { ...b.vel }, spin: { ...b.spin } })));

    const params: ShotParams = {
      speed: shotSpeed,
      angle: aimAngle,
      angleFine,
      englishX,
      englishY,
    };

    const result: SimulationResult = simulateShot(balls, params, tableConfig);
    setTrajectories(result.trajectories);
    setBalls(result.finalBalls);
    setHasAimLine(false);
    setSelectedBallId(null);
  };

  const handleReset = () => {
    if (preShotBalls) {
      setBalls(preShotBalls);
      setPreShotBalls(null);
    }
    setTrajectories([]);
    setHasAimLine(false);
  };

  const snapEnglish = (val: number): number => {
    return Math.round(val * 4) / 4;
  };

  const handleEnglishDiagramClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 4;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 4;
    setEnglishX(snapEnglish(Math.max(-2, Math.min(2, x))));
    setEnglishY(snapEnglish(Math.max(-2, Math.min(2, y))));
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
          <Button
            size="sm"
            variant="outline"
            onClick={() => addBall("solid")}
            data-testid="button-add-solid"
          >
            <Plus className="w-3 h-3 mr-1" />
            Solid
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => addBall("stripe")}
            data-testid="button-add-stripe"
          >
            <Plus className="w-3 h-3 mr-1" />
            Stripe
          </Button>
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
          {preShotBalls && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              data-testid="button-reset"
            >
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            data-testid="button-close-emulator"
          >
            <X />
          </Button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 min-h-0 bg-[#1a1a2e] dark:bg-[#0a0a1a] relative"
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

      <div className="border-t overflow-y-auto" style={{ maxHeight: "40vh" }}>
        <Accordion type="multiple" className="px-3">
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
              English: H {englishX > 0 ? "+" : ""}
              {englishX.toFixed(2)}, V {englishY > 0 ? "+" : ""}
              {englishY.toFixed(2)}
            </AccordionTrigger>
            <AccordionContent>
              <div className="pb-3">
                <div className="flex gap-4 items-start">
                  <div
                    className="relative flex-shrink-0 cursor-pointer border border-border rounded-full"
                    style={{ width: 120, height: 120 }}
                    onClick={handleEnglishDiagramClick}
                    data-testid="english-diagram"
                  >
                    <div
                      className="absolute rounded-full bg-white border border-gray-300"
                      style={{
                        width: 116,
                        height: 116,
                        top: 2,
                        left: 2,
                      }}
                    />
                    {Array.from({ length: 17 }).map((_, i) => {
                      const val = -2 + i * 0.25;
                      return Array.from({ length: 17 }).map((_, j) => {
                        const valY = -2 + j * 0.25;
                        const dist = Math.sqrt(val * val + valY * valY);
                        if (dist > 2.1) return null;
                        const px = ((val + 2) / 4) * 116 + 2;
                        const py = ((valY + 2) / 4) * 116 + 2;
                        return (
                          <div
                            key={`${i}-${j}`}
                            className="absolute rounded-full"
                            style={{
                              width: 3,
                              height: 3,
                              left: px - 1.5,
                              top: py - 1.5,
                              backgroundColor: "rgba(0,0,0,0.15)",
                            }}
                          />
                        );
                      });
                    })}
                    <div
                      className="absolute rounded-full bg-blue-500"
                      style={{
                        width: 10,
                        height: 10,
                        left: ((englishX + 2) / 4) * 116 + 2 - 5,
                        top: ((englishY + 2) / 4) * 116 + 2 - 5,
                        boxShadow: "0 0 4px rgba(59,130,246,0.8)",
                      }}
                      data-testid="english-dot"
                    />
                    <div
                      className="absolute"
                      style={{
                        width: 1,
                        height: 116,
                        left: 60,
                        top: 2,
                        backgroundColor: "rgba(0,0,0,0.1)",
                      }}
                    />
                    <div
                      className="absolute"
                      style={{
                        width: 116,
                        height: 1,
                        left: 2,
                        top: 60,
                        backgroundColor: "rgba(0,0,0,0.1)",
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-3 min-w-0">
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Left (-2)</span>
                        <span>Right (+2)</span>
                      </div>
                      <Slider
                        value={[englishX]}
                        min={-2}
                        max={2}
                        step={0.25}
                        onValueChange={([v]) => setEnglishX(v)}
                        data-testid="slider-english-x"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Top (-2)</span>
                        <span>Bottom (+2)</span>
                      </div>
                      <Slider
                        value={[englishY]}
                        min={-2}
                        max={2}
                        step={0.25}
                        onValueChange={([v]) => setEnglishY(v)}
                        data-testid="slider-english-y"
                      />
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
                </div>
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
        </Accordion>
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
