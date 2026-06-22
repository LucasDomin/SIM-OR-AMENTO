import { useEffect } from "react";
import type { Project } from "../data/projects";
import { SpectrumBar } from "./ui";

export function CaseStudy({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!project) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div className="fixed inset-0 z-[150] flex justify-center overflow-y-auto bg-noir-950/80 backdrop-blur-md fade-in">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden
      />
      <div className="relative z-10 my-0 w-full max-w-5xl bg-noir-900">
        {/* Close */}
        <button
          onClick={onClose}
          className="fixed right-5 top-5 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-noir-600 bg-noir-950/70 text-cream backdrop-blur transition-colors hover:border-accent hover:text-accent md:right-8 md:top-8"
          aria-label="Close"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {/* Cover */}
        <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden md:h-[56vh]">
          <img
            src={project.cover}
            alt={project.title}
            className="h-full w-full animate-slow-zoom object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-900 via-noir-900/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-10">
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-wide2 text-accent">
              <span>{project.category}</span>
              <span className="text-noir-500">·</span>
              <span className="text-noir-300">{project.client}</span>
            </div>
            <h2 className="mt-2 font-display text-6xl font-light tracking-[-0.02em] text-cream md:text-8xl">
              {project.title}
            </h2>
            <p className="mt-2 max-w-xl text-pretty text-sm text-noir-200 md:text-base">
              {project.subtitle}
            </p>
          </div>
        </div>

        <div className="px-6 py-10 md:px-10 md:py-14">
          {/* Meta strip */}
          <div className="grid grid-cols-2 gap-5 border-y border-noir-800 py-6 sm:grid-cols-4">
            {[
              ["Year", project.year],
              ["Location", project.location],
              ["Duration", project.duration ?? "—"],
              ["Format", project.format],
            ].map(([k, v]) => (
              <div key={k}>
                <div className="font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                  {k}
                </div>
                <div className="mt-1 text-[13px] text-noir-100">{v}</div>
              </div>
            ))}
          </div>

          {/* Description */}
          <p className="mt-10 max-w-2xl text-pretty text-lg leading-relaxed text-noir-200 md:text-xl">
            {project.description}
          </p>

          {/* Stills */}
          <div className="mt-12 grid gap-4 sm:grid-cols-3">
            {project.stills.map((s, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-sm"
                style={{ aspectRatio: "3 / 4" }}
              >
                <img
                  src={s}
                  alt={`${project.title} still ${i + 1}`}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-[1400ms] group-hover:scale-110"
                />
              </div>
            ))}
          </div>

          {/* Credits + Awards */}
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
                Credits
              </h3>
              <ul className="mt-4 divide-y divide-noir-800">
                {project.credits.map((c) => (
                  <li key={c.role} className="flex justify-between py-2.5 text-sm">
                    <span className="text-noir-400">{c.role}</span>
                    <span className="text-noir-100">{c.name}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
                Awards
              </h3>
              {project.awards ? (
                <ul className="mt-4 space-y-3">
                  {project.awards.map((a) => (
                    <li
                      key={a}
                      className="flex items-center gap-3 rounded-sm border border-noir-800 px-4 py-3 text-sm text-noir-100"
                    >
                      <span className="inline-block h-1.5 w-1.5 rotate-45 bg-accent" />
                      {a}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-noir-500">—</p>
              )}
              <SpectrumBar className="mt-8 max-w-[180px]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
