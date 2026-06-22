import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';
import { formatCurrency, supabase } from '../lib/supabase';
import { formatDateFull } from '../lib/utils';
import type { Budget } from '../types';

export function ProposalPublic() {
  const { slug } = useParams<{ slug: string }>();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [slug]);

  async function load() {
    const result = await supabase.from('budgets').select().data();
    const found = ((result.data || []) as Budget[]).find((item) => item.online_slug === slug || item.id === slug) || null;
    setBudget(found);
    setLoading(false);
  }

  if (loading) return <div className="min-h-screen bg-noir-950" />;
  if (!budget) return <div className="flex min-h-screen items-center justify-center bg-noir-950 text-white/50">Proposta não encontrada.</div>;

  const deliverables = [
    budget.deliverables.videos ? `${budget.deliverables.videos} vídeo(s) finalizados` : '',
    budget.deliverables.photos ? `${budget.deliverables.photos} foto(s) tratadas` : '',
    budget.deliverables.reels ? `${budget.deliverables.reels} reels` : '',
    budget.deliverables.pilulas ? `${budget.deliverables.pilulas} pílulas` : '',
    budget.deliverables.sameday ? 'Sameday' : '',
    budget.deliverables.aftermovie ? 'Aftermovie' : '',
    budget.deliverables.videocase ? 'Videocase' : '',
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-cream text-noir-900">
      <motion.main initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8 }} className="mx-auto max-w-4xl px-6 py-14 md:py-20">
        <section className="min-h-[75vh] border-b border-black/10 pb-16">
          <div>
            <p className="font-display text-4xl font-semibold tracking-tight text-black">SIM</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.34em] text-black/35">Still In Movement</p>
          </div>
          <p className="mt-20 text-xs uppercase tracking-[0.34em] text-black/35">Proposta Comercial</p>
          <h1 className="mt-5 font-display text-6xl leading-none tracking-tight md:text-8xl">{budget.project_name}</h1>
          <div className="mt-10 grid gap-4 text-sm text-black/55 md:grid-cols-3"><p>Cliente<br /><span className="text-black">{budget.client_name}</span></p><p>Projeto<br /><span className="text-black">{budget.project_type}</span></p><p>Data<br /><span className="text-black">{formatDateFull(budget.proposal_date)}</span></p></div>
        </section>

        <Section title="About SIM"><p>A SIM é um estúdio audiovisual que combina linguagem cinematográfica, precisão comercial e execução premium para marcas, campanhas e experiências ao vivo.</p></Section>
        <Section title="Scope"><p>{budget.project_description || 'Produção audiovisual conforme briefing aprovado.'}</p></Section>
        <Section title="Deliverables"><div className="grid gap-3 md:grid-cols-2">{deliverables.map((item) => <div key={item} className="border-t border-black/10 pt-3 text-black/65">{item}</div>)}</div></Section>
        <Section title="Schedule"><p>{budget.production.shooting_days} diária(s) de captação em {budget.production.city}. Transporte {budget.production.need_transportation ? 'incluído no escopo' : 'não solicitado'}. Hospedagem {budget.production.need_lodging ? 'incluída no escopo' : 'não solicitada'}.</p></Section>
        <Section title="Investment"><p className="font-display text-6xl text-black">{formatCurrency(budget.final_price)}</p><p className="mt-6 text-sm text-black/45">Pagamento: 50% na aprovação e 50% na entrega final.</p><p className="mt-2 text-sm text-black/45">Este orçamento é válido por 30 dias após a emissão.</p></Section>
      </motion.main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="grid gap-8 border-b border-black/10 py-16 md:grid-cols-[220px_1fr]"><h2 className="text-xs uppercase tracking-[0.34em] text-black/35">{title}</h2><div className="text-xl leading-9 text-black/70">{children}</div></motion.section>;
}