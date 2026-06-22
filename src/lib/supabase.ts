import type {
  Budget,
  BudgetItem,
  Client,
  PriceListItem,
  SystemSettings,
  Template,
  User,
} from '../types';

type TableName = 'users' | 'clients' | 'budgets' | 'budget_items' | 'price_list' | 'templates' | 'system_settings';
type TableRecord = Budget | Client | BudgetItem | PriceListItem | Template | SystemSettings | User;

const STORAGE_KEYS: Record<TableName | 'auth', string> = {
  users: 'sim_users',
  clients: 'sim_clients',
  budgets: 'sim_budgets',
  budget_items: 'sim_budget_items',
  price_list: 'sim_price_list_2025',
  templates: 'sim_templates_v2',
  system_settings: 'sim_system_settings',
  auth: 'sim_auth',
};

export function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function generateId(): string {
  return Math.random().toString(36).slice(2, 12) + Math.random().toString(36).slice(2, 12);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

const defaultSettings: SystemSettings = {
  id: 'settings-main',
  fee_percentage: 15,
  tax_percentage: 7,
  proposal_validity_days: 30,
  updated_at: new Date().toISOString(),
};

const priceSeed: Omit<PriceListItem, 'id' | 'active' | 'updated_at'>[] = [
  { category: 'Pré Produção', name: 'Roteiro', sale_price: 3200, cost_price: 1600 },
  { category: 'Pré Produção', name: 'Storyboard', sale_price: 2400, cost_price: 1200 },
  { category: 'Pré Produção', name: 'Produtor', sale_price: 2800, cost_price: 1500 },
  { category: 'Pré Produção', name: 'Produtor Executivo', sale_price: 5200, cost_price: 2800 },
  { category: 'Produção', name: 'Diretor', sale_price: 4200, cost_price: 2000 },
  { category: 'Produção', name: 'Filmmaker', sale_price: 1200, cost_price: 900 },
  { category: 'Produção', name: 'Diretor de Fotografia', sale_price: 3800, cost_price: 2200 },
  { category: 'Produção', name: 'Assistente de Câmera', sale_price: 1100, cost_price: 750 },
  { category: 'Produção', name: 'Assistente de Direção', sale_price: 1400, cost_price: 900 },
  { category: 'Produção', name: 'Logger', sale_price: 850, cost_price: 600 },
  { category: 'Produção', name: 'Gaffer', sale_price: 2200, cost_price: 1400 },
  { category: 'Produção', name: 'Operador de Áudio', sale_price: 1800, cost_price: 1100 },
  { category: 'Produção', name: 'Drone / FPV', sale_price: 3200, cost_price: 1800 },
  { category: 'Fotografia', name: 'Fotógrafo', sale_price: 2500, cost_price: 1500 },
  { category: 'Fotografia', name: 'Assistente de Fotografia', sale_price: 900, cost_price: 650 },
  { category: 'Pós Produção', name: 'Edição', sale_price: 3600, cost_price: 2000 },
  { category: 'Pós Produção', name: 'Edição Sameday', sale_price: 4200, cost_price: 2600 },
  { category: 'Pós Produção', name: 'Motion', sale_price: 3200, cost_price: 1800 },
  { category: 'Pós Produção', name: 'VFX', sale_price: 5200, cost_price: 3000 },
  { category: 'Finalização', name: 'Color Grading', sale_price: 2600, cost_price: 1500 },
  { category: 'Finalização', name: 'Sound Design', sale_price: 2200, cost_price: 1200 },
  { category: 'Finalização', name: 'Trilha', sale_price: 3000, cost_price: 1700 },
  { category: 'Finalização', name: 'Locução', sale_price: 1400, cost_price: 800 },
  { category: 'Logística', name: 'Alimentação', sale_price: 650, cost_price: 500 },
  { category: 'Logística', name: 'Catering', sale_price: 1800, cost_price: 1300 },
  { category: 'Logística', name: 'Transporte Van', sale_price: 950, cost_price: 700 },
  { category: 'Logística', name: 'Transporte Uber', sale_price: 350, cost_price: 300 },
  { category: 'Logística', name: 'Hospedagem', sale_price: 850, cost_price: 650 },
  { category: 'Equipamentos', name: 'Câmera', sale_price: 2200, cost_price: 1200 },
  { category: 'Equipamentos', name: 'Lentes', sale_price: 1300, cost_price: 700 },
  { category: 'Equipamentos', name: 'Iluminação', sale_price: 1800, cost_price: 1000 },
  { category: 'Equipamentos', name: 'Elétrica e Maquinária', sale_price: 1600, cost_price: 950 },
  { category: 'Equipamentos', name: 'Robô', sale_price: 4800, cost_price: 3000 },
  { category: 'Extras', name: 'Verba Extra', sale_price: 2500, cost_price: 2500 },
  { category: 'Extras', name: 'Material Bruto', sale_price: 0, cost_price: 0 },
];

const templateSeed: Template[] = [
  {
    id: 'template-institucional',
    name: 'Institucional',
    project_type: 'Institucional',
    description: 'Narrativa de marca com entrevistas, cenas de atmosfera e acabamento premium.',
    production: { shooting_days: 2, city: 'São Paulo', need_transportation: true, need_lodging: false },
    deliverables: { videos: 1, photos: 0, reels: 3, pilulas: 2, sameday: false, aftermovie: false, videocase: true },
    price_item_names: ['Roteiro', 'Diretor', 'Filmmaker', 'Diretor de Fotografia', 'Câmera', 'Lentes', 'Iluminação', 'Edição', 'Color Grading', 'Sound Design'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-evento',
    name: 'Evento',
    project_type: 'Evento',
    description: 'Cobertura de evento com captação multicâmera, fotografia e entrega social.',
    production: { shooting_days: 1, city: 'São Paulo', need_transportation: true, need_lodging: false },
    deliverables: { videos: 1, photos: 120, reels: 4, pilulas: 0, sameday: true, aftermovie: true, videocase: false },
    price_item_names: ['Filmmaker', 'Filmmaker', 'Fotógrafo', 'Drone / FPV', 'Câmera', 'Edição Sameday', 'Edição', 'Transporte Van', 'Alimentação'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-publicidade',
    name: 'Publicidade',
    project_type: 'Publicidade',
    description: 'Campanha com direção criativa, produção robusta e pós-produção completa.',
    production: { shooting_days: 2, city: 'São Paulo', need_transportation: true, need_lodging: false },
    deliverables: { videos: 2, photos: 30, reels: 5, pilulas: 4, sameday: false, aftermovie: false, videocase: false },
    price_item_names: ['Roteiro', 'Storyboard', 'Produtor Executivo', 'Produtor', 'Diretor', 'Diretor de Fotografia', 'Assistente de Câmera', 'Gaffer', 'Fotógrafo', 'Câmera', 'Lentes', 'Iluminação', 'Edição', 'Motion', 'Color Grading', 'Sound Design'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-podcast',
    name: 'Podcast',
    project_type: 'Podcast',
    description: 'Captação multicâmera com áudio dedicado e edição para episódio completo e cortes.',
    production: { shooting_days: 1, city: 'São Paulo', need_transportation: true, need_lodging: false },
    deliverables: { videos: 1, photos: 0, reels: 6, pilulas: 6, sameday: false, aftermovie: false, videocase: false },
    price_item_names: ['Filmmaker', 'Operador de Áudio', 'Câmera', 'Câmera', 'Iluminação', 'Edição', 'Sound Design'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-reels',
    name: 'Reels',
    project_type: 'Reels',
    description: 'Produção vertical enxuta com ritmo editorial e entrega rápida.',
    production: { shooting_days: 1, city: 'São Paulo', need_transportation: false, need_lodging: false },
    deliverables: { videos: 0, photos: 0, reels: 6, pilulas: 0, sameday: false, aftermovie: false, videocase: false },
    price_item_names: ['Filmmaker', 'Fotógrafo', 'Câmera', 'Edição', 'Motion', 'Transporte Uber'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-cobertura',
    name: 'Cobertura',
    project_type: 'Cobertura',
    description: 'Cobertura documental com fotografia, vídeo e pacote de redes sociais.',
    production: { shooting_days: 1, city: 'São Paulo', need_transportation: true, need_lodging: false },
    deliverables: { videos: 1, photos: 80, reels: 3, pilulas: 0, sameday: false, aftermovie: true, videocase: false },
    price_item_names: ['Filmmaker', 'Fotógrafo', 'Drone / FPV', 'Câmera', 'Edição', 'Color Grading', 'Transporte Van', 'Alimentação'],
    created_at: new Date().toISOString(),
  },
];

export function getSettings(): SystemSettings {
  return getStorage<SystemSettings[]>(STORAGE_KEYS.system_settings, [defaultSettings])[0] || defaultSettings;
}

export function getPriceList(): PriceListItem[] {
  return getStorage<PriceListItem[]>(STORAGE_KEYS.price_list, []);
}

export function calculateBudget(items: BudgetItem[], settings: SystemSettings = getSettings()) {
  const hasMaterialBruto = items.some((item) => item.name.toLowerCase() === 'material bruto');
  const baseCost = items.reduce((sum, item) => {
    if (item.name.toLowerCase() === 'material bruto') return sum;
    return sum + item.quantity * item.cost_price;
  }, 0);
  const feeRate = settings.fee_percentage / 100;
  const taxRate = settings.tax_percentage / 100;
  const grossMultiplier = (1 + feeRate) / (1 - taxRate);
  const cost_total = hasMaterialBruto ? baseCost / (1 - 0.2 * grossMultiplier) : baseCost;
  const material_bruto_value = hasMaterialBruto ? Math.max(0, cost_total - baseCost) : 0;
  const fee_value = cost_total * feeRate;
  const final_price = (cost_total + fee_value) / (1 - taxRate);
  const tax_value = final_price - (cost_total + fee_value);
  const profit = fee_value;
  const margin = final_price > 0 ? profit / final_price : 0;

  return { cost_total, fee_value, final_price, tax_value, profit, margin, material_bruto_value };
}

function tableKey(table: string) {
  return STORAGE_KEYS[table as TableName];
}

function readTable(table: string): TableRecord[] {
  const key = tableKey(table);
  if (!key) return [];
  return getStorage<TableRecord[]>(key, []);
}

function field(row: TableRecord, column: string) {
  return (row as unknown as Record<string, unknown>)[column];
}

function writeTable(table: string, data: TableRecord[]) {
  const key = tableKey(table);
  if (key) setStorage(key, data);
}

function normalizeBudget(raw: Budget): Budget {
  const now = new Date().toISOString();
  const expires = raw.expires_at || raw.expiration_date || now;
  const status = raw.status !== 'Approved' && raw.status !== 'Rejected' && expires < now ? 'Expired' : raw.status;
  const items = (raw.items || []).map((item) => ({
    ...item,
    sale_price: item.sale_price ?? item.unit_price ?? 0,
    cost_price: item.cost_price ?? item.unit_price ?? 0,
    subtotal_sale: item.subtotal_sale ?? item.subtotal ?? (item.quantity || 0) * (item.unit_price || 0),
    subtotal_cost: item.subtotal_cost ?? item.subtotal ?? (item.quantity || 0) * (item.unit_price || 0),
    custom_pricing: item.custom_pricing ?? false,
  }));
  return {
    ...raw,
    client_whatsapp: raw.client_whatsapp || raw.client_phone || '',
    project_type: raw.project_type || (raw.type === 'Publi' ? 'Publicidade' : raw.type === 'Guerrilha' ? 'Cobertura' : 'Personalizado'),
    production: raw.production || { shooting_days: 1, city: 'São Paulo', need_transportation: false, need_lodging: false },
    deliverables: raw.deliverables || { videos: 1, photos: 0, reels: 0, pilulas: 0, sameday: false, aftermovie: false, videocase: false },
    updated_at: raw.updated_at || raw.created_at,
    expires_at: expires,
    expiration_date: expires,
    proposal_date: raw.proposal_date || raw.budget_date || raw.created_at,
    online_slug: raw.online_slug || raw.id,
    material_bruto_value: raw.material_bruto_value || 0,
    status,
    items,
  };
}

function seed() {
  if (getStorage<SystemSettings[]>(STORAGE_KEYS.system_settings, []).length === 0) {
    setStorage(STORAGE_KEYS.system_settings, [defaultSettings]);
  }
  if (getStorage<PriceListItem[]>(STORAGE_KEYS.price_list, []).length === 0) {
    const now = new Date().toISOString();
    setStorage(
      STORAGE_KEYS.price_list,
      priceSeed.map((item) => ({ ...item, id: generateId(), active: true, updated_at: now }))
    );
  }
  if (getStorage<Template[]>(STORAGE_KEYS.templates, []).length === 0) {
    setStorage(STORAGE_KEYS.templates, templateSeed);
  }
  if (getStorage<User[]>(STORAGE_KEYS.users, []).length === 0) {
    setStorage(STORAGE_KEYS.users, [{ id: 'user-1', email: 'jay@admin.com.br' }]);
  }
  if (getStorage<Budget[]>(STORAGE_KEYS.budgets, []).length === 0) {
    const prices = getStorage<PriceListItem[]>(STORAGE_KEYS.price_list, []);
    const names = ['Roteiro', 'Diretor', 'Diretor de Fotografia', 'Filmmaker', 'Fotógrafo', 'Câmera', 'Lentes', 'Iluminação', 'Edição', 'Color Grading', 'Sound Design', 'Material Bruto'];
    const budgetId = 'demo-premium-2025';
    const created = new Date();
    const expires = new Date(created);
    expires.setDate(expires.getDate() + defaultSettings.proposal_validity_days);
    const items: BudgetItem[] = names
      .map((name) => prices.find((price) => price.name === name))
      .filter(Boolean)
      .map((price) => {
        const p = price as PriceListItem;
        return {
          id: generateId(),
          budget_id: budgetId,
          price_list_id: p.id,
          category: p.category,
          name: p.name,
          quantity: 1,
          sale_price: p.sale_price,
          cost_price: p.cost_price,
          subtotal_sale: p.sale_price,
          subtotal_cost: p.cost_price,
          custom_pricing: false,
          unit_price: p.sale_price,
          subtotal: p.cost_price,
        };
      });
    const financials = calculateBudget(items, defaultSettings);
    const hydratedItems = items.map((item) => item.name === 'Material Bruto'
      ? { ...item, sale_price: financials.material_bruto_value, cost_price: financials.material_bruto_value, subtotal_sale: financials.material_bruto_value, subtotal_cost: financials.material_bruto_value, unit_price: financials.material_bruto_value, subtotal: financials.material_bruto_value }
      : item);
    setStorage<Budget[]>(STORAGE_KEYS.budgets, [{
      id: budgetId,
      client_id: 'client-demo-premium',
      client_name: 'Marina Rocha',
      client_company: 'Rocha Studio',
      client_whatsapp: '(11) 98888-2025',
      client_email: 'marina@rochastudio.com',
      project_name: 'Manifesto Rocha Studio',
      project_type: 'Institucional',
      project_description: 'Filme manifesto com linguagem cinematográfica, entrevistas e imagens de processo para lançamento de nova identidade.',
      production: { shooting_days: 2, city: 'São Paulo', need_transportation: true, need_lodging: false },
      deliverables: { videos: 1, photos: 24, reels: 3, pilulas: 2, sameday: false, aftermovie: false, videocase: true },
      status: 'Sent',
      created_at: created.toISOString(),
      updated_at: created.toISOString(),
      expires_at: expires.toISOString(),
      expiration_date: expires.toISOString(),
      proposal_date: created.toISOString(),
      online_slug: 'manifesto-rocha-studio-demo',
      ...financials,
      items: hydratedItems,
      type: 'Institucional',
      budget_date: created.toISOString(),
      client_phone: '(11) 98888-2025',
    }]);
  }
}

seed();

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      await new Promise((resolve) => setTimeout(resolve, 700));
      if (email === 'jay@admin.com.br' && password === 'JayAdmin01') {
        const user: User = { id: 'user-1', email };
        setStorage(STORAGE_KEYS.auth, { session: true, user });
        return { data: { user, session: { user } }, error: null };
      }
      return { data: { user: null, session: null }, error: { message: 'Credenciais inválidas' } };
    },
    signOut: async () => {
      localStorage.removeItem(STORAGE_KEYS.auth);
      return { error: null };
    },
    getSession: async () => {
      const auth = getStorage<{ session: boolean; user: User } | null>(STORAGE_KEYS.auth, null);
      return { data: { session: auth?.session ? { user: auth.user } : null }, error: null };
    },
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
  },

  from: (table: string) => ({
    select: () => ({
      eq: (column: string, value: string) => ({
        single: async () => {
          let rows = readTable(table);
          if (table === 'budgets') rows = (rows as Budget[]).map(normalizeBudget);
          const data = rows.find((row) => String(field(row, column)) === value) || null;
          return { data, error: null };
        },
        order: () => ({
          data: async () => {
            let rows = readTable(table).filter((row) => String(field(row, column)) === value);
            if (table === 'budgets') rows = (rows as Budget[]).map(normalizeBudget);
            return { data: rows, error: null };
          },
        }),
      }),
      order: (column: string, opts?: { ascending?: boolean }) => ({
        data: async () => {
          let rows = readTable(table);
          if (table === 'budgets') rows = (rows as Budget[]).map(normalizeBudget);
          rows = rows.sort((a, b) => {
            const av = String(field(a, column) || '');
            const bv = String(field(b, column) || '');
            return opts?.ascending ? av.localeCompare(bv) : bv.localeCompare(av);
          });
          if (table === 'budgets') writeTable(table, rows);
          return { data: rows, error: null };
        },
      }),
      data: async () => {
        let rows = readTable(table);
        if (table === 'budgets') rows = (rows as Budget[]).map(normalizeBudget);
        if (table === 'budgets') writeTable(table, rows);
        return { data: rows, error: null };
      },
    }),
    insert: async (data: unknown) => {
      const rows = readTable(table);
      const payload = Array.isArray(data) ? data : [data];
      rows.push(...(payload as TableRecord[]));
      writeTable(table, rows);
      return { data: payload, error: null };
    },
    update: (data: unknown) => ({
      eq: async (column: string, value: string) => {
        const rows = readTable(table).map((row) => {
          if (String(field(row, column)) === value) {
            return { ...row, ...(data as Record<string, unknown>), updated_at: new Date().toISOString() } as TableRecord;
          }
          return row;
        });
        writeTable(table, rows);
        return { data: rows, error: null };
      },
    }),
    delete: () => ({
      eq: async (column: string, value: string) => {
        const rows = readTable(table).filter((row) => String(field(row, column)) !== value);
        writeTable(table, rows);
        return { data: null, error: null };
      },
    }),
  }),
};