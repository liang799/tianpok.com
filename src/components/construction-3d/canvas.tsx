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
import { SiteLife, type SiteLifeFrame } from "./ambient-life";

/** Offline authoring input; ignored by the production renderer. */
export type ConstructionCaptureFrame = {
  id: number;
  progress: number;
  presentation: number;
  overscan?: number;
};

type CanvasProps = {
  progress?: MotionValue<number>;
  animated: boolean;
  dark: boolean;
  overview?: boolean;
  ambientMotion?: boolean;
  ambientCycle?: number;
  captureFrame?: ConstructionCaptureFrame;
  onLifeFrame: (frame: SiteLifeFrame) => void;
  onProjectLabel: (x: number, y: number, fontSize: number) => void;
  onReady: () => void;
  onFailure: () => void;
  onFrame: (
    value: number,
    sample: CraneSample,
    rendered: { pieceCount: number; placedCount: number },
  ) => void;
};

/** Keep idle activity to 30fps; all other scene states stay demand-rendered. */
function AmbientFrames({ running }: { running: boolean }) {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
    if (!running) return;
    const timer = window.setInterval(invalidate, 1000 / 30);
    return () => window.clearInterval(timer);
  }, [running, invalidate]);
  return null;
}

function CameraFrame({
  overview = false,
  captureFrame,
  onProjectLabel,
}: Pick<CanvasProps, "overview" | "captureFrame" | "onProjectLabel">) {
  const { camera, size, invalidate } = useThree();
  useLayoutEffect(() => {
    fitCamera(
      camera as OrthographicCamera,
      size.width,
      size.height,
      captureFrame?.presentation ?? Number(overview),
      captureFrame?.overscan ?? 1,
    );
    camera.updateMatrixWorld();
    const label = new Vector3(7.3, 0.6, 1.27).project(camera);
    const ortho = camera as OrthographicCamera;
    const labelFontSize = (size.height / (ortho.top - ortho.bottom)) * 0.2;
    onProjectLabel(
      ((label.x + 1) * size.width) / 2,
      ((1 - label.y) * size.height) / 2,
      labelFontSize,
    );
    invalidate();
  }, [
    camera,
    size.width,
    size.height,
    invalidate,
    overview,
    captureFrame,
    onProjectLabel,
  ]);
  return null;
}

// Three owns this mutable camera; React only supplies its viewport dimensions.
function fitCamera(
  camera: OrthographicCamera,
  width: number,
  viewportHeight: number,
  presentation: number,
  overscan: number,
) {
  const aspect = (width / Math.max(1, viewportHeight)) * overscan;
  const height =
    blend(
      Math.max(16.6, 19 / aspect),
      Math.max(12.8, 16 / aspect),
      presentation,
    ) * overscan;
  const renderedAspect = width / Math.max(1, viewportHeight);
  camera.left = (-height * renderedAspect) / 2;
  camera.right = (height * renderedAspect) / 2;
  camera.top = height / 2;
  camera.bottom = -height / 2;
  const centerX = blend(-0.8, -2.4, presentation);
  const centerY = blend(4.1, 3.3, presentation);
  camera.position.set(centerX - 12, centerY + 5.6, 28);
  camera.lookAt(centerX, centerY, 0);
  camera.updateProjectionMatrix();
}

function blend(from: number, to: number, amount: number) {
  if (amount <= 0) return from;
  if (amount >= 1) return to;
  return from + (to - from) * amount;
}

const pieceEyes = CONSTRUCTION_PIECES.map(liftingEyes);
const up = new Vector3(0, 1, 0);

function CraneSequence({
  progress,
  animated,
  overview = false,
  captureFrame,
  onReady,
  onFailure,
  onFrame,
}: CanvasProps) {
  const { gl, invalidate } = useThree();
  const boom = useRef<Group>(null);
  const tower = useRef<Group>(null);
  const presentationCrate = useRef<Group>(null);
  const trolley = useRef<Group>(null);
  const cable = useRef<Group>(null);
  const hook = useRef<Group>(null);
  const pieces = useRef<Array<Group | null>>([]);
  const slings = useRef<Array<Mesh | null>>([]);
  const slingGroup = useRef<Group>(null);
  const firstFrame = useRef(true);
  const readyFrame = useRef(0);
  const lastFrame = useRef("");
  const direction = useRef(new Vector3());
  const endpoint = useRef(new Vector3());
  const start = useRef(new Vector3());
  const rotation = useRef(new Quaternion());

  useEffect(() => {
    invalidate();
    if (!animated) return;
    return progress?.on("change", () => invalidate());
  }, [progress, animated, captureFrame, invalidate]);
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
      captureFrame?.progress ??
      (animated && progress ? Math.max(0, Math.min(1, progress.get())) : 1);
    const presentation = captureFrame?.presentation ?? Number(overview);
    const frameKey = `${value}:${overview}:${captureFrame?.id ?? ""}`;
    if (frameKey === lastFrame.current && !firstFrame.current) return;
    lastFrame.current = frameKey;
    const sample = sampleCrane(value);
    const angle = blend(sample.boomRotation, 2.7367, presentation);
    const scaleX = blend(1, 0.68, presentation);
    const worldRadius = blend(sample.trolleyRadius, 4.8 * 0.68, presentation);
    const radius = worldRadius / scaleX;
    const boomHeight = blend(BOOM_HEIGHT, 7.6, presentation);
    const hookPosition =
      presentation <= 0
        ? sample.hookPosition
        : [
            CRANE_BASE[0] + Math.cos(angle) * worldRadius,
            blend(sample.hookPosition[1], 6.95, presentation),
            CRANE_BASE[2] - Math.sin(angle) * worldRadius,
          ];
    tower.current?.scale.set(
      blend(1, 0.65, presentation),
      boomHeight / BOOM_HEIGHT,
      blend(1, 0.65, presentation),
    );
    if (boom.current) {
      boom.current.rotation.y = angle;
      boom.current.position.y = boomHeight;
      boom.current.scale.set(
        scaleX,
        blend(1, 0.62, presentation),
        blend(1, 0.65, presentation),
      );
    }
    if (presentationCrate.current) {
      presentationCrate.current.visible = presentation > 0;
      presentationCrate.current.scale.setScalar(presentation);
    }
    if (trolley.current) trolley.current.position.x = radius;
    if (cable.current) {
      cable.current.position.set(hookPosition[0], boomHeight, hookPosition[2]);
      cable.current.scale.y = boomHeight - hookPosition[1];
      cable.current.rotation.y = angle;
    }
    if (hook.current) {
      hook.current.position.fromArray(hookPosition);
      hook.current.rotation.y = angle;
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
      <group ref={tower} position={CRANE_BASE}>
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
        {(overview || Boolean(captureFrame)) && (
          <group ref={presentationCrate}>
            <SuspendedCrate />
          </group>
        )}
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

/** The presentation load hangs from the same hook as the working assembly rig. */
function SuspendedCrate() {
  return (
    <group rotation={[0, -2.7367, 0]}>
      {[-1, 1].flatMap((x) =>
        [-1, 1].map((z) => {
          const start = new Vector3(0, -0.55, 0);
          const end = new Vector3(x * 0.4, -0.77, z * 0.34);
          const delta = end.clone().sub(start);
          return (
            <mesh
              key={`${x}:${z}`}
              position={start.add(end).multiplyScalar(0.5)}
              quaternion={new Quaternion().setFromUnitVectors(
                up,
                delta.clone().normalize(),
              )}
            >
              <cylinderGeometry args={[0.012, 0.012, delta.length(), 6]} />
              <meshStandardMaterial color="#494a42" />
            </mesh>
          );
        }),
      )}
      <mesh position={[0, -1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.03, 0.86, 0.9]} />
        <meshStandardMaterial color="#f47737" roughness={0.9} />
      </mesh>
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, -1.2, 0.453]}>
          <boxGeometry args={[0.009, 0.83, 0.008]} />
          <meshStandardMaterial color="#bd592e" />
        </mesh>
      ))}
    </group>
  );
}

export default function ConstructionCanvas(props: CanvasProps) {
  const captureFrame =
    process.env.NODE_ENV === "production" ? undefined : props.captureFrame;
  const presentation =
    captureFrame?.presentation ?? Number(Boolean(props.overview));
  return (
    <Canvas
      className={styles.canvas}
      orthographic
      camera={{ position: [15, 12, 22], near: 0.1, far: 120 }}
      gl={{
        alpha: true,
        antialias: true,
        powerPreference: "low-power",
        preserveDrawingBuffer: Boolean(captureFrame),
      }}
      dpr={[1, 1.5]}
      frameloop="demand"
      shadows="soft"
      resize={{ scroll: false, debounce: 0 }}
    >
      <CameraFrame
        overview={props.overview}
        captureFrame={captureFrame}
        onProjectLabel={props.onProjectLabel}
      />
      <AmbientFrames running={Boolean(props.ambientMotion)} />
      <fog attach="fog" args={[props.dark ? "#0c1011" : "#faf9f6", 38, 58]} />
      <ambientLight intensity={props.dark ? 1.0 : 1.25} />
      <hemisphereLight
        args={["#fff5e7", props.dark ? "#343d43" : "#c9b9a4", 1.0]}
      />
      <directionalLight
        position={[-7, 16, 10]}
        intensity={2.4}
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
      <BuildingSite overview={presentation >= 0.5} />
      <SiteLife
        key={props.ambientCycle ?? 0}
        running={Boolean(props.ambientMotion)}
        overview={props.overview}
        onFrame={props.onLifeFrame}
      />
      <CraneSequence {...props} captureFrame={captureFrame} />
    </Canvas>
  );
}
