import type { Budget } from '../types';
import { getLogoDataUrl } from './logoImage';
import { formatCurrency } from './supabase';
import { formatDateFull } from './utils';
import { getDilutedItems } from './calc';

export async function generateClientPDF(budget: Budget) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  
  const allItems = [
    ...budget.services.map(s => ({ name: s.name, quantity: s.quantity, unit_price: s.unit_price })),
    ...budget.reels.map(r => ({ name: r.name, quantity: r.quantity, unit_price: r.unit_price })),
    ...budget.equipment.map(e => ({ name: e.name, quantity: e.days, unit_price: e.daily_rate })),
    ...budget.professionals.map(p => ({ name: p.name, quantity: p.days, unit_price: p.daily_rate })),
  ];

  const dilutedItems = getDilutedItems(allItems, budget.final_price, budget.subtotal);

  // Layout PDF (Lógica simplificada para focar nos valores diluídos)
  doc.text('PROPOSTA COMERCIAL', 20, 20);
  doc.text(budget.project_name, 20, 30);
  
  let y = 40;
  dilutedItems.forEach(item => {
    doc.text(`${item.name} (${item.quantity}) - ${formatCurrency(item.unit_price * item.quantity)}`, 20, y);
    y += 10;
  });
  
  doc.text(`TOTAL: ${formatCurrency(budget.final_price)}`, 20, y + 10);
  doc.save(`proposta-${budget.project_name}.pdf`);
}

export async function generateInternalPDF(budget: Budget) {
  // Implementação com detalhes internos...
}
