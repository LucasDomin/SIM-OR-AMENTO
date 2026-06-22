import { useEffect, useRef } from "react";

/**
 * Reveal-on-scroll — "stillness resolving into movement" as elements
 * enter the frame. Mirrors the original SIM .reveal helper.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px", ...options }
    );

    // Observe the element and all .reveal descendants
    io.observe(el);
    el.querySelectorAll<HTMLElement>(".reveal").forEach((n) => io.observe(n));

    return () => io.disconnect();
  }, [options]);

  return ref;
}
