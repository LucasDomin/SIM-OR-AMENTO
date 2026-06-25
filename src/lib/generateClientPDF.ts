/**
 * Geração de PDF para o cliente
 * - Oculta fee, impostos, lucro, margem, custos internos
 * - Usa o VALOR DE VENDA por item (já com fee + impostos embutidos)
 * - A soma dos itens é exatamente o INVESTIMENTO TOTAL
 */

import type { Budget, SystemSettings } from '../types';
import { getLogoDataUrl, LOGO_ASPECT } from './logoImage';
import { formatDate } from './utils';
import { recalcBudgetSnapshot } from './calc';
import {
  SEGMENTS,
  INK,
  MUTED,
  drawClientTable,
  drawFactsGrid,
  footer,
  formatCurrency,
  sectionTitle,
  setFill,
  setFillHex,
  setColor,
  setColorHex,
  type SectionItem,
} from './pdfHelpers';

export async function generateClientPDF(rawBudget: Budget, settings: SystemSettings) {
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
  doc.text('PROPOSTA COMERCIAL', W - M, y + 5, { align: 'right' });
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

  // ---------- MONTAR SEÇÕES (valor de venda por item) ----------
  // unit_price já é o VALOR DE VENDA (custo + fee + impostos). Sem diluição.
  const sections: Array<{ title: string; items: SectionItem[] }> = [];

  if (budget.professionals.length) {
    sections.push({
      title: 'EQUIPE',
      items: budget.professionals.map((p) => ({
        name: p.name,
        meta: `${p.days} diária(s) × ${formatCurrency(p.daily_rate)}`,
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
        value: r.subtotal,
      })),
    });
  }

  // ---------- RENDERIZAR SEÇÕES ----------
  sections.forEach((section) => {
    ensure(26);
    y = sectionTitle(doc, section.title, M, y, W);
    y = drawClientTable(doc, section.items, M, y, W, ensure);
    y += 8;
  });

  // ---------- TOTAL GERAL ----------
  ensure(46);
  y += 2;
  const boxH = 34;
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

  footer(doc, W, H, M);
  doc.save(`proposta-${budget.project_name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-cliente.pdf`);
}
