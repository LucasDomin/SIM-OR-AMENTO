import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ElementType,
} from "react";
import { useReveal } from "../hooks/useReveal";
import { cn } from "../lib/cn";

const SPECTRUM = [
  "#996ea7",
  "#e45a58",
  "#ea8d11",
  "#fac421",
  "#33ae74",
  "#2894d1",
  "#b1b7b1",
  "#f4c78d",
];

/* Reveal wrapper — element enters frame resolving blur into clarity */
export function Reveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
}) {
  const ref = useReveal<HTMLDivElement>();
  return (
    <Tag
      ref={ref as never}
      className={cn("reveal", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/* Mono section label — film-index typography */
export function SectionLabel({
  children,
  index,
  className = "",
}: {
  children: ReactNode;
  index?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 font-mono text-[11px] uppercase tracking-wide2 text-noir-300",
        className
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
      {index && <span className="text-noir-400">{index}</span>}
      <span>{children}</span>
    </div>
  );
}

/* The logo spectrum bar, reused as a hairline divider / energy accent */
export function SpectrumBar({
  className = "",
  height = "h-[3px]",
  animate = false,
}: {
  className?: string;
  height?: string;
  animate?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative flex w-full overflow-hidden rounded-full",
        height,
        className
      )}
    >
      {SPECTRUM.map((c, i) => (
        <div key={i} className="h-full flex-1" style={{ backgroundColor: c }} />
      ))}
      {animate && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-spec-sweep bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      )}
    </div>
  );
}

/* Magnetic button with a slow fill — still → movement */
export function MagneticLink({
  children,
  href = "#",
  onClick,
  variant = "solid",
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: "solid" | "ghost";
  className?: string;
}) {
  const ref = useRef<HTMLAnchorElement | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e: MouseEvent) => {
      const r = el.getBoundingClientRect();
      setPos({ x: e.clientX - (r.left + r.width / 2), y: e.clientY - (r.top + r.height / 2) });
    };
    const reset = () => setPos({ x: 0, y: 0 });
    el.addEventListener("mousemove", onMove);
    el.addEventListener("mouseleave", reset);
    return () => {
      el.removeEventListener("mousemove", onMove);
      el.removeEventListener("mouseleave", reset);
    };
  }, []);

  return (
    <a
      ref={ref}
      href={href}
      onClick={onClick}
      style={{ transform: `translate(${pos.x * 0.18}px, ${pos.y * 0.3}px)` }}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-full px-7 py-3 font-mono text-[11px] uppercase tracking-wide2 transition-transform duration-300 ease-out",
        variant === "solid"
          ? "bg-cream text-noir-950"
          : "border border-noir-500/60 text-cream hover:border-accent",
        className
      )}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </a>
  );
}

/* Sprocket/perforation strip */
export function SprocketStrip({ className = "" }: { className?: string }) {
  return (
    <div
      className={cn("sprockets h-5 w-full opacity-40", className)}
      aria-hidden
    />
  );
}
