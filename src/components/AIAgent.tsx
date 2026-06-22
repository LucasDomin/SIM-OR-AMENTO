import { useEffect, useRef, useState } from "react";
import { useLang } from "../contexts/LanguageContext";

type Msg = { role: "bot" | "user"; text: string };

export function AIAgent() {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMsgs([{ role: "bot", text: t.ai.greeting }]);
  }, [t.ai.greeting]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [msgs, open]);

  const reply = (q: string): string => {
    const s = q.toLowerCase();
    const L = lang;
    const has = (...k: string[]) => k.some((w) => s.includes(w));

    if (has("orçament", "budget", "preço", "preco", "price", "cost", "quanto", "valor"))
      return L === "pt"
        ? "Você pode simular o investimento na seção Orçamento acima — ajuste tipo, dias e entregáveis para um valor em tempo real."
        : "You can model the investment in the Quote section above — adjust type, days and deliverables for a real-time figure.";
    if (has("filme", "film", "cinema", "vídeo", "video", "campanha", "campaign"))
      return L === "pt"
        ? "Nosso cinema de marca combina direção autoral e fotografia cinematográfica. Cases como Atlas e Obsidian mostram o tom."
        : "Our brand cinema blends authored direction with cinematic photography. Cases like Atlas and Obsidian show the tone.";
    if (has("editorial", "foto", "photo", "vogue", "moda", "fashion"))
      return L === "pt"
        ? "Fazemos editorial de moda, arquitetura e retrato — do conceito à pós-produção. Veja Linho."
        : "We do fashion, architecture and portraiture editorial — from concept to post. See Linho.";
    if (has("doc", "documentário", "documentary"))
      return L === "pt"
        ? "Documentários íntimos filmados com tempo e honestidade. Kintsugi é um bom exemplo."
        : "Intimate documentaries filmed with time and honesty. Kintsugi is a good example.";
    if (has("contato", "contact", "email", "falar", "talk", "olá", "hello", "oi"))
      return L === "pt"
        ? "Escreva para hello@sim.studio ou role até o rodapé. Respondemos em 24h."
        : "Email hello@sim.studio or scroll to the footer. We reply within 24h.";
    if (has("still", "movement", "movimento", "manifesto", "conceito"))
      return L === "pt"
        ? "Still In Movement: acreditamos na imagem parada que contém o movimento. É o princípio de tudo o que filmamos."
        : "Still In Movement: we believe in the still image that holds movement. It's the principle behind everything we shoot.";
    return L === "pt"
      ? "Posso ajudar com orçamento, tipos de projeto (cinema, editorial, documentário) ou contato. O que você tem em mente?"
      : "I can help with budget, project types (cinema, editorial, documentary) or contact. What do you have in mind?";
  };

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    setMsgs((m) => [...m, { role: "user", text: q }]);
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "bot", text: reply(q) }]);
    }, 480);
  };

  return (
    <>
      {/* Trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={t.ai.title}
        className="fixed bottom-5 right-5 z-[130] flex h-14 w-14 items-center justify-center rounded-full border border-noir-600 bg-noir-900/80 text-cream backdrop-blur transition-all hover:border-accent hover:scale-105 md:bottom-7 md:right-7"
      >
        <span className="absolute inset-0 animate-glow rounded-full bg-accent/20 blur-md" />
        {!open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="relative">
            <path d="M12 3a9 9 0 0 0-9 9v4a3 3 0 0 0 3 3h1v-7H5a7 7 0 0 1 14 0h-2v7h1a3 3 0 0 0 3-3v-4a9 9 0 0 0-9-9z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="relative">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-5 z-[130] flex h-[60vh] max-h-[520px] w-[min(90vw,380px)] flex-col overflow-hidden rounded-sm border border-noir-700 bg-noir-900/95 shadow-2xl backdrop-blur-xl fade-up md:right-7">
          <div className="flex items-center gap-3 border-b border-noir-800 px-4 py-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-spec-5 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-spec-5" />
            </span>
            <div>
              <div className="font-display text-base text-cream">{t.ai.title}</div>
              <div className="font-mono text-[9px] uppercase tracking-wide2 text-noir-500">
                Still In Movement
              </div>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[80%] rounded-sm rounded-br-none bg-accent px-3 py-2 text-[13px] text-noir-950"
                      : "max-w-[85%] rounded-sm rounded-bl-none bg-noir-800 px-3 py-2 text-[13px] text-noir-100"
                  }
                >
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 border-t border-noir-800 p-3">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t.ai.placeholder}
              className="flex-1 rounded-sm border border-noir-700 bg-noir-950 px-3 py-2 text-[13px] text-cream placeholder:text-noir-500 focus:border-accent focus:outline-none"
            />
            <button
              onClick={send}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-cream text-noir-950 transition-transform hover:scale-105"
              aria-label="Send"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
