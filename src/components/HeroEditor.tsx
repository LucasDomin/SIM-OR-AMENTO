import { useEffect, useState } from "react";
import { useLang } from "../contexts/LanguageContext";
import { ImageCropper } from "./ImageCropper";
import { Reveal } from "./ui";

const HERO_KEY = "sim-hero-images";
const HERO_VIDEO_KEY = "sim-hero-video";

export function HeroEditor({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const [images, setImages] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoPoster, setVideoPoster] = useState("");
  const [cropperOpen, setCropperOpen] = useState(false);
  const [cropperTarget, setCropperTarget] = useState<{
    idx: number;
    url: string;
  } | null>(null);

  // Load from localStorage on open
  useEffect(() => {
    if (!open) return;
    try {
      const saved = localStorage.getItem(HERO_KEY);
      if (saved) setImages(JSON.parse(saved));
      const vid = localStorage.getItem(HERO_VIDEO_KEY);
      if (vid) {
        const parsed = JSON.parse(vid);
        setVideoUrl(parsed.url || "");
        setVideoPoster(parsed.poster || "");
      }
    } catch {
      /* ignore */
    }
  }, [open]);

  const saveImages = (next: string[]) => {
    setImages(next);
    try {
      localStorage.setItem(HERO_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const saveVideo = (url: string, poster: string) => {
    setVideoUrl(url);
    setVideoPoster(poster);
    try {
      localStorage.setItem(HERO_VIDEO_KEY, JSON.stringify({ url, poster }));
    } catch {
      /* ignore */
    }
  };

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      saveImages([...images, url]);
    };
    reader.readAsDataURL(f);
  };

  const onCropSave = (payload: { url: string; crop: { x: number; y: number; scale: number } }) => {
    if (cropperTarget === null) return;
    const next = [...images];
    next[cropperTarget.idx] = payload.url;
    saveImages(next);
    setCropperOpen(false);
    setCropperTarget(null);
  };

  const label = (pt: string, en: string) => (lang === "pt" ? pt : en);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[180] overflow-y-auto bg-noir-950/90 p-4 backdrop-blur-md fade-in">
      <div className="relative mx-auto max-w-4xl rounded-sm border border-noir-700 bg-noir-900 p-6 md:p-10 fade-up">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h3 className="font-display text-2xl text-cream">
              {label("Editar Banner Principal", "Edit Hero Banner")}
            </h3>
            <p className="mt-1 text-sm text-noir-400">
              {label(
                "Troque as imagens de fundo do banner. Recomendamos usar URLs do Cloudinary para vídeos e imagens em alta resolução.",
                "Replace the hero background images. We recommend using Cloudinary URLs for high-res videos and images."
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-noir-700 p-2 text-noir-400 transition-colors hover:border-noir-500 hover:text-cream"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Images grid */}
        <div className="mb-8">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
            {label("Imagens do banner", "Banner images")} ({images.length})
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {images.map((url, i) => (
              <div key={i} className="group relative overflow-hidden rounded-sm border border-noir-700 bg-noir-950">
                <img src={url} alt="" className="aspect-[16/10] w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-noir-950/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => {
                      setCropperTarget({ idx: i, url });
                      setCropperOpen(true);
                    }}
                    className="rounded-full bg-cream px-3 py-1.5 font-mono text-[9px] uppercase tracking-wide2 text-noir-950"
                  >
                    {label("Crop", "Crop")}
                  </button>
                  <button
                    onClick={() => {
                      const next = images.filter((_, j) => j !== i);
                      saveImages(next);
                    }}
                    className="rounded-full border border-spec-2 px-3 py-1.5 font-mono text-[9px] uppercase tracking-wide2 text-spec-2"
                  >
                    {label("Remover", "Remove")}
                  </button>
                </div>
                <span className="absolute left-2 top-2 rounded-full bg-noir-950/70 px-2 py-0.5 font-mono text-[9px] text-cream">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
            ))}

            {/* Add new */}
            <label className="flex aspect-[16/10] cursor-pointer flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-noir-700 bg-noir-950 transition-colors hover:border-noir-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-noir-500">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                {label("Adicionar", "Add")}
              </span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onFile(f);
                }}
              />
            </label>
          </div>
        </div>

        {/* Video section */}
        <div className="mb-8 border-t border-noir-800 pt-8">
          <div className="mb-3 font-mono text-[10px] uppercase tracking-wide2 text-accent">
            {label("Vídeo de fundo (opcional)", "Background video (optional)")}
          </div>
          <p className="mb-4 text-sm text-noir-400">
            {label(
              "Cole uma URL de vídeo (Cloudinary, Vimeo, ou qualquer CDN). Adicione uma capa para o estado parado.",
              "Paste a video URL (Cloudinary, Vimeo, or any CDN). Add a poster for the idle state."
            )}
          </p>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block">
                <span className="font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                  {label("URL do vídeo", "Video URL")}
                </span>
                <input
                  value={videoUrl}
                  onChange={(e) => saveVideo(e.target.value, videoPoster)}
                  placeholder="https://res.cloudinary.com/.../video.mp4"
                  className="mt-1 w-full rounded-sm border border-noir-700 bg-noir-950 px-3 py-2 text-sm text-cream placeholder:text-noir-600 focus:border-accent focus:outline-none"
                />
              </label>
            </div>
            <div>
              <label className="block">
                <span className="font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                  {label("URL da capa (poster)", "Poster URL")}
                </span>
                <input
                  value={videoPoster}
                  onChange={(e) => saveVideo(videoUrl, e.target.value)}
                  placeholder="https://res.cloudinary.com/.../poster.jpg"
                  className="mt-1 w-full rounded-sm border border-noir-700 bg-noir-950 px-3 py-2 text-sm text-cream placeholder:text-noir-600 focus:border-accent focus:outline-none"
                />
              </label>
            </div>
          </div>

          {videoUrl && videoPoster && (
            <Reveal className="mt-4">
              <div className="overflow-hidden rounded-sm border border-noir-700">
                <video
                  src={videoUrl}
                  poster={videoPoster}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className="aspect-[16/10] w-full object-cover"
                  onMouseEnter={(e) => e.currentTarget.play()}
                  onMouseLeave={(e) => {
                    e.currentTarget.pause();
                    e.currentTarget.currentTime = 0;
                  }}
                />
              </div>
              <p className="mt-2 text-center font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                {label("Passe o mouse para testar", "Hover to test")}
              </p>
            </Reveal>
          )}
        </div>

        {/* Cloudinary tip */}
        <div className="mb-6 rounded-sm border border-noir-800 bg-noir-950 p-4">
          <div className="flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="mt-0.5 shrink-0 text-accent">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-wide2 text-cream">
                {label("Dica: use Cloudinary (gratuito)", "Tip: use Cloudinary (free)")}
              </div>
              <p className="mt-1 text-sm text-noir-400">
                {label(
                  "Crie uma conta em cloudinary.com. Arraste imagens e vídeos para lá. Eles geram URLs otimizadas com CDN global — muito mais rápido que hospedar no próprio site.",
                  "Create an account at cloudinary.com. Drag images and videos there. They generate optimized URLs with a global CDN — much faster than self-hosting."
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="w-full rounded-full bg-cream py-3 font-mono text-[11px] uppercase tracking-wide2 text-noir-950 transition-transform hover:scale-[1.01]"
          >
            {label("Salvar alterações", "Save changes")}
          </button>
        </div>
      </div>

      <ImageCropper
        open={cropperOpen}
        initialImage={cropperTarget?.url}
        onClose={() => {
          setCropperOpen(false);
          setCropperTarget(null);
        }}
        onSave={onCropSave}
      />
    </div>
  );
}

/**
 * Hook para consumir imagens do Hero salvas no localStorage.
 */
export function useHeroImages(defaultImages: string[]): string[] {
  const [images, setImages] = useState<string[]>(defaultImages);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HERO_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setImages(parsed);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  return images;
}

/**
 * Hook para consumir vídeo do Hero salvo no localStorage.
 */
export function useHeroVideo(): { url: string; poster: string } | null {
  const [video, setVideo] = useState<{ url: string; poster: string } | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(HERO_VIDEO_KEY);
      if (saved) setVideo(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  return video;
}
