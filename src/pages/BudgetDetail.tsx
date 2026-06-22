import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, Copy, Download, FileText, Link2, Send, XCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { BudgetStatusBadge } from '../components/BudgetStatusBadge';
import { Layout } from '../components/Layout';
import { formatCurrency, supabase } from '../lib/supabase';
import { formatDate, formatDateFull } from '../lib/utils';
import type { Budget } from '../types';

export function BudgetDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [budget, setBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (id) loadBudget(); }, [id]);

  async function loadBudget() {
    const { data } = await supabase.from('budgets').select().eq('id', id || '').single();
    setBudget(data as Budget | null);
    setLoading(false);
  }

  async function updateStatus(status: Budget['status']) {
    if (!budget) return;
    await supabase.from('budgets').update({ status }).eq('id', budget.id);
    loadBudget();
  }

  function duplicateBudget() {
    if (!budget) return;
    navigate('/budgets/new', { state: { duplicate: budget } });
  }

  function proposalUrl() {
    if (!budget) return '';
    return `${window.location.origin}/proposal/${budget.online_slug}`;
  }

  async function copyLink() {
    await navigator.clipboard.writeText(proposalUrl());
    alert('Link da proposta copiado.');
  }

  function generatePDF(clientOnly = true) {
    if (!budget) return;
    const doc = new jsPDF();
    const margin = 24;
    const width = doc.internal.pageSize.getWidth();
    let y = 28;

    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    doc.text('SIM', margin, y);
    doc.setFontSize(9);
    doc.setTextColor(115, 115, 115);
    doc.text(clientOnly ? 'PROPOSTA COMERCIAL' : 'DOCUMENTO INTERNO', width - margin - 45, y);
    y += 24;

    doc.setFontSize(22);
    doc.setTextColor(20, 20, 20);
    doc.text(budget.project_name, margin, y);
    y += 9;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(90, 90, 90);
    doc.text(`${budget.client_name} / ${budget.client_company || 'Cliente SIM'}`, margin, y);
    y += 18;

    const lines = [
      ['Projeto', budget.project_type],
      ['Data', formatDateFull(budget.proposal_date)],
      ['Cidade', budget.production.city],
      ['Diárias', String(budget.production.shooting_days)],
      ['Validade', formatDateFull(budget.expires_at)],
    ];
    lines.forEach(([label, value]) => { doc.text(`${label}: ${value}`, margin, y); y += 7; });
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('Escopo e entregáveis', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.splitTextToSize(budget.project_description || 'Produção audiovisual conforme briefing aprovado.', width - margin * 2).forEach((line: string) => { doc.text(line, margin, y); y += 6; });
    y += 6;
    deliverableLines(budget).forEach((line) => { doc.text(`- ${line}`, margin, y); y += 6; });
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(20, 20, 20);
    doc.text('Investimento final', margin, y);
    y += 12;
    doc.setFontSize(24);
    doc.text(formatCurrency(budget.final_price), margin, y);
    y += 12;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Este orçamento é válido por 30 dias após a emissão.', margin, y);
    y += 10;
    doc.text('Pagamento: 50% na aprovação e 50% na entrega final.', margin, y);

    if (!clientOnly) {
      y += 18;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(20, 20, 20);
      doc.text('Resumo interno', margin, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      [['Custo', budget.cost_total], ['Fee', budget.fee_value], ['Imposto', budget.tax_value], ['Lucro', budget.profit]].forEach(([label, value]) => { doc.text(`${label}: ${formatCurrency(Number(value))}`, margin, y); y += 6; });
      doc.text(`Margem: ${(budget.margin * 100).toFixed(1)}%`, margin, y);
    }
    doc.save(`${clientOnly ? 'proposta' : 'interno'}-${budget.project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
  }

  async function generateDOCX() {
    if (!budget) return;
    const doc = new Document({ sections: [{ children: [
      new Paragraph({ text: 'SIM', heading: HeadingLevel.TITLE }),
      new Paragraph({ text: 'Proposta Comercial', heading: HeadingLevel.HEADING_1 }),
      new Paragraph({ children: [new TextRun({ text: budget.project_name, bold: true })] }),
      new Paragraph({ text: `Cliente: ${budget.client_name}` }),
      new Paragraph({ text: `Projeto: ${budget.project_type}` }),
      new Paragraph({ text: budget.project_description || 'Produção audiovisual conforme briefing aprovado.' }),
      new Paragraph({ text: 'Entregáveis', heading: HeadingLevel.HEADING_2 }),
      ...deliverableLines(budget).map((line) => new Paragraph({ text: line, bullet: { level: 0 } })),
      new Paragraph({ text: 'Investimento', heading: HeadingLevel.HEADING_2 }),
      new Paragraph({ children: [new TextRun({ text: formatCurrency(budget.final_price), bold: true, size: 32 })] }),
      new Paragraph({ text: 'Este orçamento é válido por 30 dias após a emissão.' }),
      new Paragraph({ text: 'Pagamento: 50% na aprovação e 50% na entrega final.' }),
    ] }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposta-${budget.project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <Layout><div className="h-64 animate-pulse rounded-3xl bg-white/5" /></Layout>;
  if (!budget) return <Layout><p className="text-white/50">Orçamento não encontrado.</p></Layout>;

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-8">
        <button onClick={() => navigate('/budgets')} className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white"><ChevronLeft size={16} />Voltar</button>
        <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-5 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="mb-3 text-xs uppercase tracking-[0.34em] text-accent">Budget ID {budget.id.slice(0, 8)}</p><div className="flex flex-wrap items-center gap-3"><h1 className="font-display text-4xl text-white md:text-5xl">{budget.project_name}</h1><BudgetStatusBadge status={budget.status} /></div><p className="mt-3 text-sm text-white/45">{budget.client_name} / {budget.project_type} / expira em {formatDate(budget.expires_at)}</p></div>
          <div className="flex flex-wrap gap-2">{budget.status === 'Draft' && <Button onClick={() => updateStatus('Sent')} icon={Send}>Enviar</Button>}{budget.status === 'Sent' && <><Button onClick={() => updateStatus('Approved')} icon={CheckCircle2}>Aprovar</Button><Button onClick={() => updateStatus('Rejected')} icon={XCircle}>Rejeitar</Button></>}<Button onClick={duplicateBudget} icon={Copy}>Duplicar</Button></div>
        </motion.header>

        <div className="grid gap-5 md:grid-cols-4">
          <Metric label="Final Price" value={formatCurrency(budget.final_price)} strong />
          <Metric label="Total Cost" value={formatCurrency(budget.cost_total)} />
          <Metric label="Profit" value={formatCurrency(budget.profit)} />
          <Metric label="Margin" value={`${(budget.margin * 100).toFixed(1)}%`} />
        </div>

        <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-5 font-display text-2xl text-white">Scope</h2>
            <p className="text-sm leading-6 text-white/50">{budget.project_description || 'Produção audiovisual conforme briefing aprovado.'}</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">{deliverableLines(budget).map((line) => <div key={line} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">{line}</div>)}</div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-5 font-display text-2xl text-white">Proposal</h2>
            <div className="space-y-3"><Button onClick={() => generatePDF(true)} icon={FileText} block>PDF Cliente</Button><Button onClick={() => generatePDF(false)} icon={Download} block>PDF Interno</Button><Button onClick={generateDOCX} icon={Download} block>DOCX Cliente</Button><Button onClick={copyLink} icon={Link2} block>Copiar link online</Button></div>
            <p className="mt-5 break-all rounded-2xl bg-black/30 p-3 text-xs leading-5 text-white/35">{proposalUrl()}</p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-5 font-display text-2xl text-white">Internal Items</h2>
          <div className="space-y-2">{budget.items.map((item) => <div key={item.id} className="grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm md:grid-cols-[1fr_80px_120px_120px]"><div><p className="text-white">{item.name}</p><p className="text-xs text-white/35">{item.category}</p></div><p className="text-white/55">x{item.quantity}</p><p className="text-white/55">Sale {formatCurrency(item.sale_price)}</p><p className="text-white/55">Cost {formatCurrency(item.cost_price)}</p></div>)}</div>
        </section>
      </div>
    </Layout>
  );
}

function deliverableLines(budget: Budget) {
  const d = budget.deliverables;
  return [
    d.videos ? `${d.videos} vídeo(s) finalizados` : '',
    d.photos ? `${d.photos} foto(s) tratadas` : '',
    d.reels ? `${d.reels} reels` : '',
    d.pilulas ? `${d.pilulas} pílulas de conteúdo` : '',
    d.sameday ? 'Entrega sameday' : '',
    d.aftermovie ? 'Aftermovie' : '',
    d.videocase ? 'Videocase' : '',
    `${budget.production.shooting_days} diária(s) em ${budget.production.city}`,
  ].filter(Boolean);
}

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) { return <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"><p className="text-xs uppercase tracking-[0.24em] text-white/30">{label}</p><p className={`mt-3 font-display ${strong ? 'text-3xl text-white' : 'text-2xl text-white/80'}`}>{value}</p></div>; }
function Button({ children, onClick, icon: Icon, block }: { children: React.ReactNode; onClick: () => void; icon: React.ElementType; block?: boolean }) { return <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 transition hover:border-white/25 hover:bg-white hover:text-black ${block ? 'w-full justify-center' : ''}`}><Icon size={16} />{children}</button>; }