import { createClient } from '@supabase/supabase-js';
import type { Budget, SystemSettings } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltam as variáveis de ambiente VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const DEFAULT_SETTINGS: SystemSettings = {
  id: '',
  fee_percentage: 15,
  tax_percentage: 7,
  proposal_validity_days: 30,
  updated_at: '',
};

export async function fetchSettings(): Promise<SystemSettings> {
  const { data } = await supabase.from('system_settings').select().limit(1);
  return (data?.[0] as SystemSettings | undefined) || DEFAULT_SETTINGS;
}

// Converte o objeto Budget usado no app para as colunas reais da tabela
// `budgets` (os campos legados/duplicados como expiration_date, type,
// budget_date e client_phone não são persistidos — são recompostos na leitura).
export function budgetToRow(budget: Budget) {
  return {
    id: budget.id,
    client_id: budget.client_id,
    client_name: budget.client_name,
    client_company: budget.client_company,
    client_whatsapp: budget.client_whatsapp,
    client_email: budget.client_email,
    project_name: budget.project_name,
    project_type: budget.project_type,
    project_description: budget.project_description,
    production: budget.production,
    services: budget.services,
    reels: budget.reels,
    equipment: budget.equipment,
    professionals: budget.professionals,
    status: budget.status,
    created_at: budget.created_at,
    updated_at: budget.updated_at,
    expires_at: budget.expires_at,
    proposal_date: budget.proposal_date,
    online_slug: budget.online_slug,
    cost_total: budget.cost_total,
    fee_value: budget.fee_value,
    tax_value: budget.tax_value,
    final_price: budget.final_price,
    profit: budget.profit,
    margin: budget.margin,
    material_bruto_value: budget.material_bruto_value,
  };
}

// Recompõe os campos legados/duplicados a partir de uma linha da tabela
// `budgets`, para manter compatibilidade com telas que ainda leem
// budget.expiration_date, budget.type, budget.budget_date etc.
export function mapBudgetRow(row: Record<string, unknown>): Budget {
  const b = row as unknown as Budget;
  return {
    ...b,
    services: b.services || [],
    reels: b.reels || [],
    equipment: b.equipment || [],
    professionals: b.professionals || [],
    expiration_date: b.expires_at,
    type: b.project_type,
    budget_date: b.created_at,
    client_phone: b.client_whatsapp,
    items: b.services || [],
    deliverables: b.deliverables || {
      videos: 0,
      photos: 0,
      reels: 0,
      pilulas: 0,
      sameday: false,
      aftermovie: false,
      videocase: false,
    },
  };
}
