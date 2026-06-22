import { useLang } from "../contexts/LanguageContext";
import { cn } from "../lib/cn";

/**
 * Admin access entry — preserved from the original SIM admin flow.
 * Opens the studio-only access panel (handled by the parent).
 */
export function AdminAccessButton({
  onClick,
  className = "",
}: {
  onClick?: () => void;
  className?: string;
}) {
  const { t } = useLang();
  return (
    <button
      onClick={onClick}
      aria-label={t.nav.admin}
      className={cn(
        "group flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wide2 text-noir-400 transition-colors hover:text-accent",
        className
      )}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        className="transition-transform group-hover:scale-110"
      >
        <rect x="4" y="11" width="16" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </svg>
      <span className="hidden sm:inline">{t.nav.admin}</span>
    </button>
  );
}
