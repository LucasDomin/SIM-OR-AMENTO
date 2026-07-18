import { useLang } from "../contexts/LanguageContext";
import { useConsent } from "../contexts/ConsentContext";
import { Logo } from "./Logo";
import { Reveal } from "./ui";
import { getEmail, getEmailHref, getTel, getTelHref } from "../lib/contact";

const SOCIALS = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "Wfolio", href: "#" },
];

const NAV_LINKS = [
  { key: "manifesto", href: "#manifesto" },
  { key: "works", href: "#works" },
  { key: "studio", href: "#studio" },
] as const;

export function Contact() {
  const { t, lang } = useLang();
  const { reset: resetConsent } = useConsent();
  const year = new Date().getFullYear();
  const questions = t.footer.questions;

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-noir-950 pt-24 md:pt-32"
    >
      {/* glow superior sutil */}
      <div className="pointer-events-none absolute -top-32 left-1/2 h-[420px] w-[80%] -translate-x-1/2 rounded-full bg-accent/[0.035] blur-[160px]" />

      <div className="mx-auto max-w-[1500px] px-5 md:px-10">
        {/* Cabeçalho — título principal (com efeito e link) */}
        <Reveal className="pb-12 md:pb-16">
          <a
            href={getEmailHref()}
            rel="noreferrer"
            className="group block text-left font-display text-[13vw] font-light leading-[0.92] tracking-[-0.03em] text-cream md:text-[7vw]"
          >
            <span className="block transition-colors group-hover:text-accent">
              {t.footer.headline1}
            </span>
            <span className="block italic text-noir-400 transition-colors group-hover:text-cream">
              {t.footer.headline2}
              <span className="text-accent">.</span>
            </span>
          </a>
        </Reveal>

        {/* Bloco perguntas + um único SIM gigante */}
        <div className="grid items-center gap-12 border-b border-noir-800 pb-20 md:gap-16 lg:grid-cols-12 md:pb-28">
          {/* Perguntas — uma abaixo da outra */}
          <Reveal className="lg:col-span-7">
            <ul className="space-y-5 md:space-y-7">
              {questions.map((q, i) => (
                <li
                  key={i}
                  className="group flex items-baseline gap-4 text-left"
                >
                  <span className="font-mono text-[10px] tracking-wide2 text-noir-600">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-2xl font-light leading-snug tracking-[-0.01em] text-noir-200 transition-colors duration-500 group-hover:text-cream md:text-[2.1rem]">
                    {q}
                  </span>
                </li>
              ))}
            </ul>
          </Reveal>

          {/* Um único SIM — logo exata da marca, sem barra */}
          <Reveal className="lg:col-span-5" delay={120}>
            <div className="flex items-center justify-center lg:justify-end">
              <Logo
                noBar
                className="!h-auto w-[70%] max-w-[420px] text-cream sm:w-[55%] lg:w-full"
              />
            </div>
          </Reveal>
        </div>

        {/* Dados de contato — limpos */}
        <div className="grid gap-12 border-t border-noir-800 pt-16 md:grid-cols-12 md:pt-20">
          {/* Estúdio */}
          <Reveal className="md:col-span-5">
            <div className="font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
              {t.footer.studio}
            </div>
            <div className="mt-4 space-y-3 text-left">
              <a
                href={getEmailHref()}
                rel="noreferrer"
                className="block font-display text-2xl text-cream transition-colors hover:text-accent md:text-3xl"
              >
                {getEmail()}
              </a>
              <a
                href={getTelHref()}
                rel="noreferrer"
                className="block font-display text-xl text-noir-200 transition-colors hover:text-accent md:text-2xl"
              >
                {getTel()}
              </a>
            </div>
          </Reveal>

          {/* Sociais */}
          <Reveal className="md:col-span-4" delay={80}>
            <div className="font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
              Social
            </div>
            <ul className="mt-4 space-y-3 text-sm">
              {SOCIALS.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
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
          </Reveal>

          {/* Navegação */}
          <Reveal className="md:col-span-3" delay={160}>
            <div className="font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
              {t.footer.contact === "COMO?" ? "Navegação" : "Navigation"}
            </div>
            <ul className="mt-4 space-y-3 text-sm">
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
          </Reveal>
        </div>

        {/* Wordmark oversize */}
        <div className="pointer-events-none select-none pt-6 md:pt-8">
          <div className="font-display text-[26vw] font-light leading-[0.8] tracking-[-0.04em] text-noir-100/[0.04]">
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
          <div className="flex items-center gap-4">
            <button
              onClick={resetConsent}
              className="transition-colors hover:text-cream"
              aria-label={
                lang === "pt"
                  ? "Gerenciar consentimento de privacidade"
                  : "Manage privacy consent"
              }
            >
              {lang === "pt" ? "Privacidade" : "Privacy"}
            </button>
            <a
              href="https://www.instagram.com/domi.n.arte/"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative text-center normal-case tracking-[0.22em] transition-all duration-300 hover:text-cream"
            >
              produzido por @domi.n.arte
              <span className="pointer-events-none absolute -inset-x-1 -inset-y-0.5 rounded opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-r from-accent/30 via-accent/60 to-accent/30" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
