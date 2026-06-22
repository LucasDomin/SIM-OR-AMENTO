import { useEffect, useState } from "react";
import { Loader } from "./components/Loader";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { ParallaxMarquee } from "./components/ParallaxMarquee";
import { Manifesto } from "./components/Manifesto";
import { SelectedWorks } from "./components/SelectedWorks";
import { Capabilities } from "./components/Capabilities";
import { Recognition } from "./components/Recognition";
import { Why } from "./components/Why";
import { Contact } from "./components/Contact";
import { CaseStudy } from "./components/CaseStudy";
import { AIAgent } from "./components/AIAgent";
import { AdminAccessModal } from "./components/AdminAccessModal";
import { AdminProvider } from "./contexts/AdminContext";
import { projects } from "./data/projects";

function ScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setP(max > 0 ? h.scrollTop / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed inset-x-0 top-0 z-[110] h-[2px] bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-spec-1 via-accent to-spec-6"
        style={{ width: `${p * 100}%` }}
      />
    </div>
  );
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [slug, setSlug] = useState<string | null>(null);
  const [admin, setAdmin] = useState(false);

  const active = projects.find((p) => p.slug === slug) ?? null;

  // lock scroll during loader
  useEffect(() => {
    document.body.style.overflow = loading ? "hidden" : "";
    if (!loading) window.scrollTo(0, 0);
  }, [loading]);

  return (
    <AdminProvider>
      <div className="grain relative min-h-screen bg-noir-950 text-noir-100">
        {loading && <Loader onDone={() => setLoading(false)} />}

        <ScrollProgress />
        <Navbar onAdmin={() => setAdmin(true)} />

        <main>
          <Hero onEnter={() => scrollToId("works")} />
          <ParallaxMarquee text="Still In Movement" />
          <Manifesto />
          <SelectedWorks onOpen={setSlug} />
          <Capabilities />
          <Why />
          <Recognition />
          <ParallaxMarquee text="A resposta continua sendo SIM" />
          <Contact onAdmin={() => setAdmin(true)} />
        </main>

        <CaseStudy project={active} onClose={() => setSlug(null)} />
        <AIAgent />
        <AdminAccessModal open={admin} onClose={() => setAdmin(false)} />
      </div>
    </AdminProvider>
  );
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
}
