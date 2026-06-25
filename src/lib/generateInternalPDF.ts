/**
 * Geração de PDF interno
 * - Mostra tudo: subtotal, fee, impostos, lucro, margem, custos internos
 * - Sem diluição de valores
 */

import type { Budget, SystemSettings } from '../types';
import { getLogoDataUrl, LOGO_ASPECT } from './logoImage';
import { formatDate } from './utils';
import { formatPercent, recalcBudgetSnapshot } from './calc';
import {
  SEGMENTS,
  INK,
  MUTED,
  LIGHT,
  SOFT_BG,
  GREEN,
  drawInternalTable,
  drawFactsGrid,
  footer,
  formatCurrency,
  sectionTitle,
  setFill,
  setFillHex,
  setColor,
  setColorHex,
  hairlineBox,
  type SectionItem,
} from './pdfHelpers';

function sumCost(budget: Budget): number {
  let total = 0;
  budget.professionals.forEach((p) => (total += (p.cost_base ?? p.cost_price ?? 0) * p.days));
  budget.equipment.forEach((e) => (total += (e.cost_base ?? e.cost_price ?? 0) * e.days));
  budget.services.forEach((s) => (total += (s.cost_base ?? s.cost_price ?? 0) * s.quantity));
  budget.reels.forEach((r) => (total += (r.cost_base ?? r.cost_price ?? 0) * r.quantity));
  return total;
}

function sumValue(budget: Budget): number {
  let total = 0;
  budget.professionals.forEach((p) => (total += p.subtotal));
  budget.equipment.forEach((e) => (total += e.subtotal));
  budget.services.forEach((s) => (total += s.subtotal));
  budget.reels.forEach((r) => (total += r.subtotal));
  return total;
}

export async function generateInternalPDF(rawBudget: Budget, settings: SystemSettings) {
  // Recalcula todos os totais a partir dos valores aplicados
  const budget = recalcBudgetSnapshot(rawBudget, settings) as Budget;

  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;
  let y = M;

  const ensure = (need: number) => {
    if (y + need > H - M - 14) {
      footer(doc, W, H, M);
      doc.addPage();
      y = M;
    }
  };

  // ---------- CABEÇALHO ----------
  const logoImg = await getLogoDataUrl(4);
  if (logoImg) {
    const logoW = 50;
    const logoH = logoW / LOGO_ASPECT;
    doc.addImage(logoImg, 'PNG', M, y, logoW, logoH);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    setColor(doc, INK);
    doc.text('SIM', M, y + 12);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setColor(doc, MUTED);
  doc.text('ORÇAMENTO INTERNO', W - M, y + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  setColor(doc, { r: 150, g: 150, b: 150 });
  doc.text(formatDate(budget.proposal_date), W - M, y + 11, { align: 'right' });

  y += 24;
  doc.setDrawColor(228, 228, 228);
  doc.setLineWidth(0.2);
  doc.line(M, y, W - M, y);
  y += 12;

  // ---------- TÍTULO + CLIENTE ----------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  setColor(doc, INK);
  const titleLines = doc.splitTextToSize(budget.project_name, W - M * 2);
  doc.text(titleLines, M, y);
  y += titleLines.length * 7 + 2;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setColor(doc, MUTED);
  doc.text(
    `${budget.client_name}${budget.client_company ? '  ·  ' + budget.client_company : ''}  ·  ${budget.project_type}`,
    M,
    y,
  );
  y += 12;

  // ---------- DADOS RÁPIDOS ----------
  const facts: Array<[string, string]> = [
    ['CONTATO', `${budget.client_email || '—'}`],
    ['WHATSAPP', `${budget.client_whatsapp || '—'}`],
    ['CIDADE', budget.production.city],
    ['TEMPO DE ENTREGA', `${budget.production.delivery_days} dias`],
    ['VALIDADE', `${settings.proposal_validity_days} dias`],
    ['VÁLIDO ATÉ', formatDate(budget.expires_at)],
  ];
  y = drawFactsGrid(doc, facts, M, y, W);
  y += 10;

  // ---------- ESCOPO ----------
  ensure(30);
  y = sectionTitle(doc, 'ESCOPO', M, y, W);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setColor(doc, { r: 60, g: 60, b: 60 });
  const escopoTexto = budget.project_description || 'Detalhes do escopo e objetivos da produção.';
  const lines = doc.splitTextToSize(escopoTexto, W - M * 2);
  lines.forEach((line: string) => {
    ensure(6);
    doc.text(line, M, y);
    y += 5.4;
  });
  y += 8;

  // ---------- MONTAR SEÇÕES ----------
  const sections: Array<{ title: string; items: SectionItem[] }> = [];

  if (budget.professionals.length) {
    sections.push({
      title: 'EQUIPE',
      items: budget.professionals.map((p) => ({
        name: p.name,
        meta: `${p.days} diária(s) × ${formatCurrency(p.daily_rate)}`,
        cost: (p.cost_base ?? p.cost_price ?? 0) * p.days,
        value: p.subtotal,
      })),
    });
  }

  if (budget.equipment.length) {
    sections.push({
      title: 'EQUIPAMENTOS',
      items: budget.equipment.map((e) => ({
        name: e.name,
        meta: `${e.days} diária(s) × ${formatCurrency(e.daily_rate)}`,
        cost: (e.cost_base ?? e.cost_price ?? 0) * e.days,
        value: e.subtotal,
      })),
    });
  }

  if (budget.services.length) {
    sections.push({
      title: 'SERVIÇOS',
      items: budget.services.map((s) => ({
        name: s.name,
        meta: `${s.quantity} × ${formatCurrency(s.unit_price)}`,
        cost: (s.cost_base ?? s.cost_price ?? 0) * s.quantity,
        value: s.subtotal,
      })),
    });
  }

  if (budget.reels.length) {
    sections.push({
      title: 'REELS',
      items: budget.reels.map((r) => ({
        name: r.name,
        meta: `${r.quantity} × ${formatCurrency(r.unit_price)}`,
        cost: (r.cost_base ?? r.cost_price ?? 0) * r.quantity,
        value: r.subtotal,
      })),
    });
  }

  // ---------- RENDERIZAR SEÇÕES ----------
  sections.forEach((section) => {
    ensure(26);
    y = sectionTitle(doc, section.title, M, y, W);
    y = drawInternalTable(doc, section.items, M, y, W, ensure);
    y += 8;
  });

  // ---------- TOTAL GERAL ----------
  ensure(46);
  y += 2;
  const boxH = 40;
  setFill(doc, INK);
  doc.roundedRect(M, y, W - M * 2, boxH, 2.5, 2.5, 'F');

  const barY = y + boxH - 4;
  const barW = W - M * 2 - 20;
  const segW = barW / SEGMENTS.length;
  SEGMENTS.forEach((c, i) => {
    setFillHex(doc, c);
    doc.rect(M + 10 + i * segW, barY, segW + 0.4, 2, 'F');
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColorHex(doc, '#D4C5A9');
  doc.text('INVESTIMENTO TOTAL', M + 12, y + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.text(formatCurrency(budget.final_price), M + 12, y + 23);

  // Breakdown à direita
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  setColor(doc, { r: 175, g: 175, b: 175 });
  const bdX = W - M - 12;
  doc.text(`Subtotal  ${formatCurrency(sumValue(budget))}`, bdX, y + 10, { align: 'right' });
  doc.text(`Fee (${settings.fee_percentage}%)  ${formatCurrency(budget.fee_value)}`, bdX, y + 16, { align: 'right' });
  doc.text(`Impostos (${settings.tax_percentage}%)  ${formatCurrency(budget.tax_value)}`, bdX, y + 22, { align: 'right' });

  y += boxH + 8;

  // ---------- CONDIÇÕES ----------
  ensure(16);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setColor(doc, MUTED);
  doc.text('Condições de pagamento: 50% no aceite do orçamento e 50% na entrega final.', M, y);
  y += 5;
  doc.text(`Esta proposta é válida por ${settings.proposal_validity_days} dias após a emissão.`, M, y);
  y += 12;

  // ---------- RESUMO FINANCEIRO INTERNO ----------
  ensure(60);
  y = sectionTitle(doc, 'RESUMO FINANCEIRO INTERNO', M, y, W);

  const totalCusto = sumCost(budget);
  const totalValor = sumValue(budget);
  const lucro = totalValor - totalCusto;
  const margemReal = totalValor > 0 ? lucro / totalValor : 0;

  const cardW = (W - M * 2 - 8) / 2;
  const cardH = 26;

  // Card CUSTO
  setFill(doc, SOFT_BG);
  doc.roundedRect(M, y, cardW, cardH, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setColor(doc, MUTED);
  doc.text('CUSTO DE PRODUÇÃO', M + 6, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setColor(doc, LIGHT);
  doc.text('O que você gasta para produzir', M + 6, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  setColor(doc, INK);
  doc.text(formatCurrency(totalCusto), M + 6, y + 22);

  // Card VALOR
  const card2X = M + cardW + 8;
  setFill(doc, INK);
  doc.roundedRect(card2X, y, cardW, cardH, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setColorHex(doc, '#D4C5A9');
  doc.text('VALOR COBRADO', card2X + 6, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setColor(doc, { r: 175, g: 175, b: 175 });
  doc.text('O que o cliente paga (Total Geral)', card2X + 6, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.text(formatCurrency(budget.final_price), card2X + 6, y + 22);

  y += cardH + 8;

  // Indicadores
  ensure(24);
  const metrics: Array<[string, string, boolean]> = [
    ['LUCRO BRUTO', formatCurrency(lucro), true],
    ['MARGEM', formatPercent(margemReal), false],
    ['FEE', formatCurrency(budget.fee_value), false],
    ['IMPOSTOS', formatCurrency(budget.tax_value), false],
  ];
  const mW = (W - M * 2 - 6 * 3) / 4;
  metrics.forEach(([label, value, highlight], i) => {
    const mx = M + i * (mW + 6);
    hairlineBox(doc, mx, y, mW, 20);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    setColor(doc, MUTED);
    doc.text(label, mx + 4, y + 7);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    setColor(doc, highlight ? GREEN : INK);
    doc.text(value, mx + 4, y + 15);
  });
  y += 28;

  footer(doc, W, H, M);
  doc.save(`orcamento-${budget.project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-interno.pdf`);
}
