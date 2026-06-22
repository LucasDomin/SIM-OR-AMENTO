import { useEffect, useState } from "react";
import { useLang } from "../contexts/LanguageContext";
import { Logo } from "./Logo";
import { AdminAccessButton } from "./AdminAccessButton";
import { cn } from "../lib/cn";

const LINKS = [
  { key: "manifesto", href: "#manifesto" },
  { key: "works", href: "#works" },
  { key: "studio", href: "#studio" },
  { key: "contact", href: "#contact" },
] as const;

export function Navbar({ onAdmin }: { onAdmin: () => void }) {
  const { t, lang, toggle } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-[90] transition-all duration-500",
        scrolled ? "glass py-3" : "py-5"
      )}
    >
      <nav className="mx-auto flex max-w-[1500px] items-center justify-between px-5 md:px-10">
        {/* Logo */}
        <a href="#top" className="shrink-0" aria-label="SIM — home">
          <Logo compact />
        </a>

        {/* Center links */}
        <div className="hidden items-center gap-9 md:flex">
          {LINKS.map((l) => (
            <a
              key={l.key}
              href={l.href}
              className="group relative font-mono text-[11px] uppercase tracking-wide2 text-noir-200 transition-colors hover:text-cream"
            >
              {t.nav[l.key]}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-accent transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-5">
          <button
            onClick={toggle}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide2 text-noir-200 transition-colors hover:text-accent"
            aria-label="Toggle language"
          >
            <span className={lang === "pt" ? "text-cream" : "text-noir-500"}>
              PT
            </span>
            <span className="text-noir-600">/</span>
            <span className={lang === "en" ? "text-cream" : "text-noir-500"}>
              EN
            </span>
          </button>
          <span className="hidden h-4 w-px bg-noir-600 sm:block" />
          <AdminAccessButton onClick={onAdmin} className="hidden sm:flex" />

          {/* Mobile toggle */}
          <button
            onClick={() => setOpen((o) => !o)}
            className="flex flex-col gap-[5px] md:hidden"
            aria-label="Menu"
          >
            <span
              className={cn(
                "h-px w-6 bg-cream transition-transform duration-300",
                open && "translate-y-[6px] rotate-45"
              )}
            />
            <span
              className={cn(
                "h-px w-6 bg-cream transition-opacity",
                open && "opacity-0"
              )}
            />
            <span
              className={cn(
                "h-px w-6 bg-cream transition-transform duration-300",
                open && "-translate-y-[6px] -rotate-45"
              )}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden px-5 transition-all duration-500 md:hidden",
          open ? "max-h-80 pb-6 pt-4 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <div className="flex flex-col gap-4 border-t border-noir-700 pt-5">
          {LINKS.map((l) => (
            <a
              key={l.key}
              href={l.href}
              onClick={() => setOpen(false)}
              className="font-display text-2xl text-cream"
            >
              {t.nav[l.key]}
            </a>
          ))}
          <div className="mt-2 flex items-center justify-between">
            <AdminAccessButton onClick={onAdmin} />
          </div>
        </div>
      </div>
    </header>
  );
}
