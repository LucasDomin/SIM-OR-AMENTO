import { useState } from "react";
import { useLang } from "../contexts/LanguageContext";
import { useAdmin } from "../contexts/AdminContext";
import { projects } from "../data/projects";
import type { Project } from "../data/projects";
import { ProjectEditor } from "./ProjectEditor";
import { HeroEditor } from "./HeroEditor";
import { Logo } from "./Logo";
import { SpectrumBar } from "./ui";

/**
 * AdminDashboard — painel principal do estúdio após login.
 * Lista todos os projetos com thumbnails, indica os que têm rascunho
 * pendente, e abre o ProjectEditor com pré-visualização e crop.
 */
export function AdminDashboard({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { lang } = useLang();
  const { logout, drafts, setEditing, authenticated } = useAdmin();
  const [active, setActive] = useState<Project | null>(null);
  const [heroOpen, setHeroOpen] = useState(false);

  if (!open || !authenticated) return null;

  const label = (pt: string, en: string) => (lang === "pt" ? pt : en);

  return (
    <>
      <div className="fixed inset-0 z-[170] overflow-y-auto bg-noir-950 fade-in">
        <div className="mx-auto max-w-[1500px] px-5 py-8 md:px-10 md:py-12">
          <div className="flex flex-col gap-4 border-b border-noir-800 pb-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Logo compact />
              <span className="font-mono text-[10px] uppercase tracking-wide2 text-noir-400">
                / {label("Painel de edição", "Edit dashboard")}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setHeroOpen(true)}
                className="rounded-full border border-accent px-4 py-2 font-mono text-[10px] uppercase tracking-wide2 text-accent transition-colors hover:bg-accent hover:text-noir-950"
              >
                {label("Editar Banner", "Edit Hero")}
              </button>
              <button
                onClick={() => setEditing(true)}
                className="rounded-full bg-accent px-4 py-2 font-mono text-[10px] uppercase tracking-wide2 text-noir-950 transition-transform hover:scale-[1.02]"
              >
                {label("Ativar modo edição", "Turn edit mode on")}
              </button>
              <button
                onClick={logout}
                className="rounded-full border border-noir-700 px-4 py-2 font-mono text-[10px] uppercase tracking-wide2 text-noir-300 transition-colors hover:border-noir-500 hover:text-cream"
              >
                {label("Sair", "Sign out")}
              </button>
              <button
                onClick={onClose}
                className="rounded-full border border-noir-700 p-2 text-noir-400 transition-colors hover:border-noir-500 hover:text-cream"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          </div>

          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-noir-400">
            {label(
              "Clique em qualquer projeto para abrir o editor. Você poderá alterar textos e substituir/cortar imagens com pré-visualização antes de publicar. Rascunhos são guardados localmente.",
              "Click any project to open the editor. You can change text and replace/crop images with a live preview before publishing. Drafts are stored locally."
            )}
          </p>

          <SpectrumBar className="mt-8" />

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((p) => {
              const hasDraft = Boolean(drafts[p.slug]);
              return (
                <button
                  key={p.id}
                  onClick={() => setActive(p)}
                  className="group relative overflow-hidden rounded-sm border border-noir-700 bg-noir-900 text-left transition-all hover:border-noir-500"
                >
                  <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
                    <img
                      src={p.cover}
                      alt={p.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-noir-950/80 via-transparent to-transparent" />
                    {hasDraft && (
                      <span className="absolute left-3 top-3 rounded-full bg-accent px-3 py-1 font-mono text-[9px] uppercase tracking-wide2 text-noir-950">
                        {label("Rascunho", "Draft")}
                      </span>
                    )}
                    <span className="absolute right-3 top-3 font-mono text-[9px] uppercase tracking-wide2 text-cream/70">
                      #{p.id}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="font-mono text-[9px] uppercase tracking-wide2 text-accent">
                      {p.category} · {p.client}
                    </div>
                    <div className="mt-1 font-display text-xl text-cream">{p.title}</div>
                    <div className="mt-2 line-clamp-2 text-xs leading-relaxed text-noir-400">
                      {p.description}
                    </div>
                    <div className="mt-3 flex items-center justify-between font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                      <span>{p.year}</span>
                      <span className="transition-colors group-hover:text-cream">
                        {label("Editar →", "Edit →")}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <ProjectEditor open={Boolean(active)} project={active} onClose={() => setActive(null)} />
      <HeroEditor open={heroOpen} onClose={() => setHeroOpen(false)} />
    </>
  );
}
