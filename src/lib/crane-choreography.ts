export type CraneVector3 = [number, number, number];

export const CRANE_BASE: CraneVector3 = [3.8, 0, -0.8];
export const BOOM_HEIGHT = 9.2;
export const PICKUP_POSITION: CraneVector3 = [-3.4, 0.87, 2.5];
export const PLACEMENT_POSITION: CraneVector3 = [-0.8, 5.15, 0.45];
export const LOAD_SIZE: CraneVector3 = [2.8, 0.72, 1.05];
export const SLING_HEIGHT = 1.1;
// Heights refer to the center of the load; the hook includes the lifting rig.
export const LIFT_HEIGHT = 6.6;

export type CranePhase =
  | "approach"
  | "lower"
  | "attach"
  | "lift"
  | "slew"
  | "seat"
  | "release"
  | "return"
  | "completed";

export interface CraneSample {
  phase: CranePhase;
  phaseLabel: string;
  boomRotation: number;
  trolleyRadius: number;
  hookPosition: CraneVector3;
  loadPosition: CraneVector3;
  loadRotation: CraneVector3;
  attached: boolean;
  placed: boolean;
  cableLength: number;
}

const phases: readonly [number, CranePhase, string][] = [
  [0.07, "approach", "Line up the lift"],
  [0.23, "lower", "Lower the hook"],
  [0.3, "attach", "Secure the load"],
  [0.48, "lift", "Clear the ground"],
  [0.68, "slew", "Move into position"],
  [0.82, "seat", "Set the final piece"],
  [0.88, "release", "Release the rigging"],
  [0.98, "return", "Return the crane"],
  [Infinity, "completed", "Built. Keep exploring."],
];

function smoothRange(progress: number, start: number, end: number) {
  const t = Math.min(1, Math.max(0, (progress - start) / (end - start)));
  // Zero velocity and acceleration at each end avoids mechanical jolts when
  // scrolling stops, reverses, or crosses a change from hoisting to slewing.
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function boomAngle(position: CraneVector3) {
  return Math.atan2(
    -(position[2] - CRANE_BASE[2]),
    position[0] - CRANE_BASE[0],
  );
}

function boomRadius(position: CraneVector3) {
  return Math.hypot(position[0] - CRANE_BASE[0], position[2] - CRANE_BASE[2]);
}

function mixAngle(from: number, to: number, progress: number) {
  const shortestArc = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + shortestArc * progress;
}

/**
 * A reversible, scroll-driven lift with no elapsed-time or simulation state.
 * Positions are world coordinates, the load position is its center, and a
 * positive Three.js Y rotation turns the boom's local +X direction toward -Z.
 */
export function sampleCrane(progress: number): CraneSample {
  const p = Math.min(1, Math.max(0, Number.isNaN(progress) ? 0 : progress));
  const [, phase, phaseLabel] = phases.find(([end]) => p < end)!;
  const rigHeight = LOAD_SIZE[1] / 2 + SLING_HEIGHT;
  const raisedHook = LIFT_HEIGHT + rigHeight;
  const pickupHook = PICKUP_POSITION[1] + rigHeight;
  const placedHook = PLACEMENT_POSITION[1] + rigHeight;

  const outbound = smoothRange(p, 0.48, 0.68);
  const returning = smoothRange(p, 0.93, 0.98);
  const traverse = outbound * (1 - returning);
  const boomRotation = mixAngle(
    boomAngle(PICKUP_POSITION),
    boomAngle(PLACEMENT_POSITION),
    traverse,
  );
  const trolleyRadius = mix(
    boomRadius(PICKUP_POSITION),
    boomRadius(PLACEMENT_POSITION),
    traverse,
  );

  let hookHeight = mix(raisedHook, pickupHook, smoothRange(p, 0.07, 0.23));
  hookHeight = mix(hookHeight, raisedHook, smoothRange(p, 0.3, 0.48));
  hookHeight = mix(hookHeight, placedHook, smoothRange(p, 0.68, 0.82));
  hookHeight = mix(hookHeight, raisedHook, smoothRange(p, 0.88, 0.93));

  const hookPosition: CraneVector3 = [
    CRANE_BASE[0] + Math.cos(boomRotation) * trolleyRadius,
    hookHeight,
    CRANE_BASE[2] - Math.sin(boomRotation) * trolleyRadius,
  ];
  const attached = p >= 0.27 && p < 0.85;
  const placed = p >= 0.82;
  const loadPosition: CraneVector3 = placed
    ? [...PLACEMENT_POSITION]
    : p <= 0.3
      ? [...PICKUP_POSITION]
      : [hookPosition[0], hookPosition[1] - rigHeight, hookPosition[2]];

  // A small torsional sway preserves a plumb hoist and level load. It settles
  // completely before seating, so reversing never snaps the rig or the cap.
  const carryProgress = Math.min(1, Math.max(0, (p - 0.3) / (0.82 - 0.3)));
  const swayEnvelope = Math.sin(Math.PI * carryProgress) ** 2;
  const sway =
    carryProgress === 0 || carryProgress === 1
      ? 0
      : Math.sin(carryProgress * Math.PI * 4) * swayEnvelope * 0.035;

  return {
    phase,
    phaseLabel,
    boomRotation,
    trolleyRadius,
    hookPosition,
    loadPosition,
    loadRotation: [0, sway, 0],
    attached,
    placed,
    cableLength: BOOM_HEIGHT - hookHeight,
  };
}
