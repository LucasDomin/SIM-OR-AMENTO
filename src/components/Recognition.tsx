import { useLang } from "../contexts/LanguageContext";
import { Reveal, SectionLabel } from "./ui";

export function Recognition() {
  const { t } = useLang();
  return (
    <section className="relative bg-noir-950 pt-8 pb-20 md:pt-10 md:pb-28">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <Reveal className="grid gap-8 border-t border-noir-800 pt-10 md:grid-cols-12">
          <div className="md:col-span-6">
            <SectionLabel index="04">{t.recognition.label}</SectionLabel>
            <h2 className="mt-5 font-display text-[10vw] font-light leading-[0.95] tracking-[-0.02em] text-cream md:text-[4.6vw]">
              {t.recognition.title}
            </h2>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-6 self-end md:col-span-6 md:grid-cols-4">
            {t.recognition.stats.map((s) => (
              <div key={s.l}>
                <div className="font-display text-4xl font-light text-accent md:text-5xl">
                  {s.n}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wide2 text-noir-400">
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* Países onde já atuamos */}
        <Reveal className="mt-14 border-t border-noir-800 pt-10">
          <div className="font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
            {t.recognition.countriesLabel}
          </div>
          <ul className="mt-6 flex flex-wrap gap-x-3 gap-y-4">
            {t.recognition.countries.map((country, i) => (
              <li key={country} className="flex items-center">
                <span className="font-display text-2xl font-light text-noir-100 transition-colors hover:text-cream md:text-3xl">
                  {country}
                </span>
                {i < t.recognition.countries.length - 1 && (
                  <span className="ml-3 inline-block h-1.5 w-1.5 rotate-45 bg-accent/70" />
                )}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
