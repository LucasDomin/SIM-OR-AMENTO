import type { Budget, SystemSettings } from '../types';
import { getLogoDataUrl } from './logoImage';
import { formatCurrency } from './supabase';
import { formatDate } from './utils';
import { formatPercent } from './calc';
import { t } from './i18n';

const SEGMENTS = ['#996EA7', '#E45A58', '#EA8D11', '#FAC421', '#33AE74', '#2894D1', '#B1B7B1', '#F4C78D', '#8B5A2B'];

interface PdfContext {
  doc: import('jspdf').default;
  width: number;
  height: number;
  margin: number;
  y: number;
  clientOnly: boolean;
}

export async function generateProposalPDF(budget: Budget, settings: SystemSettings, clientOnly: boolean) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 20;
  let y = margin;

  function ensure(needed: number) {
    if (y + needed > height - margin) {
      doc.addPage();
      y = margin;
    }
  }

  const logoImg = await getLogoDataUrl(4);

  // Header com logo 25% menor
  if (logoImg) {
    doc.addImage(logoImg, 'PNG', margin, y - 2, 90, 26);
    y += 30;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('SIM', margin, y + 10);
    y += 20;
  }

  doc.setTextColor(110, 110, 110);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(clientOnly ? 'PROPOSTA COMERCIAL' : 'ORÇAMENTO INTERNO', width - margin, y - 10, { align: 'right' });
  doc.text(formatDate(budget.proposal_date), width - margin, y - 4, { align: 'right' });

  // Title
  y += 6;
  doc.setTextColor(10, 10, 10);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  const titleLines = doc.splitTextToSize(budget.project_name.toUpperCase(), width - margin * 2);
  doc.text(titleLines, margin, y);
  y += titleLines.length * 8 + 4;

  const ctx: PdfContext = { doc, width, height, margin, y, clientOnly };

  // Informações Gerais
  y = drawGeneralInfo(doc, budget, ctx);
  // Escopo
  y = drawScope(doc, budget, { ...ctx, y });
  // Profissionais
  y = drawSection(
    doc,
    'PROFISSIONAIS',
    budget.professionals,
    { ...ctx, y },
    (p) => [p.name, `${p.days} diária(s) · ${formatCurrency(p.daily_rate)}`],
    (p) => formatCurrency(p.subtotal),
  );
  // Equipamentos
  y = drawSection(
    doc,
    'EQUIPAMENTOS',
    budget.equipment,
    { ...ctx, y },
    (e) => {
      const lines = [`${e.days} diária(s) · ${formatCurrency(e.daily_rate)}`];
      if (e.pickup_date) lines.push(`Retirada: ${formatDate(e.pickup_date)}`);
      if (e.return_date) lines.push(`Devolução: ${formatDate(e.return_date)}`);
      return [e.name, ...lines];
    },
    (e) => formatCurrency(e.subtotal),
  );
  // Serviços
  y = drawSection(
    doc,
    'SERVIÇOS',
    budget.services,
    { ...ctx, y },
    (s) => [s.name, `${s.quantity} × ${formatCurrency(s.unit_price)}`],
    (s) => formatCurrency(s.subtotal),
  );
  // Reels
  if (budget.reels.length > 0) {
    y = drawSection(
      doc,
      'REELS',
      budget.reels,
      { ...ctx, y },
      (r) => [r.name, `${r.quantity} × ${formatCurrency(r.unit_price)}`],
      (r) => formatCurrency(r.subtotal),
    );
  }
  // Cronograma
  y = drawSchedule(doc, budget, { ...ctx, y });

  // TOTAL GERAL - destaque máximo
  ensure(60);
  ctx.y = y;
  ensure(60);
  y = ctx.y + 6;

  doc.setFillColor(10, 10, 10);
  doc.roundedRect(margin, y, width - margin * 2, 52, 3, 3, 'F');

  // Barra colorida
  const barTop = y + 44;
  const barLeft = margin + 10;
  const barWidth = width - margin * 2 - 20;
  const segW = barWidth / SEGMENTS.length;
  SEGMENTS.forEach((color, i) => {
    doc.setFillColor(color);
    doc.rect(barLeft + i * segW, barTop, segW + 0.4, 2.5, 'F');
  });

  doc.setTextColor(212, 197, 169);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('TOTAL GERAL', margin + 10, y + 14);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(budget.final_price), margin + 10, y + 32);

  // Detalhamento do cálculo
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(180, 180, 180);
  const calcDetail = `Subtotal ${formatCurrency(budget.cost_total)} + Fee ${formatCurrency(budget.fee_value)} + Impostos ${formatCurrency(budget.tax_value)}`;
  doc.text(calcDetail, margin + 10, y + 42);

  // Condições
  y += 64;
  doc.setTextColor(95, 95, 95);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Proposta válida por ${settings.proposal_validity_days} dias · até ${formatDate(budget.expires_at)}`, margin, y);
  doc.text('Condições: 50% no aceite do orçamento e 50% na entrega final.', margin, y + 4);

  if (!clientOnly) {
    // Resumo interno de custos e ganhos
    ensure(60);
    ctx.y = y;
    ensure(60);
    y = ctx.y + 14;

    doc.setTextColor(10, 10, 10);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('RESUMO INTERNO (controle)', margin, y);
    y += 6;
    doc.setDrawColor(230, 230, 230);
    doc.line(margin, y, margin + 50, y);
    y += 6;

    const rows: Array<[string, string, string?]> = [
      ['Subtotal', formatCurrency(budget.cost_total)],
      ['Fee', formatCurrency(budget.fee_value)],
      ['Impostos', formatCurrency(budget.tax_value)],
      ['Custo interno', formatCurrency(budget.cost_total)],
      ['Lucro', formatCurrency(budget.profit)],
      ['Margem', formatPercent(budget.margin)],
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    rows.forEach(([label, value]) => {
      ensure(8);
      doc.text(label, margin, y);
      doc.text(value, width - margin, y, { align: 'right' });
      y += 6;
    });
  }

  doc.save(`${clientOnly ? 'proposta' : 'interno'}-${budget.project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`);
}

function drawGeneralInfo(_doc: import('jspdf').default, budget: Budget, ctx: PdfContext): number {
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(11);
  ctx.doc.setTextColor(10, 10, 10);
  ctx.doc.text('INFORMAÇÕES GERAIS', ctx.margin, ctx.y);
  ctx.y += 6;
  ctx.doc.setDrawColor(230, 230, 230);
  ctx.doc.line(ctx.margin, ctx.y, ctx.margin + 50, ctx.y);
  ctx.y += 6;

  ctx.doc.setFillColor(248, 248, 248);
  ctx.doc.roundedRect(ctx.margin, ctx.y, ctx.width - ctx.margin * 2, 30, 2, 2, 'F');
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setFontSize(9);

  const lines = [
    [t.clientName, `${budget.client_name}${budget.client_company ? ' / ' + budget.client_company : ''}`],
    [t.emailField, `${budget.client_email || '—'} · ${budget.client_whatsapp || '—'}`],
    [t.projectType, budget.project_type],
  ];
  lines.forEach(([label, value], i) => {
    ctx.doc.setTextColor(110, 110, 110);
    ctx.doc.text(label, ctx.margin + 6, ctx.y + 8 + i * 7);
    ctx.doc.setTextColor(20, 20, 20);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.text(value, ctx.margin + 35, ctx.y + 8 + i * 7);
    ctx.doc.setFont('helvetica', 'normal');
  });
  ctx.y += 36;
  return ctx.y;
}

function drawScope(doc: import('jspdf').default, budget: Budget, ctx: PdfContext): number {
  if (ctx.y + 30 > ctx.height - ctx.margin) {
    doc.addPage();
    ctx.y = ctx.margin;
  }
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(11);
  ctx.doc.setTextColor(10, 10, 10);
  ctx.doc.text('ESCOPO', ctx.margin, ctx.y);
  ctx.y += 6;
  ctx.doc.setDrawColor(230, 230, 230);
  ctx.doc.line(ctx.margin, ctx.y, ctx.margin + 24, ctx.y);
  ctx.y += 6;

  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setFontSize(9);
  ctx.doc.setTextColor(70, 70, 70);
  const text = budget.project_description || 'Produção audiovisual conforme briefing acordado.';
  const lines = doc.splitTextToSize(text, ctx.width - ctx.margin * 2);
  lines.forEach((line: string) => {
    if (ctx.y + 5 > ctx.height - ctx.margin) {
      doc.addPage();
      ctx.y = ctx.margin;
    }
    ctx.doc.text(line, ctx.margin, ctx.y);
    ctx.y += 5;
  });
  ctx.y += 6;
  return ctx.y;
}

function drawSection<T>(
  doc: import('jspdf').default,
  title: string,
  items: T[],
  ctx: PdfContext,
  toDetails: (item: T) => string[],
  toValue: (item: T) => string,
): number {
  if (ctx.y + 30 > ctx.height - ctx.margin) {
    doc.addPage();
    ctx.y = ctx.margin;
  }

  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(11);
  ctx.doc.setTextColor(10, 10, 10);
  ctx.doc.text(`${title} (${items.length})`, ctx.margin, ctx.y);
  ctx.y += 6;
  ctx.doc.setDrawColor(230, 230, 230);
  ctx.doc.line(ctx.margin, ctx.y, ctx.margin + 30, ctx.y);
  ctx.y += 6;

  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setFontSize(9);
  ctx.doc.setTextColor(20, 20, 20);
  items.forEach((item, i) => {
    if (ctx.y + 12 > ctx.height - ctx.margin) {
      doc.addPage();
      ctx.y = ctx.margin;
    }
    const [name, ...rest] = toDetails(item);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.text(name.slice(0, 60), ctx.margin, ctx.y);
    ctx.doc.setFont('helvetica', 'normal');
    ctx.doc.setTextColor(110, 110, 110);
    rest.forEach((d, idx) => {
      ctx.doc.text(d, ctx.margin, ctx.y + 5 + idx * 4);
    });
    ctx.doc.setTextColor(20, 20, 20);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.text(toValue(item), ctx.width - ctx.margin, ctx.y, { align: 'right' });
    ctx.y += Math.max(8, 4 + (rest.length - 1) * 4 + 4);
    if (i < items.length - 1) {
      ctx.doc.setDrawColor(240, 240, 240);
      ctx.doc.line(ctx.margin, ctx.y, ctx.width - ctx.margin, ctx.y);
      ctx.y += 2;
    }
  });
  ctx.y += 4;
  return ctx.y;
}

function drawSchedule(doc: import('jspdf').default, budget: Budget, ctx: PdfContext): number {
  if (ctx.y + 28 > ctx.height - ctx.margin) {
    doc.addPage();
    ctx.y = ctx.margin;
  }
  ctx.doc.setFont('helvetica', 'bold');
  ctx.doc.setFontSize(11);
  ctx.doc.setTextColor(10, 10, 10);
  ctx.doc.text('DATAS & CRONOGRAMA', ctx.margin, ctx.y);
  ctx.y += 6;
  ctx.doc.setDrawColor(230, 230, 230);
  ctx.doc.line(ctx.margin, ctx.y, ctx.margin + 50, ctx.y);
  ctx.y += 6;

  ctx.doc.setFillColor(248, 248, 248);
  ctx.doc.roundedRect(ctx.margin, ctx.y, ctx.width - ctx.margin * 2, 24, 2, 2, 'F');
  ctx.doc.setFont('helvetica', 'normal');
  ctx.doc.setFontSize(9);
  const fields: Array<[string, string]> = [
    [t.shootingDays, `${budget.production.shooting_days} ${t.days.toLowerCase()}`],
    [t.delivery, `${budget.production.delivery_days} ${t.days.toLowerCase()}`],
    [t.startDate, budget.production.start_date ? formatDate(budget.production.start_date) : '—'],
  ];
  ctx.doc.setTextColor(110, 110, 110);
  fields.forEach(([label, value], i) => {
    ctx.doc.text(label, ctx.margin + 6, ctx.y + 9 + i * 5);
    ctx.doc.setTextColor(20, 20, 20);
    ctx.doc.setFont('helvetica', 'bold');
    ctx.doc.text(value, ctx.margin + 38, ctx.y + 9 + i * 5);
    ctx.doc.setFont('helvetica', 'normal');
  });
  ctx.y += 30;
  return ctx.y;
}
