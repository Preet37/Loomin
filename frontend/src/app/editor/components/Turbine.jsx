// app/loomin/components/Turbine.jsx
"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { useLoominStore } from "../store";

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function degToRad(d) { return (d * Math.PI) / 180; }
function num(vars, key, fallback) { const v = vars?.[key]; return typeof v === "number" && Number.isFinite(v) ? v : fallback; }
function lerp(a, b, t) { return a + (b - a) * t; }

function useActiveVars() {
  return useLoominStore((s) => {
    const j = s.journals.find((x) => x.id === s.activeId) || s.journals[0];
    return j?.vars || {};
  });
}

function computeRotationSpeed(vars) {
  const w = typeof vars?.Wind_Speed === "number" ? vars.Wind_Speed : 12;
  return Math.max(0, w) * 0.12;
}

function MatShell() { return <meshStandardMaterial color="#EEF0F5" roughness={0.44} metalness={0.06} />; }
function MatShell2() { return <meshStandardMaterial color="#E4E7EE" roughness={0.52} metalness={0.06} />; }
function MatDark() { return <meshStandardMaterial color="#343A43" roughness={0.66} metalness={0.18} />; }
function MatRubber() { return <meshStandardMaterial color="#0F131B" roughness={0.9} metalness={0.05} />; }
function MatTip() { return <meshStandardMaterial color="#D94A4A" roughness={0.55} metalness={0.05} />; }

function Tower({ h }) {
  const height = h;
  const baseR = 0.40;
  const topR = 0.155;
  return (
    <group>
      <mesh castShadow receiveShadow position={[0, height / 2, 0]}>
        <cylinderGeometry args={[topR, baseR, height, 72]} />
        <MatShell />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.10, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.20, 72]} />
        <MatDark />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.24, 0]}>
        <cylinderGeometry args={[0.54, 0.54, 0.08, 56]} />
        <MatShell2 />
      </mesh>

      <mesh castShadow receiveShadow position={[0.58, 0.98, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.017, 0.017, 1.15, 12]} />
        <meshStandardMaterial color="#101521" roughness={0.85} metalness={0.1} />
      </mesh>
    </group>
  );
}

function Nacelle({ len }) {
  const L = len;
  return (
    <group>
      <RoundedBox args={[0.46, 0.40, L]} radius={0.16} smoothness={14} castShadow receiveShadow>
        <MatShell />
      </RoundedBox>

      <group position={[0, -0.06, -L * 0.26]}>
        <RoundedBox args={[0.36, 0.18, Math.max(0.32, L * 0.36)]} radius={0.10} smoothness={12} castShadow receiveShadow>
          <MatDark />
        </RoundedBox>
      </group>

      <mesh castShadow receiveShadow position={[0, 0.0, L * 0.43]}>
        <cylinderGeometry args={[0.115, 0.115, 0.07, 44]} />
        <MatDark />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0.0, L * 0.47]}>
        <cylinderGeometry args={[0.105, 0.105, 0.02, 44]} />
        <MatRubber />
      </mesh>

      <mesh castShadow receiveShadow position={[0, 0.17, -L * 0.12]}>
        <cylinderGeometry args={[0.06, 0.06, 0.11, 26]} />
        <MatShell2 />
      </mesh>
    </group>
  );
}

function Hub() {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.135, 42, 42]} />
        <MatDark />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, 0.09]}>
        <cylinderGeometry args={[0.095, 0.095, 0.18, 44]} />
        <meshStandardMaterial color="#2B313A" roughness={0.66} metalness={0.18} />
      </mesh>
      <mesh castShadow receiveShadow position={[0, 0, 0.155]}>
        <coneGeometry args={[0.075, 0.12, 48]} />
        <meshStandardMaterial color="#3A4048" roughness={0.62} metalness={0.18} />
      </mesh>
    </group>
  );
}

function Blade({ bladeLen, rotorScale, sweep, prebend }) {
  const segs = 22;
  const parts = useMemo(() => {
    const out = [];
    for (let i = 0; i < segs; i++) {
      const t0 = i / (segs - 1);
      const t = Math.pow(t0, 1.05);

      const x = bladeLen * t;
      const y = sweep * Math.pow(t, 1.25);
      const z = prebend * Math.sin(Math.PI * t) * Math.pow(t, 1.05);

      const chord = lerp(0.20, 0.05, Math.pow(t, 1.0)) * rotorScale;
      const thick = lerp(0.065, 0.022, Math.pow(t, 1.0)) * rotorScale;
      const depth = lerp(0.085, 0.030, Math.pow(t, 1.0)) * rotorScale;

      const twist = degToRad(lerp(10, -4, Math.pow(t, 0.9)));

      const isTip = i >= segs - 3;

      out.push(
        <group key={i} position={[x, y, z]} rotation={[twist, 0, 0]}>
          <RoundedBox args={[bladeLen / segs * 1.12, chord, depth]} radius={Math.min(0.02, chord * 0.18)} smoothness={10} castShadow receiveShadow>
            {isTip ? <MatTip /> : <MatShell />}
          </RoundedBox>
          {i === 0 ? (
            <mesh castShadow receiveShadow position={[-(bladeLen / segs) * 0.62, 0, 0]}>
              <cylinderGeometry args={[0.06 * rotorScale, 0.06 * rotorScale, 0.12 * rotorScale, 28]} />
              <MatDark />
            </mesh>
          ) : null}
        </group>
      );
    }
    return out;
  }, [bladeLen, rotorScale, sweep, prebend]);

  return <group>{parts}</group>;
}

function Rotor({ vars, towerHeight }) {
  const yawGroup = useRef(null);
  const pitchGroup = useRef(null);
  const spinGroup = useRef(null);
  const spin = useRef(0);

  const yaw = useMemo(() => degToRad(clamp(num(vars, "Yaw", 0), -180, 180)), [vars]);
  const pitch = useMemo(() => degToRad(clamp(num(vars, "Blade_Pitch", 0), -30, 30)), [vars]);
  const rotationSpeed = useMemo(() => computeRotationSpeed(vars), [vars]);

  const nacelleLen = clamp(num(vars, "Nacelle_Length", 1.05), 0.75, 1.6);
  const bladeLen = clamp(num(vars, "Blade_Length", 2.35), 1.2, 3.8);
  const rotorScale = clamp(num(vars, "Rotor_Scale", 1.0), 0.6, 1.6);
  const prebend = clamp(num(vars, "Blade_PreBend", 0), 0, 0.35);
  const sweep = clamp(num(vars, "Blade_Sweep", 0.10), 0, 0.35);

  const bladeCount = useMemo(() => {
    const raw = num(vars, "Blade_Count", 3);
    return clamp(Math.round(raw), 1, 8);
  }, [vars]);

  useFrame((_, dt) => {
    if (yawGroup.current) yawGroup.current.rotation.y = yaw;
    if (pitchGroup.current) pitchGroup.current.rotation.x = pitch;

    const rs = Number.isFinite(rotationSpeed) ? rotationSpeed : 0;
    spin.current += rs * dt;
    if (spinGroup.current) spinGroup.current.rotation.z = spin.current;
  });

  const blades = useMemo(() => {
    const out = [];
    for (let i = 0; i < bladeCount; i++) {
      const a = (i / bladeCount) * Math.PI * 2;
      out.push(
        <group key={i} rotation={[0, 0, a]}>
          <Blade bladeLen={bladeLen} rotorScale={rotorScale} sweep={sweep} prebend={prebend} />
        </group>
      );
    }
    return out;
  }, [bladeCount, bladeLen, rotorScale, sweep, prebend]);

  return (
    <group ref={yawGroup} position={[0, towerHeight, 0]}>
      <group position={[0, 0.18, 0]}>
        <Nacelle len={nacelleLen} />
      </group>

      <group position={[0, 0.18, nacelleLen * 0.46]}>
        <group ref={pitchGroup}>
          <group ref={spinGroup}>
            <Hub />
            {blades}
          </group>
        </group>
      </group>
    </group>
  );
}

export default function Turbine({ position = [0, 0, 0], scale = 0.95 }) {
  const vars = useActiveVars();
  const rotationSpeed = useMemo(() => computeRotationSpeed(vars || {}), [vars]);

  const towerHeight = clamp(num(vars, "Tower_Height", 4.1), 2.6, 6.0);

  const windText = useMemo(() => (typeof vars?.Wind_Speed === "number" ? String(vars.Wind_Speed) : "—"), [vars]);
  const pitchText = useMemo(() => (typeof vars?.Blade_Pitch === "number" ? String(vars.Blade_Pitch) : "—"), [vars]);
  const yawText = useMemo(() => (typeof vars?.Yaw === "number" ? String(vars.Yaw) : "—"), [vars]);
  const bladeCountText = useMemo(() => String(clamp(Math.round(num(vars, "Blade_Count", 3)), 1, 8)), [vars]);

  return (
    <>
      <group position={position} scale={scale}>
        <Tower h={towerHeight} />
        <Rotor vars={vars} towerHeight={towerHeight} />
      </group>

      <Html fullscreen>
        <div style={{ position: "absolute", left: 18, bottom: 18, pointerEvents: "none" }}>
          <div className="select-none rounded-2xl bg-black/45 ring-1 ring-white/15 backdrop-blur-xl px-3 py-2 text-[11px] text-white/85 min-w-[240px]">
            <div className="text-white/55 tracking-[0.16em] uppercase text-[10px]">Turbine Telemetry</div>
            <div className="mt-1 flex items-center justify-between"><span className="text-white/60">Wind_Speed</span><span className="font-semibold text-white/95">{windText}</span></div>
            <div className="mt-1 flex items-center justify-between"><span className="text-white/60">rotationSpeed</span><span className="font-semibold text-white/95">{Number.isFinite(rotationSpeed) ? rotationSpeed.toFixed(2) : "0.00"}</span></div>
            <div className="mt-1 flex items-center justify-between"><span className="text-white/60">Blade_Pitch</span><span className="font-semibold text-white/95">{pitchText}°</span></div>
            <div className="mt-1 flex items-center justify-between"><span className="text-white/60">Yaw</span><span className="font-semibold text-white/95">{yawText}°</span></div>
            <div className="mt-1 flex items-center justify-between"><span className="text-white/60">Blade_Count</span><span className="font-semibold text-white/95">{bladeCountText}</span></div>
          </div>
        </div>
      </Html>
    </>
  );
}
