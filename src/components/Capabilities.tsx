import { useLang } from "../contexts/LanguageContext";
import { Reveal, SectionLabel, SpectrumBar } from "./ui";

export function Capabilities() {
  const { t } = useLang();
  const list = t.capabilities.list;

  return (
    <section id="studio" className="relative bg-noir-950 pt-16 pb-20 md:pt-20 md:pb-28">
      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        <Reveal className="grid gap-10 border-b border-noir-800 pb-10 md:grid-cols-12">
          <div className="md:col-span-7">
            <SectionLabel index="03">{t.capabilities.label}</SectionLabel>
            <h2 className="mt-5 font-display text-[10vw] font-light leading-[0.95] tracking-[-0.02em] text-cream md:text-[4.6vw]">
              {t.capabilities.title}
            </h2>
          </div>
          <p className="max-w-sm self-end text-pretty text-left text-sm leading-relaxed text-noir-400 md:col-span-5">
            {t.capabilities.intro}
          </p>
        </Reveal>

        <ul className="divide-y divide-noir-800">
          {list.map((item) => (
            <Reveal as="li" key={item.k}>
              <div className="group grid items-center gap-4 py-7 transition-colors md:grid-cols-12 md:gap-8">
                <span className="font-mono text-[11px] uppercase tracking-wide2 text-noir-500 transition-colors group-hover:text-accent md:col-span-1">
                  {item.k}
                </span>
                <h3 className="font-display text-3xl font-light tracking-[-0.01em] text-noir-200 transition-colors group-hover:text-cream md:col-span-4 md:text-4xl">
                  {item.t}
                </h3>
                <p className="text-pretty text-left text-sm leading-relaxed text-noir-400 md:col-span-6 md:text-base">
                  {item.d}
                </p>
                <div className="hidden justify-end md:col-span-1 md:flex">
                  <svg
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    className="-rotate-45 text-noir-500 transition-all duration-300 group-hover:rotate-0 group-hover:text-accent"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </div>
              </div>
              <div className="overflow-hidden">
                <SpectrumBar
                  className="h-px max-w-0 opacity-0 transition-all duration-500 group-hover:max-w-full group-hover:opacity-100"
                  height="h-px"
                />
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
