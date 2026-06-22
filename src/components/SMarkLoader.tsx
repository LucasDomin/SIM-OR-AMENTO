const sPath =
  "M94.31,38.49c-13.63,6.5-23.64,12.21-36.3,19.83-5.02-4.44-8.1-7.81-12.38-12.94-5.53-6.63-8.65-15.24-1.4-22.36,6.6-6.49,16.28-10.49,25.12-12.53,6.72-1.55,3.87-11.88-2.85-10.33-14.74,3.41-42.22,18.85-37.32,38.17,2.07,8.16,9.01,15.15,14.77,20.89,1.5,1.49,3.04,2.85,4.99,4.42-20.95,11.67-30.83,17.36-41.57,31.71-5.43,7.25-12.02,18.36-2.65,25.19,9.04,6.58,23.65,2.4,33-.81,17.23-5.92,52.35-25.92,34.73-47.98-1.2-1.5-5.49-5.36-6.82-6.75,10.01-5.91,15.54-10.45,29.42-16.73,8.56-3.87,5.89-13.28-.73-9.78ZM36.44,108.86c-5.39,1.99-11.4,3.95-17.19,4.18-12.32.48-6.63-7.66-.92-14.3,10.75-12.53,24.76-19.66,39.06-28.33,2.71,2.5,6.09,6.14,7.48,8.92h0c7.1,14.22-18.08,25.71-28.43,29.53Z";

export function SMarkLoader({
  progress,
  className = "",
}: {
  progress: number;
  className?: string;
}) {
  const draw = Math.min(progress, 1);
  const fill = Math.max(0, Math.min(1, (progress - 0.72) / 0.25));

  return (
    <div className={`relative ${className}`}>
      <svg
        viewBox="0 0 100.44 124.03"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full overflow-visible"
        aria-hidden="true"
      >
        <path
          d={sPath}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d={sPath}
          pathLength={1}
          fill="none"
          stroke="#fff"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            strokeDasharray: 1,
            strokeDashoffset: 1 - draw,
            filter: "drop-shadow(0 0 18px rgba(255,255,255,0.18))",
            transition: "stroke-dashoffset 80ms linear",
          }}
        />
        <path
          d={sPath}
          fill="#fff"
          style={{ opacity: fill, transition: "opacity 300ms ease" }}
        />
      </svg>
      {/* Barra de cores colorida */}
      <div className="mt-8 flex h-1.5 w-full overflow-hidden rounded-full">
        {[
          { c: "#c084fc", w: 12.5 },
          { c: "#f87171", w: 12.5 },
          { c: "#fb923c", w: 12.5 },
          { c: "#facc15", w: 12.5 },
          { c: "#4ade80", w: 12.5 },
          { c: "#38bdf8", w: 12.5 },
          { c: "#94a3b8", w: 12.5 },
          { c: "#fde68a", w: 12.5 },
        ].map((seg, i) => (
          <div
            key={i}
            className="h-full transition-opacity duration-300"
            style={{
              width: `${seg.w}%`,
              backgroundColor: seg.c,
              opacity: draw >= (i + 1) / 8 ? 1 : 0.25,
            }}
          />
        ))}
      </div>
      <div className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.32em] text-noir-400">
        Still In Movement
      </div>
    </div>
  );
}
