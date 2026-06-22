import { useEffect, useState } from "react";
import { useLang } from "../contexts/LanguageContext";
import { useAdmin } from "../contexts/AdminContext";
import { Logo } from "./Logo";
import { SpectrumBar } from "./ui";
import { AdminDashboard } from "./AdminDashboard";

export function AdminAccessModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { t, lang } = useLang();
  const { authenticated, login } = useAdmin();
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setCode("");
      setError(false);
      setDashboardOpen(false);
    }
    if (open && authenticated) {
      setDashboardOpen(true);
    }
  }, [open, authenticated]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(code);
    if (ok) {
      setError(false);
      setDashboardOpen(true);
    } else {
      setError(true);
    }
  };

  if (dashboardOpen || authenticated) {
    return <AdminDashboard open onClose={onClose} />;
  }

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-noir-950/85 p-5 backdrop-blur-md fade-in">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <form
        onSubmit={submit}
        className="relative z-10 w-full max-w-sm rounded-sm border border-noir-700 bg-noir-900 p-8 fade-up"
      >
        <div className="flex items-center justify-between">
          <Logo compact />
          <button
            type="button"
            onClick={onClose}
            className="text-noir-400 transition-colors hover:text-cream"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="mt-8 flex items-center gap-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-accent">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <h3 className="font-display text-xl text-cream">{t.nav.admin}</h3>
        </div>
        <p className="mt-2 text-sm text-noir-400">
          {lang === "pt"
            ? "Área restrita ao estúdio — edite textos e imagens dos projetos."
            : "Studio-only area — edit project text and images."}
        </p>

        <input
          type="password"
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            setError(false);
          }}
          placeholder="••••••••"
          autoFocus
          className={`mt-5 w-full rounded-sm border bg-noir-950 px-4 py-3 font-mono text-sm tracking-[0.3em] text-cream placeholder:tracking-[0.3em] focus:outline-none ${
            error ? "border-spec-2" : "border-noir-700 focus:border-accent"
          }`}
        />
        {error && (
          <p className="mt-2 text-xs text-spec-2">
            {lang === "pt" ? "Código inválido." : "Invalid code."}
          </p>
        )}

        <button
          type="submit"
          className="mt-4 w-full rounded-sm bg-cream py-3 font-mono text-[11px] uppercase tracking-wide2 text-noir-950 transition-transform hover:scale-[1.02]"
        >
          {lang === "pt" ? "Entrar" : "Enter"}
        </button>

        <div className="mt-6">
          <SpectrumBar className="h-px opacity-50" />
        </div>
      </form>
    </div>
  );
}
