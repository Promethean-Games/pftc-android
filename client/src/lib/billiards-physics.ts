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
  slow: 0.015,
  medium: 0.010,
  fast: 0.005,
};

const SLIDING_FRICTION: Record<string, number> = {
  slow: 0.30,
  medium: 0.20,
  fast: 0.15,
};

const RAIL_RESTITUTION: Record<string, number> = {
  soft: 0.55,
  medium: 0.72,
  firm: 0.85,
};

const THROW_FACTOR: Record<string, number> = {
  dirty: 0.050,
  average: 0.035,
  clean: 0.020,
};

const SQUIRT_COEFFICIENT = 0.005;
const SWERVE_COEFFICIENT = 0.00015;
const SPEED_SCALE = 8;
const DT = 0.002;
const MAX_STEPS = 30000;
const VELOCITY_THRESHOLD = 0.05;
const BALL_BALL_RESTITUTION = 0.95;
const G = 386.4;

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
    const spinEffect = ball.spin.y * 0.15;
    ball.vel.y += spinEffect;
    ball.spin.y *= 0.7;
  }
  if (ball.pos.x + BALL_RADIUS > TABLE_WIDTH) {
    ball.pos.x = TABLE_WIDTH - BALL_RADIUS;
    ball.vel.x = -Math.abs(ball.vel.x) * restitution;
    const spinEffect = -ball.spin.y * 0.15;
    ball.vel.y += spinEffect;
    ball.spin.y *= 0.7;
  }
  if (ball.pos.y - BALL_RADIUS < 0) {
    ball.pos.y = BALL_RADIUS;
    ball.vel.y = Math.abs(ball.vel.y) * restitution;
    const spinEffect = ball.spin.x * 0.15;
    ball.vel.x += spinEffect;
    ball.spin.x *= 0.7;
  }
  if (ball.pos.y + BALL_RADIUS > TABLE_HEIGHT) {
    ball.pos.y = TABLE_HEIGHT - BALL_RADIUS;
    ball.vel.y = -Math.abs(ball.vel.y) * restitution;
    const spinEffect = -ball.spin.x * 0.15;
    ball.vel.x += spinEffect;
    ball.spin.x *= 0.7;
  }
}

function applyFriction(ball: Ball, rollingFriction: number, slidingFriction: number, dt: number): void {
  const speed = vecLen(ball.vel);
  if (speed < VELOCITY_THRESHOLD * 0.5 && vecLen(ball.spin) < VELOCITY_THRESHOLD * 0.5) {
    ball.vel = { x: 0, y: 0 };
    ball.spin = { x: 0, y: 0 };
    return;
  }

  if (speed < 1e-10) {
    ball.spin = vecScale(ball.spin, Math.max(0, 1 - slidingFriction * 3 * dt));
    return;
  }

  const velDir = vecNorm(ball.vel);

  const naturalRollSpin = {
    x: velDir.x * speed,
    y: velDir.y * speed,
  };

  const relSpin = vecSub(ball.spin, naturalRollSpin);
  const relSpinMag = vecLen(relSpin);

  if (relSpinMag > speed * 0.05) {
    const slideDecel = slidingFriction * G * dt;
    const slideDir = vecNorm(relSpin);
    const slideForceX = -slideDir.x * slideDecel * 0.4;
    const slideForceY = -slideDir.y * slideDecel * 0.4;

    ball.vel.x += slideForceX;
    ball.vel.y += slideForceY;

    const spinDecayRate = slidingFriction * 5 * dt;
    ball.spin = vecAdd(
      naturalRollSpin,
      vecScale(relSpin, Math.max(0, 1 - spinDecayRate))
    );
  } else {
    ball.spin = { ...naturalRollSpin };

    const rollDecel = rollingFriction * G * dt;
    const newSpeed = Math.max(0, speed - rollDecel);
    ball.vel = vecScale(velDir, newSpeed);
    ball.spin = vecScale(velDir, newSpeed);
  }
}

function applySwerve(ball: Ball, dt: number): void {
  if (ball.type !== "cue") return;

  const speed = vecLen(ball.vel);
  if (speed < VELOCITY_THRESHOLD) return;

  const velDir = vecNorm(ball.vel);
  const naturalRollSpin = vecScale(velDir, speed);
  const relSpin = vecSub(ball.spin, naturalRollSpin);

  const sideComponent = relSpin.x * velDir.y - relSpin.y * velDir.x;

  if (Math.abs(sideComponent) < 0.01) return;

  const perpDir = vecPerp(velDir);
  const swerveForce = sideComponent * SWERVE_COEFFICIENT;
  ball.vel = vecAdd(ball.vel, vecScale(perpDir, swerveForce * dt * 100));
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

  const velDir = vecNorm(cueBall.vel);
  const naturalRollX = velDir.x * initialSpeed;
  const naturalRollY = velDir.y * initialSpeed;

  const sideSpinMag = shotParams.englishX * initialSpeed * 0.25;

  const perpX = -velDir.y;
  const perpY = velDir.x;

  const topDrawFactor = -shotParams.englishY;
  const rollFactor = topDrawFactor * 0.6;

  cueBall.spin = {
    x: naturalRollX * (1 + rollFactor) + perpX * sideSpinMag,
    y: naturalRollY * (1 + rollFactor) + perpY * sideSpinMag,
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
      applySwerve(ball, DT);
    }

    for (const ball of simBalls) {
      if (ball.pocketed) continue;
      if (checkPocketed(ball)) {
        ball.pocketed = true;
        trajectoryMap[ball.id]?.push({ x: ball.pos.x, y: ball.pos.y });
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
    if (!ball.pocketed) {
      if (vecLen(ball.vel) > 0) {
        ball.vel = { x: 0, y: 0 };
        ball.spin = { x: 0, y: 0 };
      }
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
