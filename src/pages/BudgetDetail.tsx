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
    const html2canvasUrl = 'https://esm.sh/html2canvas@1.4.1';
    const { default: jsPDF } = await import(/* @vite-ignore */ jspdfUrl);
    const { default: html2canvas } = await import(/* @vite-ignore */ html2canvasUrl);
    
    const doc = new jsPDF();
    const margin = 20;
    const width = doc.internal.pageSize.getWidth();
    const height = doc.internal.pageSize.getHeight();
    let y = margin;

    const segments = ['#996EA7', '#E45A58', '#EA8D11', '#FAC421', '#33AE74', '#2894D1', '#B1B7B1', '#F4C78D', '#8B5A2B'];

    function checkPageBreak(needed: number) {
      if (y + needed > height - margin) {
        doc.addPage();
        y = margin;
      }
    }

    // Capture Logo
    const logoEl = document.querySelector('svg[aria-label="SIM — Still In Movement"]');
    let logoImg = null;
    if (logoEl) {
      const canvas = await html2canvas(logoEl as HTMLElement, { scale: 4, backgroundColor: null, logging: false });
      logoImg = canvas.toDataURL('image/png');
    }

    // Header
    if (logoImg) {
      doc.addImage(logoImg, 'PNG', margin, y, 45, 14);
      y += 18;
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.text('SIM', margin, y + 10);
      y += 18;
    }

    // Colored Bar under Logo
    const barWidth = 60;
    const segW = barWidth / segments.length;
    segments.forEach((color, i) => {
      doc.setFillColor(color);
      doc.rect(margin + 12 + i * segW, y - 5, segW, 1.5, 'F');
    });

    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(clientOnly ? 'PROPOSTA COMERCIAL' : 'ORÇAMENTO INTERNO', width - margin, margin + 5, { align: 'right' });
    doc.text(formatDateFull(budget.proposal_date), width - margin, margin + 10, { align: 'right' });

    y += 15;

    // Title
    doc.setTextColor(10, 10, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    const splitTitle = doc.splitTextToSize(budget.project_name.toUpperCase(), width - margin * 2);
    doc.text(splitTitle, margin, y);
    y += splitTitle.length * 8 + 10;

    // Client/Project Info Box
    doc.setFillColor(248, 248, 248);
    doc.roundedRect(margin, y, width - margin * 2, 22, 2, 2, 'F');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('CLIENTE', margin + 6, y + 8);
    doc.text('PROJETO', margin + (width - margin * 2) / 2, y + 8);
    doc.setTextColor(20, 20, 20);
    doc.setFont('helvetica', 'bold');
    doc.text(budget.client_name.toUpperCase(), margin + 6, y + 14);
    doc.text(budget.project_type.toUpperCase(), margin + (width - margin * 2) / 2, y + 14);
    y += 32;

    // Scope
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ESCOPO E OBJETIVOS', margin, y);
    y += 6;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, margin + 40, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const scopeLines = doc.splitTextToSize(budget.project_description || 'Produção audiovisual conforme briefing acordado.', width - margin * 2);
    doc.text(scopeLines, margin, y);
    y += scopeLines.length * 5 + 12;

    // Deliverables
    checkPageBreak(40);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(10, 10, 10);
    doc.text('ENTREGÁVEIS', margin, y);
    y += 6;
    doc.line(margin, y, margin + 30, y);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    deliverableLines(budget).forEach((line, i) => {
      checkPageBreak(8);
      // Small colored bullet
      doc.setFillColor(segments[i % segments.length]);
      doc.circle(margin + 2, y - 1, 0.8, 'F');
      doc.text(line, margin + 6, y);
      y += 6;
    });
    y += 12;

    if (clientOnly) {
      // Client Investment
      checkPageBreak(50);
      doc.setFillColor(10, 10, 10);
      doc.roundedRect(margin, y, width - margin * 2, 40, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('INVESTIMENTO TOTAL', margin + 10, y + 12);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.text(formatCurrency(budget.final_price), margin + 10, y + 28);
      
      // Validity bar
      const barH = 2;
      segments.forEach((color, i) => {
        doc.setFillColor(color);
        doc.rect(margin + 10 + i * ((width - margin * 2 - 20) / segments.length), y + 34, (width - margin * 2 - 20) / segments.length, barH, 'F');
      });

      y += 55;
      doc.setTextColor(120, 120, 120);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(`PROPOSTA VÁLIDA POR 30 DIAS ATÉ ${formatDate(budget.expires_at)}`, margin, y);
      doc.text('CONDIÇÕES: 50% NO ACEITE E 50% NA ENTREGA FINAL.', margin, y + 5);
    } else {
      // Internal Detail
      checkPageBreak(50);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('DETALHAMENTO FINANCEIRO INTERNO', margin, y);
      y += 10;

      // Summary Grid
      const boxW = (width - margin * 2 - 10) / 3;
      const metrics = [
        { label: 'CUSTO TOTAL', value: formatCurrency(budget.cost_total) },
        { label: 'FEE (15%)', value: formatCurrency(budget.fee_value) },
        { label: 'IMPOSTO (7%)', value: formatCurrency(budget.tax_value) },
        { label: 'LUCRO ESTIMADO', value: formatCurrency(budget.profit), color: '#33AE74' },
        { label: 'MARGEM', value: `${(budget.margin * 100).toFixed(1)}%` },
        { label: 'PREÇO FINAL', value: formatCurrency(budget.final_price), color: '#EA8D11' }
      ];

      metrics.forEach((m, i) => {
        const row = Math.floor(i / 3);
        const col = i % 3;
        const bx = margin + col * (boxW + 5);
        const by = y + row * 22;
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(bx, by, boxW, 18, 1, 1, 'F');
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        doc.text(m.label, bx + 4, by + 6);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(m.color || '#000000');
        doc.text(m.value, bx + 4, by + 13);
      });
      y += 55;

      // Item Table
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.text('ITENS E SERVIÇOS', margin, y);
      y += 6;
      doc.setFillColor(0, 0, 0);
      doc.rect(margin, y, width - margin * 2, 0.5, 'F');
      y += 8;

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('DESCRIÇÃO', margin, y);
      doc.text('QTD', margin + 90, y);
      doc.text('VENDA', margin + 110, y);
      doc.text('CUSTO', margin + 140, y);
      doc.text('SPREAD', margin + 170, y);
      y += 4;

      doc.setFont('helvetica', 'normal');
      budget.items.forEach(item => {
        checkPageBreak(10);
        y += 6;
        doc.setTextColor(40, 40, 40);
        doc.text(item.name.slice(0, 50), margin, y);
        doc.text(String(item.quantity), margin + 90, y);
        doc.text(formatCurrency(item.sale_price), margin + 110, y);
        doc.text(formatCurrency(item.cost_price), margin + 140, y);
        const spread = item.sale_price - item.cost_price;
        doc.setTextColor(spread >= 0 ? '#33AE74' : '#E45A58');
        doc.text(formatCurrency(spread), margin + 170, y);
        
        doc.setDrawColor(240, 240, 240);
        doc.line(margin, y + 2, width - margin, y + 2);
      });
    }

    doc.save(`${clientOnly ? 'proposta' : 'interno'}-${budget.project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
  }

  async function generateDOCX() {
    if (!budget) return;
    const docxUrl = 'https://esm.sh/docx@9.5.1';
    const html2canvasUrl = 'https://esm.sh/html2canvas@1.4.1';
    const { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun } = await import(/* @vite-ignore */ docxUrl);
    const { default: html2canvas } = await import(/* @vite-ignore */ html2canvasUrl);

    // Capture Logo
    const logoEl = document.querySelector('svg[aria-label="SIM — Still In Movement"]');
    let logoData = null;
    if (logoEl) {
      const canvas = await html2canvas(logoEl as HTMLElement, { scale: 3, backgroundColor: null, logging: false });
      logoData = canvas.toDataURL('image/png').split(',')[1];
    }
    
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              ...(logoData ? [new ImageRun({
                data: Buffer.from(logoData, 'base64'),
                transformation: { width: 140, height: 45 }
              })] : [new TextRun({ text: "SIM", bold: true, size: 48 })])
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [
              new TextRun({ text: "PROPOSTA COMERCIAL", size: 16, color: "999999" }),
              new TextRun({ break: 1 }),
              new TextRun({ text: formatDateFull(budget.proposal_date), size: 16, color: "999999" })
            ]
          }),
          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({
            children: [new TextRun({ text: budget.project_name.toUpperCase(), bold: true, size: 36, color: "000000" })]
          }),
          new Paragraph({
            spacing: { before: 200, after: 400 },
            children: [
              new TextRun({ text: "CLIENTE: ", bold: true, size: 18 }),
              new TextRun({ text: budget.client_name.toUpperCase(), size: 18 }),
              new TextRun({ break: 1 }),
              new TextRun({ text: "PROJETO: ", bold: true, size: 18 }),
              new TextRun({ text: budget.project_type.toUpperCase(), size: 18 })
            ]
          }),
          new Paragraph({
            children: [new TextRun({ text: "ESCOPO", bold: true, size: 24 })]
          }),
          new Paragraph({
            spacing: { after: 300 },
            children: [new TextRun({ text: budget.project_description || 'Produção audiovisual conforme briefing acordado.', size: 20, color: "333333" })]
          }),
          new Paragraph({
            children: [new TextRun({ text: "ENTREGÁVEIS", bold: true, size: 24 })]
          }),
          ...deliverableLines(budget).map((line) => new Paragraph({
            text: `• ${line}`,
            spacing: { after: 100 },
          })),
          new Paragraph({ spacing: { before: 400 } }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "INVESTIMENTO TOTAL", bold: true, size: 20, color: "666666" }),
              new TextRun({ break: 1 }),
              new TextRun({ text: formatCurrency(budget.final_price), bold: true, size: 52, color: "000000" })
            ]
          }),
          new Paragraph({
            spacing: { before: 400 },
            children: [
              new TextRun({ text: `Validade: 30 dias (${formatDate(budget.expires_at)})`, size: 16, color: "888888" }),
              new TextRun({ break: 1 }),
              new TextRun({ text: "Pagamento: 50% no aceite e 50% na entrega.", size: 16, color: "888888" })
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
