import { useEffect, useMemo, useRef, useState } from "react";
import { useLang } from "../contexts/LanguageContext";
import { projects } from "../data/projects";
import { useHeroImages, useHeroVideo } from "./HeroEditor";

/* Film timecode formatter: 00:00:00:00 (HH:MM:SS:FF @ 24fps) */
function tc(ms: number) {
  const totalFrames = Math.floor((ms / 1000) * 24);
  const f = totalFrames % 24;
  const s = Math.floor(totalFrames / 24) % 60;
  const m = Math.floor(totalFrames / (24 * 60)) % 60;
  const h = Math.floor(totalFrames / (24 * 3600));
  const p2 = (n: number) => String(n).padStart(2, "0");
  return `${p2(h)}:${p2(m)}:${p2(s)}:${p2(f)}`;
}

export function Hero({ onEnter }: { onEnter: () => void }) {
  const { t } = useLang();
  const defaultImages = useMemo(
    () => [
      projects[0].cover, // Atlas
      projects[5].cover, // Noctilucent
      projects[3].cover, // Kintsugi
    ],
    []
  );
  const savedImages = useHeroImages(defaultImages);
  const heroVideo = useHeroVideo();
  const heroImages = savedImages.length > 0 ? savedImages : defaultImages;

  const [active, setActive] = useState(0);
  const [prog, setProg] = useState(0); // 0..1 within current slide
  const [timecode, setTimecode] = useState("00:00:00:00");
  const startRef = useRef(performance.now());

  const SCENE_MS = 4200;

  // slide + scrubber cycling
  useEffect(() => {
    let raf = 0;
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const idx = Math.floor(elapsed / SCENE_MS) % heroImages.length;
      const within = (elapsed % SCENE_MS) / SCENE_MS;
      setActive(idx);
      setProg(within);
      setTimecode(tc(elapsed));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [heroImages.length]);

  // Parallax on scroll — image sinks, title floats: cinematic depth.
  const [sy, setSy] = useState(0);
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setSy(window.scrollY));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  const fade = Math.max(0, 1 - sy / 620);

  return (
    <section
      id="top"
      className="relative h-[100svh] min-h-[640px] w-full overflow-hidden bg-noir-950"
    >
      {/* Background: video (priority) or cycling stills */}
      <div
        className="absolute inset-0"
        style={{ transform: `translateY(${sy * 0.32}px) scale(${1 + sy * 0.0002})`, willChange: "transform" }}
      >
        {heroVideo?.url ? (
          <video
            src={heroVideo.url}
            poster={heroVideo.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="h-full w-full object-cover"
          />
        ) : (
          heroImages.map((src, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-[1400ms] ease-out"
              style={{ opacity: i === active ? 1 : 0 }}
            >
              <img
                src={src}
                alt=""
                className="h-full w-full animate-slow-zoom-loop object-cover"
                style={{ animationDelay: `${i * -6}s` }}
              />
            </div>
          ))
        )}
      </div>

      {/* Cinematic grading overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-noir-950 via-noir-950/35 to-noir-950/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-noir-950/80 via-transparent to-noir-950/40" />
      {/* letterbox vibe */}
      <div className="absolute inset-x-0 top-0 h-[6vh] bg-gradient-to-b from-noir-950/80 to-transparent" />

      {/* Top film UI */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 pt-24 font-mono text-[10px] uppercase tracking-wide2 text-noir-300 md:px-10 md:pt-28">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2 w-2 animate-blink rounded-full bg-spec-2" />
          <span>Rec</span>
          <span className="text-noir-500">·</span>
          <span>{timecode}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-noir-500">2.39 : 1</span>
          <span className="text-cream">{t.hero.reel}</span>
        </div>
      </div>

      {/* Title block */}
      <div
        className="relative z-20 flex h-full flex-col justify-end px-5 pb-28 md:px-10 md:pb-32"
        style={{ transform: `translateY(${sy * -0.12}px)`, opacity: fade }}
      >
        <div className="mb-5 flex items-center gap-3 font-mono text-[11px] uppercase tracking-wide2 text-accent">
          <span className="inline-block h-px w-8 bg-accent" />
          {t.hero.kicker}
        </div>

        <h1 className="font-display font-light leading-[0.92] tracking-[-0.02em] text-cream text-balance">
          <span className="block text-[12.5vw] sm:text-[11vw] md:text-[8.4vw] lg:text-[8vw]">
            {t.hero.title1}
          </span>
          <span className="block text-[12.5vw] sm:text-[11vw] md:text-[8.4vw] lg:text-[8vw]">
            {t.hero.title2}
          </span>
          <span className="block italic text-[12.5vw] text-accent sm:text-[11vw] md:text-[8.4vw] lg:text-[8vw]">
            {t.hero.titleEm}
          </span>
        </h1>

        <div className="mt-7 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            {/* Enter reel */}
          <button
            onClick={onEnter}
            className="group inline-flex shrink-0 items-center gap-3 self-start rounded-full border border-noir-500/60 px-6 py-3 font-mono text-[11px] uppercase tracking-wide2 text-cream transition-colors hover:border-accent md:self-auto"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            View Reel
          </button>
        </div>
      </div>

      {/* Bottom: film scrubber + ticker */}
      <div className="absolute inset-x-0 bottom-0 z-20 px-5 pb-6 md:px-10 md:pb-8">
        <div className="mb-3 flex items-center justify-between font-mono text-[10px] uppercase tracking-wide2 text-noir-400">
          <span>{t.hero.scenes[active]}</span>
          <span className="hidden items-center gap-2 md:flex">
            {t.hero.scroll}
            <span className="relative flex h-9 w-px justify-center overflow-hidden">
              <span className="absolute top-0 h-3 w-px animate-drift bg-accent" />
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          {heroImages.map((_, i) => (
            <div
              key={i}
              className="relative h-px flex-1 overflow-hidden bg-cream/15"
            >
              <div
                className="absolute inset-y-0 left-0 bg-accent"
                style={{
                  width: i < active ? "100%" : i === active ? `${prog * 100}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
