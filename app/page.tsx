"use client";

import { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Center, ContactShadows, Float, Text } from "@react-three/drei";
import * as THREE from "three";

// --- MATERIALS ---
const materials = {
  metal: new THREE.MeshStandardMaterial({ color: "#cbd5e1", metalness: 0.8, roughness: 0.2 }),
  charred: new THREE.MeshStandardMaterial({ color: "#111", emissive: "#b91c1c", emissiveIntensity: 2 }),
  gold: new THREE.MeshStandardMaterial({ color: "#fcd34d", metalness: 0.5, roughness: 0.2 }),
  pcb: new THREE.MeshStandardMaterial({ color: "#064e3b", roughness: 0.3 })
};

// --- 3D COMPONENTS ---
function WindTurbine({ status, vars }: { status: string, vars: any }) {
  const ref = useRef<THREE.Group>(null);
  const blades = vars?.blade_count || 3;
  useFrame((_, delta) => { if(ref.current && status!=='CRITICAL_FAILURE') ref.current.rotation.z -= delta*2; });
  return (
      <group position={[0,-2,0]}>
          <mesh position={[0,3,0]} material={materials.metal}><cylinderGeometry args={[0.2,0.5,6]} /></mesh>
          <group position={[0,6,0.2]} ref={ref}>
              <mesh rotation={[1.57,0,0]} material={materials.metal}><coneGeometry args={[0.5,0.8]} /></mesh>
              {[...Array(blades)].map((_,i) => (
                  <group key={i} rotation={[0,0,i/blades*6.28]}><mesh position={[0,2.5,0]} material={status==='CRITICAL_FAILURE'?materials.charred:materials.metal}><boxGeometry args={[0.4,5,0.1]} /></mesh></group>
              ))}
          </group>
      </group>
  );
}

function RobotArm({ status }: { status: string }) {
   const ref = useRef<THREE.Group>(null);
   useFrame((state) => { if (status!=='CRITICAL_FAILURE' && ref.current) ref.current.rotation.y = state.mouse.x * 0.5; });
   return (
     <group ref={ref} position={[0,-2,0]}>
        <mesh material={materials.metal}><cylinderGeometry args={[1,1.2,0.5]} /></mesh>
        <mesh position={[0,2,0]} material={status==='CRITICAL_FAILURE'?materials.charred:materials.metal}><boxGeometry args={[0.5,4,0.5]} /></mesh>
     </group>
   );
}

function CircuitBoard({ status }: { status: string }) {
  const isFried = status === 'CRITICAL_FAILURE';
  return (
    <group rotation={[Math.PI/4, Math.PI/4, 0]}>
       <mesh material={materials.pcb}><boxGeometry args={[4, 0.1, 3]} /></mesh>
       <group position={[0, 0.5, 0]}>
          <mesh rotation={[0,0,Math.PI/2]}>
             <cylinderGeometry args={[0.3, 0.3, 1.2, 32]} />
             <meshStandardMaterial color={isFried ? "#111" : "#fcd34d"} emissive={isFried ? "#f00" : "#000"} emissiveIntensity={isFried?2:0} />
          </mesh>
          {isFried && <Text position={[0, 1, 0]} fontSize={0.5} color="red">FRIED</Text>}
       </group>
    </group>
  );
}

// --- FLASHCARD ENGINE ---
function FlashcardMode({ initialCards, onClose }: { initialCards: any[], onClose: () => void }) {
  const [deck, setDeck] = useState(initialCards);
  const [learningQueue, setLearningQueue] = useState<any[]>([]); 
  const [masteredCount, setMasteredCount] = useState(0);
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [viewState, setViewState] = useState<'STUDYING' | 'SUMMARY' | 'VICTORY'>('STUDYING');

  if (deck.length === 0) return null;
  const current = deck[index];

  const handleSwipe = (mastered: boolean) => {
    setIsFlipped(false);
    if (mastered) setMasteredCount(prev => prev + 1);
    else setLearningQueue(prev => [...prev, current]);

    setTimeout(() => {
        if (index < deck.length - 1) setIndex(prev => prev + 1);
        else finishRound(mastered);
    }, 200);
  };

  const finishRound = (lastMastered: boolean) => {
     const finalQueue = lastMastered ? learningQueue : [...learningQueue, current];
     if (finalQueue.length === 0) setViewState('VICTORY');
     else setViewState('SUMMARY');
  };

  const restartRound = () => {
      setDeck(learningQueue);
      setLearningQueue([]);
      setIndex(0);
      setViewState('STUDYING');
  };

  if (viewState === 'VICTORY') {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md">
            <div className="text-center p-8 bg-slate-900 border border-emerald-500 rounded-2xl shadow-2xl">
                <h2 className="text-4xl font-bold text-emerald-400 mb-4">🎉 Deck Mastered!</h2>
                <button onClick={onClose} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold">Return to Notes</button>
            </div>
        </div>
      );
  }

  if (viewState === 'SUMMARY') {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-md">
            <div className="text-center p-8 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-6">Round Complete</h2>
                <p className="mb-4 text-slate-400">Mastered: {masteredCount} | Learning: {learningQueue.length}</p>
                <button onClick={restartRound} className="w-full py-3 bg-white text-black hover:bg-gray-200 rounded-lg font-bold mb-3">Keep Learning ({learningQueue.length})</button>
                <button onClick={onClose} className="w-full py-3 text-slate-400 hover:text-white">Exit</button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-md" onClick={(e) => e.stopPropagation()}>
      <div className="w-full max-w-xl px-4">
        <div 
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative w-full h-80 cursor-pointer group perspective"
          style={{ perspective: "1000px" }}
        >
           <div className={`relative w-full h-full duration-500 transition-transform ${isFlipped ? 'rotate-y-180' : ''}`} style={{ transformStyle: "preserve-3d", transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)" }}>
              <div className="absolute inset-0 bg-slate-900 border-2 border-slate-700 rounded-2xl flex items-center justify-center p-8 text-center" style={{ backfaceVisibility: "hidden" }}>
                 <h3 className="text-2xl font-bold text-white">{current?.front}</h3>
                 <p className="absolute bottom-4 text-xs text-slate-500 uppercase">Tap to Flip</p>
              </div>
              <div className="absolute inset-0 bg-emerald-950 border-2 border-emerald-500/50 rounded-2xl flex items-center justify-center p-8 text-center" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                 <h3 className="text-xl font-medium text-emerald-100">{current?.back}</h3>
              </div>
           </div>
        </div>
        <div className="flex gap-4 mt-8 justify-center">
           <button onClick={() => handleSwipe(false)} className="px-8 py-4 rounded-full bg-slate-800 text-slate-300 font-bold w-1/2">Still Learning</button>
           <button onClick={() => handleSwipe(true)} className="px-8 py-4 rounded-full bg-emerald-600 text-white font-bold w-1/2">Mastered</button>
        </div>
        <button onClick={onClose} className="mt-8 text-slate-500 hover:text-white block mx-auto">Exit</button>
      </div>
    </div>
  );
}

// --- MAIN APP ---
export default function Home() {
  const [notes, setNotes] = useState<any[]>([]);
  const [activeNote, setActiveNote] = useState<any>(null);
  const [code, setCode] = useState("");
  
  const [simData, setSimData] = useState<any>(null);
  const [status, setStatus] = useState("OPTIMAL");
  const [recommendation, setRecommendation] = useState("");
  const [explanation, setExplanation] = useState("");
  const [isSimEnabled, setIsSimEnabled] = useState(true);
  
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [askPrompt, setAskPrompt] = useState("");
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [cardCount, setCardCount] = useState(5);
  const [isStudyMode, setIsStudyMode] = useState(false);
  const [isAutoFixing, setIsAutoFixing] = useState(false);
  const [deckLoading, setDeckLoading] = useState(false);

  useEffect(() => {
    fetch('/api/notes').then(res => res.json()).then(data => {
      setNotes(data);
      if (data.length > 0) { setActiveNote(data[0]); setCode(data[0].content); }
      else createNewNote();
    });
  }, []);

  const createNewNote = async () => {
    const res = await fetch('/api/notes', { method: 'POST', body: JSON.stringify({ title: "New Physics Note", content: "" }) });
    const newNote = await res.json();
    setNotes([newNote, ...notes]);
    setActiveNote(newNote); setCode("");
  };

  const deleteNote = async (e: any, id: string) => {
    e.stopPropagation();
    await fetch('/api/notes', { method: 'DELETE', body: JSON.stringify({ id }) });
    const remaining = notes.filter(n => n.id !== id);
    setNotes(remaining);
    if (activeNote?.id === id) {
        if (remaining.length > 0) { setActiveNote(remaining[0]); setCode(remaining[0].content); }
        else { createNewNote(); }
    }
  };

  const saveNote = async () => {
    if (!activeNote) return;
    // FIX: Generate title from first line of actual text
    const title = code.split('\n').find(l => l.trim().length > 0)?.substring(0,25) || "Untitled Note";
    await fetch('/api/notes', { method: 'POST', body: JSON.stringify({ id: activeNote.id, content: code, title }) });
    setNotes(prev => prev.map(n => n.id === activeNote.id ? { ...n, title, content: code } : n));
  };

  const handleAskLoomin = async () => {
    const promptHeader = `\n// ??? ASK LOOMIN: ${askPrompt}\n// -------------------------\n`;
    try {
        const res = await fetch('/api/ask', { method: 'POST', body: JSON.stringify({ prompt: askPrompt, context: code }) });
        const data = await res.json();
        const newCode = promptHeader + data.result + "\n\n" + code;
        setCode(newCode);
        setIsAskOpen(false); 
        setAskPrompt("");
        // FIX: Force Sim Update immediately after AI writes
        runSimulation(newCode); 
    } catch(e) {}
  };

  // FIX: Robust Auto-Fixer
  const handleAutoFix = () => {
    setIsAutoFixing(true);
    let newCode = code;
    
    // 1. Apply Logic Fixes
    if (recommendation.includes("wind_speed")) newCode = newCode.replace(/wind_speed\s*[:=]\s*\d+\s*(mph|m\/s)?/gi, "wind_speed = 45 mph");
    if (recommendation.includes("blade_count")) newCode = newCode.replace(/blade_count\s*[:=]\s*\d+/gi, "blade_count = 3");
    if (recommendation.includes("payload")) newCode = newCode.replace(/payload\s*[:=]\s*\d+\s*(kg|lbs)?/gi, "payload = 10 kg");

    // 2. Add Timestamp to FORCE Cache Miss
    const timeId = new Date().getTime().toString().slice(-4);
    newCode += `\n\n// [AUTO-FIX APPLIED #${timeId}]: ${explanation.substring(0, 60)}...`;
    
    // 3. Update State & Run
    setCode(newCode);
    runSimulation(newCode); 
    setTimeout(() => setIsAutoFixing(false), 800);
  };

  const generateDeck = async () => {
    setDeckLoading(true);
    const res = await fetch('/api/flashcards', { method: 'POST', body: JSON.stringify({ notes: code, count: cardCount }) });
    const data = await res.json();
    setFlashcards(data.cards || []);
    setDeckLoading(false);
    setIsStudyMode(true);
  };

  const runSimulation = async (noteContent: string) => {
      if (!isSimEnabled || noteContent.length < 5) return;
      try {
        const res = await fetch("/api/extract", { method: "POST", body: JSON.stringify({ notes: noteContent }) });
        const data = await res.json();
        setSimData(data);
        setStatus(data.simulation?.status || "OPTIMAL");
        setRecommendation(data.simulation?.recommendation || "");
        setExplanation(data.simulation?.aiExplanation || "");
      } catch (e) {}
  };

  useEffect(() => {
    const timer = setTimeout(() => runSimulation(code), 1500);
    return () => clearTimeout(timer);
  }, [code, isSimEnabled]);

  const topic = simData?.extraction?.topic || 'wind_turbine';
  const vars = simData?.extraction?.vars || {};

  return (
    <main className="flex h-screen w-full bg-[#0f172a] text-white font-sans overflow-hidden relative">
      
      {isStudyMode && <FlashcardMode initialCards={flashcards} onClose={() => setIsStudyMode(false)} />}

      <div className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col shrink-0 z-20">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center">
          <span className="font-bold text-slate-200">Notebooks</span>
          <button onClick={createNewNote} className="text-xl text-blue-400 hover:text-blue-300">+</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {notes.map(n => (
            <div key={n.id} onClick={()=>{setActiveNote(n); setCode(n.content)}} className={`p-3 border-b border-slate-900 cursor-pointer flex justify-between group ${activeNote?.id===n.id?'bg-slate-900 border-l-2 border-blue-500':''}`}>
               <p className="truncate text-sm text-slate-300 font-medium w-40">{n.title}</p>
               <button onClick={(e) => deleteNote(e, n.id)} className="text-slate-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">🗑️</button>
            </div>
          ))}
        </div>
      </div>

      <div className={`flex flex-col border-r border-slate-700 bg-slate-900 transition-all duration-500 ${isSimEnabled ? 'w-5/12' : 'flex-1'}`}>
         {/* HEADER - FIXED LAYOUT */}
         <div className="p-3 bg-slate-800 border-b border-slate-700 flex justify-between items-center shrink-0">
             <div className="flex gap-2">
               <button onClick={saveNote} className="px-3 py-1 bg-blue-600 text-xs rounded font-bold hover:bg-blue-500">Save</button>
               <button onClick={() => setIsAskOpen(!isAskOpen)} className="px-3 py-1 bg-purple-600 text-xs rounded font-bold hover:bg-purple-500">✨ Ask AI</button>
             </div>
             
             <div className="flex items-center gap-3">
                {/* GENERATE DECK */}
                <div className="flex items-center gap-1 bg-slate-900 rounded p-1 border border-slate-700">
                    <input type="range" min="3" max="10" value={cardCount} onChange={(e) => setCardCount(parseInt(e.target.value))} className="w-12 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"/>
                    <span className="text-[10px] text-slate-400 w-3">{cardCount}</span>
                    <button onClick={generateDeck} disabled={deckLoading} className="text-[10px] bg-emerald-900 text-emerald-400 px-2 py-1 rounded hover:bg-emerald-800">
                        {deckLoading ? "..." : "Deck"}
                    </button>
                </div>

                {/* SIM TOGGLE (MOVED TO HEADER) */}
                <button onClick={() => setIsSimEnabled(!isSimEnabled)} className={`flex items-center gap-2 px-3 py-1 rounded border transition-all ${isSimEnabled ? 'bg-emerald-900 border-emerald-500 text-emerald-100' : 'bg-slate-700 border-slate-600 text-slate-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${isSimEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                    <span className="text-[10px] font-bold">{isSimEnabled ? "ON" : "OFF"}</span>
                </button>
             </div>
         </div>

         {isAskOpen && (
           <div className="p-4 bg-slate-800 border-b border-slate-700">
             <input autoFocus className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" placeholder="Ex: Fix my windmill..." value={askPrompt} onChange={(e)=>setAskPrompt(e.target.value)} onKeyDown={(e)=>e.key==='Enter' && handleAskLoomin()} />
           </div>
         )}
         
         <div className="flex-1 relative min-h-0">
            <Editor height="100%" defaultLanguage="markdown" theme="vs-dark" value={code} onChange={(val) => setCode(val || "")} options={{fontFamily: "JetBrains Mono", fontSize: 14, minimap:{enabled:false}, wordWrap:"on"}}/>
         </div>
      </div>

      <div className={`relative bg-black transition-all duration-500 overflow-hidden ${isSimEnabled ? 'flex-1 opacity-100' : 'w-0 opacity-0'}`}>
         {isSimEnabled && (
           <>
             <div className="absolute top-8 left-8 z-10 w-80 pointer-events-none">
                <div className={`p-6 rounded-xl border backdrop-blur-md shadow-2xl transition-all ${status === 'CRITICAL_FAILURE' ? 'bg-red-950/90 border-red-500' : 'bg-slate-900/50 border-emerald-500/30'}`}>
                  <p className={`text-2xl font-mono font-bold ${status==='CRITICAL_FAILURE'?'text-red-400':'text-emerald-400'}`}>{status}</p>
                  
                  {status === 'CRITICAL_FAILURE' && (
                      <div className="mt-4 pointer-events-auto animate-in fade-in">
                          <p className="text-xs text-red-200 mb-3 leading-relaxed">{explanation}</p>
                          <div className="h-px bg-red-500/30 w-full mb-3" />
                          <button onClick={handleAutoFix} disabled={isAutoFixing} className="w-full py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-xs flex items-center justify-center gap-2 shadow-lg">
                             {isAutoFixing ? "FIXING..." : "🔧 AUTO-FIX CODE"}
                          </button>
                      </div>
                  )}
                </div>
             </div>

             <Canvas shadows camera={{ position: [4, 4, 8], fov: 45 }}>
                <Environment preset="city" />
                <ambientLight intensity={0.7} />
                <spotLight position={[10, 10, 10]} intensity={2} castShadow />
                <Center>
                  <Float speed={2} rotationIntensity={0.2}>
                     {topic === 'wind_turbine' && <WindTurbine status={status} vars={vars} />}
                     {topic === 'robot_arm' && <RobotArm status={status} />}
                     {topic === 'electronics' && <CircuitBoard status={status} />}
                  </Float>
                </Center>
                <ContactShadows opacity={0.4} scale={10} blur={2} />
                <OrbitControls makeDefault />
             </Canvas>
           </>
         )}
      </div>
    </main>
  );
}