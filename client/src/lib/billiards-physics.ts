export interface Vec2 {
  x: number;
  y: number;
}

export interface Ball {
  id: string;
  type: "cue" | "solid" | "stripe";
  pos: Vec2;
  vel: Vec2;
  spin: Vec2;
  pocketed: boolean;
}

export interface TableConfig {
  tableSpeed: "slow" | "medium" | "fast";
  equipment: "dirty" | "average" | "clean";
  rails: "soft" | "medium" | "firm";
}

export interface ShotParams {
  speed: number;
  angle: number;
  angleFine: number;
  englishX: number;
  englishY: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
}

export interface TrajectorySegment {
  ballId: string;
  ballType: "cue" | "solid" | "stripe";
  points: TrajectoryPoint[];
}

export interface SimulationResult {
  trajectories: TrajectorySegment[];
  finalBalls: Ball[];
}

const BALL_RADIUS = 1.125;
const BALL_DIAMETER = 2.25;
const TABLE_WIDTH = 100;
const TABLE_HEIGHT = 50;
const POCKET_RADIUS = 2.25;

const POCKETS: Vec2[] = [
  { x: 0, y: 0 },
  { x: TABLE_WIDTH / 2, y: 0 },
  { x: TABLE_WIDTH, y: 0 },
  { x: 0, y: TABLE_HEIGHT },
  { x: TABLE_WIDTH / 2, y: TABLE_HEIGHT },
  { x: TABLE_WIDTH, y: TABLE_HEIGHT },
];

const ROLLING_FRICTION: Record<string, number> = {
  slow: 0.022,
  medium: 0.016,
  fast: 0.010,
};

const SLIDING_FRICTION: Record<string, number> = {
  slow: 0.28,
  medium: 0.22,
  fast: 0.18,
};

const RAIL_RESTITUTION: Record<string, number> = {
  soft: 0.6,
  medium: 0.75,
  firm: 0.9,
};

const THROW_FACTOR: Record<string, number> = {
  dirty: 0.06,
  average: 0.035,
  clean: 0.015,
};

const SQUIRT_COEFFICIENT = 0.006;
const CURVE_COEFFICIENT = 0.0004;
const SPEED_SCALE = 8;
const DT = 0.002;
const MAX_STEPS = 30000;
const VELOCITY_THRESHOLD = 0.05;
const BALL_MASS = 1;
const BALL_BALL_RESTITUTION = 0.95;

function vecAdd(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x + b.x, y: a.y + b.y };
}

function vecSub(a: Vec2, b: Vec2): Vec2 {
  return { x: a.x - b.x, y: a.y - b.y };
}

function vecScale(v: Vec2, s: number): Vec2 {
  return { x: v.x * s, y: v.y * s };
}

function vecDot(a: Vec2, b: Vec2): number {
  return a.x * b.x + a.y * b.y;
}

function vecLen(v: Vec2): number {
  return Math.sqrt(v.x * v.x + v.y * v.y);
}

function vecNorm(v: Vec2): Vec2 {
  const l = vecLen(v);
  if (l < 1e-10) return { x: 0, y: 0 };
  return { x: v.x / l, y: v.y / l };
}

function vecPerp(v: Vec2): Vec2 {
  return { x: -v.y, y: v.x };
}

function clampBallPosition(pos: Vec2): Vec2 {
  return {
    x: Math.max(BALL_RADIUS, Math.min(TABLE_WIDTH - BALL_RADIUS, pos.x)),
    y: Math.max(BALL_RADIUS, Math.min(TABLE_HEIGHT - BALL_RADIUS, pos.y)),
  };
}

function checkPocketed(ball: Ball): boolean {
  for (const pocket of POCKETS) {
    const dist = vecLen(vecSub(ball.pos, pocket));
    if (dist < POCKET_RADIUS) return true;
  }
  return false;
}

function resolveBallBallCollision(
  a: Ball,
  b: Ball,
  throwFactor: number
): void {
  const delta = vecSub(b.pos, a.pos);
  const dist = vecLen(delta);
  if (dist < 1e-10 || dist > BALL_DIAMETER) return;

  const normal = vecNorm(delta);
  const tangent = vecPerp(normal);

  const overlap = BALL_DIAMETER - dist;
  if (overlap > 0) {
    const sep = vecScale(normal, overlap / 2);
    a.pos = vecSub(a.pos, sep);
    b.pos = vecAdd(b.pos, sep);
  }

  const relVel = vecSub(a.vel, b.vel);
  const normalSpeed = vecDot(relVel, normal);

  if (normalSpeed <= 0) return;

  const impulse = (normalSpeed * (1 + BALL_BALL_RESTITUTION)) / 2;

  a.vel = vecSub(a.vel, vecScale(normal, impulse));
  b.vel = vecAdd(b.vel, vecScale(normal, impulse));

  const tangentSpeed = vecDot(relVel, tangent);
  const throwImpulse = tangentSpeed * throwFactor;
  b.vel = vecAdd(b.vel, vecScale(tangent, throwImpulse));
  a.vel = vecSub(a.vel, vecScale(tangent, throwImpulse * 0.5));
}

function resolveRailCollision(
  ball: Ball,
  restitution: number
): void {
  if (ball.pos.x - BALL_RADIUS < 0) {
    ball.pos.x = BALL_RADIUS;
    ball.vel.x = Math.abs(ball.vel.x) * restitution;
    const spinEffect = ball.spin.y * 0.3;
    ball.vel.y += spinEffect;
    ball.spin.y *= 0.6;
  }
  if (ball.pos.x + BALL_RADIUS > TABLE_WIDTH) {
    ball.pos.x = TABLE_WIDTH - BALL_RADIUS;
    ball.vel.x = -Math.abs(ball.vel.x) * restitution;
    const spinEffect = -ball.spin.y * 0.3;
    ball.vel.y += spinEffect;
    ball.spin.y *= 0.6;
  }
  if (ball.pos.y - BALL_RADIUS < 0) {
    ball.pos.y = BALL_RADIUS;
    ball.vel.y = Math.abs(ball.vel.y) * restitution;
    const spinEffect = ball.spin.x * 0.3;
    ball.vel.x += spinEffect;
    ball.spin.x *= 0.6;
  }
  if (ball.pos.y + BALL_RADIUS > TABLE_HEIGHT) {
    ball.pos.y = TABLE_HEIGHT - BALL_RADIUS;
    ball.vel.y = -Math.abs(ball.vel.y) * restitution;
    const spinEffect = -ball.spin.x * 0.3;
    ball.vel.x += spinEffect;
    ball.spin.x *= 0.6;
  }
}

function applyFriction(ball: Ball, rollingFriction: number, slidingFriction: number, dt: number): void {
  const speed = vecLen(ball.vel);
  if (speed < VELOCITY_THRESHOLD) {
    ball.vel = { x: 0, y: 0 };
    ball.spin = { x: 0, y: 0 };
    return;
  }

  const spinMag = vecLen(ball.spin);
  const isSliding = spinMag > speed * 0.1;

  const friction = isSliding ? slidingFriction : rollingFriction;
  const decel = friction * 386.4 * dt;

  const dir = vecNorm(ball.vel);
  const newSpeed = Math.max(0, speed - decel);
  ball.vel = vecScale(dir, newSpeed);

  const spinDecay = 1 - friction * 2 * dt;
  ball.spin = vecScale(ball.spin, Math.max(0, spinDecay));
}

function applyCurvature(ball: Ball, dt: number): void {
  if (ball.type !== "cue") return;
  const spinMag = vecLen(ball.spin);
  if (spinMag < 0.01) return;

  const speed = vecLen(ball.vel);
  if (speed < VELOCITY_THRESHOLD) return;

  const velDir = vecNorm(ball.vel);
  const perpDir = vecPerp(velDir);

  const lateralForce = ball.spin.x * CURVE_COEFFICIENT * speed;
  ball.vel = vecAdd(ball.vel, vecScale(perpDir, lateralForce * dt * 100));
}

export function simulateShot(
  balls: Ball[],
  shotParams: ShotParams,
  tableConfig: TableConfig
): SimulationResult {
  const simBalls: Ball[] = balls
    .filter((b) => !b.pocketed)
    .map((b) => ({
      ...b,
      pos: { ...b.pos },
      vel: { ...b.vel },
      spin: { ...b.spin },
    }));

  const cueBall = simBalls.find((b) => b.type === "cue");
  if (!cueBall) {
    return { trajectories: [], finalBalls: simBalls };
  }

  const totalAngle = shotParams.angle + (shotParams.angleFine * Math.PI) / 180;

  const squirtAngle =
    -shotParams.englishX * SQUIRT_COEFFICIENT * shotParams.speed;
  const finalAngle = totalAngle + squirtAngle;

  const initialSpeed = shotParams.speed * SPEED_SCALE;
  cueBall.vel = {
    x: Math.cos(finalAngle) * initialSpeed,
    y: Math.sin(finalAngle) * initialSpeed,
  };

  cueBall.spin = {
    x: shotParams.englishX * initialSpeed * 0.3,
    y: shotParams.englishY * initialSpeed * 0.3,
  };

  const rollingFriction = ROLLING_FRICTION[tableConfig.tableSpeed];
  const slidingFriction = SLIDING_FRICTION[tableConfig.tableSpeed];
  const restitution = RAIL_RESTITUTION[tableConfig.rails];
  const throwFactor = THROW_FACTOR[tableConfig.equipment];

  const trajectoryMap: Record<string, TrajectoryPoint[]> = {};
  for (const b of simBalls) {
    trajectoryMap[b.id] = [{ x: b.pos.x, y: b.pos.y }];
  }

  let recordCounter = 0;
  const RECORD_INTERVAL = 3;

  for (let step = 0; step < MAX_STEPS; step++) {
    for (const ball of simBalls) {
      if (ball.pocketed) continue;
      ball.pos = vecAdd(ball.pos, vecScale(ball.vel, DT));
    }

    for (let i = 0; i < simBalls.length; i++) {
      for (let j = i + 1; j < simBalls.length; j++) {
        if (simBalls[i].pocketed || simBalls[j].pocketed) continue;
        const dist = vecLen(vecSub(simBalls[i].pos, simBalls[j].pos));
        if (dist < BALL_DIAMETER) {
          resolveBallBallCollision(simBalls[i], simBalls[j], throwFactor);
        }
      }
    }

    for (const ball of simBalls) {
      if (ball.pocketed) continue;
      resolveRailCollision(ball, restitution);
    }

    for (const ball of simBalls) {
      if (ball.pocketed) continue;
      applyFriction(ball, rollingFriction, slidingFriction, DT);
      applyCurvature(ball, DT);
    }

    for (const ball of simBalls) {
      if (ball.pocketed) continue;
      if (checkPocketed(ball)) {
        ball.pocketed = true;
        ball.vel = { x: 0, y: 0 };
        ball.spin = { x: 0, y: 0 };
      }
    }

    recordCounter++;
    if (recordCounter >= RECORD_INTERVAL) {
      recordCounter = 0;
      for (const ball of simBalls) {
        if (ball.pocketed) continue;
        if (vecLen(ball.vel) > VELOCITY_THRESHOLD * 0.5) {
          trajectoryMap[ball.id]?.push({ x: ball.pos.x, y: ball.pos.y });
        }
      }
    }

    let allStopped = true;
    for (const ball of simBalls) {
      if (!ball.pocketed && vecLen(ball.vel) > VELOCITY_THRESHOLD) {
        allStopped = false;
        break;
      }
    }
    if (allStopped) break;
  }

  for (const ball of simBalls) {
    if (!ball.pocketed && vecLen(ball.vel) > 0) {
      ball.vel = { x: 0, y: 0 };
      ball.spin = { x: 0, y: 0 };
    }
    if (!ball.pocketed) {
      trajectoryMap[ball.id]?.push({ x: ball.pos.x, y: ball.pos.y });
    }
  }

  const trajectories: TrajectorySegment[] = simBalls.map((b) => ({
    ballId: b.id,
    ballType: b.type,
    points: trajectoryMap[b.id] || [],
  }));

  return { trajectories, finalBalls: simBalls };
}

export function createBall(
  id: string,
  type: "cue" | "solid" | "stripe",
  x: number,
  y: number
): Ball {
  return {
    id,
    type,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    spin: { x: 0, y: 0 },
    pocketed: false,
  };
}

export const TABLE_DIMENSIONS = {
  width: TABLE_WIDTH,
  height: TABLE_HEIGHT,
  ballRadius: BALL_RADIUS,
  pocketRadius: POCKET_RADIUS,
  pockets: POCKETS,
};
