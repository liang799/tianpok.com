"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef } from "react";
import type { MotionValue } from "motion/react";
import { Group, Mesh, OrthographicCamera, Quaternion, Vector3 } from "three";
import {
  BOOM_HEIGHT,
  CRANE_BASE,
  sampleCrane,
  type CraneSample,
} from "@/lib/crane-choreography";
import { CONSTRUCTION_PIECES, liftingEyes } from "@/lib/construction-plan";
import {
  BuildingSite,
  CityBackdrop,
  ConstructionPieceModel,
  CraneBoom,
  CraneHook,
  CraneTower,
  CraneTrolley,
} from "./models";
import styles from "./scene.module.css";

type CanvasProps = {
  progress?: MotionValue<number>;
  animated: boolean;
  dark: boolean;
  onReady: () => void;
  onFailure: () => void;
  onFrame: (
    value: number,
    sample: CraneSample,
    rendered: { pieceCount: number; placedCount: number },
  ) => void;
};

function CameraFrame() {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    fitCamera(camera as OrthographicCamera, size.width, size.height);
    invalidate();
  }, [camera, size.width, size.height, invalidate]);
  return null;
}

// Three owns this mutable camera; React only supplies its viewport dimensions.
function fitCamera(
  camera: OrthographicCamera,
  width: number,
  viewportHeight: number,
) {
  const aspect = width / Math.max(1, viewportHeight);
  const height = Math.max(12.8, 15.8 / aspect);
  camera.left = (-height * aspect) / 2;
  camera.right = (height * aspect) / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  camera.position.set(15, 12, 22);
  camera.lookAt(0, 4.9, 0);
  camera.updateProjectionMatrix();
}

const pieceEyes = CONSTRUCTION_PIECES.map(liftingEyes);
const up = new Vector3(0, 1, 0);

function CraneSequence({
  progress,
  animated,
  onReady,
  onFailure,
  onFrame,
}: CanvasProps) {
  const { gl, invalidate } = useThree();
  const boom = useRef<Group>(null);
  const trolley = useRef<Group>(null);
  const cable = useRef<Group>(null);
  const hook = useRef<Group>(null);
  const pieces = useRef<Array<Group | null>>([]);
  const slings = useRef<Array<Mesh | null>>([]);
  const slingGroup = useRef<Group>(null);
  const firstFrame = useRef(true);
  const readyFrame = useRef(0);
  const lastProgress = useRef(-1);
  const direction = useRef(new Vector3());
  const endpoint = useRef(new Vector3());
  const start = useRef(new Vector3());
  const rotation = useRef(new Quaternion());

  useEffect(() => {
    invalidate();
    if (!animated) return;
    return progress?.on("change", () => invalidate());
  }, [progress, animated, invalidate]);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      cancelAnimationFrame(readyFrame.current);
      onFailure();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => {
      canvas.removeEventListener("webglcontextlost", lost);
      cancelAnimationFrame(readyFrame.current);
    };
  }, [gl, onFailure]);

  useFrame(() => {
    const value =
      animated && progress ? Math.max(0, Math.min(1, progress.get())) : 1;
    if (value === lastProgress.current && !firstFrame.current) return;
    lastProgress.current = value;
    const sample = sampleCrane(value);
    if (boom.current) boom.current.rotation.y = sample.boomRotation;
    if (trolley.current) trolley.current.position.x = sample.trolleyRadius;
    if (cable.current) {
      cable.current.position.set(
        sample.hookPosition[0],
        BOOM_HEIGHT,
        sample.hookPosition[2],
      );
      cable.current.scale.y = sample.cableLength;
      cable.current.rotation.y = sample.boomRotation;
    }
    if (hook.current) {
      hook.current.position.fromArray(sample.hookPosition);
      hook.current.rotation.y = sample.boomRotation;
    }
    let pieceCount = 0;
    let placedCount = 0;
    sample.piecePoses.forEach((pose, index) => {
      const piece = pieces.current[index];
      if (!piece || piece.children.length === 0) return;
      piece.position.fromArray(pose.position);
      piece.rotation.set(...pose.rotation);
      piece.updateMatrixWorld();
      pieceCount++;
      if (pose.placed) placedCount++;
      const eyes = piece.getObjectByName("lifting-eyes");
      if (eyes)
        eyes.visible =
          !pose.placed ||
          (index === sample.activePieceIndex && sample.attached);
    });
    const activeLoad = pieces.current[sample.activePieceIndex];
    if (slingGroup.current) slingGroup.current.visible = sample.attached;
    start.current.set(
      sample.hookPosition[0],
      sample.hookPosition[1] - 0.56,
      sample.hookPosition[2],
    );
    pieceEyes[sample.activePieceIndex].forEach((eye, index) => {
      const mesh = slings.current[index];
      if (!mesh || !activeLoad) return;
      endpoint.current
        .set(eye[0], eye[1], eye[2])
        .applyMatrix4(activeLoad.matrixWorld);
      direction.current.subVectors(endpoint.current, start.current);
      const length = direction.current.length();
      mesh.position
        .copy(start.current)
        .add(endpoint.current)
        .multiplyScalar(0.5);
      mesh.scale.set(1, length, 1);
      rotation.current.setFromUnitVectors(up, direction.current.normalize());
      mesh.quaternion.copy(rotation.current);
    });
    onFrame(value, sample, { pieceCount, placedCount });
    if (firstFrame.current) {
      firstFrame.current = false;
      readyFrame.current = requestAnimationFrame(onReady);
    }
  });

  return (
    <>
      <group position={CRANE_BASE}>
        <CraneTower />
      </group>
      <group ref={boom} position={[CRANE_BASE[0], BOOM_HEIGHT, CRANE_BASE[2]]}>
        <CraneBoom />
        <group ref={trolley}>
          <CraneTrolley />
        </group>
      </group>
      <group ref={cable}>
        {[-0.07, 0.07].map((offset) => (
          <mesh key={offset} position={[0, -0.5, offset]}>
            <cylinderGeometry args={[0.015, 0.015, 1, 6]} />
            <meshStandardMaterial
              color="#343938"
              roughness={0.6}
              metalness={0.6}
            />
          </mesh>
        ))}
      </group>
      <group ref={hook}>
        <CraneHook />
      </group>
      {CONSTRUCTION_PIECES.map((piece, index) => (
        <group
          key={piece.id}
          name={piece.id}
          ref={(node) => {
            pieces.current[index] = node;
          }}
        >
          <ConstructionPieceModel piece={piece} />
        </group>
      ))}
      <group ref={slingGroup}>
        {pieceEyes[0].map((_, index) => (
          <mesh
            key={index}
            ref={(node) => {
              slings.current[index] = node;
            }}
          >
            <cylinderGeometry args={[0.014, 0.014, 1, 6]} />
            <meshStandardMaterial
              color="#555b53"
              roughness={0.7}
              metalness={0.35}
            />
          </mesh>
        ))}
      </group>
    </>
  );
}

export default function ConstructionCanvas(props: CanvasProps) {
  return (
    <Canvas
      className={styles.canvas}
      orthographic
      camera={{ position: [15, 12, 22], near: 0.1, far: 120 }}
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      dpr={[1, 1.5]}
      frameloop="demand"
      shadows="soft"
      resize={{ scroll: false, debounce: 0 }}
    >
      <CameraFrame />
      <fog attach="fog" args={[props.dark ? "#0c1011" : "#faf9f6", 28, 44]} />
      <ambientLight intensity={props.dark ? 1.0 : 1.55} />
      <hemisphereLight
        args={["#fff5e7", props.dark ? "#343d43" : "#c9b9a4", 1.3]}
      />
      <directionalLight
        position={[-7, 16, 10]}
        intensity={3.1}
        color="#fff3df"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={14}
        shadow-camera-bottom={-10}
        shadow-camera-near={1}
        shadow-camera-far={50}
        shadow-bias={-0.0005}
        shadow-normalBias={0.025}
      />
      <directionalLight
        position={[8, 6, -4]}
        intensity={props.dark ? 1.5 : 0.6}
        color="#ffb277"
      />
      <CityBackdrop />
      <BuildingSite />
      <CraneSequence {...props} />
    </Canvas>
  );
}
