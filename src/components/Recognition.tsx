import { useLang } from "../contexts/LanguageContext";
import { Reveal, SectionLabel } from "./ui";

const AWARDS = [
  { year: "2025", name: "Cannes Lions", detail: "Shortlist · Atlas" },
  { year: "2025", name: "D&AD", detail: "Wood Pencil · Obsidian" },
  { year: "2025", name: "Ciclope Festival", detail: "Bronze · Atlas" },
  { year: "2024", name: "IDFA", detail: "Official Selection · Kintsugi" },
];

export function Recognition() {
  const { t } = useLang();
  return (
    <section className="relative bg-noir-950 pt-16 pb-20 md:pt-20 md:pb-28">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <Reveal className="grid gap-8 border-b border-noir-800 pb-10 md:grid-cols-12">
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

        <ul className="divide-y divide-noir-800">
          {AWARDS.map((a, i) => (
            <Reveal as="li" key={i}>
              <div className="group flex items-center gap-6 py-6">
                <span className="font-mono text-[11px] uppercase tracking-wide2 text-noir-500">
                  {a.year}
                </span>
                <span className="font-display text-2xl font-light text-noir-100 transition-colors group-hover:text-cream md:text-3xl">
                  {a.name}
                </span>
                <span className="ml-auto hidden text-sm text-noir-400 sm:block md:text-base">
                  {a.detail}
                </span>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
