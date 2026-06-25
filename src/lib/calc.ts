// Cálculo financeiro por item — cada item tem seu próprio fee e imposto embutidos.
//
// Fórmula por item:
//   fee       = cost × (fee_percent / 100)
//   base      = cost + fee
//   impostos  = base × (tax_percent / 100)
//   sale_price = base + impostos
//
// O sale_price é o VALOR DE VENDA FINAL (com fee e impostos embutidos).
// É ele que aparece no orçamento e no PDF do cliente.

export interface PricedItem {
  quantity: number;
  unit_price: number;   // = sale_price aplicado neste orçamento
  cost_price?: number;
  fee_percent?: number;
  tax_percent?: number;
  name?: string;
}

export interface ItemBreakdown {
  cost: number;        // custo base × qty
  fee: number;         // fee × qty
  base: number;        // (cost + fee) × qty
  tax: number;         // impostos × qty
  sale: number;        // sale_price × qty (= total ao cliente)
  unit_sale: number;   // sale_price unitário (com fee + imposto embutidos)
}

export interface BudgetFinancials {
  subtotal: number;       // = soma dos sale_price aplicados (cliente vê isso)
  fee_value: number;      // soma dos fees por item
  base: number;           // soma das bases por item
  tax_value: number;      // soma dos impostos por item
  final_price: number;    // = subtotal (já com tudo embutido)
  cost_total: number;     // soma dos custos por item
  profit: number;         // fee_value (margem bruta)
  margin: number;         // profit / final_price
  material_bruto_value: number;
}

/** Calcula sale_price unitário a partir de custo, fee% e imposto% */
export function calcItemSalePrice(cost: number, feePercent: number, taxPercent: number): number {
  const c = Number(cost) || 0;
  const f = (Number(feePercent) || 0) / 100;
  const t = (Number(taxPercent) || 0) / 100;
  const fee = c * f;
  const base = c + fee;
  const tax = base * t;
  return base + tax;
}

/** Breakdown completo por item (uso interno: PDF interno, telas internas) */
export function calcItemBreakdown(item: PricedItem): ItemBreakdown {
  const qty = Number(item.quantity) || 0;
  const cost = Number(item.cost_price) || 0;
  const fp = (Number(item.fee_percent) || 0) / 100;
  const tp = (Number(item.tax_percent) || 0) / 100;
  const fee = cost * fp;
  const base = cost + fee;
  const tax = base * tp;
  const unitSale = base + tax;
  // Se houve override (valor personalizado no orçamento), preserve esse valor.
  const appliedUnit = Number(item.unit_price) || unitSale;
  return {
    cost: cost * qty,
    fee: fee * qty,
    base: base * qty,
    tax: tax * qty,
    sale: appliedUnit * qty,
    unit_sale: appliedUnit,
  };
}

export function calcSubtotal(item: PricedItem): number {
  return (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
}

export function calcCost(item: PricedItem): number {
  return (Number(item.quantity) || 0) * (Number(item.cost_price) || 0);
}

export function calcTotalSale<T extends PricedItem>(items: T[]): number {
  return items.reduce((sum, item) => sum + calcSubtotal(item), 0);
}

export function calcTotalCost<T extends PricedItem>(items: T[]): number {
  return items.reduce((sum, item) => sum + calcCost(item), 0);
}

/**
 * Financeiro do orçamento — agregação por item.
 * Cada item já carrega seu próprio fee_percent e tax_percent.
 * O total é simplesmente a soma dos valores de venda.
 */
export function calcFinancials(
  items: Array<PricedItem & { name?: string }>,
  // settings global é apenas fallback para itens sem fee/imposto definidos
  settings: { fee_percentage: number; tax_percentage: number },
): BudgetFinancials {
  let subtotal = 0;
  let cost_total = 0;
  let fee_value = 0;
  let base = 0;
  let tax_value = 0;

  items.forEach((item) => {
    // fallback: se item não tem fee/tax próprios, usa o global
    const enriched: PricedItem = {
      ...item,
      fee_percent: item.fee_percent ?? settings.fee_percentage,
      tax_percent: item.tax_percent ?? settings.tax_percentage,
    };
    const bd = calcItemBreakdown(enriched);
    subtotal += bd.sale;
    cost_total += bd.cost;
    fee_value += bd.fee;
    base += bd.base;
    tax_value += bd.tax;
  });

  const final_price = subtotal; // sale_price já contém fee + impostos embutidos
  const profit = fee_value;
  const margin = final_price > 0 ? profit / final_price : 0;

  return {
    subtotal,
    fee_value,
    base,
    tax_value,
    final_price,
    cost_total,
    profit,
    margin,
    material_bruto_value: 0,
  };
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}

/**
 * Recalcula um orçamento do zero a partir dos valores aplicados nos itens.
 * Garante que o PDF e a tela sejam sempre um espelho exato — sem cache antigo.
 * NUNCA consulta a tabela global de preços.
 */
export function recalcBudgetSnapshot<
  B extends {
    services?: Array<{ quantity: number; unit_price: number; cost_price?: number; fee_percent?: number; tax_percent?: number; name?: string; subtotal?: number }>;
    reels?: Array<{ quantity: number; unit_price: number; cost_price?: number; fee_percent?: number; tax_percent?: number; name?: string; subtotal?: number }>;
    equipment?: Array<{ days: number; daily_rate: number; cost_price?: number; fee_percent?: number; tax_percent?: number; name?: string; subtotal?: number }>;
    professionals?: Array<{ days: number; daily_rate: number; cost_price?: number; fee_percent?: number; tax_percent?: number; name?: string; subtotal?: number }>;
  },
>(budget: B, settings: { fee_percentage: number; tax_percentage: number }): B & BudgetFinancials {
  const services = (budget.services || []).map((s) => ({
    ...s,
    subtotal: (Number(s.quantity) || 0) * (Number(s.unit_price) || 0),
  }));
  const reels = (budget.reels || []).map((r) => ({
    ...r,
    subtotal: (Number(r.quantity) || 0) * (Number(r.unit_price) || 0),
  }));
  const equipment = (budget.equipment || []).map((e) => ({
    ...e,
    subtotal: (Number(e.days) || 0) * (Number(e.daily_rate) || 0),
  }));
  const professionals = (budget.professionals || []).map((p) => ({
    ...p,
    subtotal: (Number(p.days) || 0) * (Number(p.daily_rate) || 0),
  }));

  const pricedItems: Array<PricedItem & { name?: string }> = [
    ...services.map((s) => ({
      quantity: s.quantity, unit_price: s.unit_price,
      cost_price: s.cost_price, fee_percent: s.fee_percent, tax_percent: s.tax_percent, name: s.name,
    })),
    ...reels.map((r) => ({
      quantity: r.quantity, unit_price: r.unit_price,
      cost_price: r.cost_price, fee_percent: r.fee_percent, tax_percent: r.tax_percent, name: r.name,
    })),
    ...equipment.map((e) => ({
      quantity: e.days, unit_price: e.daily_rate,
      cost_price: e.cost_price, fee_percent: e.fee_percent, tax_percent: e.tax_percent, name: e.name,
    })),
    ...professionals.map((p) => ({
      quantity: p.days, unit_price: p.daily_rate,
      cost_price: p.cost_price, fee_percent: p.fee_percent, tax_percent: p.tax_percent, name: p.name,
    })),
  ];

  const financials = calcFinancials(pricedItems, settings);

  return {
    ...budget,
    services,
    reels,
    equipment,
    professionals,
    ...financials,
  } as B & BudgetFinancials;
}

// Mantido para compatibilidade — não é mais usado pelos PDFs.
export function getDilutedItems(items: PricedItem[], totalGeral: number, subtotal: number) {
  const factor = totalGeral / (subtotal || 1);
  return items.map(item => ({ ...item, unit_price: item.unit_price * factor }));
}
