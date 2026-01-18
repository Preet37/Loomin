"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, RoundedBox } from "@react-three/drei";
import { useLoominStore } from "../store";

// Generic 3D visualization for topics without specific simulations
// This creates basic visual representations of various concepts

export default function GenericVisual() {
  const groupRef = useRef();
  
  const activeId = useLoominStore((s) => s.activeId);
  const journals = useLoominStore((s) => s.journals);
  const active = journals.find((j) => j.id === activeId) || journals[0];
  const vars = active?.vars || {};
  const editorValue = active?.editorValue || "";
  
  // Detect topic from editor content
  const topic = useMemo(() => {
    const lower = editorValue.toLowerCase();
    if (lower.includes('motherboard') || lower.includes('cpu') || lower.includes('ram') || lower.includes('chipset')) {
      return 'motherboard';
    }
    if (lower.includes('circuit') || lower.includes('resistor') || lower.includes('capacitor') || lower.includes('led')) {
      return 'circuit';
    }
    if (lower.includes('gear') || lower.includes('mechanical') || lower.includes('lever') || lower.includes('pulley')) {
      return 'mechanical';
    }
    if (lower.includes('solar') || lower.includes('panel') || lower.includes('photovoltaic')) {
      return 'solar';
    }
    if (lower.includes('engine') || lower.includes('piston') || lower.includes('cylinder')) {
      return 'engine';
    }
    return 'generic';
  }, [editorValue]);

  // Gentle rotation animation
  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      {topic === 'motherboard' && <MotherboardVisual vars={vars} />}
      {topic === 'circuit' && <CircuitVisual vars={vars} />}
      {topic === 'mechanical' && <MechanicalVisual vars={vars} />}
      {topic === 'solar' && <SolarPanelVisual vars={vars} />}
      {topic === 'engine' && <EngineVisual vars={vars} />}
      {topic === 'generic' && <GenericPlaceholder />}
      
      <Html position={[0, -3, 0]} center>
        <div className="bg-slate-900/90 px-4 py-2 rounded-xl border border-white/10 text-center">
          <p className="text-xs text-white/50 uppercase tracking-wider">Visualizing</p>
          <p className="text-sm font-semibold text-white capitalize">{topic}</p>
        </div>
      </Html>
    </group>
  );
}

// MOTHERBOARD VISUALIZATION
function MotherboardVisual({ vars }) {
  const cpuSize = vars.CPU_Size || 1;
  const ramSlots = vars.RAM_Slots || 4;
  
  return (
    <group>
      {/* Main PCB Board */}
      <RoundedBox args={[6, 0.15, 5]} radius={0.05} position={[0, 0, 0]}>
        <meshStandardMaterial color="#1a472a" metalness={0.3} roughness={0.7} />
      </RoundedBox>
      
      {/* CPU Socket */}
      <group position={[-1, 0.15, 0]}>
        <RoundedBox args={[cpuSize * 1.2, 0.1, cpuSize * 1.2]} radius={0.02}>
          <meshStandardMaterial color="#4a5568" metalness={0.6} roughness={0.3} />
        </RoundedBox>
        {/* CPU Chip */}
        <RoundedBox args={[cpuSize, 0.15, cpuSize]} radius={0.02} position={[0, 0.12, 0]}>
          <meshStandardMaterial color="#2d3748" metalness={0.8} roughness={0.2} />
        </RoundedBox>
        {/* Heatsink */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[cpuSize * 1.1, 0.4, cpuSize * 1.1]} />
          <meshStandardMaterial color="#a0aec0" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>
      
      {/* RAM Slots */}
      {Array.from({ length: ramSlots }).map((_, i) => (
        <group key={i} position={[1.5, 0.15, -1.5 + i * 0.6]}>
          {/* Slot */}
          <RoundedBox args={[0.15, 0.1, 2]} radius={0.01}>
            <meshStandardMaterial color="#2d3748" />
          </RoundedBox>
          {/* RAM Stick */}
          <RoundedBox args={[0.08, 0.5, 1.8]} radius={0.01} position={[0, 0.3, 0]}>
            <meshStandardMaterial color="#48bb78" metalness={0.4} />
          </RoundedBox>
        </group>
      ))}
      
      {/* Chipset */}
      <RoundedBox args={[0.8, 0.1, 0.8]} radius={0.02} position={[0.5, 0.12, 1.5]}>
        <meshStandardMaterial color="#1a202c" metalness={0.5} roughness={0.4} />
      </RoundedBox>
      
      {/* PCIe Slots */}
      {[0, 1, 2].map((i) => (
        <RoundedBox key={i} args={[4, 0.08, 0.15]} radius={0.01} position={[-0.5, 0.1, -2 + i * 0.4]}>
          <meshStandardMaterial color="#1a202c" />
        </RoundedBox>
      ))}
      
      {/* I/O Panel */}
      <RoundedBox args={[0.3, 0.4, 2]} radius={0.02} position={[-2.8, 0.25, 0]}>
        <meshStandardMaterial color="#4a5568" metalness={0.5} />
      </RoundedBox>
      
      {/* Capacitors */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-2 + (i % 4) * 0.3, 0.2, 1.8 - Math.floor(i / 4) * 0.3]}>
          <cylinderGeometry args={[0.05, 0.05, 0.15, 16]} />
          <meshStandardMaterial color="#2b6cb0" metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// CIRCUIT BOARD VISUALIZATION
function CircuitVisual({ vars }) {
  return (
    <group>
      {/* PCB */}
      <RoundedBox args={[4, 0.1, 3]} radius={0.05}>
        <meshStandardMaterial color="#234e3e" metalness={0.2} roughness={0.8} />
      </RoundedBox>
      
      {/* LED */}
      <mesh position={[-1, 0.2, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Resistors */}
      {[-0.5, 0, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.1, 0.8]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
          <meshStandardMaterial color="#d69e2e" />
        </mesh>
      ))}
      
      {/* Capacitors */}
      <mesh position={[1, 0.25, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.4, 16]} />
        <meshStandardMaterial color="#1a365d" metalness={0.4} />
      </mesh>
      
      {/* IC Chip */}
      <RoundedBox args={[0.6, 0.1, 0.3]} radius={0.02} position={[0, 0.1, -0.8]}>
        <meshStandardMaterial color="#1a202c" />
      </RoundedBox>
    </group>
  );
}

// MECHANICAL SYSTEM VISUALIZATION
function MechanicalVisual({ vars }) {
  const gearRef = useRef();
  
  useFrame((state, delta) => {
    if (gearRef.current) {
      gearRef.current.rotation.z += delta * 2;
    }
  });
  
  return (
    <group>
      {/* Base plate */}
      <RoundedBox args={[4, 0.2, 3]} radius={0.05}>
        <meshStandardMaterial color="#4a5568" metalness={0.6} roughness={0.4} />
      </RoundedBox>
      
      {/* Gear */}
      <group position={[0, 0.5, 0]} ref={gearRef}>
        <mesh>
          <cylinderGeometry args={[0.8, 0.8, 0.2, 32]} />
          <meshStandardMaterial color="#a0aec0" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Gear teeth */}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={i} rotation={[0, (i / 12) * Math.PI * 2, 0]} position={[0, 0, 0]}>
            <boxGeometry args={[0.15, 0.2, 0.1]} />
            <meshStandardMaterial color="#a0aec0" metalness={0.7} />
          </mesh>
        ))}
      </group>
      
      {/* Lever */}
      <mesh position={[1.5, 0.4, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[2, 0.15, 0.15]} />
        <meshStandardMaterial color="#718096" metalness={0.5} />
      </mesh>
      
      {/* Fulcrum */}
      <mesh position={[0.8, 0.2, 0]}>
        <coneGeometry args={[0.2, 0.3, 4]} />
        <meshStandardMaterial color="#2d3748" metalness={0.6} />
      </mesh>
    </group>
  );
}

// SOLAR PANEL VISUALIZATION
function SolarPanelVisual({ vars }) {
  const panelCount = vars.Panel_Count || 6;
  
  return (
    <group rotation={[-0.3, 0, 0]}>
      {/* Panel Frame */}
      <RoundedBox args={[4, 0.1, 3]} radius={0.05}>
        <meshStandardMaterial color="#2d3748" metalness={0.7} roughness={0.3} />
      </RoundedBox>
      
      {/* Solar Cells */}
      {Array.from({ length: panelCount }).map((_, i) => (
        <RoundedBox 
          key={i} 
          args={[0.9, 0.02, 0.9]} 
          radius={0.02} 
          position={[-1.3 + (i % 3) * 1.1, 0.08, -0.6 + Math.floor(i / 3) * 1.1]}
        >
          <meshStandardMaterial color="#1a365d" metalness={0.3} roughness={0.5} />
        </RoundedBox>
      ))}
      
      {/* Stand */}
      <mesh position={[0, -0.8, 0.5]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.15, 1.5, 0.15]} />
        <meshStandardMaterial color="#4a5568" metalness={0.6} />
      </mesh>
    </group>
  );
}

// ENGINE VISUALIZATION
function EngineVisual({ vars }) {
  const pistonRef = useRef();
  
  useFrame((state) => {
    if (pistonRef.current) {
      pistonRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 5) * 0.3;
    }
  });
  
  return (
    <group>
      {/* Engine Block */}
      <RoundedBox args={[2, 1.5, 1.5]} radius={0.1}>
        <meshStandardMaterial color="#4a5568" metalness={0.6} roughness={0.4} />
      </RoundedBox>
      
      {/* Cylinder */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 1, 32]} />
        <meshStandardMaterial color="#2d3748" metalness={0.7} roughness={0.3} />
      </mesh>
      
      {/* Piston */}
      <mesh ref={pistonRef} position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.3, 32]} />
        <meshStandardMaterial color="#a0aec0" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Crankshaft */}
      <mesh position={[0, -0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 2.5, 16]} />
        <meshStandardMaterial color="#718096" metalness={0.7} />
      </mesh>
    </group>
  );
}

// GENERIC PLACEHOLDER
function GenericPlaceholder() {
  return (
    <group>
      <mesh>
        <icosahedronGeometry args={[1.5, 1]} />
        <meshStandardMaterial color="#6366f1" wireframe opacity={0.7} transparent />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[1.2, 0]} />
        <meshStandardMaterial color="#8b5cf6" metalness={0.5} roughness={0.5} />
      </mesh>
    </group>
  );
}
