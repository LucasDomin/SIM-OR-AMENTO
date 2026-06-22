import { useLang } from "../contexts/LanguageContext";
import { Logo } from "./Logo";
import { Reveal, SectionLabel, SpectrumBar } from "./ui";
import { EstimateCalculator } from "./EstimateCalculator";

const SOCIALS = [
  { label: "Instagram", href: "#" },
  { label: "Vimeo", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Behance", href: "#" },
];

const NAV_LINKS = [
  { key: "manifesto", href: "#manifesto" },
  { key: "works", href: "#works" },
  { key: "studio", href: "#studio" },
] as const;

export function Contact({ onAdmin }: { onAdmin: () => void }) {
  const { t, lang } = useLang();
  const year = new Date().getFullYear();
  const questions = t.footer.questions;

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-noir-950 pt-20 md:pt-28"
    >
      {/* glow superior */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[80%] -translate-x-1/2 rounded-full bg-accent/[0.04] blur-[140px]" />

      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        {/* Header — Manchete cinematográfica */}
        <Reveal className="border-b border-noir-800 pb-12 md:pb-16">
          <SectionLabel index="05">{t.footer.contact}</SectionLabel>
          <a
            href="mailto:hello@sim.studio"
            className="group mt-5 block font-display text-[13vw] font-light leading-[0.92] tracking-[-0.03em] text-cream md:text-[7.4vw]"
          >
            <span className="block transition-colors group-hover:text-accent">
              {t.footer.headline1}
            </span>
            <span className="block italic text-noir-400 transition-colors group-hover:text-cream">
              {t.footer.headline2}
              <span className="text-accent">.</span>
            </span>
          </a>

          {/* Perguntas + respostas */}
          <Reveal delay={100} className="mt-10">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {questions.map((item, i) => (
                <div
                  key={i}
                  className="group flex items-baseline justify-start gap-3 border-t border-noir-800 pt-3"
                >
                  <span className="text-left text-sm text-noir-300 transition-colors group-hover:text-cream">
                    {item.q}
                  </span>
                  <span className="font-display text-2xl font-light text-accent md:text-3xl">
                    {item.a}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>

          <div className="mt-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <p className="max-w-md text-left text-sm text-noir-400 md:text-base">
              {lang === "pt"
                ? "Conte-nos sobre seu projeto ou simule um orçamento ao lado. Respondemos em até 24h úteis."
                : "Tell us about your project or simulate a quote on the side. We reply within 24 business hours."}
            </p>
            <SpectrumBar animate className="max-w-[280px]" />
          </div>
        </Reveal>

        {/* Grid principal */}
        <div className="grid gap-12 py-16 md:py-20 lg:grid-cols-12 lg:gap-16">
          {/* Coluna esquerda — dados & navegação */}
          <Reveal className="lg:col-span-5">
            <div className="space-y-10">
              {/* Estúdio */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
                  {t.footer.studio}
                </div>
                <div className="mt-4 space-y-3 text-left">
                  <a
                    href="mailto:hello@sim.studio"
                    className="block font-display text-2xl text-cream transition-colors hover:text-accent md:text-3xl"
                  >
                    hello@sim.studio
                  </a>
                  <a
                    href="tel:+5511999999999"
                    className="block font-display text-xl text-noir-200 transition-colors hover:text-accent md:text-2xl"
                  >
                    +55 11 9 9999-9999
                  </a>
                  <div className="flex items-center gap-2 text-sm text-noir-400">
                    <span className="inline-block h-1.5 w-1.5 animate-blink rounded-full bg-spec-2" />
                    {t.footer.locations}
                  </div>
                </div>
              </div>

              {/* Sociais */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
                  Social
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
                  {SOCIALS.map((s) => (
                    <li key={s.label}>
                      <a
                        href={s.href}
                        className="group inline-flex items-center gap-2 text-noir-200 transition-colors hover:text-accent"
                      >
                        <span className="inline-block h-1 w-1 rounded-full bg-noir-600 transition-colors group-hover:bg-accent" />
                        <span className="relative">
                          {s.label}
                          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
                        </span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Navegação */}
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
                  {lang === "pt" ? "Navegação" : "Navigation"}
                </div>
                <ul className="mt-4 grid grid-cols-2 gap-y-3 text-sm">
                  {NAV_LINKS.map((l) => (
                    <li key={l.key}>
                      <a
                        href={l.href}
                        className="group inline-flex items-center gap-2 text-noir-200 transition-colors hover:text-cream"
                      >
                        <span className="font-mono text-[9px] uppercase tracking-wide2 text-noir-600 group-hover:text-accent">
                          →
                        </span>
                        {t.nav[l.key]}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Acesso admin discreto */}
              <button
                onClick={onAdmin}
                className="inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-wide2 text-noir-500 transition-colors hover:text-accent"
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  <rect x="4" y="11" width="16" height="9" rx="2" />
                  <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                </svg>
                {t.nav.admin} ↗
              </button>
            </div>
          </Reveal>

          {/* Coluna direita — calculadora */}
          <Reveal className="lg:col-span-7" delay={120}>
            <EstimateCalculator />
          </Reveal>
        </div>

        {/* Spectrum divider */}
        <SpectrumBar className="opacity-60" />

        {/* Wordmark oversize */}
        <div className="pointer-events-none select-none pt-8 md:pt-10">
          <div className="font-display text-[26vw] font-light leading-[0.8] tracking-[-0.04em] text-noir-100/[0.045]">
            Still
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-noir-850">
        <div className="mx-auto flex max-w-[1500px] flex-col items-center justify-between gap-4 px-5 py-6 font-mono text-[10px] uppercase tracking-wide2 text-noir-500 md:flex-row md:px-10">
          <div className="flex items-center gap-3">
            <Logo compact className="!h-5" />
            <span className="hidden text-noir-700 md:inline">|</span>
            <span>© {year} — Still In Movement</span>
          </div>
          <span className="text-center">{t.footer.rights}</span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 animate-blink rounded-full bg-spec-2" />
            {t.footer.locations}
          </span>
        </div>
      </div>
    </section>
  );
}
