// app/loomin/Scene.jsx
"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls } from "@react-three/drei";
import { useLoominStore } from "./store";

import Arm from "./components/Arm";
import Turbine from "./components/Turbine";

function ResetCameraOnJournalChange() {
  const activeId = useLoominStore((s) => s.activeId);
  const { camera, controls } = useThree();

  useEffect(() => {
    if (!controls) return;

    camera.position.set(3, 2, 4);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 1, 0);

    controls.target.set(0, 1, 0);
    controls.update();
  }, [activeId, camera, controls]);

  return null;
}

function useSceneMode() {
  return useLoominStore((s) => {
    const j = s.journals.find((x) => x.id === s.activeId) || s.journals[0];
    const m = j?.vars?.Scene_Mode;
    return typeof m === "number" && Number.isFinite(m) ? m : 0;
  });
}

export default function Scene() {
  const sceneMode = useSceneMode();
  const showArm = sceneMode === 1;

  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 45, position: [3, 2, 4], near: 0.01, far: 500 }}>
      <ResetCameraOnJournalChange />
      <color attach="background" args={["#070A0F"]} />
      <ambientLight intensity={0.55} />
      <directionalLight position={[6, 8, 4]} intensity={1.1} castShadow />

      <Suspense
        fallback={
          <Html center>
            <div className="rounded-2xl bg-black/50 ring-1 ring-white/15 px-4 py-2 text-xs text-white/80 backdrop-blur-xl">
              Loading 3D…
            </div>
          </Html>
        }
      >
        <Environment preset="city" />

        <group visible={!showArm}>
          <Turbine />
        </group>

        <group visible={showArm}>
          <Arm />
        </group>

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <circleGeometry args={[30, 96]} />
          <meshStandardMaterial color="#0b1222" roughness={0.95} metalness={0.05} />
        </mesh>

        <OrbitControls makeDefault enableDamping dampingFactor={0.08} rotateSpeed={0.6} minDistance={0.6} maxDistance={80} />
      </Suspense>
    </Canvas>
  );
}
