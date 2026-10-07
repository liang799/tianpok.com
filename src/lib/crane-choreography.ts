import {
  CONSTRUCTION_PIECES,
  type ConstructionVector,
} from "./construction-plan";

export type CraneVector3 = ConstructionVector;

export const CRANE_BASE: CraneVector3 = [3.8, 0, -0.8];
export const BOOM_HEIGHT = 9.2;
// Compatibility aliases for the original crown-beam milestone.
const crown = CONSTRUCTION_PIECES[CONSTRUCTION_PIECES.length - 1];
export const PICKUP_POSITION: CraneVector3 = [...crown.pickup];
export const PLACEMENT_POSITION: CraneVector3 = [...crown.placement];
export const LOAD_SIZE: CraneVector3 = [...crown.size];
export const SLING_HEIGHT = 1.1;
// Heights refer to the center of the load; the hook includes the lifting rig.
export const LIFT_HEIGHT = 6.15;

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
  activePieceIndex: number;
  cycleProgress: number;
  placedCount: number;
  piecePoses: ConstructionPiecePose[];
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

export interface ConstructionPiecePose {
  id: string;
  position: CraneVector3;
  rotation: CraneVector3;
  placed: boolean;
}

const phases: readonly [number, Exclude<CranePhase, "completed">, string][] = [
  [0.07, "approach", "Line up the lift"],
  [0.23, "lower", "Lower the hook"],
  [0.3, "attach", "Secure the load"],
  [0.48, "lift", "Clear the ground"],
  [0.68, "slew", "Move into position"],
  [0.82, "seat", "Seat the piece"],
  [0.88, "release", "Release the rigging"],
  [Infinity, "return", "Position for the next lift"],
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

// Keep equivalent angles on one continuous branch. A pickup just north of the
// crane's -X axis and a placement south of it otherwise differ by almost 2π.
let nextPickupAngle = boomAngle(CONSTRUCTION_PIECES[0].pickup);
const paths = CONSTRUCTION_PIECES.map((piece, index) => {
  const next = CONSTRUCTION_PIECES[(index + 1) % CONSTRUCTION_PIECES.length];
  const pickupAngle = nextPickupAngle;
  const placementAngle = mixAngle(pickupAngle, boomAngle(piece.placement), 1);
  nextPickupAngle = mixAngle(placementAngle, boomAngle(next.pickup), 1);
  return { pickupAngle, placementAngle, nextPickupAngle };
});

/**
 * Eight reversible lifts, including their empty-hook journeys between pallets.
 * Every prefab always exists, either staged, carried, or placed. The legacy
 * load fields alias the active piece; render piecePoses to preserve identity.
 * Coordinates are world-space centers. Positive Three.js Y rotation turns
 * the boom's local +X direction toward -Z.
 */
export function sampleCrane(progress: number): CraneSample {
  const overall = Math.min(
    1,
    Math.max(0, Number.isNaN(progress) ? 0 : progress),
  );
  const count = CONSTRUCTION_PIECES.length;
  const activePieceIndex = Math.min(count - 1, Math.floor(overall * count));
  const p = overall * count - activePieceIndex;
  const piece = CONSTRUCTION_PIECES[activePieceIndex];
  const next = CONSTRUCTION_PIECES[(activePieceIndex + 1) % count];
  const path = paths[activePieceIndex];
  const [, cyclePhase, action] = phases.find(([end]) => p < end)!;
  const phase = overall === 1 ? "completed" : cyclePhase;
  const phaseLabel =
    phase === "completed"
      ? "Built. Keep exploring."
      : `${piece.label} · ${action}`;
  const rigHeight = piece.size[1] / 2 + SLING_HEIGHT;
  const raisedHook = LIFT_HEIGHT + rigHeight;
  const nextRaisedHook = LIFT_HEIGHT + next.size[1] / 2 + SLING_HEIGHT;
  const pickupHook = piece.pickup[1] + rigHeight;
  const placedHook = piece.placement[1] + rigHeight;

  const outbound = smoothRange(p, 0.48, 0.68);
  const returning = smoothRange(p, 0.93, 0.98);
  const boomRotation = mix(
    mix(path.pickupAngle, path.placementAngle, outbound),
    path.nextPickupAngle,
    returning,
  );
  const trolleyRadius = mix(
    mix(boomRadius(piece.pickup), boomRadius(piece.placement), outbound),
    boomRadius(next.pickup),
    returning,
  );

  let hookHeight = mix(raisedHook, pickupHook, smoothRange(p, 0.07, 0.23));
  hookHeight = mix(hookHeight, raisedHook, smoothRange(p, 0.3, 0.48));
  hookHeight = mix(hookHeight, placedHook, smoothRange(p, 0.68, 0.82));
  hookHeight = mix(hookHeight, raisedHook, smoothRange(p, 0.88, 0.93));
  hookHeight = mix(hookHeight, nextRaisedHook, returning);

  const hookPosition: CraneVector3 = [
    CRANE_BASE[0] + Math.cos(boomRotation) * trolleyRadius,
    hookHeight,
    CRANE_BASE[2] - Math.sin(boomRotation) * trolleyRadius,
  ];
  const attached = p >= 0.27 && p < 0.85;
  const placed = p >= 0.82;
  const loadPosition: CraneVector3 = placed
    ? [...piece.placement]
    : p <= 0.3
      ? [...piece.pickup]
      : [hookPosition[0], hookPosition[1] - rigHeight, hookPosition[2]];

  // A small torsional sway preserves a plumb hoist and level load. It settles
  // completely before seating, so reversing never snaps the rig or the cap.
  const carryProgress = Math.min(1, Math.max(0, (p - 0.3) / (0.68 - 0.3)));
  const swayEnvelope = Math.sin(Math.PI * carryProgress) ** 2;
  const sway =
    carryProgress === 0 || carryProgress === 1
      ? 0
      : Math.sin(carryProgress * Math.PI * 4) * swayEnvelope * 0.035;
  const loadRotation: CraneVector3 = [0, sway, 0];
  const piecePoses = CONSTRUCTION_PIECES.map(
    (part, index): ConstructionPiecePose => ({
      id: part.id,
      position:
        index === activePieceIndex
          ? [...loadPosition]
          : [...(index < activePieceIndex ? part.placement : part.pickup)],
      rotation: index === activePieceIndex ? [...loadRotation] : [0, 0, 0],
      placed:
        index < activePieceIndex || (index === activePieceIndex && placed),
    }),
  );

  return {
    activePieceIndex,
    cycleProgress: p,
    placedCount: activePieceIndex + Number(placed),
    piecePoses,
    phase,
    phaseLabel,
    boomRotation,
    trolleyRadius,
    hookPosition,
    loadPosition,
    loadRotation,
    attached,
    placed,
    cableLength: BOOM_HEIGHT - hookHeight,
  };
}
