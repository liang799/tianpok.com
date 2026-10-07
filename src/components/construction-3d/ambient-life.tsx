"use client";

import {
  createRef,
  memo,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useFrame } from "@react-three/fiber";
import {
  Euler,
  Group,
  InstancedMesh,
  Matrix4,
  Quaternion,
  Vector3,
} from "three";
import {
  sampleSiteLife,
  type SiteLifeWorkerPose,
} from "@/lib/site-life-motion";

type Point = [number, number, number];
export type SiteLifeFrame = {
  time: number;
  dronePosition: Point;
  workerPosition: Point;
  workerPose: [number, number];
  rotorAngle: number;
};

type WorkerRig = {
  root: Group;
  head: Group;
  limbs: InstancedMesh;
  boots: InstancedMesh;
  hands: InstancedMesh;
};

function scratchSpace() {
  return {
    matrix: new Matrix4(),
    position: new Vector3(),
    scale: new Vector3(),
    direction: new Vector3(),
    midpoint: new Vector3(),
    rotation: new Quaternion(),
    identity: new Quaternion(),
    start: new Vector3(),
    joint: new Vector3(),
    end: new Vector3(),
    euler: new Euler(),
  };
}
type Scratch = ReturnType<typeof scratchSpace>;
const up = new Vector3(0, 1, 0);
const neutral = sampleSiteLife(0);

function block(
  mesh: InstancedMesh,
  index: number,
  position: Point,
  scale: Point,
  scratch: Scratch,
) {
  scratch.matrix.compose(
    scratch.position.fromArray(position),
    scratch.identity,
    scratch.scale.fromArray(scale),
  );
  mesh.setMatrixAt(index, scratch.matrix);
}

function bone(
  mesh: InstancedMesh,
  index: number,
  start: Vector3,
  end: Vector3,
  radius: number,
  scratch: Scratch,
) {
  scratch.direction.subVectors(end, start);
  const length = scratch.direction.length();
  scratch.rotation.setFromUnitVectors(up, scratch.direction.normalize());
  scratch.midpoint.copy(start).add(end).multiplyScalar(0.5);
  scratch.matrix.compose(
    scratch.midpoint,
    scratch.rotation,
    scratch.scale.set(radius, length, radius),
  );
  mesh.setMatrixAt(index, scratch.matrix);
}

function placeWorker(
  rig: WorkerRig,
  pose: SiteLifeWorkerPose,
  scratch: Scratch,
) {
  const root = rig.root;
  const limbs = rig.limbs;
  const boots = rig.boots;
  const hands = rig.hands;
  if (!root || !limbs || !boots || !hands) return;
  root.position.fromArray(pose.position);
  root.rotation.y = pose.yaw;
  if (rig.head) rig.head.rotation.set(pose.headPitch, pose.headYaw, 0);
  block(limbs, 0, [0, 0.327, 0], [0.077, 0.215, 0.048], scratch);
  [pose.leftFoot, pose.rightFoot].forEach((foot, index) => {
    const side = index === 0 ? -1 : 1;
    scratch.start.set(side * 0.045, 0.24, 0);
    scratch.end.fromArray(foot);
    scratch.joint.copy(scratch.start).lerp(scratch.end, 0.53);
    scratch.joint.z += 0.018 + Math.max(0, foot[1] - 0.04) * 0.6;
    bone(limbs, 1 + index * 2, scratch.start, scratch.joint, 0.031, scratch);
    bone(limbs, 2 + index * 2, scratch.joint, scratch.end, 0.028, scratch);
    block(
      boots,
      index,
      [foot[0], foot[1] - 0.019, foot[2] + 0.025],
      [0.072, 0.042, 0.125],
      scratch,
    );
  });
  [pose.leftHand, pose.rightHand].forEach((hand, index) => {
    const side = index === 0 ? -1 : 1;
    scratch.start.set(side * 0.079, 0.395, 0);
    scratch.end.fromArray(hand);
    scratch.joint.copy(scratch.start).lerp(scratch.end, 0.52);
    scratch.joint.z += 0.025;
    bone(limbs, 5 + index * 2, scratch.start, scratch.joint, 0.024, scratch);
    bone(limbs, 6 + index * 2, scratch.joint, scratch.end, 0.022, scratch);
    block(hands, index, hand, [0.025, 0.03, 0.024], scratch);
  });
  limbs.instanceMatrix.needsUpdate = true;
  boots.instanceMatrix.needsUpdate = true;
  hands.instanceMatrix.needsUpdate = true;
}

const Worker = memo(function Worker({
  index,
  onReady,
}: {
  index: number;
  onReady: (index: number, rig: WorkerRig | null) => void;
}) {
  const root = useRef<Group>(null);
  const head = useRef<Group>(null);
  const limbs = useRef<InstancedMesh>(null);
  const boots = useRef<InstancedMesh>(null);
  const hands = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (
      !root.current ||
      !head.current ||
      !limbs.current ||
      !boots.current ||
      !hands.current
    )
      return;
    onReady(index, {
      root: root.current,
      head: head.current,
      limbs: limbs.current,
      boots: boots.current,
      hands: hands.current,
    });
    return () => onReady(index, null);
  }, [index, onReady]);
  return (
    <group
      ref={root}
      position={neutral.workers[index].position}
      name={`site-worker-${index}`}
    >
      <instancedMesh
        ref={limbs}
        args={[undefined, undefined, 9]}
        frustumCulled={false}
        castShadow
      >
        <cylinderGeometry args={[1, 1, 1, 8]} />
        <meshStandardMaterial color="#343b39" roughness={0.86} />
      </instancedMesh>
      <instancedMesh
        ref={boots}
        args={[undefined, undefined, 2]}
        frustumCulled={false}
        castShadow
      >
        <boxGeometry />
        <meshStandardMaterial color="#252c29" roughness={0.9} />
      </instancedMesh>
      <instancedMesh
        ref={hands}
        args={[undefined, undefined, 2]}
        frustumCulled={false}
      >
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial color="#b5815d" roughness={0.8} />
      </instancedMesh>
      <group ref={head} position={[0, 0.475, 0]}>
        <mesh scale={[0.051, 0.062, 0.045]} castShadow>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#b5815d" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.05, 0]} scale={[0.075, 0.05, 0.071]} castShadow>
          <sphereGeometry args={[1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#ff7947" roughness={0.65} />
        </mesh>
        <mesh
          position={[0, 0.048, 0.013]}
          scale={[0.162, 0.016, 0.14]}
          castShadow
        >
          <boxGeometry />
          <meshStandardMaterial color="#ed5728" roughness={0.65} />
        </mesh>
      </group>
    </group>
  );
});

const rotorLocations: Point[] = [
  [-0.25, 0.075, -0.18],
  [-0.25, 0.075, 0.18],
  [0.25, 0.075, -0.18],
  [0.25, 0.075, 0.18],
];

/** Receives frames from the canvas scheduler; it never runs a second clock. */
export function SiteLife({
  running,
  overview = false,
  onFrame,
}: {
  running: boolean;
  overview?: boolean;
  onFrame?: (frame: SiteLifeFrame) => void;
}) {
  const rigs = useRef<Array<WorkerRig | null>>([]);
  const register = useCallback((index: number, rig: WorkerRig | null) => {
    rigs.current[index] = rig;
  }, []);
  const rotors = useMemo(
    () => rotorLocations.map(() => createRef<Group>()),
    [],
  );
  const drone = useRef<Group>(null);
  const body = useRef<InstancedMesh>(null);
  const arms = useRef<InstancedMesh>(null);
  const scratch = useMemo(() => scratchSpace(), []);
  const elapsed = useRef(0);
  const wasRunning = useRef(false);
  const dirty = useRef(true);

  useLayoutEffect(() => {
    rigs.current.forEach((rig, index) => {
      if (rig) placeWorker(rig, neutral.workers[index], scratch);
    });
    if (body.current && arms.current) {
      block(body.current, 0, [0, 0, 0], [0.25, 0.095, 0.16], scratch);
      block(body.current, 1, [0, -0.11, 0.045], [0.07, 0.08, 0.07], scratch);
      rotorLocations.forEach(([x, , z], index) => {
        block(
          body.current!,
          index + 2,
          [x, 0.045, z],
          [0.045, 0.045, 0.045],
          scratch,
        );
        bone(
          arms.current!,
          index,
          scratch.start.set(0, 0, 0),
          scratch.end.set(x, 0.025, z),
          0.013,
          scratch,
        );
      });
      [-0.12, 0.12].forEach((x, index) => {
        bone(
          arms.current!,
          index + 4,
          scratch.start.set(x, -0.025, 0),
          scratch.end.set(x, -0.17, 0),
          0.007,
          scratch,
        );
        bone(
          arms.current!,
          index + 6,
          scratch.start.set(x, -0.17, -0.1),
          scratch.end.set(x, -0.17, 0.1),
          0.007,
          scratch,
        );
      });
      body.current.instanceMatrix.needsUpdate = true;
      arms.current.instanceMatrix.needsUpdate = true;
    }
  }, [rigs, scratch]);

  useLayoutEffect(() => {
    if (!overview) elapsed.current = 0;
    dirty.current = true;
  }, [overview, running]);

  useFrame((_, delta) => {
    const advance = overview && running;
    if (advance && wasRunning.current)
      elapsed.current += Math.min(Math.max(delta, 0), 1 / 15);
    wasRunning.current = advance;
    if (!advance && !dirty.current) return;
    dirty.current = false;
    const sample = sampleSiteLife(elapsed.current);
    if (drone.current) {
      drone.current.position.fromArray(sample.drone.position);
      drone.current.rotation.set(...sample.drone.rotation);
    }
    rotors.forEach((rotor, index) => {
      if (rotor.current)
        rotor.current.rotation.y =
          sample.drone.rotorAngle * (index % 2 === 0 ? 1 : -1);
    });
    rigs.current.forEach((rig, index) => {
      if (rig) placeWorker(rig, sample.workers[index], scratch);
    });
    const walker = rigs.current[3];
    if (!onFrame || !drone.current || !walker || !walker.limbs) return;
    // Diagnostics read the matrices just written to the visible objects.
    const angles: [number, number] = [0, 0];
    [1, 3].forEach((instance, index) => {
      walker.limbs.getMatrixAt(instance, scratch.matrix);
      scratch.matrix.decompose(
        scratch.position,
        scratch.rotation,
        scratch.scale,
      );
      angles[index] = scratch.euler.setFromQuaternion(scratch.rotation).x;
    });
    onFrame({
      time: elapsed.current,
      dronePosition: drone.current.position.toArray() as Point,
      workerPosition: walker.root.position.toArray() as Point,
      workerPose: angles,
      rotorAngle: rotors[0].current?.rotation.y ?? 0,
    });
  });

  return (
    <group name="site-life">
      {neutral.workers.map((_, index) => (
        <Worker key={index} onReady={register} index={index} />
      ))}
      <group ref={drone} position={neutral.drone.position} name="site-drone">
        <instancedMesh
          ref={body}
          args={[undefined, undefined, 6]}
          frustumCulled={false}
        >
          <boxGeometry />
          <meshStandardMaterial
            color="#77796e"
            roughness={0.65}
            metalness={0.25}
          />
        </instancedMesh>
        <instancedMesh
          ref={arms}
          args={[undefined, undefined, 8]}
          frustumCulled={false}
        >
          <cylinderGeometry args={[1, 1, 1, 6]} />
          <meshStandardMaterial color="#474d48" roughness={0.6} />
        </instancedMesh>
        {rotorLocations.map((position, index) => (
          <group ref={rotors[index]} position={position} key={index}>
            <mesh scale={[0.34, 0.008, 0.035]}>
              <boxGeometry />
              <meshStandardMaterial color="#62675e" roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
