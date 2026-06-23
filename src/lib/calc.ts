// Cálculos de orçamento — única fonte de verdade para valores monetários.
// Regra principal: subtotal = quantidade * valor unitário.
// O campo `cost_price` é apenas controle interno.

export interface PricedItem {
  quantity: number;
  unit_price: number;
  cost_price?: number;
}

export interface CategorySummary {
  category: string;
  subtotal: number;
  items: number;
}

export interface BudgetFinancials {
  cost_total: number;
  fee_value: number;
  tax_value: number;
  final_price: number;
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

export function sumByCategory<T extends PricedItem & { category: string }>(
  items: T[],
  category: string,
): number {
  return items
    .filter((item) => item.category === category)
    .reduce((sum, item) => sum + calcSubtotal(item), 0);
}

export function summarizeByCategory<T extends PricedItem & { category: string }>(
  items: T[],
): CategorySummary[] {
  const map = new Map<string, { subtotal: number; items: number }>();
  items.forEach((item) => {
    const current = map.get(item.category) ?? { subtotal: 0, items: 0 };
    current.subtotal += calcSubtotal(item);
    current.items += 1;
    map.set(item.category, current);
  });
  return Array.from(map.entries())
    .map(([category, value]) => ({ category, ...value }))
    .sort((a, b) => b.subtotal - a.subtotal);
}

export function calcTotalSale<T extends PricedItem>(items: T[]): number {
  return items.reduce((sum, item) => sum + calcSubtotal(item), 0);
}

export function calcTotalCost<T extends PricedItem>(items: T[]): number {
  return items.reduce((sum, item) => sum + calcCost(item), 0);
}

export function calcFinancials(
  items: Array<PricedItem & { name?: string }>,
  settings: { fee_percentage: number; tax_percentage: number },
): BudgetFinancials {
  const feeRate = settings.fee_percentage / 100;
  const taxRate = settings.tax_percentage / 100;
  const hasMaterialBruto = items.some((item) => item.name === 'Material Bruto');
  const baseCost = items
    .filter((item) => item.name !== 'Material Bruto')
    .reduce((sum, item) => sum + calcCost(item), 0);
  const grossMultiplier = (1 + feeRate) / (1 - taxRate);
  const cost_total = hasMaterialBruto ? baseCost / (1 - 0.2 * grossMultiplier) : baseCost;
  const material_bruto_value = hasMaterialBruto ? Math.max(0, cost_total - baseCost) : 0;
  const fee_value = cost_total * feeRate;
  const final_price = (cost_total + fee_value) / (1 - taxRate);
  const tax_value = final_price - (cost_total + fee_value);
  const profit = fee_value;
  const margin = final_price > 0 ? profit / final_price : 0;

  return {
    cost_total,
    fee_value,
    final_price,
    tax_value,
    profit,
    margin,
    material_bruto_value,
  };
}

export function formatPercent(value: number, fractionDigits = 1): string {
  return `${(value * 100).toFixed(fractionDigits)}%`;
}
