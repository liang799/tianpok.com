"use client";

import { memo, useLayoutEffect, useMemo, useRef } from "react";
import type {} from "@react-three/fiber";
import { Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from "three";
import {
  CONSTRUCTION_PIECES,
  PICKUP_SURFACE_HEIGHT,
  liftingEyes,
  type ConstructionPiece,
} from "@/lib/construction-plan";

type Point = [number, number, number];
type Part = {
  position: Point;
  scale: Point;
  rotation?: Point;
  quaternion?: [number, number, number, number];
};
type Shape = "box" | "cylinder" | "sphere" | "eye" | "cloud";
type Collection = Record<string, Part[]>;

const ORANGE = "#ed5728";
const ORANGE_LIGHT = "#ff7947";
const ORANGE_DARK = "#be3b18";
const GRAPHITE = "#343b39";
const STEEL = "#666f6b";
const CONCRETE = "#e0d8c8";
const WOOD = "#bc9870";

function box(position: Point, scale: Point, rotation?: Point): Part {
  return { position, scale, rotation };
}

function beam(start: Point, end: Point, width: number, depth = width): Part {
  const from = new Vector3(...start);
  const to = new Vector3(...end);
  const direction = to.clone().sub(from);
  const rotation = new Quaternion().setFromUnitVectors(
    new Vector3(0, 1, 0),
    direction.clone().normalize(),
  );

  return {
    position: from.add(to).multiplyScalar(0.5).toArray() as Point,
    scale: [width, direction.length(), depth],
    quaternion: rotation.toArray() as [number, number, number, number],
  };
}

// A single draw call per material keeps even the fine lattice and bolt details cheap.
const Parts = memo(function Parts({
  items,
  color,
  shape = "box",
  roughness = 0.72,
  metalness = 0.08,
  castShadow = true,
  unlit = false,
}: {
  items: Part[];
  color: string;
  shape?: Shape;
  roughness?: number;
  metalness?: number;
  castShadow?: boolean;
  unlit?: boolean;
}) {
  const ref = useRef<InstancedMesh>(null);

  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;

    const matrix = new Matrix4();
    const position = new Vector3();
    const scale = new Vector3();
    const quaternion = new Quaternion();
    const euler = new Euler();

    items.forEach((part, index) => {
      position.set(...part.position);
      scale.set(...part.scale);
      if (part.quaternion) quaternion.fromArray(part.quaternion);
      else quaternion.setFromEuler(euler.set(...(part.rotation ?? [0, 0, 0])));
      matrix.compose(position, quaternion, scale);
      mesh.setMatrixAt(index, matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [items]);

  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, items.length]}
      castShadow={castShadow}
      receiveShadow
    >
      {shape === "box" && <boxGeometry args={[1, 1, 1]} />}
      {shape === "cylinder" && <cylinderGeometry args={[1, 1, 1, 10]} />}
      {shape === "sphere" && <sphereGeometry args={[1, 10, 6]} />}
      {shape === "eye" && <torusGeometry args={[0.085, 0.021, 6, 12]} />}
      {shape === "cloud" && (
        <sphereGeometry args={[1, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      )}
      {unlit ? (
        <meshBasicMaterial color={color} toneMapped={false} />
      ) : (
        <meshStandardMaterial
          color={color}
          roughness={roughness}
          metalness={metalness}
        />
      )}
    </instancedMesh>
  );
});

function Batch({ parts }: { parts: Collection }) {
  return Object.entries(parts)
    .filter(([, items]) => items.length > 0)
    .map(([color, items]) => <Parts key={color} color={color} items={items} />);
}

const tower = (() => {
  const orange: Part[] = [];
  const dark: Part[] = [];
  const ladder: Part[] = [];
  const bolts: Part[] = [];
  const corners: Point[] = [
    [-0.34, 0, -0.34],
    [0.34, 0, -0.34],
    [0.34, 0, 0.34],
    [-0.34, 0, 0.34],
  ];
  corners.forEach(([x, , z]) => {
    orange.push(box([x, 4.75, z], [0.11, 8.7, 0.11]));
    dark.push(box([x, 0.4, z], [0.31, 0.12, 0.31]));
    dark.push(beam([x, 0.42, z], [x * 1.8, 0.25, z * 1.8], 0.14));
  });

  for (let bay = 0; bay < 11; bay++) {
    const low = 0.44 + bay * 0.78;
    const high = low + 0.78;
    for (let side = 0; side < 4; side++) {
      const a = corners[side];
      const b = corners[(side + 1) % 4];
      orange.push(beam([a[0], low, a[2]], [b[0], low, b[2]], 0.065));
      orange.push(beam([a[0], low, a[2]], [b[0], high, b[2]], 0.048));
      orange.push(beam([b[0], low, b[2]], [a[0], high, a[2]], 0.048));
      bolts.push(box([a[0], low, a[2]], [0.145, 0.12, 0.145]));
    }
  }
  ladder.push(box([0.11, 4.64, -0.435], [0.025, 8.45, 0.025]));
  ladder.push(box([-0.11, 4.64, -0.435], [0.025, 8.45, 0.025]));
  for (let rung = 0; rung < 38; rung++) {
    ladder.push(box([0, 0.5 + rung * 0.225, -0.435], [0.24, 0.026, 0.026]));
  }
  orange.push(box([0, 8.98, 0], [1.26, 0.12, 1.1]));
  for (const x of [-0.6, 0.6]) {
    for (const z of [-0.5, 0.5]) {
      orange.push(box([x, 9.22, z], [0.04, 0.4, 0.04]));
    }
    orange.push(box([x, 9.4, 0], [0.035, 0.035, 1.02]));
  }
  orange.push(box([0, 9.4, -0.5], [1.2, 0.035, 0.035]));

  return { orange, dark, ladder, bolts };
})();

export const CraneTower = memo(function CraneTower() {
  return (
    <group>
      <Parts color={CONCRETE} items={[box([0, 0.14, 0], [1.7, 0.28, 1.6])]} />
      <Parts color={ORANGE} items={tower.orange} />
      <Parts color={GRAPHITE} items={tower.dark} />
      <Parts color={STEEL} items={tower.ladder} />
      <Parts color={ORANGE_DARK} items={tower.bolts} />
    </group>
  );
});

const boom = (() => {
  const orange: Part[] = [];
  const dark: Part[] = [];
  const wire: Part[] = [];
  const cabin: Part[] = [];
  const glass: Part[] = [];
  const weights: Part[] = [];

  for (const z of [-0.28, 0.28]) {
    orange.push(box([4.2, 0.025, z], [8.4, 0.09, 0.085]));
    dark.push(box([4.2, -0.035, z], [8.4, 0.025, 0.105]));
  }
  orange.push(box([4.2, 0.58, 0], [8.4, 0.075, 0.075]));
  for (let panel = 0; panel < 12; panel++) {
    const x = panel * 0.7;
    for (const z of [-0.28, 0.28]) {
      orange.push(beam([x, 0.02, z], [x + 0.35, 0.58, 0], 0.046));
      orange.push(beam([x + 0.35, 0.58, 0], [x + 0.7, 0.02, z], 0.046));
    }
    orange.push(box([x, 0.02, 0], [0.05, 0.05, 0.56]));
    orange.push(beam([x, 0.02, -0.28], [x + 0.7, 0.02, 0.28], 0.03));
  }

  orange.push(box([-1.3, 0.1, 0], [2.6, 0.12, 0.85]));
  for (const z of [-0.4, 0.4]) {
    orange.push(box([-1.3, 0.56, z], [2.6, 0.07, 0.07]));
    for (let panel = 0; panel < 4; panel++) {
      const x = -panel * 0.65;
      orange.push(beam([x, 0.1, z], [x - 0.65, 0.56, z], 0.06));
      orange.push(box([x, 0.32, z], [0.055, 0.48, 0.055]));
    }
  }
  for (let slab = 0; slab < 4; slab++) {
    weights.push(box([-2.29 + slab * 0.16, 0.03, 0], [0.14, 0.94, 0.95]));
  }
  dark.push(box([-1.15, 0.4, 0], [0.75, 0.5, 0.56]));
  orange.push(box([-1.15, 0.69, 0], [0.83, 0.08, 0.66]));
  // A-frame and tension stays remain attached as the whole jib slews.
  for (const z of [-0.25, 0.25]) {
    orange.push(beam([-0.43, 0.17, z], [0, 2.14, 0], 0.075));
    orange.push(beam([0.43, 0.17, z], [0, 2.14, 0], 0.075));
    wire.push(beam([0, 2.1, 0], [6.65, 0.59, z * 0.2], 0.025));
    wire.push(beam([0, 2.1, 0], [-2.57, 0.56, z], 0.032));
  }
  for (let rung = 0; rung < 4; rung++) {
    orange.push(
      box([0, 0.44 + rung * 0.4, 0], [0.65 - rung * 0.13, 0.045, 0.045]),
    );
  }

  cabin.push(box([0.2, -0.55, 0.59], [0.84, 0.87, 0.68]));
  cabin.push(box([0.2, -0.06, 0.59], [0.97, 0.105, 0.82]));
  glass.push(box([0.2, -0.4, 0.938], [0.68, 0.49, 0.014]));
  glass.push(box([0.628, -0.4, 0.59], [0.014, 0.49, 0.53]));
  glass.push(box([-0.228, -0.4, 0.59], [0.014, 0.49, 0.53]));
  cabin.push(box([0.18, -0.4, 0.953], [0.04, 0.51, 0.027]));
  dark.push(box([0.2, -1.03, 0.7], [0.88, 0.06, 0.95]));
  dark.push(box([0.66, -0.63, 0.78], [0.045, 0.055, 0.17]));

  return { orange, dark, wire, cabin, glass, weights };
})();

export const CraneBoom = memo(function CraneBoom() {
  return (
    <group>
      <Parts color={ORANGE} items={boom.orange} />
      <Parts color={GRAPHITE} items={boom.dark} />
      <Parts color={ORANGE_DARK} items={boom.wire} />
      <Parts color={ORANGE_LIGHT} items={boom.cabin} />
      <Parts
        color="#3c5355"
        items={boom.glass}
        roughness={0.23}
        metalness={0.3}
      />
      <Parts color={CONCRETE} items={boom.weights} />
      <Parts
        color={GRAPHITE}
        shape="cylinder"
        items={[box([0, 0.025, 0], [0.53, 0.18, 0.53])]}
      />
      <Parts
        color={ORANGE_LIGHT}
        shape="cylinder"
        items={[
          box([8.31, 0.16, 0], [0.135, 0.31, 0.135], [Math.PI / 2, 0, 0]),
        ]}
      />
    </group>
  );
});

const trolleyWheels = [-0.19, 0.19].flatMap((x) =>
  [-0.3, 0.3].map((z) =>
    box([x, 0.015, z], [0.105, 0.095, 0.105], [Math.PI / 2, 0, 0]),
  ),
);

export const CraneTrolley = memo(function CraneTrolley() {
  return (
    <group>
      <Parts
        color={ORANGE_DARK}
        items={[
          box([0, -0.07, 0], [0.59, 0.19, 0.69]),
          box([0, -0.22, 0], [0.32, 0.12, 0.28]),
        ]}
      />
      <Parts color={GRAPHITE} shape="cylinder" items={trolleyWheels} />
      <Parts
        color={STEEL}
        shape="cylinder"
        items={[box([0, -0.23, 0], [0.105, 0.37, 0.105], [Math.PI / 2, 0, 0])]}
      />
    </group>
  );
});

export const CraneHook = memo(function CraneHook() {
  return (
    <group>
      <Parts
        color={ORANGE_LIGHT}
        items={[
          box([0, -0.155, -0.105], [0.35, 0.31, 0.065]),
          box([0, -0.155, 0.105], [0.35, 0.31, 0.065]),
        ]}
      />
      <Parts
        color={GRAPHITE}
        shape="cylinder"
        items={[
          box([0, -0.145, 0], [0.115, 0.25, 0.115], [Math.PI / 2, 0, 0]),
          box([0, -0.35, 0], [0.045, 0.17, 0.045]),
        ]}
      />
      <Parts
        color={ORANGE_DARK}
        items={[-0.09, 0.09].map((x) =>
          box([x, -0.155, 0.143], [0.045, 0.28, 0.013], [0, 0, -0.24]),
        )}
      />
      <mesh
        position={[0.045, -0.48, 0]}
        rotation={[0, 0, Math.PI * 0.45]}
        castShadow
      >
        <torusGeometry args={[0.12, 0.043, 8, 14, Math.PI * 1.55]} />
        <meshStandardMaterial
          color={GRAPHITE}
          roughness={0.4}
          metalness={0.65}
        />
      </mesh>
    </group>
  );
});

function prefabDetails(piece: ConstructionPiece) {
  const [width, height, depth] = piece.size;
  const cap = piece.kind === "t-cap";
  const panels: Part[] = [];
  const bolts: Part[] = [];
  const accents: Part[] = [];
  const sockets: Part[] = [];
  const eyes = liftingEyes(piece);
  const columns = cap ? 2 : 1;
  const rows = Math.max(1, Math.ceil(height / 1.15));
  const panelWidth = width / columns;
  const panelHeight = height / rows;

  for (let column = 0; column < columns; column++) {
    const x = -width / 2 + (column + 0.5) * panelWidth;
    for (let row = 0; row < rows; row++) {
      const y = -height / 2 + (row + 0.5) * panelHeight;
      for (const side of [1]) {
        panels.push(
          box(
            [x, y, side * (depth / 2 + 0.006)],
            [panelWidth - 0.004, panelHeight - 0.006, 0.012],
          ),
        );
        for (const dx of [-1, 1]) {
          for (const dy of [-1, 1]) {
            bolts.push(
              box(
                [
                  x + dx * (panelWidth / 2 - 0.055),
                  y + dy * (panelHeight / 2 - 0.07),
                  side * (depth / 2 + 0.017),
                ],
                [0.01, 0.008, 0.01],
                [Math.PI / 2, 0, 0],
              ),
            );
          }
        }
      }
    }
  }
  if (piece.kind === "t-column") {
    // The pale face and deep orange returns give the letters the substantial
    // architectural extrusion of the reference, without flattening the mesh.
    for (const side of [-1, 1]) {
      for (let row = 0; row < rows; row++) {
        accents.push(
          box(
            [
              side * (width / 2 + 0.006),
              -height / 2 + (row + 0.5) * panelHeight,
              0,
            ],
            [0.012, panelHeight - 0.012, depth - 0.02],
          ),
        );
      }
    }
  }
  if (piece.accent === "orange-top") {
    accents.push(
      box([0, height / 2 + 0.006, 0], [width - 0.014, 0.012, depth - 0.014]),
    );
  }
  eyes.forEach(([x, , z]) => {
    sockets.push(box([x, height / 2 + 0.012, z], [0.136, 0.024, 0.104]));
  });

  return {
    body: [box([0, 0, 0], [...piece.size])],
    bodyColor: ORANGE,
    panelColor: "#f2e7d8",
    boltColor: "#cbbba6",
    accents,
    panels,
    bolts,
    sockets,
    eyes: eyes.map((position) => box(position, [0.64, 0.64, 0.64])),
  };
}

/** All geometry is piece-local, including its removable lifting hardware. */
export const ConstructionPieceModel = memo(function ConstructionPieceModel({
  piece,
}: {
  piece: ConstructionPiece;
}) {
  const geometry = useMemo(() => prefabDetails(piece), [piece]);

  return (
    <group>
      <Parts color={geometry.bodyColor} items={geometry.body} />
      <Parts color={geometry.panelColor} items={geometry.panels} />
      {geometry.accents.length > 0 && (
        <Parts color={ORANGE} items={geometry.accents} />
      )}
      <Parts
        color={geometry.boltColor}
        items={geometry.bolts}
        shape="cylinder"
        metalness={0.5}
        roughness={0.5}
      />
      <group name="lifting-eyes">
        <Parts color={STEEL} items={geometry.sockets} metalness={0.6} />
        <Parts
          color={STEEL}
          shape="eye"
          items={geometry.eyes}
          metalness={0.6}
        />
      </group>
    </group>
  );
});

const site = (() => {
  const parts: Collection = {
    [CONCRETE]: [],
    [GRAPHITE]: [],
    [STEEL]: [],
    [ORANGE]: [],
    [ORANGE_LIGHT]: [],
    [WOOD]: [],
    "#bcb8a9": [],
  };
  const dark = parts[GRAPHITE];
  const steel = parts[STEEL];
  const orange = parts[ORANGE];
  const timber = parts[WOOD];
  const pallets: Part[] = [];
  const workerLimbs: Part[] = [];
  const skin: Part[] = [];
  const hats: Part[] = [];
  const wheels: Part[] = [];
  const tBase = CONSTRUCTION_PIECES[0];
  const pBase = CONSTRUCTION_PIECES[1];
  const scaffoldLeft = tBase.placement[0] - tBase.size[0] / 2 - 0.71;
  const scaffoldRight = -0.12;
  const scaffoldCenter = (scaffoldLeft + scaffoldRight) / 2;
  const scaffoldWidth = scaffoldRight - scaffoldLeft;

  dark.push(box([-0.55, 0.105, 0.6], [7.6, 0.21, 4.9]));
  steel.push(box([-0.55, 0.018, 0.6], [7.78, 0.036, 5.08]));
  // A slightly lower front apron gives every staged component real support.
  dark.push(box([-0.55, 0.09, 3.745], [9.1, 0.18, 1.39]));
  steel.push(box([-0.55, 0.016, 3.745], [9.26, 0.032, 1.55]));
  // Narrow expansion joints give the site slab a scale without using textures.
  for (const x of [-3, -1.2, 0.6, 2.4]) {
    steel.push(box([x, 0.214, 0.6], [0.01, 0.005, 4.8]));
  }
  for (const z of [-0.65, 0.85, 2.35]) {
    steel.push(box([-0.55, 0.214, z], [7.52, 0.005, 0.01]));
  }
  for (const x of [-3.1, -1.05, 1.1]) {
    steel.push(box([x, 0.182, 3.745], [0.01, 0.004, 1.36]));
  }
  // Flush anchoring plates end at the first column's specified bottom face.
  dark.push(
    box(
      [tBase.placement[0], 0.205, tBase.placement[2]],
      [tBase.size[0] + 0.29, 0.03, 1.17],
    ),
  );
  steel.push(
    box(
      [pBase.placement[0], 0.205, pBase.placement[2]],
      [pBase.size[0] + 0.27, 0.03, 1.09],
    ),
  );

  // Scaffold stays open around the landing pad and the load's approach path.
  for (const x of [scaffoldLeft, scaffoldRight]) {
    for (const z of [-0.42, 1.12]) {
      steel.push(box([x, 2.37, z], [0.047, 4.3, 0.047]));
      steel.push(box([x, 0.245, z], [0.22, 0.055, 0.22]));
    }
  }
  for (const y of [0.48, 1.76, 3.05, 4.35]) {
    steel.push(
      box([scaffoldCenter, y, -0.42], [scaffoldWidth + 0.05, 0.048, 0.048]),
    );
    for (const x of [scaffoldLeft, scaffoldRight]) {
      steel.push(box([x, y, 0.35], [0.048, 0.048, 1.58]));
    }
    if (y < 3.1)
      steel.push(
        box([scaffoldCenter, y, 1.12], [scaffoldWidth + 0.05, 0.048, 0.048]),
      );
  }
  for (const y of [0.48, 1.76, 3.05]) {
    steel.push(
      beam([scaffoldLeft, y, -0.42], [scaffoldLeft, y + 1.29, 1.12], 0.032),
    );
    steel.push(
      beam([scaffoldLeft, y, 1.12], [scaffoldLeft, y + 1.29, -0.42], 0.032),
    );
    steel.push(
      beam([scaffoldLeft, y, -0.42], [scaffoldRight, y + 1.29, -0.42], 0.032),
    );
  }
  for (const y of [1.7, 3.0]) {
    timber.push(
      box([scaffoldCenter, y, 1.18], [scaffoldWidth + 0.21, 0.07, 0.3]),
    );
    timber.push(box([scaffoldLeft + 0.07, y, 0.35], [0.31, 0.07, 1.55]));
  }
  for (let step = 0; step < 11; step++) {
    steel.push(
      box([0.14, 0.27 + step * 0.143, 2.18 - step * 0.1], [0.42, 0.045, 0.145]),
    );
  }
  for (const x of [-0.08, 0.36]) {
    steel.push(beam([x, 0.24, 2.26], [x, 1.78, 1.15], 0.045));
    steel.push(beam([x, 0.89, 2.26], [x, 2.41, 1.15], 0.032));
    steel.push(box([x, 0.57, 2.26], [0.027, 0.67, 0.027]));
    steel.push(box([x, 2.08, 1.15], [0.027, 0.68, 0.027]));
  }

  // Pallet tops match the shared pickup plane, including the lower front apron.
  CONSTRUCTION_PIECES.forEach((piece) => {
    const [x, , z] = piece.pickup;
    const width = piece.size[0] + 0.09;
    const depth = piece.size[2] + 0.08;
    const floor = z > 3.05 ? 0.18 : 0.21;
    const deckThickness = 0.055;
    const bearerTop = PICKUP_SURFACE_HEIGHT - deckThickness;
    const bearerHeight = bearerTop - floor;
    for (const side of [-1, 1]) {
      pallets.push(
        box(
          [x, floor + bearerHeight / 2, z + side * depth * 0.32],
          [width, bearerHeight, 0.095],
        ),
      );
    }
    const planks = Math.max(3, Math.ceil(width / 0.32));
    const pitch = width / planks;
    for (let plank = 0; plank < planks; plank++) {
      pallets.push(
        box(
          [
            x - width / 2 + (plank + 0.5) * pitch,
            PICKUP_SURFACE_HEIGHT - deckThickness / 2,
            z,
          ],
          [pitch - 0.022, deckThickness, depth],
        ),
      );
    }
  });
  for (let beamIndex = 0; beamIndex < 5; beamIndex++) {
    dark.push(
      box(
        [
          1.38,
          0.29 + (beamIndex % 2) * 0.12,
          2.43 + Math.floor(beamIndex / 2) * 0.18,
        ],
        [1.55, 0.105, 0.12],
      ),
    );
  }
  for (const x of [0.88, 1.89]) {
    timber.push(box([x, 0.24, 2.57], [0.14, 0.06, 0.7]));
  }
  for (const [x, z] of [
    [2.65, 1.68],
    [-2.7, -1.4],
  ]) {
    timber.push(box([x, 0.47, z], [0.54, 0.48, 0.55]));
    for (const dx of [-0.2, 0.2]) {
      parts["#bcb8a9"].push(
        box([x + dx, 0.47, z + 0.28], [0.045, 0.48, 0.025]),
      );
    }
  }

  // A small site power unit, with vent slats and a towing handle.
  orange.push(box([2.62, 0.58, 2.72], [0.77, 0.5, 0.47]));
  dark.push(box([2.62, 0.87, 2.72], [0.83, 0.065, 0.54]));
  steel.push(beam([2.99, 0.49, 2.72], [3.38, 0.32, 2.72], 0.05));
  for (const x of [2.37, 2.87]) {
    for (const z of [2.45, 2.99]) {
      wheels.push(box([x, 0.34, z], [0.135, 0.1, 0.135], [Math.PI / 2, 0, 0]));
    }
  }
  for (let vent = 0; vent < 6; vent++) {
    dark.push(box([2.41 + vent * 0.069, 0.6, 2.961], [0.019, 0.26, 0.012]));
  }

  function worker(x: number, y: number, z: number, turn: number) {
    const footSpread = 0.06;
    for (const side of [-1, 1]) {
      workerLimbs.push(
        beam(
          [x + side * 0.045, y + 0.24, z],
          [x + side * footSpread, y + 0.045, z],
          0.031,
        ),
      );
      dark.push(
        box(
          [x + side * footSpread, y + 0.021, z + 0.025],
          [0.072, 0.042, 0.125],
        ),
      );
    }
    workerLimbs.push(box([x, y + 0.327, z], [0.077, 0.215, 0.048]));
    workerLimbs.push(
      beam([x - 0.079, y + 0.395, z], [x - 0.135, y + 0.235, z + 0.04], 0.024),
    );
    workerLimbs.push(
      beam(
        [x + 0.079, y + 0.395, z],
        [x + 0.18, y + 0.33 + turn, z + 0.04],
        0.024,
      ),
    );
    skin.push(box([x - 0.135, y + 0.228, z + 0.04], [0.025, 0.03, 0.024]));
    skin.push(box([x + 0.18, y + 0.33 + turn, z + 0.04], [0.025, 0.03, 0.024]));
    skin.push(box([x, y + 0.475, z], [0.051, 0.062, 0.045]));
    hats.push(box([x, y + 0.525, z], [0.075, 0.05, 0.071]));
    orange.push(box([x, y + 0.523, z + 0.013], [0.162, 0.016, 0.14]));
  }
  worker(-2.6, 0.22, 1.95, 0.1);
  worker(-1.91, 1.75, 1.18, -0.07);
  worker(1.75, 0.22, 1.39, 0.1);
  worker(-0.8, 0.22, 2.7, 0.08);
  worker(-6.6, -0.6, 1.3, 0.1);
  worker(6.8, 2.5, -0.3, 0.08);

  // Loose anchor plates and rebar at the edge of the work area.
  for (const x of [0.52, 0.65, 0.78]) {
    steel.push(box([x, 0.68, -1.08], [0.025, 0.91, 0.025]));
    steel.push(box([x, 0.68, -1.28], [0.025, 0.91, 0.025]));
  }
  for (const y of [0.39, 0.61, 0.82]) {
    steel.push(box([0.65, y, -1.08], [0.32, 0.022, 0.022]));
    steel.push(box([0.65, y, -1.28], [0.32, 0.022, 0.022]));
  }
  return { parts, pallets, workerLimbs, skin, hats, wheels };
})();

const neighborhood = (() => {
  const parts: Collection = {
    "#303532": [],
    "#414743": [],
    "#59615a": [],
    [ORANGE]: [],
    [ORANGE_DARK]: [],
    [CONCRETE]: [],
  };
  const dark = parts["#303532"];
  const panels = parts["#414743"];
  const steel = parts["#59615a"];
  const orange = parts[ORANGE];
  const orangeDark = parts[ORANGE_DARK];

  function building(
    x: number,
    bottom: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    orangeSide = false,
  ) {
    dark.push(box([x, bottom + height / 2, z], [width, height, depth]));
    for (let y = bottom + 0.65; y < bottom + height; y += 0.65) {
      panels.push(box([x, y, z + depth / 2 + 0.008], [width, 0.012, 0.012]));
      panels.push(box([x - width / 2 - 0.008, y, z], [0.012, 0.012, depth]));
    }
    for (let column = 0.6; column < width; column += 0.6) {
      panels.push(
        box(
          [x - width / 2 + column, bottom + height / 2, z + depth / 2 + 0.008],
          [0.012, height, 0.012],
        ),
      );
    }
    if (orangeSide) {
      orange.push(
        box(
          [x + width / 2 + 0.006, bottom + height / 2, z],
          [0.012, height, depth],
        ),
      );
    }
  }

  function scaffold(
    x: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    bottom: number,
  ) {
    for (const dx of [-width / 2, width / 2]) {
      for (const dz of [-depth / 2, depth / 2]) {
        steel.push(
          box([x + dx, bottom + height / 2, z + dz], [0.055, height, 0.055]),
        );
      }
    }
    const bays = Math.ceil(height / 1.0);
    for (let bay = 0; bay <= bays; bay++) {
      const y = bottom + (bay / bays) * height;
      for (const dz of [-depth / 2, depth / 2]) {
        steel.push(box([x, y, z + dz], [width, 0.05, 0.05]));
      }
      for (const dx of [-width / 2, width / 2]) {
        steel.push(box([x + dx, y, z], [0.05, 0.05, depth]));
      }
      if (bay < bays) {
        const next = bottom + ((bay + 1) / bays) * height;
        steel.push(
          beam(
            [x - width / 2, y, z + depth / 2],
            [x + width / 2, next, z + depth / 2],
            0.035,
          ),
        );
        steel.push(
          beam(
            [x + width / 2, y, z + depth / 2],
            [x - width / 2, next, z + depth / 2],
            0.035,
          ),
        );
        steel.push(
          beam(
            [x - width / 2, y, z - depth / 2],
            [x - width / 2, next, z + depth / 2],
            0.035,
          ),
        );
      }
    }
  }

  // The assembly floor is the roof of a real building, not a floating plinth.
  building(-0.55, -2.3, 0.6, 7.6, 2.3, 4.9, true);
  dark.push(box([0, -2.375, 1.1], [24, 0.15, 9]));
  building(3.8, -2.3, -0.8, 1.7, 2.3, 1.6);
  for (const x of [-4.85, -2.7, -0.55, 1.6, 3.75]) {
    steel.push(box([x, -1.075, 4.27], [0.105, 2.45, 0.105]));
  }
  dark.push(box([-0.55, -0.035, 4.28], [9.1, 0.24, 0.22]));
  for (const x of [-3.775, -1.625, 0.525, 2.675]) {
    steel.push(beam([x - 1.075, -2.25, 4.27], [x + 1.075, -0.15, 4.27], 0.055));
  }
  scaffold(-0.55, 3.1, 7.85, 2.4, 0.28, -2.3);

  // Stepped foreground rooflines carry the scene beyond the hero's edges.
  building(-6.5, -2.3, 1.2, 2.5, 1.7, 2.0);
  building(-7.35, -2.3, 1.7, 1.0, 1.2, 1.5);
  building(-9.0, -2.3, 2.6, 1.15, 0.58, 1.2);
  building(-4.7, -2.3, -0.1, 1.2, 1.05, 1.25, true);
  scaffold(-6.05, 0.6, 1.02, 2.0, 0.7, -0.6);
  for (const x of [-7.62, -6.72, -5.78, -5.31]) {
    steel.push(box([x, -0.36, 2.22], [0.035, 0.5, 0.035]));
  }
  steel.push(box([-6.5, -0.12, 2.22], [2.35, 0.035, 0.035]));

  building(7, -2.4, 0, 2.8, 4.2, 2.5);
  building(7, 1.8, -0.3, 1.65, 0.7, 1.6);
  building(9.1, -2.3, -0.3, 1.5, 2.9, 2.2);
  building(4.85, -2.3, 2.0, 1.2, 1.75, 1.25, true);
  scaffold(8.35, -0.45, 0.7, 4.7, 0.7, -2.3);
  orange.push(box([4.1, -1.45, 3.9], [1.1, 1.7, 1.1]));
  orangeDark.push(box([4.1, -1.45, 4.458], [1.08, 0.015, 0.015]));
  for (const x of [-2.9, 0.1, 5.2, 6.15, 8.2]) {
    orange.push(box([x, -1.95, 4.5], [0.65, 0.7, 0.64]));
  }

  // A second working crane gives the distant construction a believable scale.
  const mastX = -6;
  const mastZ = -2.8;
  for (const dx of [-0.13, 0.13]) {
    for (const dz of [-0.13, 0.13]) {
      orange.push(box([mastX + dx, 0.1, mastZ + dz], [0.048, 4.8, 0.048]));
    }
  }
  for (let bay = 0; bay < 9; bay++) {
    const low = -2.3 + bay * (4.8 / 9);
    const high = low + 4.8 / 9;
    for (const dz of [-0.13, 0.13]) {
      orange.push(box([mastX, low, mastZ + dz], [0.3, 0.035, 0.035]));
      orange.push(
        beam(
          [mastX - 0.13, low, mastZ + dz],
          [mastX + 0.13, high, mastZ + dz],
          0.027,
        ),
      );
    }
    for (const dx of [-0.13, 0.13]) {
      orange.push(
        beam(
          [mastX + dx, low, mastZ - 0.13],
          [mastX + dx, high, mastZ + 0.13],
          0.027,
        ),
      );
    }
  }
  for (const dz of [-0.13, 0.13]) {
    orange.push(box([-4.89, 2.52, mastZ + dz], [4.32, 0.045, 0.045]));
  }
  orange.push(box([-4.89, 2.78, mastZ], [4.32, 0.035, 0.035]));
  for (let panel = 0; panel < 12; panel++) {
    const x = -7.05 + panel * 0.36;
    for (const dz of [-0.13, 0.13]) {
      orange.push(beam([x, 2.52, mastZ + dz], [x + 0.18, 2.78, mastZ], 0.026));
      orange.push(
        beam([x + 0.18, 2.78, mastZ], [x + 0.36, 2.52, mastZ + dz], 0.026),
      );
    }
  }
  orange.push(beam([-6.2, 2.5, mastZ], [mastX, 3.3, mastZ], 0.045));
  orange.push(beam([-5.8, 2.5, mastZ], [mastX, 3.3, mastZ], 0.045));
  orangeDark.push(beam([mastX, 3.3, mastZ], [-2.73, 2.78, mastZ], 0.019));
  orangeDark.push(beam([mastX, 3.3, mastZ], [-7.05, 2.78, mastZ], 0.019));
  orange.push(box([-6, 2.19, -2.54], [0.34, 0.47, 0.35]));
  panels.push(box([-6, 2.25, -2.358], [0.26, 0.24, 0.012]));
  orange.push(box([-6.86, 2.36, mastZ], [0.35, 0.55, 0.4]));
  steel.push(box([-3.67, 1.91, mastZ], [0.019, 1.23, 0.019]));
  orange.push(box([-3.67, 1.25, mastZ], [0.12, 0.16, 0.1]));
  parts[CONCRETE].push(box([-3.67, 0.9, mastZ], [0.59, 0.44, 0.5]));
  for (const dx of [-0.24, 0.24]) {
    steel.push(beam([-3.67, 1.16, mastZ], [-3.67 + dx, 1.12, mastZ], 0.018));
  }

  return parts;
})();

export const BuildingSite = memo(function BuildingSite({
  overview = false,
}: {
  overview?: boolean;
}) {
  return (
    <group>
      <Batch parts={neighborhood} />
      <Batch parts={site.parts} />
      {!overview && <Parts color={WOOD} items={site.pallets} />}
      <Parts color={GRAPHITE} items={site.workerLimbs} shape="cylinder" />
      <Parts color="#b5815d" items={site.skin} shape="sphere" />
      <Parts color={ORANGE_LIGHT} items={site.hats} shape="cloud" />
      <Parts color={GRAPHITE} items={site.wheels} shape="cylinder" />
    </group>
  );
});

const city = (() => {
  const colors = [
    "#f3dfce",
    "#efd6c1",
    "#f4e4d7",
    "#edcfb8",
    "#edbda0",
    "#f1c8aa",
    "#e7b193",
    "#f8eee4",
  ];
  const parts: Collection = Object.fromEntries(
    colors.map((color) => [color, []]),
  );
  const crowns: Part[] = [];
  const base = -2.3;

  for (const layer of [0, 1]) {
    const count = layer === 0 ? 33 : 28;
    for (let index = 0; index < count; index++) {
      const x = -15 + index * (layer === 0 ? 0.94 : 1.09);
      const leftRise = Math.min(1, Math.max(0.025, (x + 14) / 8));
      const height =
        leftRise *
        (layer === 0
          ? 1.9 + ((index * 7 + 3) % 14) * 0.22
          : 1.4 + ((index * 5 + 1) % 10) * 0.25);
      const width = 0.59 + ((index * 3) % 5) * 0.14;
      const depth = 0.75 + (index % 3) * 0.21;
      const z =
        layer === 0 ? -7.2 - (index % 4) * 0.65 : -5.3 - (index % 3) * 0.51;
      const color =
        x < -6 ? colors[7] : colors[layer === 0 ? index % 4 : 4 + (index % 3)];
      parts[color].push(box([x, base + height / 2, z], [width, height, depth]));
      if (index % 3 !== 0 && x > -10) {
        parts[color].push(
          box([x, base + height + 0.19, z], [width * 0.62, 0.38, depth * 0.75]),
        );
        if (index % 2 === 0) {
          parts[color].push(
            box(
              [x, base + height + 0.43, z],
              [width * 0.34, 0.16, depth * 0.45],
            ),
          );
          crowns.push(box([x, base + height + 0.76, z], [0.022, 0.59, 0.022]));
        }
      }
      if (index % 4 === 0) {
        parts[color].push(
          box(
            [x + width * 0.47, base + height * 0.28, z + 0.35],
            [width * 0.48, height * 0.56, depth * 0.9],
          ),
        );
      }
      if (index % 5 === 0) {
        parts[color].push(
          box(
            [x - width * 0.46, base + height * 0.38, z + 0.12],
            [width * 0.25, height * 0.76, depth * 0.72],
          ),
        );
      }
    }
  }
  return { parts, crowns };
})();

const atmosphere = (() => {
  const clouds: Part[] = [];
  const birds: Part[] = [];
  const drone: Part[] = [];
  const rotors: Part[] = [];
  for (const [x, y, z, scale] of [
    [-9, 3.3, -3, 0.7],
    [12, 4.1, -5, 1.05],
  ]) {
    clouds.push(box([x, y, z], [scale * 0.7, scale * 0.42, 0.13]));
    clouds.push(
      box([x - scale * 0.66, y, z], [scale * 0.46, scale * 0.25, 0.13]),
    );
    clouds.push(
      box([x + scale * 0.72, y, z], [scale * 0.5, scale * 0.29, 0.13]),
    );
  }
  for (const [x, y, z, scale] of [
    [-5, 3.1, -2, 1],
    [-4.72, 3.02, -2.2, 0.6],
  ]) {
    birds.push(
      beam([x - 0.1 * scale, y + 0.05 * scale, z], [x, y, z], 0.015 * scale),
    );
    birds.push(
      beam([x, y, z], [x + 0.1 * scale, y + 0.04 * scale, z], 0.015 * scale),
    );
  }
  const droneOrigin: Point = [6.1, 4.1, 0.6];
  const [x, y, z] = droneOrigin;
  drone.push(box([x, y, z], [0.25, 0.095, 0.16]));
  drone.push(box([x, y - 0.11, z + 0.045], [0.07, 0.08, 0.07]));
  for (const dx of [-0.25, 0.25]) {
    for (const dz of [-0.18, 0.18]) {
      drone.push(beam([x, y, z], [x + dx, y + 0.025, z + dz], 0.026));
      drone.push(box([x + dx, y + 0.045, z + dz], [0.045, 0.045, 0.045]));
      rotors.push(box([x + dx, y + 0.075, z + dz], [0.17, 0.007, 0.035]));
    }
  }
  for (const dx of [-0.12, 0.12]) {
    drone.push(beam([x + dx, y - 0.025, z], [x + dx, y - 0.17, z], 0.014));
    drone.push(box([x + dx, y - 0.17, z], [0.015, 0.015, 0.2]));
  }
  return { clouds, birds, drone, rotors };
})();

export const CityBackdrop = memo(function CityBackdrop() {
  return (
    <group>
      {Object.entries(city.parts).map(([color, items]) => (
        <Parts
          key={color}
          color={color}
          items={items}
          castShadow={false}
          roughness={1}
          metalness={0}
        />
      ))}
      <Parts color="#ecd5c1" items={city.crowns} castShadow={false} />
      <Parts
        color="#f9ddc6"
        items={atmosphere.clouds}
        shape="cloud"
        unlit
        castShadow={false}
        roughness={1}
        metalness={0}
      />
      <Parts color="#c2a38d" items={atmosphere.birds} castShadow={false} />
      <Parts color="#625f53" items={atmosphere.drone} castShadow={false} />
      <Parts
        color="#969389"
        items={atmosphere.rotors}
        shape="cylinder"
        castShadow={false}
      />
    </group>
  );
});
