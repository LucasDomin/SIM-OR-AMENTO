import { projects } from "../data/projects";
import { SprocketStrip } from "./ui";

const STILL_W = 320;

function Reel({ reverse = false }: { reverse?: boolean }) {
  const stills = projects.flatMap((p) =>
    p.stills.map((s) => ({ src: s, title: p.title, color: p.color }))
  );
  const loop = [...stills, ...stills];

  return (
    <div className="group relative overflow-hidden">
      <div
        className={
          (reverse ? "animate-marquee-slow " : "animate-marquee ") +
          "group-hover:[animation-play-state:paused] flex gap-4"
        }
        style={{
          width: "max-content",
          animationDirection: reverse ? "reverse" : "normal",
        }}
      >
        <div className="flex gap-4">
          {loop.map((s, i) => (
            <figure
              key={i}
              className="relative shrink-0 overflow-hidden rounded-sm border border-noir-800"
              style={{ width: STILL_W, height: STILL_W * 0.62 }}
            >
              <img
                src={s.src}
                alt={s.title}
                loading="lazy"
                className="h-full w-full object-cover grayscale-[0.35] transition-all duration-700 hover:grayscale-0 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir-950/70 to-transparent opacity-70" />
              <figcaption className="absolute bottom-2 left-3 font-mono text-[9px] uppercase tracking-wide2 text-cream/80">
                {s.title}{" "}
                <span className="text-noir-400">
                  · {String((i % stills.length) + 1).padStart(2, "0")}
                </span>
              </figcaption>
              <span
                className="absolute right-2 top-2 h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
            </figure>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * FramesStrip — apenas o filmstrip animado, sem cabeçalho de seção.
 * Pensado para ser embutido dentro de outros blocos (ex.: SelectedWorks).
 */
export function FramesStrip() {
  return (
    <div className="relative overflow-hidden">
      <SprocketStrip className="mb-4" />
      <div className="mask-fade-x space-y-4">
        <Reel />
        <Reel reverse />
      </div>
      <SprocketStrip className="mt-4" />
    </div>
  );
}
