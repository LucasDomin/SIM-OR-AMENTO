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
