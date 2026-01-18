// app/loomin/page.jsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import Scene from "./Scene";
import JournalsNav from "./components/JournalsNav";
import { Leaf } from "lucide-react";
import { useLoominStore } from "./store";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

function debounce(fn, wait = 250) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

function extractKeyValuePairs(text) {
  const out = {};
  const re = /(^|\n)\s*([A-Za-z_][A-Za-z0-9_]*)\s*(?:=|:)\s*([-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?)\s*(?=\n|$)/g;
  let m;
  while ((m = re.exec(text)) !== null) {
    const key = m[2];
    const num = Number(m[3]);
    if (!Number.isNaN(num)) out[key] = num;
  }
  return out;
}

function computeRotationSpeed(vars) {
  const w = typeof vars?.Wind_Speed === "number" ? vars.Wind_Speed : 12;
  return Math.max(0, w) * 0.12;
}

export default function Page() {
  const updateFromStorage = useLoominStore((s) => s.updateFromStorage);
  const hasUpdated = useLoominStore((s) => s.hasUpdated);
  const journals = useLoominStore((s) => s.journals);
  const activeId = useLoominStore((s) => s.activeId);
  const setEditorValue = useLoominStore((s) => s.setEditorValue);
  const setVars = useLoominStore((s) => s.setVars);

  const [navOpen, setNavOpen] = useState(false);

  const active = useMemo(() => journals.find((j) => j.id === activeId) || journals[0], [journals, activeId]);
  const editorValue = active?.editorValue ?? "";
  const vars = active?.vars ?? {};
  const rotationSpeed = useMemo(() => computeRotationSpeed(vars || {}), [vars]);

  const debouncedRef = useRef(null);

  useEffect(() => {
    updateFromStorage();
  }, [updateFromStorage]);

  const onEditorChange = useMemo(() => {
    const handler = (value) => {
      const v = value ?? "";
      setEditorValue(v);
      setVars(extractKeyValuePairs(v));
    };
    debouncedRef.current = debounce(handler, 220);
    return (value) => debouncedRef.current?.(value);
  }, [setEditorValue, setVars]);

  useEffect(() => {
    if (!hasUpdated) return;
    setVars(extractKeyValuePairs(editorValue));
  }, [hasUpdated, activeId]);

  return (
    <div className="h-[100vh] overflow-hidden bg-[#070A0F] text-white selection:bg-white/20">
      <style>{`
        .loomin-scroll{scrollbar-gutter:stable}
        .loomin-scroll::-webkit-scrollbar{width:10px}
        .loomin-scroll::-webkit-scrollbar-track{background:rgba(255,255,255,0.04);border-radius:999px}
        .loomin-scroll::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.14);border:2px solid rgba(0,0,0,0);background-clip:padding-box;border-radius:999px}
        .loomin-scroll::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,0.20);border:2px solid rgba(0,0,0,0);background-clip:padding-box}
      `}</style>

      <div
        className="pointer-events-none fixed inset-0 opacity-[0.65]"
        style={{
          background:
            "radial-gradient(1200px 600px at 70% 20%, rgba(99,102,241,0.22), transparent 55%), radial-gradient(900px 520px at 20% 80%, rgba(16,185,129,0.16), transparent 58%), radial-gradient(700px 420px at 35% 30%, rgba(236,72,153,0.10), transparent 60%)",
        }}
      />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:42px_42px] opacity-[0.08]" />

      <div className="relative mx-auto h-full max-w-[1400px] px-4 py-4 grid grid-cols-[280px,1fr] gap-4">
        <JournalsNav open={navOpen} onToggle={() => setNavOpen((v) => !v)} />

        <div className="min-h-0 grid grid-rows-[auto,1fr] gap-4">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur-md flex items-center justify-center">
                <div className="h-4 w-4 rounded-sm bg-gradient-to-br from-indigo-400 via-fuchsia-300 to-emerald-300 opacity-95" />
              </div>
              <div className="leading-tight">
                <div className="text-sm tracking-[0.18em] uppercase text-white/55">Loomin</div>
                <div className="text-[15px] font-semibold text-white/92">{active?.name ?? "Journal"}</div>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-2 rounded-2xl bg-white/6 ring-1 ring-white/12 px-3 py-2 backdrop-blur-md">
              <div className="h-2 w-2 rounded-full bg-emerald-400/90 shadow-[0_0_18px_rgba(52,211,153,0.55)]" />
              <div className="text-xs text-white/65">Live sync</div>
              <div className="ml-3 text-xs text-white/55">Wind_Speed</div>
              <div className="text-xs font-semibold text-white/85">{typeof vars?.Wind_Speed === "number" ? vars.Wind_Speed : "—"}</div>
              <div className="ml-3 text-xs text-white/55">rotationSpeed</div>
              <div className="text-xs font-semibold text-white/85">{Number.isFinite(rotationSpeed) ? rotationSpeed.toFixed(2) : "0.00"}</div>
            </div>
          </header>

          <div className="min-h-0 grid grid-cols-12 gap-4">
            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="min-h-0 col-span-12 lg:col-span-4">
              <div className="h-full min-h-0 grid grid-rows-[0.92fr,1.08fr] gap-4">
                <div className="min-h-0 rounded-3xl bg-white/[0.055] ring-1 ring-white/12 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_90px_rgba(0,0,0,0.55)] overflow-hidden grid grid-rows-[auto,1fr]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="text-sm font-semibold text-white/90">Lecture</div>
                    <div className="text-xs text-white/55">Top-left</div>
                  </div>
                  <div className="min-h-0 p-3">
                    <div className="relative h-full rounded-2xl overflow-hidden bg-black/50 ring-1 ring-white/10">
                      <video className="h-full w-full object-cover opacity-95" controls playsInline src="/video/lecture.mp4" />
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
                    </div>
                  </div>
                </div>

                <div className="min-h-0 rounded-3xl bg-white/[0.055] ring-1 ring-white/12 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_90px_rgba(0,0,0,0.55)] overflow-hidden grid grid-rows-[auto,1fr]">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                    <div className="text-sm font-semibold text-white/90">Editor</div>
                    <div className="text-xs text-white/55">Bottom-left</div>
                  </div>
                  <div className="min-h-0 p-2">
                    <div className="h-full overflow-hidden rounded-2xl ring-1 ring-white/10 bg-[#0B1020]/70">
                      <Monaco
                        theme="vs-dark"
                        language="plaintext"
                        value={editorValue}
                        onChange={onEditorChange}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13,
                          lineHeight: 20,
                          padding: { top: 14, bottom: 14 },
                          renderLineHighlight: "gutter",
                          scrollBeyondLastLine: false,
                          smoothScrolling: true,
                          cursorSmoothCaretAnimation: "on",
                          fontLigatures: true,
                          bracketPairColorization: { enabled: true },
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04, duration: 0.5, ease: [0.22, 1, 0.36, 1] }} className="min-h-0 col-span-12 lg:col-span-8">
              <div className="h-full min-h-0 rounded-3xl bg-white/[0.055] ring-1 ring-white/12 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_30px_90px_rgba(0,0,0,0.55)] overflow-hidden grid grid-rows-[auto,1fr]">
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold text-white/90">3D Sandbox</div>
                  </div>
                  <div className="text-xs text-white/55">Right column</div>
                </div>

                <div className="relative min-h-0">
                  <Scene />
                  <div className="pointer-events-none absolute right-4 top-4 flex items-center gap-2 rounded-2xl bg-white/10 ring-1 ring-white/15 px-3 py-2 backdrop-blur-xl">
                    <Leaf className="h-4 w-4 text-emerald-300/90" />
                    <div className="text-xs font-semibold text-white/85">Sustainability</div>
                  </div>
                </div>
              </div>
            </motion.section>
          </div>
        </div>
      </div>
    </div>
  );
}
