// app/loomin/store.js
"use client";

import { create } from "zustand";

const DEFAULT_EDITOR = `Wind_Speed = 12
Blade_Pitch = 0
Yaw = 0
`;

const DEFAULT_VARS = { Wind_Speed: 12, Blade_Pitch: 0, Yaw: 0 };

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function safeParse(json, fallback) {
  try {
    const v = JSON.parse(json);
    return v ?? fallback;
  } catch {
    return fallback;
  }
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

function normalizeJournal(j) {
  const editorValue = typeof j?.editorValue === "string" ? j.editorValue : DEFAULT_EDITOR;
  const varsFromText = extractKeyValuePairs(editorValue);
  const vars = { ...DEFAULT_VARS, ...(j?.vars || {}), ...varsFromText };
  return {
    id: typeof j?.id === "string" ? j.id : uid(),
    name: typeof j?.name === "string" ? j.name : "Untitled",
    editorValue,
    vars,
  };
}

function loadFromLS() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("loomin.journals.v1");
  if (!raw) return null;
  return safeParse(raw, null);
}

function saveToLS(state) {
  if (typeof window === "undefined") return;
  const payload = { journals: state.journals, activeId: state.activeId };
  window.localStorage.setItem("loomin.journals.v1", JSON.stringify(payload));
}

const seedJournals = [normalizeJournal({ id: "default", name: "Journal 1", editorValue: DEFAULT_EDITOR, vars: DEFAULT_VARS })];

export const useLoominStore = create((set, get) => ({
  journals: seedJournals,
  activeId: "default",
  hasUpdated: false,

  updateFromStorage: () => {
    const saved = loadFromLS();
    if (!saved?.journals?.length) {
      set({ hasUpdated: true });
      return;
    }
    const journals = saved.journals.map(normalizeJournal);
    const activeId = journals.some((j) => j.id === saved.activeId) ? saved.activeId : journals[0].id;
    set({ journals, activeId, hasUpdated: true });
  },

  setActive: (id) => {
    set({ activeId: id });
    saveToLS(get());
  },

  createJournal: (name = "New Journal") => {
    const j = normalizeJournal({ id: uid(), name, editorValue: DEFAULT_EDITOR, vars: DEFAULT_VARS });
    set((s) => ({ journals: [j, ...s.journals], activeId: j.id }));
    saveToLS(get());
  },

  renameJournal: (id, name) => {
    set((s) => ({ journals: s.journals.map((j) => (j.id === id ? { ...j, name: name || "Untitled" } : j)) }));
    saveToLS(get());
  },

  deleteJournal: (id) => {
    const { journals, activeId } = get();
    if (journals.length <= 1) return;

    const next = journals.filter((j) => j.id !== id);
    const nextActive = activeId === id ? (next[0]?.id ?? activeId) : activeId;

    set({ journals: next, activeId: nextActive });
    saveToLS(get());
  },

  setEditorValue: (value) => {
    const { activeId } = get();
    const editorValue = value ?? "";
    const varsFromText = extractKeyValuePairs(editorValue);
    set((s) => ({
      journals: s.journals.map((j) =>
        j.id === activeId ? { ...j, editorValue, vars: { ...DEFAULT_VARS, ...(j.vars || {}), ...varsFromText } } : j
      ),
    }));
    saveToLS(get());
  },

  setVars: (varsPatch) => {
    const { activeId } = get();
    set((s) => ({
      journals: s.journals.map((j) =>
        j.id === activeId ? { ...j, vars: { ...DEFAULT_VARS, ...(j.vars || {}), ...(varsPatch || {}) } } : j
      ),
    }));
    saveToLS(get());
  },
}));
