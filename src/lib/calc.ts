// Cálculos financeiros centrais do sistema.
// Nova lógica: cada item possui custo base, fee% e imposto%, e gera seu valor de venda.

export interface PricedItem {
  quantity: number;
  unit_price: number;        // valor unitário final aplicado no orçamento
  cost_base?: number;        // custo base unitário
  cost_price?: number;       // legado / compatibilidade
  fee_percent?: number;
  tax_percent?: number;
  name?: string;
}

export interface CategorySummary {
  category: string;
  subtotal: number;
  items: number;
}

export interface ItemPricingBreakdown {
  cost_base: number;
  fee_percent: number;
  tax_percent: number;
  fee_value: number;
  base_commercial: number;
  tax_value: number;
  sale_price: number;
}

export interface BudgetFinancials {
  subtotal: number;      // soma dos valores de venda dos itens
  fee_value: number;     // soma dos fee dos itens
  base: number;          // subtotal sem impostos? aqui = cost_total + fee_value
  tax_value: number;     // soma dos impostos dos itens
  final_price: number;   // subtotal final cobrado
  // Controle interno
  cost_total: number;    // soma dos custos base
  profit: number;        // final - custo - impostos
  margin: number;
  material_bruto_value: number;
}

export function calcSubtotal(item: PricedItem): number {
  return (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
}

export function getCostBase(item: Pick<PricedItem, 'cost_base' | 'cost_price'>): number {
  return Number(item.cost_base ?? item.cost_price ?? 0) || 0;
}

export function calcCost(item: PricedItem): number {
  return (Number(item.quantity) || 0) * getCostBase(item);
}

export function calcItemPricing(
  costBase: number,
  feePercent: number,
  taxPercent: number,
): ItemPricingBreakdown {
  const fee_value = costBase * ((feePercent || 0) / 100);
  const base_commercial = costBase + fee_value;
  const tax_value = base_commercial * ((taxPercent || 0) / 100);
  const sale_price = base_commercial + tax_value;
  return { cost_base: costBase, fee_percent: feePercent, tax_percent: taxPercent, fee_value, base_commercial, tax_value, sale_price };
}

/**
 * Quando um item teve o valor final manualmente ajustado no orçamento,
 * recalculamos a decomposição interna mantendo custo base e imposto fixos.
 *
 * Fórmula:
 * baseComercial = valorAplicado / (1 + imposto)
 * fee = baseComercial - custoBase
 * impostos = valorAplicado - baseComercial
 */
export function deriveAppliedBreakdown(
  costBase: number,
  appliedSalePrice: number,
  taxPercent: number,
): ItemPricingBreakdown {
  const taxRate = (taxPercent || 0) / 100;
  const base_commercial = appliedSalePrice / (1 + taxRate);
  const fee_value = base_commercial - costBase;
  const tax_value = appliedSalePrice - base_commercial;
  const fee_percent = costBase > 0 ? (fee_value / costBase) * 100 : 0;
  return {
    cost_base: costBase,
    fee_percent,
    tax_percent: taxPercent,
    fee_value,
    base_commercial,
    tax_value,
    sale_price: appliedSalePrice,
  };
}

export function calcTotalSale<T extends PricedItem>(items: T[]): number {
  return items.reduce((sum, item) => sum + calcSubtotal(item), 0);
}

export function calcTotalCost<T extends PricedItem>(items: T[]): number {
  return items.reduce((sum, item) => sum + calcCost(item), 0);
}

/**
 * Financeiro do projeto: soma os componentes por item.
 * Se o item teve preço final customizado, decompõe usando deriveAppliedBreakdown.
 */
export function calcFinancials(
  items: Array<PricedItem & { name?: string }>,
  settings?: { fee_percentage: number; tax_percentage: number },
): BudgetFinancials {
  let subtotal = 0;
  let cost_total = 0;
  let fee_value = 0;
  let tax_value = 0;

  items.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const applied = Number(item.unit_price) || 0;
    const costBase = getCostBase(item);
    const fallbackFee = item.fee_percent ?? settings?.fee_percentage ?? 15;
    const fallbackTax = item.tax_percent ?? settings?.tax_percentage ?? 7;

    const formula = calcItemPricing(costBase, fallbackFee, fallbackTax);
    const breakdown = Math.abs(formula.sale_price - applied) < 0.01
      ? formula
      : deriveAppliedBreakdown(costBase, applied, fallbackTax);

    subtotal += applied * qty;
    cost_total += breakdown.cost_base * qty;
    fee_value += breakdown.fee_value * qty;
    tax_value += breakdown.tax_value * qty;
  });

  const base = cost_total + fee_value;
  const final_price = subtotal;
  const profit = final_price - cost_total - tax_value;
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

export function recalcBudgetSnapshot<
  B extends {
    services?: Array<{ quantity: number; unit_price: number; cost_base?: number; cost_price?: number; fee_percent?: number; tax_percent?: number; name?: string; subtotal?: number }>;
    reels?: Array<{ quantity: number; unit_price: number; cost_base?: number; cost_price?: number; fee_percent?: number; tax_percent?: number; name?: string; subtotal?: number }>;
    equipment?: Array<{ days: number; daily_rate: number; cost_base?: number; cost_price?: number; fee_percent?: number; tax_percent?: number; name?: string; subtotal?: number }>;
    professionals?: Array<{ days: number; daily_rate: number; cost_base?: number; cost_price?: number; fee_percent?: number; tax_percent?: number; name?: string; subtotal?: number }>;
  },
>(budget: B, settings: { fee_percentage: number; tax_percentage: number }): B & BudgetFinancials {
  const services = (budget.services || []).map((s) => ({
    ...s,
    cost_base: getCostBase(s),
    fee_percent: s.fee_percent ?? settings.fee_percentage,
    tax_percent: s.tax_percent ?? settings.tax_percentage,
    subtotal: (Number(s.quantity) || 0) * (Number(s.unit_price) || 0),
  }));
  const reels = (budget.reels || []).map((r) => ({
    ...r,
    cost_base: getCostBase(r),
    fee_percent: r.fee_percent ?? settings.fee_percentage,
    tax_percent: r.tax_percent ?? settings.tax_percentage,
    subtotal: (Number(r.quantity) || 0) * (Number(r.unit_price) || 0),
  }));
  const equipment = (budget.equipment || []).map((e) => ({
    ...e,
    cost_base: getCostBase(e),
    fee_percent: e.fee_percent ?? settings.fee_percentage,
    tax_percent: e.tax_percent ?? settings.tax_percentage,
    subtotal: (Number(e.days) || 0) * (Number(e.daily_rate) || 0),
  }));
  const professionals = (budget.professionals || []).map((p) => ({
    ...p,
    cost_base: getCostBase(p),
    fee_percent: p.fee_percent ?? settings.fee_percentage,
    tax_percent: p.tax_percent ?? settings.tax_percentage,
    subtotal: (Number(p.days) || 0) * (Number(p.daily_rate) || 0),
  }));

  const pricedItems: Array<PricedItem & { name?: string }> = [
    ...services.map((s) => ({ quantity: s.quantity, unit_price: s.unit_price, cost_base: s.cost_base, fee_percent: s.fee_percent, tax_percent: s.tax_percent, name: s.name })),
    ...reels.map((r) => ({ quantity: r.quantity, unit_price: r.unit_price, cost_base: r.cost_base, fee_percent: r.fee_percent, tax_percent: r.tax_percent, name: r.name })),
    ...equipment.map((e) => ({ quantity: e.days, unit_price: e.daily_rate, cost_base: e.cost_base, fee_percent: e.fee_percent, tax_percent: e.tax_percent, name: e.name })),
    ...professionals.map((p) => ({ quantity: p.days, unit_price: p.daily_rate, cost_base: p.cost_base, fee_percent: p.fee_percent, tax_percent: p.tax_percent, name: p.name })),
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
