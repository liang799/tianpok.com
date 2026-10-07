"use client";

import { memo, useLayoutEffect, useRef } from "react";
import type {} from "@react-three/fiber";
import { Euler, InstancedMesh, Matrix4, Quaternion, Vector3 } from "three";

type Point = [number, number, number];
type Part = {
  position: Point;
  scale: Point;
  rotation?: Point;
  quaternion?: [number, number, number, number];
};
type Shape = "box" | "cylinder" | "sphere" | "eye";
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
}: {
  items: Part[];
  color: string;
  shape?: Shape;
  roughness?: number;
  metalness?: number;
  castShadow?: boolean;
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
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
      />
    </instancedMesh>
  );
});

function Batch({ parts }: { parts: Collection }) {
  return Object.entries(parts).map(([color, items]) => (
    <Parts key={color} color={color} items={items} />
  ));
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

const loadPanels = [-1.05, -0.35, 0.35, 1.05].flatMap((x) =>
  [-0.531, 0.531].map((z) => box([x, 0, z], [0.678, 0.675, 0.014])),
);
const loadBolts = [-1.31, -0.69, -0.01, 0.69, 1.31].flatMap((x) =>
  [-0.25, 0.25].flatMap((y) =>
    [-0.546, 0.546].map((z) => box([x, y, z], [0.024, 0.024, 0.024])),
  ),
);
const loadEyes = [-1.1, 1.1].flatMap((x) =>
  [-0.36, 0.36].map((z) => box([x, 0.43, z], [1, 1, 1])),
);

export const ConstructionLoad = memo(function ConstructionLoad() {
  return (
    <group>
      <Parts color={ORANGE_DARK} items={[box([0, 0, 0], [2.8, 0.72, 1.05])]} />
      <Parts color={ORANGE} items={loadPanels} />
      <Parts
        color={ORANGE_LIGHT}
        items={[box([0, 0.365, 0], [2.79, 0.015, 1.04])]}
      />
      <Parts
        color={GRAPHITE}
        items={loadBolts}
        metalness={0.6}
        roughness={0.4}
      />
      <Parts color={STEEL} shape="eye" items={loadEyes} metalness={0.6} />
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
  const concrete = parts[CONCRETE];
  const dark = parts[GRAPHITE];
  const steel = parts[STEEL];
  const orange = parts[ORANGE];
  const timber = parts[WOOD];
  const bolts: Part[] = [];
  const skin: Part[] = [];
  const hats: Part[] = [];
  const wheels: Part[] = [];

  concrete.push(box([-0.6, 0.105, 0.6], [7.1, 0.21, 4.9]));
  parts["#bcb8a9"].push(box([-0.6, 0.018, 0.6], [7.28, 0.036, 5.08]));
  // Narrow expansion joints give the site slab a scale without using textures.
  for (const x of [-3, -1.2, 0.6, 2.4]) {
    parts["#bcb8a9"].push(box([x, 0.214, 0.6], [0.013, 0.005, 4.8]));
  }
  for (const z of [-0.65, 0.85, 2.35]) {
    parts["#bcb8a9"].push(box([-0.6, 0.214, z], [7.02, 0.005, 0.013]));
  }

  // The orange load completes the top of the T. Its landing height is 4.79.
  dark.push(box([-1.1, 2.505, 0.45], [0.86, 4.57, 0.88]));
  dark.push(box([-1.1, 0.35, 0.45], [1.15, 0.27, 1.17]));
  concrete.push(box([0.98, 2.16, 0.18], [0.7, 3.89, 0.85]));
  concrete.push(box([1.55, 4.06, 0.18], [1.84, 0.66, 0.85]));
  concrete.push(box([2.15, 3.28, 0.18], [0.66, 1.56, 0.85]));
  concrete.push(box([1.55, 2.55, 0.18], [1.84, 0.58, 0.85]));
  orange.push(box([0.98, 1.25, 0.622], [0.72, 2.06, 0.024]));
  orange.push(box([1.57, 4.397, 0.18], [1.82, 0.025, 0.84]));

  for (const height of [1.12, 2.12, 3.12, 4.12]) {
    steel.push(box([-1.1, height, 0.899], [0.86, 0.018, 0.012]));
    steel.push(box([-1.538, height, 0.45], [0.012, 0.018, 0.87]));
    for (const x of [-1.44, -0.77]) {
      bolts.push(box([x, height + 0.09, 0.916], [0.025, 0.025, 0.025]));
    }
  }
  for (const x of [0.7, 1.2, 1.87, 2.35]) {
    bolts.push(box([x, 4.09, 0.622], [0.04, 0.04, 0.025]));
  }

  // Scaffold stays open around the landing pad and the load's approach path.
  for (const x of [-2.24, -0.12]) {
    for (const z of [-0.42, 1.12]) {
      steel.push(box([x, 2.37, z], [0.047, 4.3, 0.047]));
      steel.push(box([x, 0.245, z], [0.22, 0.055, 0.22]));
    }
  }
  for (const y of [0.48, 1.76, 3.05, 4.35]) {
    steel.push(box([-1.18, y, -0.42], [2.17, 0.048, 0.048]));
    for (const x of [-2.24, -0.12]) {
      steel.push(box([x, y, 0.35], [0.048, 0.048, 1.58]));
    }
    if (y < 3.1) steel.push(box([-1.18, y, 1.12], [2.17, 0.048, 0.048]));
  }
  for (const y of [0.48, 1.76, 3.05]) {
    steel.push(beam([-2.24, y, -0.42], [-2.24, y + 1.29, 1.12], 0.032));
    steel.push(beam([-2.24, y, 1.12], [-2.24, y + 1.29, -0.42], 0.032));
    steel.push(beam([-2.24, y, -0.42], [-0.12, y + 1.29, -0.42], 0.032));
  }
  for (const y of [1.7, 3.0]) {
    timber.push(box([-1.18, y, 1.035], [2.33, 0.07, 0.42]));
    timber.push(box([-2.17, y, 0.35], [0.31, 0.07, 1.55]));
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

  // The pickup pallet is centered underneath the animation's ground position.
  for (const z of [2.08, 2.5, 2.92]) {
    timber.push(box([-3.4, 0.305, z], [2.66, 0.18, 0.11]));
  }
  for (let plank = 0; plank < 8; plank++) {
    timber.push(box([-4.55 + plank * 0.33, 0.442, 2.5], [0.25, 0.09, 1.12]));
  }
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
    [-2.9, -1.13],
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
    const footSpread = 0.055;
    dark.push(
      box([x - footSpread, y + 0.12, z], [0.067, 0.23, 0.085], [0, 0, -0.09]),
    );
    dark.push(
      box([x + footSpread, y + 0.12, z], [0.067, 0.23, 0.085], [0, 0, 0.09]),
    );
    dark.push(box([x - footSpread, y + 0.021, z + 0.025], [0.08, 0.045, 0.13]));
    dark.push(box([x + footSpread, y + 0.021, z + 0.025], [0.08, 0.045, 0.13]));
    orange.push(box([x, y + 0.32, z], [0.19, 0.22, 0.105]));
    parts[ORANGE_LIGHT].push(
      box([x - 0.045, y + 0.33, z + 0.057], [0.021, 0.19, 0.009]),
    );
    parts[ORANGE_LIGHT].push(
      box([x + 0.045, y + 0.33, z + 0.057], [0.021, 0.19, 0.009]),
    );
    dark.push(
      beam([x - 0.1, y + 0.39, z], [x - 0.15, y + 0.23, z + 0.04], 0.06),
    );
    dark.push(
      beam([x + 0.1, y + 0.39, z], [x + 0.2, y + 0.33 + turn, z + 0.04], 0.06),
    );
    skin.push(box([x, y + 0.475, z], [0.071, 0.079, 0.068]));
    hats.push(box([x, y + 0.54, z], [0.092, 0.062, 0.09]));
    orange.push(box([x, y + 0.508, z + 0.014], [0.2, 0.023, 0.18]));
  }
  worker(-2.78, 0.22, 0.21, 0.1);
  worker(-1.91, 1.75, 1.015, -0.07);
  worker(1.75, 0.22, 1.39, 0.1);

  // Loose anchor plates and rebar at the edge of the work area.
  for (const x of [0.52, 0.65, 0.78]) {
    steel.push(box([x, 0.68, -1.08], [0.025, 0.91, 0.025]));
    steel.push(box([x, 0.68, -1.28], [0.025, 0.91, 0.025]));
  }
  for (const y of [0.39, 0.61, 0.82]) {
    steel.push(box([0.65, y, -1.08], [0.32, 0.022, 0.022]));
    steel.push(box([0.65, y, -1.28], [0.32, 0.022, 0.022]));
  }
  return { parts, bolts, skin, hats, wheels };
})();

export const BuildingSite = memo(function BuildingSite() {
  return (
    <group>
      <Batch parts={site.parts} />
      <Parts color="#a8b0a8" items={site.bolts} shape="sphere" />
      <Parts color="#b5815d" items={site.skin} shape="sphere" />
      <Parts color={ORANGE_LIGHT} items={site.hats} shape="sphere" />
      <Parts color={GRAPHITE} items={site.wheels} shape="cylinder" />
    </group>
  );
});

const city = (() => {
  const colors = ["#eee4d5", "#eadbc8", "#f1dcc7", "#e4ddcf"];
  const parts: Collection = Object.fromEntries(
    colors.map((color) => [color, []]),
  );
  const crowns: Part[] = [];

  for (let index = 0; index < 22; index++) {
    const x = -11.5 + index * 1.05;
    const height = 1.8 + ((index * 7 + 3) % 13) * 0.39;
    const width = 0.55 + ((index * 3) % 4) * 0.16;
    const z = -7.8 - (index % 3) * 1.35;
    const color = colors[index % colors.length];
    parts[color].push(box([x, height / 2 - 0.08, z], [width, height, 0.85]));
    if (index % 3 !== 0) {
      parts[color].push(box([x, height + 0.19, z], [width * 0.57, 0.4, 0.65]));
      crowns.push(box([x, height + 0.61, z], [0.022, 0.57, 0.022]));
    }
    if (index % 4 === 0) {
      parts[color].push(
        box(
          [x + width * 0.42, height * 0.28, z + 0.38],
          [width * 0.47, height * 0.55, 0.8],
        ),
      );
    }
  }
  return { parts, crowns };
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
      <Parts color="#e2d9cb" items={city.crowns} castShadow={false} />
    </group>
  );
});
