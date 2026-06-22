import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, Copy, Download, FileText, Link2, Send, XCircle } from 'lucide-react';
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

  async function generatePDF(clientOnly = true) {
    if (!budget) return;
    const jspdfUrl = 'https://esm.sh/jspdf@3.0.3';
    const { default: jsPDF } = await import(/* @vite-ignore */ jspdfUrl);
    const doc = new jsPDF();
    const margin = 20;
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    let y = margin;

    function checkPageBreak(needed: number) {
      if (y + needed > height - margin) {
        doc.addPage();
        y = margin;
      }
    }

    // Logo & Header
    doc.setFillColor(6, 6, 6);
    doc.rect(0, 0, width, 55, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('SIM', margin, 30);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(212, 197, 169); // Accent
    doc.text('Still In Movement', margin, 40);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text(clientOnly ? 'PROPOSTA COMERCIAL' : 'ORÇAMENTO INTERNO', width - margin, 30, { align: 'right' });
    doc.setTextColor(150, 150, 150);
    doc.text(formatDateFull(budget.proposal_date), width - margin, 40, { align: 'right' });
    
    y = 75;

    // Title
    doc.setTextColor(10, 10, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    const splitTitle = doc.splitTextToSize(budget.project_name, width - margin * 2);
    doc.text(splitTitle, margin, y);
    y += splitTitle.length * 9 + 5;

    // Client info box
    doc.setFillColor(244, 241, 236); // Cream
    doc.roundedRect(margin, y, width - margin * 2, 25, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', margin + 6, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${budget.client_name} - ${budget.client_company || 'SIM'}`, margin + 25, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.text('Projeto:', margin + 6, y + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(budget.project_type, margin + 25, y + 18);
    y += 40;

    // Scope & Deliverables
    checkPageBreak(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('Escopo', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    const scopeLines = doc.splitTextToSize(budget.project_description || 'Produção audiovisual conforme briefing aprovado.', width - margin * 2);
    doc.text(scopeLines, margin, y);
    y += scopeLines.length * 5 + 8;

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(10, 10, 10);
    doc.setFontSize(14);
    doc.text('Entregáveis', margin, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(70, 70, 70);
    deliverableLines(budget).forEach((line) => {
      doc.text(`•  ${line}`, margin, y);
      y += 6;
    });
    y += 10;

    if (clientOnly) {
      // Client Investment Box
      checkPageBreak(60);
      doc.setFillColor(6, 6, 6);
      doc.roundedRect(margin, y, width - margin * 2, 45, 4, 4, 'F');
      doc.setTextColor(212, 197, 169);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('Investimento Final', margin + 8, y + 14);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(28);
      doc.text(formatCurrency(budget.final_price), margin + 8, y + 28);
      
      y += 60;
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Válido até: ${formatDateFull(budget.expires_at)}`, margin, y);
      doc.text('Pagamento: 50% na aprovação do projeto e 50% na entrega final.', margin, y + 5);
    } else {
      // Internal Version - Items Table
      checkPageBreak(40);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(10, 10, 10);
      doc.setFontSize(14);
      doc.text('Detalhamento Interno de Custos', margin, y);
      y += 10;

      // Table Header
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y, width - margin * 2, 8, 'F');
      doc.setFontSize(8);
      doc.text('ITEM', margin + 3, y + 5);
      doc.text('QTD', margin + 85, y + 5);
      doc.text('VENDA', margin + 100, y + 5);
      doc.text('CUSTO', margin + 130, y + 5);
      doc.text('SPREAD', margin + 160, y + 5);
      y += 12;

      // Table Rows
      doc.setFont('helvetica', 'normal');
      budget.items.forEach(item => {
        checkPageBreak(10);
        doc.text(item.name.slice(0, 45), margin + 3, y);
        doc.text(String(item.quantity), margin + 85, y);
        doc.text(formatCurrency(item.sale_price), margin + 100, y);
        doc.text(formatCurrency(item.cost_price), margin + 130, y);
        doc.text(formatCurrency(item.sale_price - item.cost_price), margin + 160, y);
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, y + 2, width - margin, y + 2);
        y += 7;
      });

      y += 10;
      checkPageBreak(50);

      // Financial Summary Box
      doc.setFillColor(6, 6, 6);
      doc.roundedRect(margin, y, width - margin * 2, 45, 4, 4, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9);
      doc.text('CUSTO TOTAL', margin + 8, y + 12);
      doc.text('FEE', margin + 50, y + 12);
      doc.text('IMPOSTO', margin + 90, y + 12);
      doc.text('LUCRO', margin + 130, y + 12);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(formatCurrency(budget.cost_total), margin + 8, y + 20);
      doc.text(formatCurrency(budget.fee_value), margin + 50, y + 20);
      doc.text(formatCurrency(budget.tax_value), margin + 90, y + 20);
      doc.setTextColor(51, 174, 116); // Green
      doc.text(formatCurrency(budget.profit), margin + 130, y + 20);

      doc.setDrawColor(40, 40, 40);
      doc.line(margin + 8, y + 28, width - margin - 8, y + 28);

      doc.setTextColor(212, 197, 169);
      doc.setFontSize(12);
      doc.text('PREÇO FINAL', margin + 8, y + 38);
      doc.setFontSize(16);
      doc.text(formatCurrency(budget.final_price), margin + 45, y + 38);
      
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text(`MARGEM: ${(budget.margin * 100).toFixed(1)}%`, width - margin - 35, y + 37);
    }

    doc.save(`${clientOnly ? 'proposta' : 'interno'}-${budget.project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
  }

  async function generateDOCX() {
    if (!budget) return;
    const docxUrl = 'https://esm.sh/docx@9.5.1';
    const { Document, Packer, Paragraph, TextRun, AlignmentType, ShadingType } = await import(/* @vite-ignore */ docxUrl);
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            shading: { type: ShadingType.CLEAR, fill: "060606" },
            spacing: { before: 400, after: 400 },
            children: [
              new TextRun({ text: " SIM ", bold: true, size: 56, color: "FFFFFF", font: "Helvetica" }),
              new TextRun({ break: 1 }),
              new TextRun({ text: "Still In Movement", size: 16, color: "D4C5A9", font: "Helvetica" })
            ]
          }),
          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "PROPOSTA COMERCIAL", size: 18, color: "888888", font: "Helvetica" }),
              new TextRun({ break: 1 }),
              new TextRun({ text: formatDateFull(budget.proposal_date), size: 18, color: "AAAAAA", font: "Helvetica" })
            ]
          }),
          new Paragraph({ spacing: { before: 400, after: 200 } }),
          new Paragraph({
            children: [
              new TextRun({ text: budget.project_name, bold: true, size: 44, color: "111111", font: "Helvetica" })
            ]
          }),
          new Paragraph({
            spacing: { before: 200, after: 400 },
            children: [
              new TextRun({ text: "Cliente: ", bold: true, size: 20, color: "111111", font: "Helvetica" }),
              new TextRun({ text: `${budget.client_name} - ${budget.client_company || 'SIM'}`, size: 20, color: "444444", font: "Helvetica" }),
              new TextRun({ break: 1 }),
              new TextRun({ text: "Formato: ", bold: true, size: 20, color: "111111", font: "Helvetica" }),
              new TextRun({ text: budget.project_type, size: 20, color: "444444", font: "Helvetica" })
            ]
          }),
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: "Escopo do Projeto", bold: true, size: 28, color: "111111", font: "Helvetica" })]
          }),
          new Paragraph({
            spacing: { after: 400 },
            children: [new TextRun({ text: budget.project_description || 'Produção audiovisual conforme briefing aprovado.', size: 22, color: "444444", font: "Helvetica" })]
          }),
          new Paragraph({
            spacing: { before: 200, after: 100 },
            children: [new TextRun({ text: "Entregáveis e Formato", bold: true, size: 28, color: "111111", font: "Helvetica" })]
          }),
          ...deliverableLines(budget).map((line) => new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 100 },
            children: [new TextRun({ text: line, size: 22, color: "444444", font: "Helvetica" })]
          })),
          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({
            shading: { type: ShadingType.CLEAR, fill: "F4F1EC" },
            spacing: { before: 300, after: 300 },
            children: [
              new TextRun({ text: " INVESTIMENTO FINAL", bold: true, size: 24, color: "111111", font: "Helvetica" }),
              new TextRun({ break: 1 }),
              new TextRun({ text: ` ${formatCurrency(budget.final_price)} `, bold: true, size: 56, color: "111111", font: "Helvetica" })
            ]
          }),
          new Paragraph({ spacing: { before: 200 } }),
          new Paragraph({
            children: [
              new TextRun({ text: `Válido até: ${formatDateFull(budget.expires_at)}`, size: 18, color: "888888", font: "Helvetica" }),
              new TextRun({ break: 1 }),
              new TextRun({ text: "Pagamento: 50% na aprovação do projeto e 50% na entrega final.", size: 18, color: "888888", font: "Helvetica" })
            ]
          })
        ]
      }]
    });
    
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
          <div className="min-w-0">
            <p className="mb-3 truncate text-xs uppercase tracking-[0.34em] text-accent">Budget ID {budget.id.slice(0, 8)}</p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="line-clamp-2 break-words font-display text-3xl leading-tight text-white md:text-4xl">{budget.project_name}</h1>
              <BudgetStatusBadge status={budget.status} />
            </div>
            <p className="mt-3 truncate text-sm text-white/45">{budget.client_name} / {budget.project_type} / expira em {formatDate(budget.expires_at)}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {budget.status === 'Draft' && <Button onClick={() => updateStatus('Sent')} icon={Send}>Enviar</Button>}
            {budget.status === 'Sent' && <>
              <Button onClick={() => updateStatus('Approved')} icon={CheckCircle2}>Aprovar</Button>
              <Button onClick={() => updateStatus('Rejected')} icon={XCircle}>Rejeitar</Button>
            </>}
            <Button onClick={duplicateBudget} icon={Copy}>Duplicar</Button>
          </div>
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
            <p className="line-clamp-6 text-sm leading-6 text-white/50">{budget.project_description || 'Produção audiovisual conforme briefing aprovado.'}</p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {deliverableLines(budget).map((line) => <div key={line} className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/60">{line}</div>)}
            </div>
          </div>
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-5 font-display text-2xl text-white">Proposal</h2>
            <div className="space-y-3">
              <Button onClick={() => generatePDF(true)} icon={FileText} block>PDF Cliente</Button>
              <Button onClick={() => generatePDF(false)} icon={Download} block>PDF Interno</Button>
              <Button onClick={generateDOCX} icon={Download} block>DOCX Cliente</Button>
              <Button onClick={copyLink} icon={Link2} block>Copiar link online</Button>
            </div>
            <p className="mt-5 break-all rounded-2xl bg-black/30 p-3 text-xs leading-5 text-white/35" title={proposalUrl()}>
              {proposalUrl().length > 80 ? proposalUrl().slice(0, 77) + '...' : proposalUrl()}
            </p>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
          <h2 className="mb-5 font-display text-2xl text-white">Internal Items</h2>
          <div className="space-y-2">
            {budget.items.map((item) => <div key={item.id} className="grid gap-3 rounded-2xl border border-white/10 bg-black/30 p-4 text-sm md:grid-cols-[1fr_70px_110px_110px]">
              <div className="min-w-0">
                <p className="truncate text-white">{item.name}</p>
                <p className="truncate text-xs text-white/35">{item.category}</p>
              </div>
              <p className="shrink-0 text-white/55">x{item.quantity}</p>
              <p className="shrink-0 text-white/55" title={`Sale ${formatCurrency(item.sale_price)}`}>Sale {formatCurrency(item.sale_price)}</p>
              <p className="shrink-0 text-white/55" title={`Cost ${formatCurrency(item.cost_price)}`}>Cost {formatCurrency(item.cost_price)}</p>
            </div>)}
          </div>
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

function Metric({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
    <p className="text-xs uppercase tracking-[0.24em] text-white/30">{label}</p>
    <p className={`mt-3 truncate font-display ${strong ? 'text-2xl text-white md:text-3xl' : 'text-xl text-white/80 md:text-2xl'}`}>{value}</p>
  </div>;
}

function Button({ children, onClick, icon: Icon, block }: { children: React.ReactNode; onClick: () => void; icon: React.ElementType; block?: boolean }) {
  return <button onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/70 transition hover:border-white/25 hover:bg-white hover:text-black ${block ? 'w-full justify-center' : ''}`}><Icon size={16} />{children}</button>;
}
