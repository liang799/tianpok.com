export type ConstructionVector = [number, number, number];

export type ConstructionPiece = {
  id: string;
  label: string;
  kind: "t-column" | "p-column" | "p-beam" | "p-outer" | "t-cap";
  size: ConstructionVector;
  pickup: ConstructionVector;
  placement: ConstructionVector;
  accent?: "orange-front" | "orange-top";
};

export const PICKUP_SURFACE_HEIGHT = 0.38;

function piece(
  id: string,
  label: string,
  kind: ConstructionPiece["kind"],
  size: ConstructionVector,
  staging: [number, number],
  placement: ConstructionVector,
  accent?: ConstructionPiece["accent"],
): ConstructionPiece {
  return {
    id,
    label,
    kind,
    size,
    pickup: [staging[0], PICKUP_SURFACE_HEIGHT + size[1] / 2, staging[1]],
    placement,
    accent,
  };
}

// Every main structural piece exists on a staging pallet before its lift.
// Adjacent placement faces meet exactly; the scene never swaps a finished model.
export const CONSTRUCTION_PIECES: readonly ConstructionPiece[] = [
  piece(
    "t-base",
    "T · lower column",
    "t-column",
    [0.86, 2.285, 0.88],
    [-3.65, -0.9],
    [-1.1, 1.3625, 0.45],
  ),
  piece(
    "p-base",
    "P · lower column",
    "p-column",
    [0.7, 2.085, 0.85],
    [-3.65, 0.3],
    [0.98, 1.2625, 0.18],
    "orange-front",
  ),
  piece(
    "t-column",
    "T · upper column",
    "t-column",
    [0.86, 2.285, 0.88],
    [-3.65, 1.6],
    [-1.1, 3.6475, 0.45],
  ),
  piece(
    "p-column",
    "P · upper column",
    "p-column",
    [0.7, 2.085, 0.85],
    [-2.65, 2.65],
    [0.98, 3.3475, 0.18],
  ),
  piece(
    "p-crossbeam",
    "P · crossbeam",
    "p-beam",
    [1.15, 0.58, 0.85],
    [-0.1, 3.7],
    [1.905, 2.55, 0.18],
  ),
  piece(
    "p-outer",
    "P · outer column",
    "p-outer",
    [0.66, 0.89, 0.85],
    [1.0, 3.7],
    [2.15, 3.285, 0.18],
  ),
  piece(
    "p-roof",
    "P · roof beam",
    "p-beam",
    [1.15, 0.66, 0.85],
    [2.1, 3.7],
    [1.905, 4.06, 0.18],
    "orange-top",
  ),
  piece(
    "t-cap",
    "T · crown beam",
    "t-cap",
    [2.8, 0.72, 1.05],
    [-2.7, 3.7],
    [-0.8, 5.15, 0.45],
    "orange-top",
  ),
];

/** Lifting eyes are part-local coordinates shared by geometry and rigging. */
export function liftingEyes(piece: ConstructionPiece): ConstructionVector[] {
  const [width, height, depth] = piece.size;
  return [-1, 1].flatMap((x) =>
    [-1, 1].map((z): ConstructionVector => [
      x * width * 0.39,
      height / 2 + 0.07,
      z * depth * 0.34,
    ]),
  );
}
