import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Project } from "../data/projects";

type Draft = {
  cover: string;
  coverCrop: { x: number; y: number; scale: number };
  title: string;
  client: string;
  category: string;
  description: string;
  year: string;
  location: string;
  format: string;
  video: string;
  poster: string;
};

type AdminState = {
  authenticated: boolean;
  editing: boolean;
  drafts: Record<string, Partial<Draft>>;
  login: (code: string) => boolean;
  logout: () => void;
  setEditing: (v: boolean) => void;
  updateDraft: (slug: string, patch: Partial<Draft>) => void;
  commitDraft: (slug: string) => void;
  resetDraft: (slug: string) => void;
  getProject: (p: Project) => Project;
};

const Ctx = createContext<AdminState | null>(null);
const STORAGE_KEY = "sim-admin-v1";
const DRAFT_KEY = "sim-drafts-v1";

const EMPTY_DRAFT: Partial<Draft> = {};

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(false);
  const [editing, setEditing] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, Partial<Draft>>>({});

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const auth = localStorage.getItem(STORAGE_KEY);
      if (auth === "1") setAuthenticated(true);
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setDrafts(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
    } catch {
      /* ignore */
    }
  }, [drafts]);

  const login = useCallback((code: string) => {
    // Demo gate: any 6+ char code unlocks (preserved from original SIM flow).
    // In production this would hit a server-side validation.
    if (code.trim().length >= 4) {
      setAuthenticated(true);
      try {
        localStorage.setItem(STORAGE_KEY, "1");
      } catch {
        /* ignore */
      }
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setAuthenticated(false);
    setEditing(false);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const updateDraft = useCallback((slug: string, patch: Partial<Draft>) => {
    setDrafts((prev) => ({ ...prev, [slug]: { ...(prev[slug] ?? EMPTY_DRAFT), ...patch } }));
  }, []);

  const commitDraft = useCallback((slug: string) => {
    // In a real build this would POST to CMS. For now, drafts are kept in
    // localStorage so the editor can revisit and refine.
    setDrafts((prev) => {
      const next = { ...prev };
      if (next[slug]) {
        next[slug] = { ...next[slug], _committed: true } as Partial<Draft>;
      }
      return next;
    });
  }, []);

  const resetDraft = useCallback((slug: string) => {
    setDrafts((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
  }, []);

  const getProject = useCallback(
    (p: Project): Project => {
      const d = drafts[p.slug];
      if (!d) return p;
      return {
        ...p,
        title: d.title ?? p.title,
        client: d.client ?? p.client,
        description: d.description ?? p.description,
        cover: d.cover ?? p.cover,
        year: d.year ?? p.year,
        location: d.location ?? p.location,
        format: d.format ?? p.format,
        video: d.video ?? p.video,
        poster: d.poster ?? p.poster,
      };
    },
    [drafts]
  );

  const value = useMemo<AdminState>(
    () => ({
      authenticated,
      editing,
      drafts,
      login,
      logout,
      setEditing,
      updateDraft,
      commitDraft,
      resetDraft,
      getProject,
    }),
    [authenticated, editing, drafts, login, logout, updateDraft, commitDraft, resetDraft, getProject]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAdmin() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAdmin must be used inside <AdminProvider>");
  return v;
}

export function useOptionalAdmin() {
  return useContext(Ctx);
}
