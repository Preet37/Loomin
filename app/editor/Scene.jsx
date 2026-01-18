"use client";

import { Suspense, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { Environment, Html, OrbitControls, ContactShadows } from "@react-three/drei";
import { useLoominStore } from "./store";

import Arm from "./components/Arm";
import Turbine from "./components/Turbine";
import GenericVisual from "./components/GenericVisual";

function ResetCameraOnJournalChange({ mode }) {
  const activeId = useLoominStore((s) => s.activeId);
  const { camera, controls } = useThree();
  useEffect(() => {
    if (!controls) return;
    // Adjust camera based on simulation type
    if (mode === 0) {
      // Turbine - look at hub height (hub is at y=8.5)
      camera.position.set(10, 8, 16);
      controls.target.set(0, 6, 0);
    } else if (mode === 1) {
      // Arm
      camera.position.set(6, 4, 8);
      controls.target.set(0, 2, 0);
    } else {
      // Generic/Custom visualization
      camera.position.set(6, 4, 8);
      controls.target.set(0, 2, 0);
    }
    controls.update();
  }, [activeId, mode, camera, controls]);
  return null;
}

export default function Scene() {
  const activeId = useLoominStore((s) => s.activeId);
  const journals = useLoominStore((s) => s.journals);
  const active = journals.find((j) => j.id === activeId) || journals[0];
  const vars = active?.vars || {};
  
  // -1 or undefined means "Waiting for input"
  const mode = vars.Scene_Mode !== undefined ? vars.Scene_Mode : -1;

  if (mode === -1) {
      return (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/30">
              <div className="w-16 h-16 border-2 border-white/10 rounded-full flex items-center justify-center mb-4">
                  <span className="text-2xl">?</span>
              </div>
              <p className="text-sm font-mono">Waiting for Simulation Parameters...</p>
          </div>
      );
  }

  // Determine ground position based on mode
  const groundY = mode === 0 ? 0 : -2;
  const cameraPos = mode === 0 ? [10, 8, 16] : [6, 4, 8];

  return (
    <Canvas shadows dpr={[1, 2]} camera={{ fov: 45, position: cameraPos }}>
      <ResetCameraOnJournalChange mode={mode} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={1} castShadow shadow-mapSize={1024} />
      <spotLight position={[-5, 10, 5]} angle={0.3} penumbra={1} intensity={0.5} />
      
      <Suspense fallback={null}>
        <Environment preset="city" />

        {mode === 0 && <Turbine />}
        {mode === 1 && <Arm />}
        {mode >= 2 && <GenericVisual />}

        <ContactShadows position={[0, groundY, 0]} opacity={0.5} scale={25} blur={2.5} far={6} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY - 0.01, 0]} receiveShadow>
          <circleGeometry args={[25, 64]} />
          <meshStandardMaterial color="#0a0f1a" roughness={0.85} />
        </mesh>

        <OrbitControls 
          makeDefault 
          minDistance={3} 
          maxDistance={40} 
          target={mode === 0 ? [0, 6, 0] : [0, 2, 0]} 
        />
      </Suspense>
    </Canvas>
  );
}