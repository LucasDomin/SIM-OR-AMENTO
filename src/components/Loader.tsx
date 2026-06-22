import { useEffect, useState } from "react";
import { SMarkLoader } from "./SMarkLoader";

/**
 * SIM Tela de Carga Inicial — Exatamente igual no repositório LucasDomin/SIM.
 * Utiliza a marca SMarkLoader animada com progresso 0 a 2 e transição suave.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const duration = 2200; // Tempo até progress = 2
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const currentProgress = (elapsed / duration) * 2;
      setProgress(currentProgress);

      if (currentProgress < 2) {
        raf = requestAnimationFrame(tick);
      } else {
        setProgress(2);
        setTimeout(onDone, 700); // Dá tempo para o fade-out do container (opacity 0)
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-noir-950 transition-opacity duration-700"
      style={{
        opacity: progress >= 2 ? 0 : 1,
        pointerEvents: progress >= 2 ? "none" : "auto",
      }}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={2}
      aria-valuenow={progress}
    >
      <SMarkLoader className="w-28 md:w-36" progress={Math.min(progress, 1)} />
    </div>
  );
}
