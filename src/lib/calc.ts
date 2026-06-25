// Cálculos de orçamento — lógica da planilha SIM.
// Fórmula: subtotal → fee → base → impostos → totalGeral.
// Custo e lucro são apenas controle interno.

export interface PricedItem {
  quantity: number;
  unit_price: number;
  cost_price?: number;
  name?: string;
}

export interface CategorySummary {
  category: string;
  subtotal: number;
  items: number;
}

export interface BudgetFinancials {
  subtotal: number;
  fee_value: number;
  base: number;
  tax_value: number;
  final_price: number;
  // Controle interno
  cost_total: number;
  profit: number;
  margin: number;
  material_bruto_value: number;
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
 * Lógica da planilha SIM:
 * 1. subtotal = soma de todos os serviços + reels + equipamentos + profissionais
 * 2. fee = subtotal * (feePercent / 100)
 * 3. base = subtotal + fee
 * 4. impostos = base * (impostoPercent / 100)
 * 5. totalGeral = base + impostos = subtotal + fee + impostos
 */
export function calcFinancials(
  items: Array<PricedItem & { name?: string }>,
  settings: { fee_percentage: number; tax_percentage: number },
): BudgetFinancials {
  const feeRate = settings.fee_percentage / 100;
  const taxRate = settings.tax_percentage / 100;

  const subtotal = items.reduce((sum, item) => sum + calcSubtotal(item), 0);
  const cost_total = items.reduce((sum, item) => sum + calcCost(item), 0);

  const fee_value = subtotal * feeRate;
  const base = subtotal + fee_value;
  const tax_value = base * taxRate;
  const final_price = base + tax_value;

  // Controle interno: lucro = fee (o que sobra após impostos e custos)
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

export function getDilutedItems(items: PricedItem[], totalGeral: number, subtotal: number) {
  const factor = totalGeral / (subtotal || 1);
  return items.map(item => ({
    ...item,
    unit_price: item.unit_price * factor
  }));
}

/**
 * Recalcula um orçamento completo a partir dos VALORES APLICADOS dos itens.
 * Garante que o PDF (ou qualquer exportação) seja um espelho exato do estado atual,
 * sem confiar em campos de total potencialmente desatualizados (cache).
 *
 * - subtotal de cada item = quantidade × valor unitário aplicado
 * - financeiro (subtotal/fee/base/impostos/total) recalculado do zero
 * - NUNCA usa a tabela global de preços
 */
export function recalcBudgetSnapshot<
  B extends {
    services?: Array<{ quantity: number; unit_price: number; cost_price?: number; name?: string; subtotal?: number }>;
    reels?: Array<{ quantity: number; unit_price: number; cost_price?: number; name?: string; subtotal?: number }>;
    equipment?: Array<{ days: number; daily_rate: number; cost_price?: number; name?: string; subtotal?: number }>;
    professionals?: Array<{ days: number; daily_rate: number; cost_price?: number; name?: string; subtotal?: number }>;
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
    ...services.map((s) => ({ quantity: s.quantity, unit_price: s.unit_price, cost_price: s.cost_price, name: s.name })),
    ...reels.map((r) => ({ quantity: r.quantity, unit_price: r.unit_price, cost_price: r.cost_price, name: r.name })),
    ...equipment.map((e) => ({ quantity: e.days, unit_price: e.daily_rate, cost_price: e.cost_price, name: e.name })),
    ...professionals.map((p) => ({ quantity: p.days, unit_price: p.daily_rate, cost_price: p.cost_price, name: p.name })),
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
