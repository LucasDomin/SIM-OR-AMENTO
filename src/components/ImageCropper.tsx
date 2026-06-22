import { useEffect, useRef, useState } from "react";
import { useLang } from "../contexts/LanguageContext";
import { cn } from "../lib/cn";

/**
 * ImageCropper — tela de crop com pré-visualização antes de salvar.
 * - Upload (ou URL) de imagem
 * - Controles: mover (drag), zoom (slider), aspect ratio (16:10 / 4:5 / square / 21:9)
 * - Preview ao vivo em três tamanhos (desktop / tablet / mobile) no card lateral
 * - `onSave` retorna { url, crop: { x, y, scale } } para ser persistido
 */
export function ImageCropper({
  open,
  initialImage,
  initialCrop,
  onClose,
  onSave,
}: {
  open: boolean;
  initialImage?: string;
  initialCrop?: { x: number; y: number; scale: number };
  onClose: () => void;
  onSave: (payload: { url: string; crop: { x: number; y: number; scale: number } }) => void;
}) {
  const { lang } = useLang();
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState<string>(initialImage ?? "");
  const [crop, setCrop] = useState<{ x: number; y: number; scale: number }>(
    initialCrop ?? { x: 0, y: 0, scale: 1 }
  );
  const [aspect, setAspect] = useState<"16:10" | "4:5" | "1:1" | "21:9">("16:10");
  const [dragging, setDragging] = useState(false);
  const dragStart = useRef<{ x: number; y: number; cx: number; cy: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    setUrl(initialImage ?? "");
    setCrop(initialCrop ?? { x: 0, y: 0, scale: 1 });
  }, [open, initialImage, initialCrop]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const aspectRatio =
    aspect === "16:10" ? 16 / 10 : aspect === "4:5" ? 4 / 5 : aspect === "1:1" ? 1 : 21 / 9;

  const onFile = (f: File) => {
    const reader = new FileReader();
    reader.onload = () => setUrl(String(reader.result));
    reader.readAsDataURL(f);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) onFile(file);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!url) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, cx: crop.x, cy: crop.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStart.current || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragStart.current.x) / rect.width) * 200;
    const dy = ((e.clientY - dragStart.current.y) / rect.height) * 200;
    setCrop((c) => ({
      ...c,
      x: Math.max(-100, Math.min(100, dragStart.current!.cx + dx)),
      y: Math.max(-100, Math.min(100, dragStart.current!.cy + dy)),
    }));
  };

  const onPointerUp = () => {
    setDragging(false);
    dragStart.current = null;
  };

  const reset = () => setCrop({ x: 0, y: 0, scale: 1 });

  const save = () => {
    if (!url) return;
    onSave({ url, crop });
  };

  const previewStyle = {
    backgroundImage: url ? `url(${url})` : undefined,
    backgroundPosition: `${50 + crop.x / 2}% ${50 + crop.y / 2}%`,
    backgroundSize: `${crop.scale * 100}%`,
    backgroundRepeat: "no-repeat",
  };

  return (
    <div className="fixed inset-0 z-[180] flex items-center justify-center bg-noir-950/90 p-4 backdrop-blur-md fade-in">
      <div className="relative grid w-full max-w-6xl gap-5 rounded-sm border border-noir-700 bg-noir-900 p-5 md:grid-cols-[1fr_320px] md:p-8 fade-up">
        {/* Header */}
        <div className="flex items-center justify-between md:col-span-2">
          <div>
            <h3 className="font-display text-2xl text-cream">
              {lang === "pt" ? "Cortar imagem" : "Crop image"}
            </h3>
            <p className="mt-1 text-sm text-noir-400">
              {lang === "pt"
                ? "Arraste para mover, use o slider para zoom. A pré-visualização ao lado mostra como ficará publicada."
                : "Drag to reposition, use the slider to zoom. The live preview on the right shows the final result."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-noir-700 p-2 text-noir-400 transition-colors hover:border-noir-500 hover:text-cream"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {/* Stage */}
        <div>
          <div
            ref={stageRef}
            onDrop={onDrop}
            onDragOver={(e) => e.preventDefault()}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={cn(
              "relative mx-auto w-full overflow-hidden rounded-sm border border-dashed border-noir-700 bg-noir-950",
              url && "cursor-grab active:cursor-grabbing border-solid border-noir-600"
            )}
            style={{ aspectRatio }}
          >
            {url ? (
              <div
                className="absolute inset-0 transition-transform duration-75"
                style={{
                  backgroundImage: `url(${url})`,
                  backgroundPosition: `${50 + crop.x / 2}% ${50 + crop.y / 2}%`,
                  backgroundSize: `${crop.scale * 100}%`,
                  backgroundRepeat: "no-repeat",
                }}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" className="text-noir-500">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="11" r="2" />
                  <path d="M21 17l-5-5-7 7" />
                </svg>
                <p className="max-w-xs text-sm text-noir-400">
                  {lang === "pt"
                    ? "Solte uma imagem aqui ou clique para selecionar um arquivo."
                    : "Drop an image here or click to select a file."}
                </p>
                <button
                  onClick={() => fileRef.current?.click()}
                  className="rounded-full bg-cream px-5 py-2 font-mono text-[10px] uppercase tracking-wide2 text-noir-950 transition-transform hover:scale-[1.02]"
                >
                  {lang === "pt" ? "Escolher arquivo" : "Choose file"}
                </button>
              </div>
            )}

            {/* Safe-area guides */}
            {url && (
              <>
                <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i} className="border border-cream/10" />
                  ))}
                </div>
                <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-accent/30" />
              </>
            )}
          </div>

          {/* Controls */}
          <div className="mt-5 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              {(["16:10", "21:9", "4:5", "1:1"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setAspect(r)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide2 transition-colors",
                    aspect === r
                      ? "border-accent bg-accent/10 text-cream"
                      : "border-noir-700 text-noir-400 hover:border-noir-500 hover:text-cream"
                  )}
                >
                  {r}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
                Zoom
              </span>
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={crop.scale}
                onChange={(e) => setCrop((c) => ({ ...c, scale: Number(e.target.value) }))}
                className="w-40 accent-[var(--color-accent)]"
              />
              <span className="w-10 text-right font-mono text-[10px] text-noir-400">
                {crop.scale.toFixed(2)}x
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={reset}
                className="rounded-full border border-noir-700 px-4 py-2 font-mono text-[10px] uppercase tracking-wide2 text-noir-300 transition-colors hover:border-noir-500 hover:text-cream"
              >
                {lang === "pt" ? "Redefinir" : "Reset"}
              </button>
              <button
                onClick={() => fileRef.current?.click()}
                className="rounded-full border border-noir-700 px-4 py-2 font-mono text-[10px] uppercase tracking-wide2 text-noir-300 transition-colors hover:border-noir-500 hover:text-cream"
              >
                {lang === "pt" ? "Trocar" : "Replace"}
              </button>
            </div>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
        </div>

        {/* Preview panel */}
        <div className="flex flex-col gap-4">
          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
              {lang === "pt" ? "Pré-visualização" : "Live preview"}
            </div>
            <div className="space-y-3">
              {/* Desktop */}
              <div className="rounded-sm border border-noir-700 bg-noir-950 p-2">
                <div className="flex items-center justify-between px-1 pb-1 font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                  <span>Desktop</span>
                  <span>16 : 10</span>
                </div>
                <div
                  className="w-full overflow-hidden rounded-sm bg-noir-900"
                  style={{ aspectRatio: 16 / 10, ...previewStyle }}
                />
              </div>

              {/* Tablet */}
              <div className="rounded-sm border border-noir-700 bg-noir-950 p-2">
                <div className="flex items-center justify-between px-1 pb-1 font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                  <span>Tablet</span>
                  <span>4 : 5</span>
                </div>
                <div className="mx-auto w-2/3 overflow-hidden rounded-sm bg-noir-900" style={{ aspectRatio: 4 / 5, ...previewStyle }} />
              </div>

              {/* Mobile */}
              <div className="rounded-sm border border-noir-700 bg-noir-950 p-2">
                <div className="flex items-center justify-between px-1 pb-1 font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                  <span>Mobile</span>
                  <span>1 : 1</span>
                </div>
                <div className="mx-auto w-1/2 overflow-hidden rounded-sm bg-noir-900" style={{ aspectRatio: 1, ...previewStyle }} />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-noir-800 pt-4">
            <button
              onClick={save}
              disabled={!url}
              className="w-full rounded-full bg-cream py-3 font-mono text-[11px] uppercase tracking-wide2 text-noir-950 transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:bg-noir-700 disabled:text-noir-500"
            >
              {lang === "pt" ? "Salvar e publicar" : "Save & publish"}
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-full border border-noir-700 py-3 font-mono text-[11px] uppercase tracking-wide2 text-noir-300 transition-colors hover:border-noir-500 hover:text-cream"
            >
              {lang === "pt" ? "Cancelar" : "Cancel"}
            </button>
          </div>

          <div className="border-t border-noir-800 pt-3 font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
            {lang === "pt" ? "Rascunho guardado localmente" : "Draft kept locally"}
          </div>
        </div>
      </div>
    </div>
  );
}
