import { useEffect, useState } from "react";
import { useLang } from "../contexts/LanguageContext";
import { Reveal, SectionLabel, SpectrumBar } from "./ui";

export function Manifesto() {
  const { t } = useLang();
  const [phase, setPhase] = useState<"still" | "move">("still");

  useEffect(() => {
    const id = setInterval(
      () => setPhase((p) => (p === "still" ? "move" : "still")),
      2600
    );
    return () => clearInterval(id);
  }, []);

  return (
    <section
      id="manifesto"
      className="relative overflow-hidden bg-noir-950 pt-20 pb-16 md:pt-28 md:pb-20"
    >
      <div className="pointer-events-none absolute left-1/2 top-0 hidden h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-noir-700 to-transparent lg:block" />

      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <Reveal>
          <SectionLabel index="01">{t.manifesto.label}</SectionLabel>
        </Reveal>

        <div className="mt-12 grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <h2 className="font-display text-[12vw] font-light leading-[0.92] tracking-[-0.02em] text-cream sm:text-[10vw] md:text-[6.4vw]">
              <span className="block">{t.manifesto.lead.split(" ")[0]}</span>
              <span className="block italic text-accent">
                {t.manifesto.lead.split(" ").slice(1).join(" ")}.
              </span>
            </h2>

            <div className="mt-8 inline-flex items-center gap-3 rounded-full border border-noir-700 p-1 font-mono text-[10px] uppercase tracking-wide2">
              <span
                className={`rounded-full px-4 py-2 transition-all duration-500 ${
                  phase === "still" ? "bg-accent text-noir-950" : "text-noir-400"
                }`}
              >
                {t.manifesto.toggleStill}
              </span>
              <span
                className={`rounded-full px-4 py-2 transition-all duration-500 ${
                  phase === "move" ? "bg-cream text-noir-950" : "text-noir-400"
                }`}
              >
                {t.manifesto.toggleMove}
              </span>
            </div>
          </div>

          <div className="flex flex-col justify-end gap-7 lg:col-span-5">
            <Reveal>
              <p className="max-w-xl text-pretty text-left text-base leading-relaxed text-noir-200 md:text-lg">
                {t.manifesto.body}
              </p>
            </Reveal>
            <Reveal delay={120}>
              <p className="max-w-xl text-pretty text-left text-sm leading-relaxed text-noir-300 md:text-base">
                {t.manifesto.body2}
              </p>
            </Reveal>

            <Reveal delay={300}>
              <SpectrumBar animate className="mt-2 max-w-xs" />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}
