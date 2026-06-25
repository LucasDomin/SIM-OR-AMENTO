// Cálculos financeiros centrais do sistema.
// Nova lógica: cada item possui custo base, fee% e imposto%, e gera seu valor de venda.

export interface PricedItem {
  quantity: number;
  unit_price: number;        // preço FINAL aplicado no orçamento (precoFinal)
  cost_base?: number;        // custo base unitário
  price_base?: number;       // preço base (valor que quero receber)
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
  price_base: number;       // preço base (valor que quero receber)
  fee_percent: number;
  tax_percent: number;
  fee_value: number;
  tax_value: number;
  gross_profit: number;     // lucro bruto = preço base - custo base
  base_commercial: number;  // = price_base (compat)
  sale_price: number;       // preço final cliente
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

/**
 * Lógica de 3 níveis:
 * 1. custoBase  → custo real
 * 2. precoBase  → valor comercial definido manualmente (o que quero receber)
 * 3. precoFinal → precoBase com FEE + Impostos embutidos
 *
 * Fórmula:
 * taxaTotal = feePercent + impostoPercent
 * precoFinal = precoBase * (1 + taxaTotal / 100)
 *
 * lucroBruto = precoBase - custoBase
 */
export function calcItemPricing(
  costBase: number,
  feePercent: number,
  taxPercent: number,
  priceBase?: number,
): ItemPricingBreakdown {
  const base_price = priceBase ?? costBase; // se não houver preço base, usa custo
  const taxaTotal = (feePercent || 0) + (taxPercent || 0);
  const sale_price = base_price * (1 + taxaTotal / 100);
  const fee_value = base_price * ((feePercent || 0) / 100);
  const tax_value = base_price * ((taxPercent || 0) / 100);
  const gross_profit = base_price - costBase;
  return {
    cost_base: costBase,
    price_base: base_price,
    fee_percent: feePercent,
    tax_percent: taxPercent,
    fee_value,
    tax_value,
    gross_profit,
    base_commercial: base_price,
    sale_price,
  };
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
/**
 * Quando o preço final foi ajustado manualmente no orçamento, derivamos o
 * preço base implícito a partir das taxas (fee + imposto) e o lucro bruto.
 *
 * precoBase = precoFinal / (1 + taxaTotal/100)
 * fee = precoBase * feePercent/100
 * imposto = precoBase * impostoPercent/100
 * lucroBruto = precoBase - custoBase
 */
export function deriveAppliedBreakdown(
  costBase: number,
  appliedSalePrice: number,
  feePercent: number,
  taxPercent: number,
): ItemPricingBreakdown {
  const taxaTotal = (feePercent || 0) + (taxPercent || 0);
  const price_base = appliedSalePrice / (1 + taxaTotal / 100);
  const fee_value = price_base * ((feePercent || 0) / 100);
  const tax_value = price_base * ((taxPercent || 0) / 100);
  const gross_profit = price_base - costBase;
  return {
    cost_base: costBase,
    price_base,
    fee_percent: feePercent,
    tax_percent: taxPercent,
    fee_value,
    tax_value,
    gross_profit,
    base_commercial: price_base,
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

  let price_base_total = 0;

  items.forEach((item) => {
    const qty = Number(item.quantity) || 0;
    const applied = Number(item.unit_price) || 0;        // precoFinal aplicado
    const costBase = getCostBase(item);
    const fallbackFee = item.fee_percent ?? settings?.fee_percentage ?? 15;
    const fallbackTax = item.tax_percent ?? settings?.tax_percentage ?? 7;

    // Preço base do item (valor que quero receber). Se houver price_base, usamos a fórmula direta;
    // caso o preço final tenha sido customizado, derivamos o preço base implícito.
    const formula = calcItemPricing(costBase, fallbackFee, fallbackTax, item.price_base);
    const breakdown = Math.abs(formula.sale_price - applied) < 0.01
      ? formula
      : deriveAppliedBreakdown(costBase, applied, fallbackFee, fallbackTax);

    subtotal += applied * qty;
    cost_total += breakdown.cost_base * qty;
    price_base_total += breakdown.price_base * qty;
    fee_value += breakdown.fee_value * qty;
    tax_value += breakdown.tax_value * qty;
  });

  const base = price_base_total;                          // total do preço base
  const final_price = subtotal;                           // total cliente (com taxas)
  const profit = price_base_total - cost_total;           // lucro bruto = preço base - custo
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

  const pb = (x: unknown): number | undefined => (x as { price_base?: number }).price_base;
  const pricedItems: Array<PricedItem & { name?: string }> = [
    ...services.map((s) => ({ quantity: s.quantity, unit_price: s.unit_price, cost_base: s.cost_base, price_base: pb(s), fee_percent: s.fee_percent, tax_percent: s.tax_percent, name: s.name })),
    ...reels.map((r) => ({ quantity: r.quantity, unit_price: r.unit_price, cost_base: r.cost_base, price_base: pb(r), fee_percent: r.fee_percent, tax_percent: r.tax_percent, name: r.name })),
    ...equipment.map((e) => ({ quantity: e.days, unit_price: e.daily_rate, cost_base: e.cost_base, price_base: pb(e), fee_percent: e.fee_percent, tax_percent: e.tax_percent, name: e.name })),
    ...professionals.map((p) => ({ quantity: p.days, unit_price: p.daily_rate, cost_base: p.cost_base, price_base: pb(p), fee_percent: p.fee_percent, tax_percent: p.tax_percent, name: p.name })),
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
