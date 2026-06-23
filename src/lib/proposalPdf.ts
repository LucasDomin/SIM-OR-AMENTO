import type { Budget, SystemSettings } from '../types';
import { getLogoDataUrl } from './logoImage';
import { formatCurrency } from './supabase';
import { formatDate } from './utils';
import { formatPercent } from './calc';

const SEGMENTS = ['#996EA7', '#E45A58', '#EA8D11', '#FAC421', '#33AE74', '#2894D1', '#B1B7B1', '#F4C78D', '#8B5A2B'];

// Paleta
const INK = { r: 17, g: 17, b: 17 };
const MUTED = { r: 120, g: 120, b: 120 };
const LIGHT = { r: 150, g: 150, b: 150 };
const HAIRLINE = { r: 228, g: 228, b: 228 };
const SOFT_BG = { r: 248, g: 247, b: 245 };
const GREEN = { r: 51, g: 130, b: 90 };

type Doc = import('jspdf').default;

interface SectionItem {
  name: string;
  meta: string;
  cost: number; // custo total (interno)
  value: number; // valor cobrado do cliente
}

export async function generateProposalPDF(budget: Budget, settings: SystemSettings, clientOnly: boolean) {
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
    // Proporção preservada do PNG com padding seguro: nunca corta a assinatura.
    doc.addImage(logoImg, 'PNG', M, y - 2, 62, 21.4);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    setColor(doc, INK);
    doc.text('SIM', M, y + 12);
  }

  // Etiqueta no canto direito
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setColor(doc, MUTED);
  doc.text(clientOnly ? 'PROPOSTA COMERCIAL' : 'ORÇAMENTO INTERNO', W - M, y + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  setColor(doc, LIGHT);
  doc.text(formatDate(budget.proposal_date), W - M, y + 11, { align: 'right' });

  y += 24;
  hairline(doc, M, y, W - M);
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

  // ---------- DADOS RÁPIDOS (3 colunas) ----------
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

  // ---------- ESCOPO (sempre visível) ----------
  ensure(30);
  y = sectionTitle(doc, 'ESCOPO', M, y, W);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setColor(doc, { r: 60, g: 60, b: 60 });
  const escopoTexto = budget.project_description ||
    'Detalhes do escopo e objetivos da produção.';
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
        cost: p.cost_price * p.days,
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
        cost: e.cost_price * e.days,
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
        cost: s.cost_price * s.quantity,
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
        cost: r.cost_price * r.quantity,
        value: r.subtotal,
      })),
    });
  }

  // ---------- RENDERIZAR SEÇÕES ----------
  sections.forEach((section) => {
    ensure(26);
    y = sectionTitle(doc, `${section.title}`, M, y, W);
    y = clientOnly
      ? drawClientTable(doc, section.items, M, y, W, ensure)
      : drawInternalTable(doc, section.items, M, y, W, ensure);
    y += 8;
  });

  // ---------- TOTAL GERAL ----------
  ensure(46);
  y += 2;
  const boxH = clientOnly ? 34 : 40;
  setFill(doc, INK);
  doc.roundedRect(M, y, W - M * 2, boxH, 2.5, 2.5, 'F');

  // Barra de cores no rodapé do bloco
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

  // Valor do investimento — reduzido
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  setColor(doc, { r: 255, g: 255, b: 255 });
  doc.text(formatCurrency(budget.final_price), M + 12, y + 23);

  // Breakdown à direita (somente versão interna)
  if (!clientOnly) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setColor(doc, { r: 175, g: 175, b: 175 });
    const bdX = W - M - 12;
    doc.text(`Subtotal  ${formatCurrency(sumCost(budget))}`, bdX, y + 10, { align: 'right' });
    doc.text(`Fee (${settings.fee_percentage}%)  ${formatCurrency(budget.fee_value)}`, bdX, y + 16, { align: 'right' });
    doc.text(`Impostos (${settings.tax_percentage}%)  ${formatCurrency(budget.tax_value)}`, bdX, y + 22, { align: 'right' });
  }

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

  // ---------- RESUMO INTERNO (somente versão interna) ----------
  if (!clientOnly) {
    ensure(60);
    y = sectionTitle(doc, 'RESUMO FINANCEIRO INTERNO', M, y, W);

    const totalCusto = budget.cost_total
      ? // cost_total no modelo guarda o subtotal de venda; recomputamos custo real abaixo
        sumCost(budget)
      : sumCost(budget);
    const totalValor = sumValue(budget);
    const lucro = totalValor - totalCusto;
    const margemReal = totalValor > 0 ? lucro / totalValor : 0;

    // Dois cartões lado a lado: CUSTO vs VALOR
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

    // Linha de indicadores
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
  }

  footer(doc, W, H, M);
  doc.save(`${clientOnly ? 'proposta' : 'interno'}-${slugify(budget.project_name)}.pdf`);
}

// ========================= TABELAS =========================

// Tabela do cliente: descrição + valor (sem custos)
function drawClientTable(doc: Doc, items: SectionItem[], M: number, startY: number, W: number, ensure: (n: number) => void): number {
  let y = startY;
  items.forEach((item, i) => {
    ensure(11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    setColor(doc, INK);
    doc.text(truncate(item.name, 58), M, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text(formatCurrency(item.value), W - M, y, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    setColor(doc, LIGHT);
    doc.text(item.meta, M, y + 4.6);

    y += 9;
    if (i < items.length - 1) {
      hairline(doc, M, y - 2, W - M, true);
      y += 1;
    }
  });
  return y;
}

// Tabela interna: descrição | meta | CUSTO | VALOR
function drawInternalTable(doc: Doc, items: SectionItem[], M: number, startY: number, W: number, ensure: (n: number) => void): number {
  let y = startY;
  const colValor = W - M;
  const colCusto = W - M - 38;

  // Cabeçalho da tabela
  ensure(10);
  setFill(doc, SOFT_BG);
  doc.rect(M, y - 4, W - M * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  setColor(doc, MUTED);
  doc.text('DESCRIÇÃO', M + 2, y + 1);
  doc.text('CUSTO', colCusto, y + 1, { align: 'right' });
  doc.text('VALOR', colValor, y + 1, { align: 'right' });
  y += 9;

  let totalCost = 0;
  let totalValue = 0;

  items.forEach((item) => {
    ensure(10);
    totalCost += item.cost;
    totalValue += item.value;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, INK);
    doc.text(truncate(item.name, 42), M + 2, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setColor(doc, LIGHT);
    doc.text(item.meta, M + 2, y + 4.4);

    // Custo (cinza)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, MUTED);
    doc.text(formatCurrency(item.cost), colCusto, y, { align: 'right' });

    // Valor (preto, destaque)
    doc.setFont('helvetica', 'bold');
    setColor(doc, INK);
    doc.text(formatCurrency(item.value), colValor, y, { align: 'right' });

    y += 8.5;
    hairline(doc, M, y - 2.5, W - M, true);
    y += 0.5;
  });

  // Subtotal da seção
  ensure(8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  setColor(doc, MUTED);
  doc.text('SUBTOTAL', M + 2, y + 3);
  doc.setFontSize(9);
  setColor(doc, MUTED);
  doc.text(formatCurrency(totalCost), colCusto, y + 3, { align: 'right' });
  setColor(doc, INK);
  doc.text(formatCurrency(totalValue), colValor, y + 3, { align: 'right' });
  y += 7;

  return y;
}

// ========================= HELPERS =========================

function sectionTitle(doc: Doc, title: string, M: number, y: number, W: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  setColor(doc, INK);
  doc.text(title, M, y);
  doc.setDrawColor(INK.r, INK.g, INK.b);
  doc.setLineWidth(0.4);
  doc.line(M, y + 2.5, W - M, y + 2.5);
  return y + 9;
}

function drawFactsGrid(doc: Doc, facts: Array<[string, string]>, M: number, startY: number, W: number): number {
  const cols = 3;
  const gap = 6;
  const cellW = (W - M * 2 - gap * (cols - 1)) / cols;
  const rowH = 16;
  let y = startY;

  facts.forEach(([label, value], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = M + col * (cellW + gap);
    const cy = y + row * (rowH + 4);

    hairlineBox(doc, x, cy, cellW, rowH);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    setColor(doc, LIGHT);
    doc.text(label, x + 4, cy + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    setColor(doc, INK);
    doc.text(truncate(value, 26), x + 4, cy + 12);
  });

  const rows = Math.ceil(facts.length / cols);
  return y + rows * (rowH + 4) - 4;
}

function hairline(doc: Doc, x1: number, yy: number, x2: number, soft = false) {
  const c = soft ? HAIRLINE : { r: 200, g: 200, b: 200 };
  doc.setDrawColor(c.r, c.g, c.b);
  doc.setLineWidth(0.2);
  doc.line(x1, yy, x2, yy);
}

function hairlineBox(doc: Doc, x: number, yy: number, w: number, h: number) {
  doc.setDrawColor(HAIRLINE.r, HAIRLINE.g, HAIRLINE.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, yy, w, h, 1.5, 1.5, 'S');
}

function footer(doc: Doc, W: number, H: number, M: number) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setColor(doc, { r: 170, g: 170, b: 170 });
  doc.text('SIM · Still In Movement', M, H - 8);
  doc.text('Produzido por @domi.n.arte', W - M, H - 8, { align: 'right' });
}

function setColor(doc: Doc, c: { r: number; g: number; b: number }) {
  doc.setTextColor(c.r, c.g, c.b);
}
function setColorHex(doc: Doc, hex: string) {
  doc.setTextColor(hex);
}
function setFill(doc: Doc, c: { r: number; g: number; b: number }) {
  doc.setFillColor(c.r, c.g, c.b);
}
function setFillHex(doc: Doc, hex: string) {
  doc.setFillColor(hex);
}

function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function sumCost(budget: Budget): number {
  let total = 0;
  budget.professionals.forEach((p) => (total += p.cost_price * p.days));
  budget.equipment.forEach((e) => (total += e.cost_price * e.days));
  budget.services.forEach((s) => (total += s.cost_price * s.quantity));
  budget.reels.forEach((r) => (total += r.cost_price * r.quantity));
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
