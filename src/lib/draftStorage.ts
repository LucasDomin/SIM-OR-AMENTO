/**
 * Persistência do rascunho do orçamento em curso.
 * Sobrevive a navegação entre abas. Limpa apenas ao clicar "Limpar orçamento".
 */

const DRAFT_KEY = 'sim_budget_draft';

export interface DraftItemOverride {
  qty: number;
  applied_price: number; // valor aplicado NESTE orçamento
  base_price: number;    // valor original da tabela global (nunca muda)
}

export interface BudgetDraft {
  client: { name: string; company: string; whatsapp: string; email: string };
  lgpdConsent: boolean;
  project: { name: string; type: string; description: string };
  production: {
    shooting_days: number;
    city: string;
    need_transportation: boolean;
    need_lodging: boolean;
    start_date: string;
    delivery_days: number;
  };
  services: Record<string, DraftItemOverride>;   // priceId → override
  reels: Record<string, DraftItemOverride>;
  equipment: Record<string, DraftItemOverride>;
  professionals: Record<string, DraftItemOverride>;
  savedAt: string;
}

export const EMPTY_DRAFT: BudgetDraft = {
  client: { name: '', company: '', whatsapp: '', email: '' },
  lgpdConsent: false,
  project: { name: '', type: 'Personalizado', description: '' },
  production: {
    shooting_days: 1,
    city: 'Belo Horizonte',
    need_transportation: false,
    need_lodging: false,
    start_date: '',
    delivery_days: 15,
  },
  services: {},
  reels: {},
  equipment: {},
  professionals: {},
  savedAt: '',
};

export function loadDraft(): BudgetDraft {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return { ...EMPTY_DRAFT };
    return JSON.parse(raw) as BudgetDraft;
  } catch {
    return { ...EMPTY_DRAFT };
  }
}

export function saveDraft(draft: BudgetDraft): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
}

export function clearDraft(): void {
  localStorage.removeItem(DRAFT_KEY);
}

export function hasDraft(): boolean {
  const d = loadDraft();
  return (
    d.client.name.trim() !== '' ||
    Object.keys(d.services).length > 0 ||
    Object.keys(d.equipment).length > 0 ||
    Object.keys(d.professionals).length > 0
  );
}
