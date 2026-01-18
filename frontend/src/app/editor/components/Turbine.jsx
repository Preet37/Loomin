"use client";

import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useLoominStore } from "../store";

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function degToRad(d) { return (d * Math.PI) / 180; }

function computeRotationSpeed(vars) {
  const w = typeof vars?.Wind_Speed === "number" ? vars.Wind_Speed : 12;
  return Math.max(0, w) * 0.12;
}

function rigNodeWithParents(node) {
  if (!node || !node.parent) return null;

  const parent = node.parent;

  const yawGroup = new THREE.Group();
  const pitchGroup = new THREE.Group();
  const spinGroup = new THREE.Group();

  yawGroup.position.copy(node.position);
  yawGroup.quaternion.copy(node.quaternion);
  yawGroup.scale.copy(node.scale);

  node.position.set(0, 0, 0);
  node.quaternion.identity();
  node.scale.set(1, 1, 1);

  parent.add(yawGroup);
  yawGroup.add(pitchGroup);
  pitchGroup.add(spinGroup);
  spinGroup.add(node);

  const yawBaseQuat = yawGroup.quaternion.clone();
  const pitchBaseQuat = pitchGroup.quaternion.clone();
  const spinBaseQuat = spinGroup.quaternion.clone();

  return { yawGroup, pitchGroup, spinGroup, yawBaseQuat, pitchBaseQuat, spinBaseQuat, spinAngle: 0 };
}


function useActiveVars() {
  return useLoominStore((s) => {
    const j = s.journals.find((x) => x.id === s.activeId) || s.journals[0];
    return j?.vars || {};
  });
}

export default function Turbine({ url = "/models/wind_turbine.glb", position = [0, 0, 0] }) {
  const vars = useActiveVars();
  const rotationSpeed = useMemo(() => computeRotationSpeed(vars), [vars]);

  const { scene } = useGLTF(url);
  const wrapper = useRef();
  const rig = useRef(null);

  const yaw = degToRad(clamp(typeof vars?.Yaw === "number" ? vars.Yaw : 0, -180, 180));
  const pitch = degToRad(clamp(typeof vars?.Blade_Pitch === "number" ? vars.Blade_Pitch : 0, -30, 30));

  useEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
  }, [scene]);

  useLayoutEffect(() => {
    if (!wrapper.current) return;

    wrapper.current.clear();
    wrapper.current.add(scene);

    const blades = scene.getObjectByName("Object_6") || scene.getObjectByName("Windturbine Blades_1");
    if (blades && !rig.current) rig.current = rigNodeWithParents(blades);

    wrapper.current.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(wrapper.current);
    const center = box.getCenter(new THREE.Vector3());

    wrapper.current.position.x += -center.x;
    wrapper.current.position.z += -center.z;
    wrapper.current.position.y += -box.min.y;

    wrapper.current.updateMatrixWorld(true);
  }, [scene]);

    useFrame((_, dt) => {
    if (!rig.current) return;

    const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
    const pitchQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch);

    rig.current.yawGroup.quaternion.copy(rig.current.yawBaseQuat).multiply(yawQuat);
    rig.current.pitchGroup.quaternion.copy(rig.current.pitchBaseQuat).multiply(pitchQuat);

    const rs = Number.isFinite(rotationSpeed) ? rotationSpeed : 0;
    rig.current.spinAngle += rs * dt;

    const spinQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), rig.current.spinAngle);
    rig.current.spinGroup.quaternion.copy(rig.current.spinBaseQuat).multiply(spinQuat);
    });


  const windText = useMemo(() => (typeof vars?.Wind_Speed === "number" ? String(vars.Wind_Speed) : "—"), [vars]);
  const pitchText = useMemo(() => (typeof vars?.Blade_Pitch === "number" ? String(vars.Blade_Pitch) : "—"), [vars]);
  const yawText = useMemo(() => (typeof vars?.Yaw === "number" ? String(vars.Yaw) : "—"), [vars]);

  return (
    <>
      <group position={position}>
        <group ref={wrapper} />
      </group>

      <Html fullscreen>
        <div style={{ position: "absolute", left: 18, bottom: 18, pointerEvents: "none" }}>
          <div className="select-none rounded-2xl bg-black/45 ring-1 ring-white/15 backdrop-blur-xl px-3 py-2 text-[11px] text-white/85 min-w-[220px]">
            <div className="text-white/55 tracking-[0.16em] uppercase text-[10px]">Turbine Telemetry</div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-white/60">Wind_Speed</span>
              <span className="font-semibold text-white/95">{windText}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-white/60">rotationSpeed</span>
              <span className="font-semibold text-white/95">{Number.isFinite(rotationSpeed) ? rotationSpeed.toFixed(2) : "0.00"}</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-white/60">Blade_Pitch</span>
              <span className="font-semibold text-white/95">{pitchText}°</span>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-white/60">Yaw</span>
              <span className="font-semibold text-white/95">{yawText}°</span>
            </div>
          </div>
        </div>
      </Html>
    </>
  );
}

useGLTF.preload("/models/wind_turbine.glb");
