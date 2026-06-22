import { useEffect, useState } from "react";
import type { Project } from "../data/projects";
import { useLang } from "../contexts/LanguageContext";
import { useAdmin } from "../contexts/AdminContext";
import { ImageCropper } from "./ImageCropper";
import { cn } from "../lib/cn";

/**
 * ProjectEditor — painel de edição por projeto.
 * Permite alterar texto (título, cliente, descrição, categoria, ano, local, formato)
 * e imagem (abre o ImageCropper com pré-visualização antes de salvar).
 * Mostra preview ao vivo do card no topo, e confirma antes de publicar.
 */
export function ProjectEditor({
  open,
  project,
  onClose,
}: {
  open: boolean;
  project: Project | null;
  onClose: () => void;
}) {
  const { lang } = useLang();
  const { updateDraft, commitDraft, resetDraft, getProject } = useAdmin();
  const [cropperOpen, setCropperOpen] = useState(false);

  const [form, setForm] = useState<{
    title: string;
    client: string;
    category: string;
    description: string;
    year: string;
    location: string;
    format: string;
    cover: string;
    video: string;
    poster: string;
  }>({
    title: "",
    client: "",
    category: "",
    description: "",
    year: "",
    location: "",
    format: "",
    cover: "",
    video: "",
    poster: "",
  });

  useEffect(() => {
    if (!open || !project) return;
    const merged = getProject(project);
    setForm({
      title: merged.title,
      client: merged.client,
      category: merged.category,
      description: merged.description,
      year: merged.year,
      location: merged.location,
      format: merged.format,
      cover: merged.cover,
      video: merged.video || "",
      poster: merged.poster || "",
    });
  }, [open, project, getProject]);

  if (!open || !project) return null;

  const label = (pt: string, en: string) => (lang === "pt" ? pt : en);

  const save = () => {
    updateDraft(project.slug, {
      title: form.title,
      client: form.client,
      description: form.description,
      cover: form.cover,
      year: form.year,
      location: form.location,
      format: form.format,
      category: form.category,
      video: form.video,
      poster: form.poster,
    });
    commitDraft(project.slug);
    onClose();
  };

  const reset = () => {
    resetDraft(project.slug);
    onClose();
  };

  const onCropSave = (payload: { url: string; crop: { x: number; y: number; scale: number } }) => {
    setForm((f) => ({ ...f, cover: payload.url }));
    updateDraft(project.slug, { cover: payload.url, coverCrop: payload.crop });
    setCropperOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-noir-950/90 p-4 backdrop-blur-md fade-in">
      <div className="relative grid w-full max-w-6xl gap-5 rounded-sm border border-noir-700 bg-noir-900 p-5 md:grid-cols-[1fr_420px] md:p-8 fade-up">
        <div className="flex items-center justify-between md:col-span-2">
          <div>
            <h3 className="font-display text-2xl text-cream">
              {label("Editar projeto", "Edit project")}
            </h3>
            <p className="mt-1 text-sm text-noir-400">
              {label(
                "Pré-visualize antes de salvar — texto e imagem são atualizados em tempo real.",
                "Preview before saving — text and image update in real time."
              )}
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

        {/* Live preview */}
        <div>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wide2 text-noir-500">
            {label("Pré-visualização", "Live preview")}
          </div>
          <div className="overflow-hidden rounded-sm border border-noir-700 bg-noir-950">
            <div
              className="relative w-full overflow-hidden"
              style={{
                aspectRatio: "16 / 10",
                backgroundImage: `url(${form.cover})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-noir-950/90 via-noir-950/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-left">
                <div className="font-mono text-[10px] uppercase tracking-wide2 text-accent">
                  {form.category} · {form.client}
                </div>
                <div className="mt-1 font-display text-3xl text-cream">{form.title || "—"}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 text-left text-sm text-noir-300">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                  {label("Ano", "Year")}
                </div>
                <div>{form.year}</div>
              </div>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                  {label("Local", "Location")}
                </div>
                <div>{form.location}</div>
              </div>
              <div className="col-span-2">
                <div className="font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                  {label("Formato", "Format")}
                </div>
                <div>{form.format}</div>
              </div>
              <div className="col-span-2">
                <div className="font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                  {label("Descrição", "Description")}
                </div>
                <div className="text-sm leading-relaxed text-noir-300">{form.description}</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setCropperOpen(true)}
            className="mt-3 w-full rounded-full border border-noir-700 py-3 font-mono text-[11px] uppercase tracking-wide2 text-noir-200 transition-colors hover:border-noir-500 hover:text-cream"
          >
            {label("Abrir editor de imagem / crop", "Open image editor / crop")}
          </button>
        </div>

        {/* Form */}
        <div className="flex flex-col gap-3">
          <Field
            label={label("Título", "Title")}
            value={form.title}
            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
          />
          <Field
            label={label("Cliente", "Client")}
            value={form.client}
            onChange={(v) => setForm((f) => ({ ...f, client: v }))}
          />
          <Field
            label={label("Categoria", "Category")}
            value={form.category}
            onChange={(v) => setForm((f) => ({ ...f, category: v }))}
          />
          <Field
            label={label("Ano", "Year")}
            value={form.year}
            onChange={(v) => setForm((f) => ({ ...f, year: v }))}
          />
          <Field
            label={label("Localização", "Location")}
            value={form.location}
            onChange={(v) => setForm((f) => ({ ...f, location: v }))}
          />
          <Field
            label={label("Formato", "Format")}
            value={form.format}
            onChange={(v) => setForm((f) => ({ ...f, format: v }))}
          />
          <Textarea
            label={label("Descrição", "Description")}
            value={form.description}
            onChange={(v) => setForm((f) => ({ ...f, description: v }))}
          />

          {/* Video fields */}
          <div className="mt-2 border-t border-noir-800 pt-4">
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wide2 text-accent">
              {label("Vídeo (opcional)", "Video (optional)")}
            </div>
            <Field
              label={label("URL do vídeo", "Video URL")}
              value={form.video || ""}
              onChange={(v) => setForm((f) => ({ ...f, video: v }))}
            />
            <div className="mt-2">
              <Field
                label={label("URL da capa (poster)", "Poster URL")}
                value={form.poster || ""}
                onChange={(v) => setForm((f) => ({ ...f, poster: v }))}
              />
            </div>
            {form.video && form.poster && (
              <div className="mt-3 overflow-hidden rounded-sm border border-noir-700">
                <video
                  src={form.video}
                  poster={form.poster}
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
            )}
          </div>

          <div className="mt-auto flex flex-col gap-2 border-t border-noir-800 pt-4">
            <button
              onClick={save}
              className="w-full rounded-full bg-cream py-3 font-mono text-[11px] uppercase tracking-wide2 text-noir-950 transition-transform hover:scale-[1.01]"
            >
              {label("Salvar e publicar", "Save & publish")}
            </button>
            <button
              onClick={reset}
              className={cn(
                "w-full rounded-full border border-noir-700 py-3 font-mono text-[11px] uppercase tracking-wide2 text-noir-300 transition-colors",
                "hover:border-noir-500 hover:text-cream"
              )}
            >
              {label("Restaurar original", "Restore original")}
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-full border border-noir-700 py-3 font-mono text-[11px] uppercase tracking-wide2 text-noir-300 transition-colors hover:border-noir-500 hover:text-cream"
            >
              {label("Cancelar", "Cancel")}
            </button>
          </div>
        </div>
      </div>

      <ImageCropper
        open={cropperOpen}
        initialImage={form.cover}
        onClose={() => setCropperOpen(false)}
        onSave={onCropSave}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] uppercase tracking-wide2 text-noir-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-sm border border-noir-700 bg-noir-950 px-3 py-2 text-sm text-cream placeholder:text-noir-600 focus:border-accent focus:outline-none"
      />
    </label>
  );
}

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[9px] uppercase tracking-wide2 text-noir-500">{label}</span>
      <textarea
        value={value}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full resize-none rounded-sm border border-noir-700 bg-noir-950 px-3 py-2 text-sm leading-relaxed text-cream placeholder:text-noir-600 focus:border-accent focus:outline-none"
      />
    </label>
  );
}
