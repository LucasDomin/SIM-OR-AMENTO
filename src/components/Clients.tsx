import { useLang } from "../contexts/LanguageContext";
import { clients } from "../data/projects";
import { Reveal } from "./ui";

export function Clients() {
  const { t } = useLang();
  const loop = [...clients, ...clients];

  return (
    <div className="relative overflow-hidden border-y border-noir-850 bg-noir-900 py-10 md:py-12">
      <div className="mx-auto mb-7 max-w-[1500px] px-5 md:px-10">
        <Reveal>
          <div className="font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
            {t.clients.label}
          </div>
        </Reveal>
      </div>

      <div className="group mask-fade-x overflow-hidden">
        <div className="animate-marquee group-hover:[animation-play-state:paused] flex w-max items-center gap-10 pr-10">
          {loop.map((c, i) => (
            <div key={i} className="flex items-center gap-10">
              <span className="whitespace-nowrap font-display text-3xl font-light text-noir-200 transition-colors hover:text-cream md:text-4xl">
                {c}
              </span>
              <span className="inline-block h-1.5 w-1.5 rotate-45 bg-accent/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
