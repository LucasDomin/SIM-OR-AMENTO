import { useLang } from "../contexts/LanguageContext";
import { Reveal, SectionLabel, SpectrumBar } from "./ui";

/**
 * WHY — POR QUÊ?
 * Novo bloco institucional de convencimento.
 * Linguagem cinematográfica, minimalista, sem número de seção.
 */
export function Why() {
  const { t } = useLang();

  return (
    <section className="relative overflow-hidden border-y border-noir-850 bg-noir-900 py-24 md:py-32">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <Reveal className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <SectionLabel>{t.why.label}</SectionLabel>
            <h2 className="mt-5 max-w-md text-left font-display text-[10vw] font-light leading-[0.95] tracking-[-0.02em] text-cream md:text-[4.6vw]">
              {t.why.title}
            </h2>
          </div>

          <div className="flex flex-col justify-end gap-8 md:col-span-7">
            <Reveal delay={80}>
              <p className="max-w-xl text-left text-pretty text-lg leading-relaxed text-noir-200 md:text-xl">
                {t.why.body}
              </p>
            </Reveal>
            <Reveal delay={160}>
              <SpectrumBar animate className="max-w-[220px]" />
            </Reveal>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
