import { useRef, useState, useEffect } from "react";

/**
 * HoverVideoPlayer — exibe uma capa (poster) estática.
 * Ao passar o mouse, inicia o vídeo com fade suave.
 * Ao sair, pausa e volta para a capa.
 *
 * Estratégia de performance:
 *  - preload="metadata" (não baixa o vídeo inteiro de cara)
 *  - muted + playsInline (permite autoplay sem interação do usuário)
 *  - fade de 400ms para não parecer "piscada"
 */
export function HoverVideoPlayer({
  videoUrl,
  posterUrl,
  aspectRatio = "16 / 10",
  className = "",
}: {
  videoUrl: string;
  posterUrl: string;
  aspectRatio?: string;
  className?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.load(); // força recarregar quando URL muda
  }, [videoUrl]);

  const onEnter = () => {
    const v = videoRef.current;
    if (!v) return;
    setPlaying(true);
    v.play().catch(() => {
      // alguns navegadores bloqueiam autoplay — fallback silencioso
      setPlaying(false);
    });
  };

  const onLeave = () => {
    const v = videoRef.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
    setPlaying(false);
  };

  return (
    <div
      className={`group relative overflow-hidden ${className}`}
      style={{ aspectRatio }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      {/* Capa estática — aparece instantaneamente */}
      <img
        src={posterUrl}
        alt=""
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
        style={{ opacity: playing && loaded ? 0 : 1 }}
      />

      {/* Vídeo — inicia no hover */}
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500"
        style={{ opacity: playing && loaded ? 1 : 0 }}
        onLoadedData={() => setLoaded(true)}
      />

      {/* Indicador sutil de vídeo */}
      <div className="pointer-events-none absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-noir-950/50 px-2.5 py-1 backdrop-blur-sm">
        <span className={`h-1.5 w-1.5 rounded-full ${playing && loaded ? "bg-accent animate-pulse" : "bg-cream/40"}`} />
        <span className="font-mono text-[8px] uppercase tracking-wide2 text-cream/70">
          {playing && loaded ? "PLAY" : "REEL"}
        </span>
      </div>
    </div>
  );
}
