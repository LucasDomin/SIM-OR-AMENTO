/**
 * Helpers compartilhados para geração de PDF
 */

export const SEGMENTS = ['#996EA7', '#E45A58', '#EA8D11', '#FAC421', '#33AE74', '#2894D1', '#B1B7B1', '#F4C78D', '#8B5A2B'];

// Paleta
export const INK = { r: 17, g: 17, b: 17 };
export const MUTED = { r: 120, g: 120, b: 120 };
export const LIGHT = { r: 150, g: 150, b: 150 };
export const HAIRLINE = { r: 228, g: 228, b: 228 };
export const SOFT_BG = { r: 248, g: 247, b: 245 };
export const GREEN = { r: 51, g: 130, b: 90 };

type Doc = import('jspdf').default;

export function setColor(doc: Doc, c: { r: number; g: number; b: number }) {
  doc.setTextColor(c.r, c.g, c.b);
}

export function setColorHex(doc: Doc, hex: string) {
  doc.setTextColor(hex);
}

export function setFill(doc: Doc, c: { r: number; g: number; b: number }) {
  doc.setFillColor(c.r, c.g, c.b);
}

export function setFillHex(doc: Doc, hex: string) {
  doc.setFillColor(hex);
}

export function truncate(s: string, max: number): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function hairline(doc: Doc, x1: number, yy: number, x2: number, soft = false) {
  const c = soft ? HAIRLINE : { r: 200, g: 200, b: 200 };
  doc.setDrawColor(c.r, c.g, c.b);
  doc.setLineWidth(0.2);
  doc.line(x1, yy, x2, yy);
}

export function hairlineBox(doc: Doc, x: number, yy: number, w: number, h: number) {
  doc.setDrawColor(HAIRLINE.r, HAIRLINE.g, HAIRLINE.b);
  doc.setLineWidth(0.3);
  doc.roundedRect(x, yy, w, h, 1.5, 1.5, 'S');
}

export function sectionTitle(doc: Doc, title: string, M: number, y: number, W: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  setColor(doc, INK);
  doc.text(title, M, y);
  doc.setDrawColor(INK.r, INK.g, INK.b);
  doc.setLineWidth(0.4);
  doc.line(M, y + 2.5, W - M, y + 2.5);
  return y + 9;
}

export function drawFactsGrid(doc: Doc, facts: Array<[string, string]>, M: number, startY: number, W: number): number {
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

export function footer(doc: Doc, W: number, H: number, M: number) {
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setColor(doc, { r: 170, g: 170, b: 170 });
  doc.text('SIM · Still In Movement', M, H - 8);
  doc.text('Produzido por @domi.n.arte', W - M, H - 8, { align: 'right' });
}

export interface SectionItem {
  name: string;
  meta: string;
  cost?: number;
  value: number;
}

export function drawClientTable(doc: Doc, items: SectionItem[], M: number, startY: number, W: number, ensure: (n: number) => void): number {
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

export function drawInternalTable(doc: Doc, items: SectionItem[], M: number, startY: number, W: number, ensure: (n: number) => void): number {
  let y = startY;
  const colValor = W - M;
  const colCusto = W - M - 38;

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
    totalCost += item.cost || 0;
    totalValue += item.value;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, INK);
    doc.text(truncate(item.name, 42), M + 2, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    setColor(doc, LIGHT);
    doc.text(item.meta, M + 2, y + 4.4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, MUTED);
    doc.text(formatCurrency(item.cost || 0), colCusto, y, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    setColor(doc, INK);
    doc.text(formatCurrency(item.value), colValor, y, { align: 'right' });

    y += 8.5;
    hairline(doc, M, y - 2.5, W - M, true);
    y += 0.5;
  });

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

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
