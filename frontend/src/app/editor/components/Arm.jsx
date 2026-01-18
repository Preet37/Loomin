"use client";

import { useMemo } from "react";
import { Html, RoundedBox } from "@react-three/drei";
import { useLoominStore } from "../store";

function degToRad(d) { return (d * Math.PI) / 180; }
function num(vars, key, fallback) { const v = vars?.[key]; return typeof v === "number" && Number.isFinite(v) ? v : fallback; }
function lerp(a, b, t) { return a + (b - a) * t; }

function useActiveVars() {
  return useLoominStore((s) => {
    const j = s.journals.find((x) => x.id === s.activeId) || s.journals[0];
    return j?.vars || {};
  });
}

function ShellMat() { return <meshStandardMaterial color="#EEF0F5" roughness={0.42} metalness={0.1} />; }
function DarkMat() { return <meshStandardMaterial color="#3A3F47" roughness={0.62} metalness={0.18} />; }
function RubberMat() { return <meshStandardMaterial color="#141821" roughness={0.9} metalness={0.05} />; }

function RBox({ size, r, variant = "shell" }) {
  return (
    <RoundedBox args={size} radius={r} smoothness={14} castShadow receiveShadow>
      {variant === "dark" ? <DarkMat /> : variant === "rubber" ? <RubberMat /> : <ShellMat />}
    </RoundedBox>
  );
}

function FingerSeg({ w, h, l, r, tip }) {
  return (
    <RoundedBox args={[w, h, l]} radius={r} smoothness={14} castShadow receiveShadow>
      {tip ? <RubberMat /> : <ShellMat />}
    </RoundedBox>
  );
}

function Finger({ base, yaw, openZ, curl }) {
  const l1 = 0.19, l2 = 0.15, l3 = 0.12;
  const w1 = 0.078, w2 = 0.070, w3 = 0.064;
  const h1 = 0.080, h2 = 0.074, h3 = 0.068;
  const segR = 0.03, tipR = 0.028, tipLenMul = 0.45;

  const c0 = curl;
  const c1 = c0 * 0.92;
  const c2 = c0 * 0.84 + degToRad(6);

  const z = openZ;

  return (
    <group position={base} rotation={[0, yaw, 0]}>
      <group position={[0, 0, z]}>
        <group rotation={[c0, 0, 0]}>
          <group position={[0, 0, l1 * 0.5]}>
            <FingerSeg w={w1} h={h1} l={l1} r={segR} />
          </group>

          <group position={[0, 0, l1]} rotation={[c1, 0, 0]}>
            <group position={[0, 0, l2 * 0.5]}>
              <FingerSeg w={w2} h={h2} l={l2} r={segR * 0.92} />
            </group>

            <group position={[0, 0, l2]} rotation={[c2, 0, 0]}>
              <group position={[0, 0, l3 * 0.5]}>
                <FingerSeg w={w3} h={h3} l={l3} r={segR * 0.86} />
              </group>
              <group position={[0, -h3 * 0.1, l3 * 0.9]}>
                <FingerSeg w={w3 * 0.98} h={h3 * 0.92} l={l3 * tipLenMul} r={tipR} tip />
              </group>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

function Thumb({ openZ, curlRad }) {
  const l1 = 0.162, l2 = 0.126, l3 = 0.102;
  const w1 = 0.082, w2 = 0.074, w3 = 0.066;
  const h1 = 0.084, h2 = 0.078, h3 = 0.072;
  const segR = 0.03, tipR = 0.028, tipLenMul = 0.45;

  const c0 = curlRad;
  const c1 = c0 * 0.90;
  const c2 = c0 * 0.80 + degToRad(8);

  const z = openZ * 0.95;

  return (
    <group position={[0, 0, z]}>
      <group rotation={[c0, 0, 0]}>
        <group position={[0, 0, l1 * 0.5]}>
          <RoundedBox args={[w1, h1, l1]} radius={segR} smoothness={14} castShadow receiveShadow>
            <ShellMat />
          </RoundedBox>
        </group>

        <group position={[0, 0, l1]} rotation={[c1, 0, 0]}>
          <group position={[0, 0, l2 * 0.5]}>
            <RoundedBox args={[w2, h2, l2]} radius={segR * 0.92} smoothness={14} castShadow receiveShadow>
              <ShellMat />
            </RoundedBox>
          </group>

          <group position={[0, 0, l2]} rotation={[c2, 0, 0]}>
            <group position={[0, 0, l3 * 0.5]}>
              <RoundedBox args={[w3, h3, l3]} radius={segR * 0.86} smoothness={14} castShadow receiveShadow>
                <ShellMat />
              </RoundedBox>
            </group>
            <group position={[0, -h3 * 0.1, l3 * 0.9]}>
              <RoundedBox args={[w3 * 0.98, h3 * 0.92, l3 * tipLenMul]} radius={tipR} smoothness={14} castShadow receiveShadow>
                <RubberMat />
              </RoundedBox>
            </group>
          </group>
        </group>
      </group>
    </group>
  );
}

export default function Arm({ position = [0, 0, 0], scale = 1.25 }) {
  const vars = useActiveVars();

  const baseYaw = degToRad(num(vars, "Arm_Base_Yaw", 22));
  const shoulderPitch = degToRad(num(vars, "Arm_Shoulder_Pitch", 30));
  const elbowPitch = degToRad(num(vars, "Arm_Elbow_Pitch", 20));
  const wristPitch = degToRad(num(vars, "Arm_Wrist_Pitch", -34));
  const wristRoll = degToRad(num(vars, "Arm_Wrist_Roll", -40));
  const wristRotate = degToRad(num(vars, "Wrist_Rotate", 40));
  const handYaw = degToRad(num(vars, "Gripper_Yaw", 20));
  const handPitch = degToRad(num(vars, "Gripper_Pitch", -90));

  const fingerCount = Math.round(num(vars, "Finger_Count", 5));
  const thumbEnabled = num(vars, "Thumb_Enabled", 1) >= 0.5;

  const gripPct = num(vars, "Gripper_Open", 20);
  const splayPct = num(vars, "Finger_Splay", 10);

  const openZ = useMemo(() => lerp(0.055, 0.12, gripPct / 100), [gripPct]);
  const splay = useMemo(() => lerp(degToRad(1.5), degToRad(14), splayPct / 100), [splayPct]);

  const yawGain = num(vars, "Finger_Yaw_Gain", 1.0);

  const fallbackCurl = num(vars, "Finger_Curl", 0);

  const fingerMountY = num(vars, "Finger_Mount_Y", 0.06);
  const fingerMountZ = num(vars, "Finger_Mount_Z", 0.18);
  const baseSep = num(vars, "Finger_Sep", 0.14);
  const sep = baseSep * lerp(0.95, 1.07, splayPct / 100);

  const thumbYaw = degToRad(num(vars, "Thumb_Yaw", -55));
  const thumbPitch = degToRad(num(vars, "Thumb_Pitch", 10));
  const THUMB_ROLL_FIXED = degToRad(24);
  const thumbCurl = degToRad(num(vars, "Thumb_Curl", 0));
  const THUMB_BASE_FIXED = [-0.24, -0.03, -0.02];

  const fingerOffsets = useMemo(() => {
    if (fingerCount === 1) return [[0, 0.01, 0.0]];
    const center = (fingerCount - 1) / 2;
    const out = [];
    for (let i = 0; i < fingerCount; i++) {
      const side = i - center;
      const x = side * sep;
      const z = Math.abs(side) * 0.006;
      out.push([x, 0.01, z]);
    }
    return out;
  }, [fingerCount, sep]);

  const fingerYaws = useMemo(() => {
    if (fingerCount === 1) return [0];
    const center = (fingerCount - 1) / 2;
    const out = [];
    for (let i = 0; i < fingerCount; i++) {
      const side = i - center;
      const norm = side / Math.max(1e-6, center);
      const raw = norm * (splay * yawGain);
      out.push(raw);
    }
    return out;
  }, [fingerCount, splay, yawGain]);

  const fingerCurlsDeg = useMemo(() => {
    const out = [];
    const legacy = [
      num(vars, "Index_Curl", NaN),
      num(vars, "Middle_Curl", NaN),
      num(vars, "Ring_Curl", NaN),
      num(vars, "Pinky_Curl", NaN),
    ];
    for (let i = 0; i < fingerCount; i++) {
      let v = num(vars, `Finger${i + 1}_Curl`, num(vars, `Finger_${i + 1}_Curl`, NaN));
      if (!Number.isFinite(v)) {
        if (fingerCount === 5) {
          if (i === 0 && Number.isFinite(legacy[0])) v = legacy[0];
          else if (i === 1 && Number.isFinite(legacy[1])) v = legacy[1];
          else if (i === 3 && Number.isFinite(legacy[2])) v = legacy[2];
          else if (i === 4 && Number.isFinite(legacy[3])) v = legacy[3];
          else v = fallbackCurl;
        } else v = fallbackCurl;
      }
      out.push(v);
    }
    return out;
  }, [vars, fingerCount, fallbackCurl]);

  const telemetry = useMemo(() => ({
    Finger_Count: fingerCount,
    Gripper_Open: gripPct,
    Finger_Splay: splayPct,
    Wrist_Rotate: num(vars, "Wrist_Rotate", 40),
  }), [fingerCount, gripPct, splayPct, vars]);

  const baseRadius = 0.46, baseHeight = 0.22;
  const pedestalHeight = 0.34, pedestalTopRadius = 0.26, pedestalBottomRadius = 0.30;
  const collarRShoulder = 0.28, collarRElbow = 0.25, collarRWrist = 0.23, collarH = 0.13;
  const upperLen = 1.18, foreLen = 1.02, wristLen = 0.48;
  const upperX = 0.48, upperZ = 0.40, foreX = 0.46, foreZ = 0.38, wristX = 0.40, wristZ = 0.34;
  const upperR = 0.15, foreR = 0.14, wristR = 0.12;
  const palmW = 0.62, palmH = 0.18, palmD = 0.44, palmRadius = 0.12;
  const railW = 0.62, railH = 0.055, railD = 0.12, railR = 0.06;
  const cuffR = 0.18, cuffH = 0.14;

  return (
    <>
      <group position={position} scale={scale}>
        <group rotation={[0, baseYaw, 0]}>
          <mesh castShadow receiveShadow position={[0, baseHeight / 2, 0]}>
            <cylinderGeometry args={[baseRadius, baseRadius, baseHeight, 72]} />
            <DarkMat />
          </mesh>

          <mesh castShadow receiveShadow position={[0, baseHeight + pedestalHeight / 2, 0]}>
            <cylinderGeometry args={[pedestalTopRadius, pedestalBottomRadius, pedestalHeight, 56]} />
            <ShellMat />
          </mesh>

          <mesh castShadow receiveShadow position={[0, baseHeight + pedestalHeight, 0]}>
            <cylinderGeometry args={[collarRShoulder * 0.82, collarRShoulder * 0.82, collarH * 0.62, 48]} />
            <DarkMat />
          </mesh>

          <group position={[0, baseHeight + pedestalHeight, 0]}>
            <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[collarRShoulder, collarRShoulder, collarH, 64]} />
              <DarkMat />
            </mesh>

            <group rotation={[shoulderPitch, 0, 0]}>
              <group position={[0, upperLen / 2, 0]}>
                <RBox size={[upperX, upperLen, upperZ]} r={upperR} />
              </group>

              <group position={[0, upperLen, 0]}>
                <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[collarRElbow, collarRElbow, collarH, 64]} />
                  <DarkMat />
                </mesh>

                <group rotation={[elbowPitch, 0, 0]}>
                  <group position={[0, foreLen / 2, 0]}>
                    <RBox size={[foreX, foreLen, foreZ]} r={foreR} />
                  </group>

                  <group position={[0, foreLen, 0]}>
                    <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                      <cylinderGeometry args={[collarRWrist, collarRWrist, collarH, 64]} />
                      <DarkMat />
                    </mesh>

                    <group rotation={[wristPitch, 0, 0]}>
                      <group rotation={[0, 0, wristRoll]}>
                        <group rotation={[0, 0, wristRotate]}>
                          <group position={[0, wristLen / 2, 0]}>
                            <RBox size={[wristX, wristLen, wristZ]} r={wristR} />
                          </group>

                          <group position={[0, wristLen, 0]} rotation={[handPitch, handYaw, 0]}>
                            <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                              <cylinderGeometry args={[cuffR, cuffR, cuffH, 64]} />
                              <DarkMat />
                            </mesh>

                            <group position={[0, 0.02, 0.09]}>
                              <RoundedBox args={[palmW, palmH, palmD]} radius={palmRadius} smoothness={14} castShadow receiveShadow>
                                <ShellMat />
                              </RoundedBox>

                              <group position={[0, 0.02, palmD * 0.41]}>
                                <RoundedBox args={[railW, railH, railD]} radius={railR} smoothness={12} castShadow receiveShadow>
                                  <DarkMat />
                                </RoundedBox>
                              </group>

                              <group position={[0, fingerMountY, fingerMountZ]}>
                                {fingerOffsets.map((o, i) => (
                                  <Finger
                                    key={i}
                                    base={o}
                                    yaw={fingerYaws[i]}
                                    openZ={openZ}
                                    curl={degToRad(fingerCurlsDeg[i])}
                                  />
                                ))}

                                {thumbEnabled ? (
                                  <group position={THUMB_BASE_FIXED} rotation={[thumbPitch, thumbYaw, THUMB_ROLL_FIXED]}>
                                    <Thumb openZ={openZ} curlRad={thumbCurl} />
                                  </group>
                                ) : null}
                              </group>
                            </group>
                          </group>
                        </group>
                      </group>
                    </group>
                  </group>
                </group>
              </group>
            </group>
          </group>
        </group>
      </group>

      <Html fullscreen>
        <div style={{ position: "absolute", right: 18, bottom: 18, pointerEvents: "none" }}>
          <div className="select-none rounded-2xl bg-black/45 ring-1 ring-white/15 backdrop-blur-xl px-3 py-2 text-[11px] text-white/85 min-w-[290px]">
            <div className="text-white/55 tracking-[0.16em] uppercase text-[10px]">Arm Telemetry</div>
            <div className="mt-1 flex items-center justify-between"><span className="text-white/60">Finger_Count</span><span className="font-semibold text-white/95">{telemetry.Finger_Count}</span></div>
            <div className="mt-1 flex items-center justify-between"><span className="text-white/60">Gripper_Open</span><span className="font-semibold text-white/95">{telemetry.Gripper_Open.toFixed(0)}%</span></div>
            <div className="mt-1 flex items-center justify-between"><span className="text-white/60">Finger_Splay</span><span className="font-semibold text-white/95">{telemetry.Finger_Splay.toFixed(0)}%</span></div>
            <div className="mt-1 flex items-center justify-between"><span className="text-white/60">Wrist_Rotate</span><span className="font-semibold text-white/95">{telemetry.Wrist_Rotate.toFixed(0)}°</span></div>
          </div>
        </div>
      </Html>
    </>
  );
}
