import type {
  Budget,
  BudgetItem,
  Client,
  EquipmentItem,
  PriceListItem,
  ProfessionalItem,
  ReelItem,
  SystemSettings,
  Template,
  User,
} from '../types';
import { calcItemPricing, calcSubtotal, getCostBase } from './calc';

type TableName = 'users' | 'clients' | 'budgets' | 'budget_items' | 'price_list' | 'templates' | 'system_settings';
type TableRecord = Budget | Client | BudgetItem | ReelItem | EquipmentItem | ProfessionalItem | PriceListItem | Template | SystemSettings | User;

const STORAGE_KEYS: Record<TableName | 'auth', string> = {
  users: 'sim_users',
  clients: 'sim_clients',
  budgets: 'sim_budgets_v2',
  budget_items: 'sim_budget_items_v2',
  price_list: 'sim_price_list_2025_v4',
  templates: 'sim_templates_v2',
  system_settings: 'sim_system_settings',
  auth: 'sim_auth',
};

export function getStoredAuthUser(): User | null {
  const auth = getStorage<{ session: boolean; user: User } | null>(STORAGE_KEYS.auth, null);
  return auth?.session ? auth.user : null;
}

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

function makePrice(
  category: PriceListItem['category'],
  name: string,
  cost_base: number,
  fee_percent = defaultSettings.fee_percentage,
  tax_percent = defaultSettings.tax_percentage,
): Omit<PriceListItem, 'id' | 'active' | 'updated_at'> {
  const pricing = calcItemPricing(cost_base, fee_percent, tax_percent);
  return {
    category,
    name,
    cost_base,
    fee_percent,
    tax_percent,
    sale_price: pricing.sale_price,
    cost_price: cost_base,
  };
}

const priceSeed: Omit<PriceListItem, 'id' | 'active' | 'updated_at'>[] = [
  makePrice('Pré Produção', 'Roteiro', 1600),
  makePrice('Pré Produção', 'Storyboard', 1200),
  makePrice('Pré Produção', 'Produtor', 1500),
  makePrice('Pré Produção', 'Produtor Executivo', 2800),

  makePrice('Produção', 'Diretor', 2000),
  makePrice('Produção', 'Filmmaker', 900),
  makePrice('Produção', 'Diretor de Fotografia', 2200),
  makePrice('Produção', 'Assistente de Câmera', 750),
  makePrice('Produção', 'Assistente de Direção', 900),
  makePrice('Produção', 'Logger', 600),
  makePrice('Produção', 'Gaffer', 1400),
  makePrice('Produção', 'Operador de Áudio', 1100),
  makePrice('Produção', 'Drone / FPV', 1800),

  makePrice('Fotografia', 'Fotógrafo', 1500),
  makePrice('Fotografia', 'Assistente de Fotografia', 650),

  makePrice('Pós Produção', 'Edição de Vídeo', 2000),
  makePrice('Pós Produção', 'Edição Sameday', 2600),
  makePrice('Pós Produção', 'Motion', 1800),
  makePrice('Pós Produção', 'VFX', 3000),

  makePrice('Reels', 'Edição de Reel', 90),
  makePrice('Reels', 'Motion Design Reel', 160),
  makePrice('Reels', 'Color Grading Reel', 110),

  makePrice('Finalização', 'Color Grading', 1500),
  makePrice('Finalização', 'Sound Design', 1200),
  makePrice('Finalização', 'Trilha', 1700),
  makePrice('Finalização', 'Locução', 800),

  makePrice('Logística', 'Alimentação', 500),
  makePrice('Logística', 'Catering', 1300),
  makePrice('Logística', 'Transporte Van', 700),
  makePrice('Logística', 'Transporte Uber', 300),
  makePrice('Logística', 'Hospedagem', 650),

  makePrice('Equipamentos', 'Câmera', 700),
  makePrice('Equipamentos', 'Lentes', 350),
  makePrice('Equipamentos', 'Iluminação', 500),
  makePrice('Equipamentos', 'Drone', 800),
  makePrice('Equipamentos', 'Estabilizador / Gimbal', 280),
  makePrice('Equipamentos', 'Áudio / Microfones', 250),
  makePrice('Equipamentos', 'Tripé / Suportes', 100),
  makePrice('Equipamentos', 'Cartões / Storage', 150),

  makePrice('Equipe', 'Diretor', 1500),
  makePrice('Equipe', 'Diretor de Fotografia', 1200),
  makePrice('Equipe', 'Filmmaker', 900),
  makePrice('Equipe', 'Operador de Câmera', 600),
  makePrice('Equipe', 'Assistente de Câmera', 350),
  makePrice('Equipe', 'Fotógrafo', 900),
  makePrice('Equipe', 'Produtor', 700),
  makePrice('Equipe', 'Operador de Áudio', 500),
  makePrice('Equipe', 'Gaffer / Elétrica', 550),
  makePrice('Equipe', 'Piloto de Drone', 700),

  makePrice('Extras', 'Verba Extra', 2500, 0, 0),
  makePrice('Extras', 'Material Bruto', 0, 0, 0),
];

const templateSeed: Template[] = [
  {
    id: 'template-institucional',
    name: 'Institucional',
    description: 'Narrativa de marca com entrevistas, cenas de atmosfera e acabamento premium.',
    project_type: 'Institucional',
    production: { shooting_days: 2, city: 'Belo Horizonte', need_transportation: true, need_lodging: false, delivery_days: 20 },
    service_names: ['Roteiro', 'Diretor', 'Filmmaker', 'Diretor de Fotografia', 'Edição de Vídeo', 'Color Grading', 'Sound Design'],
    reel_names: ['Edição de Reel'],
    equipment_names: ['Câmera', 'Lentes', 'Iluminação'],
    professional_names: ['Diretor', 'Filmmaker', 'Diretor de Fotografia'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-evento',
    name: 'Evento',
    description: 'Cobertura de evento com captação multicâmera, fotografia e entrega social.',
    project_type: 'Evento',
    production: { shooting_days: 1, city: 'Belo Horizonte', need_transportation: true, need_lodging: false, delivery_days: 5 },
    service_names: ['Edição Sameday', 'Edição de Vídeo', 'Transporte Van', 'Alimentação'],
    reel_names: ['Edição de Reel', 'Edição de Reel'],
    equipment_names: ['Câmera', 'Iluminação'],
    professional_names: ['Filmmaker', 'Fotógrafo'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-publicidade',
    name: 'Publicidade',
    description: 'Campanha com direção criativa, produção robusta e pós-produção completa.',
    project_type: 'Publicidade',
    production: { shooting_days: 2, city: 'Belo Horizonte', need_transportation: true, need_lodging: false, delivery_days: 25 },
    service_names: ['Roteiro', 'Storyboard', 'Produtor Executivo', 'Produtor', 'Diretor', 'Diretor de Fotografia', 'Assistente de Câmera', 'Gaffer', 'Edição de Vídeo', 'Motion', 'Color Grading', 'Sound Design'],
    reel_names: ['Edição de Reel', 'Motion Design Reel'],
    equipment_names: ['Câmera', 'Lentes', 'Iluminação'],
    professional_names: ['Diretor', 'Diretor de Fotografia', 'Filmmaker'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-podcast',
    name: 'Podcast',
    description: 'Captação multicâmera com áudio dedicado e edição para episódio completo e cortes.',
    project_type: 'Podcast',
    production: { shooting_days: 1, city: 'Belo Horizonte', need_transportation: true, need_lodging: false, delivery_days: 7 },
    service_names: ['Edição de Vídeo', 'Sound Design'],
    reel_names: ['Edição de Reel'],
    equipment_names: ['Câmera', 'Iluminação'],
    professional_names: ['Filmmaker', 'Operador de Áudio'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-reels',
    name: 'Reels',
    description: 'Produção vertical enxuta com ritmo editorial e entrega rápida.',
    project_type: 'Reels',
    production: { shooting_days: 1, city: 'Belo Horizonte', need_transportation: false, need_lodging: false, delivery_days: 3 },
    service_names: ['Edição de Vídeo', 'Motion', 'Transporte Uber'],
    reel_names: ['Edição de Reel', 'Edição de Reel', 'Edição de Reel', 'Edição de Reel'],
    equipment_names: ['Câmera'],
    professional_names: ['Filmmaker', 'Fotógrafo'],
    created_at: new Date().toISOString(),
  },
  {
    id: 'template-cobertura',
    name: 'Cobertura',
    description: 'Cobertura documental com fotografia, vídeo e pacote de redes sociais.',
    project_type: 'Cobertura',
    production: { shooting_days: 1, city: 'Belo Horizonte', need_transportation: true, need_lodging: false, delivery_days: 7 },
    service_names: ['Edição de Vídeo', 'Color Grading', 'Transporte Van', 'Alimentação'],
    reel_names: ['Edição de Reel'],
    equipment_names: ['Câmera'],
    professional_names: ['Filmmaker', 'Fotógrafo'],
    created_at: new Date().toISOString(),
  },
];

export function getSettings(): SystemSettings {
  return getStorage<SystemSettings[]>(STORAGE_KEYS.system_settings, [defaultSettings])[0] || defaultSettings;
}

export function getPriceList(): PriceListItem[] {
  return getStorage<PriceListItem[]>(STORAGE_KEYS.price_list, []);
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

function normalizePrice(item: PriceListItem): PriceListItem {
  const cost_base = item.cost_base ?? getCostBase(item);
  const fee_percent = item.fee_percent ?? defaultSettings.fee_percentage;
  const tax_percent = item.tax_percent ?? defaultSettings.tax_percentage;
  const pricing = calcItemPricing(cost_base, fee_percent, tax_percent);
  return {
    ...item,
    cost_base,
    cost_price: cost_base,
    fee_percent,
    tax_percent,
    sale_price: item.sale_price ?? pricing.sale_price,
  };
}

function normalizeBudget(raw: Budget): Budget {
  const now = new Date().toISOString();
  const expires = raw.expires_at || raw.expiration_date || now;
  const status = raw.status !== 'Approved' && raw.status !== 'Rejected' && expires < now ? 'Expired' : raw.status;
  return {
    ...raw,
    services: (raw.services || []).map((item) => ({
      ...item,
      cost_base: item.cost_base ?? getCostBase(item),
      cost_price: item.cost_base ?? getCostBase(item),
      fee_percent: item.fee_percent ?? defaultSettings.fee_percentage,
      tax_percent: item.tax_percent ?? defaultSettings.tax_percentage,
      subtotal: item.subtotal ?? calcSubtotal(item),
    })),
    reels: (raw.reels || []).map((item) => ({
      ...item,
      cost_base: item.cost_base ?? getCostBase(item),
      cost_price: item.cost_base ?? getCostBase(item),
      fee_percent: item.fee_percent ?? defaultSettings.fee_percentage,
      tax_percent: item.tax_percent ?? defaultSettings.tax_percentage,
      subtotal: item.subtotal ?? calcSubtotal(item),
    })),
    equipment: (raw.equipment || []).map((item) => ({
      ...item,
      cost_base: item.cost_base ?? getCostBase(item),
      cost_price: item.cost_base ?? getCostBase(item),
      fee_percent: item.fee_percent ?? defaultSettings.fee_percentage,
      tax_percent: item.tax_percent ?? defaultSettings.tax_percentage,
      subtotal: item.subtotal ?? (item.daily_rate || 0) * (item.days || 0),
    })),
    professionals: (raw.professionals || []).map((item) => ({
      ...item,
      cost_base: item.cost_base ?? getCostBase(item),
      cost_price: item.cost_base ?? getCostBase(item),
      fee_percent: item.fee_percent ?? defaultSettings.fee_percentage,
      tax_percent: item.tax_percent ?? defaultSettings.tax_percentage,
      subtotal: item.subtotal ?? (item.daily_rate || 0) * (item.days || 0),
    })),
    production: { ...raw.production, delivery_days: raw.production?.delivery_days ?? 15 },
    updated_at: raw.updated_at || raw.created_at,
    expires_at: expires,
    expiration_date: expires,
    proposal_date: raw.proposal_date || raw.budget_date || raw.created_at,
    online_slug: raw.online_slug || raw.id,
    material_bruto_value: raw.material_bruto_value || 0,
    status,
    items: raw.items || raw.services || [],
    deliverables: raw.deliverables || { videos: 0, photos: 0, reels: 0, pilulas: 0, sameday: false, aftermovie: false, videocase: false },
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
      priceSeed.map((item) => ({ ...item, id: generateId(), active: true, updated_at: now })),
    );
  }
  if (getStorage<Template[]>(STORAGE_KEYS.templates, []).length === 0) {
    setStorage(STORAGE_KEYS.templates, templateSeed);
  }
  if (getStorage<User[]>(STORAGE_KEYS.users, []).length === 0) {
    setStorage(STORAGE_KEYS.users, [{ id: 'user-1', email: 'jay@admin.com.br' }]);
  }
  if (getStorage<Budget[]>(STORAGE_KEYS.budgets, []).length === 0) {
    const prices = getStorage<PriceListItem[]>(STORAGE_KEYS.price_list, []).map(normalizePrice);
    const find = (name: string) => prices.find((p) => p.name === name);
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + defaultSettings.proposal_validity_days);

    const servicesRaw = ['Roteiro', 'Diretor', 'Filmmaker', 'Diretor de Fotografia', 'Edição de Vídeo', 'Color Grading', 'Sound Design'];
    const services: BudgetItem[] = servicesRaw
      .map((name) => find(name))
      .filter(Boolean)
      .map((p) => ({
        id: generateId(),
        budget_id: 'demo-premium-2025',
        price_list_id: p!.id,
        category: p!.category,
        name: p!.name,
        quantity: 1,
        unit_price: p!.sale_price,
        cost_base: p!.cost_base,
        cost_price: p!.cost_base,
        fee_percent: p!.fee_percent,
        tax_percent: p!.tax_percent,
        subtotal: p!.sale_price,
        custom_pricing: false,
      }));

    const reelPrice = find('Edição de Reel');
    const reels: ReelItem[] = reelPrice ? [{
      id: generateId(),
      name: reelPrice.name,
      quantity: 3,
      unit_price: reelPrice.sale_price,
      cost_base: reelPrice.cost_base,
      cost_price: reelPrice.cost_base,
      fee_percent: reelPrice.fee_percent,
      tax_percent: reelPrice.tax_percent,
      subtotal: 3 * reelPrice.sale_price,
    }] : [];

    const eqNames = ['Câmera', 'Lentes', 'Iluminação'];
    const equipment: EquipmentItem[] = eqNames.map((name) => find(name)).filter(Boolean).map((p) => ({
      id: generateId(),
      name: p!.name,
      daily_rate: p!.sale_price,
      days: 2,
      pickup_date: undefined,
      return_date: undefined,
      cost_base: p!.cost_base,
      cost_price: p!.cost_base,
      fee_percent: p!.fee_percent,
      tax_percent: p!.tax_percent,
      subtotal: 2 * p!.sale_price,
    }));

    const profNames = ['Diretor', 'Filmmaker', 'Diretor de Fotografia'];
    const professionals: ProfessionalItem[] = profNames.map((name) => find(name)).filter(Boolean).map((p) => ({
      id: generateId(),
      name: p!.name,
      daily_rate: p!.sale_price,
      days: 2,
      cost_base: p!.cost_base,
      cost_price: p!.cost_base,
      fee_percent: p!.fee_percent,
      tax_percent: p!.tax_percent,
      subtotal: 2 * p!.sale_price,
    }));

    const demo: Budget = {
      id: 'demo-premium-2025',
      client_id: 'client-demo-premium',
      client_name: 'Marina Rocha',
      client_company: 'Rocha Studio',
      client_whatsapp: '(11) 98888-2025',
      client_email: 'marina@rochastudio.com',
      project_name: 'Manifesto Rocha Studio',
      project_type: 'Institucional',
      project_description: 'Filme manifesto com linguagem cinematográfica, entrevistas e imagens de processo para lançamento de nova identidade.',
      production: {
        shooting_days: 2,
        city: 'Belo Horizonte',
        need_transportation: true,
        need_lodging: false,
        delivery_days: 20,
        start_date: undefined,
      },
      services,
      reels,
      equipment,
      professionals,
      status: 'Sent',
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      expires_at: expires.toISOString(),
      expiration_date: expires.toISOString(),
      proposal_date: now.toISOString(),
      online_slug: 'manifesto-rocha-studio-demo',
      cost_total: 0,
      fee_value: 0,
      tax_value: 0,
      final_price: 0,
      profit: 0,
      margin: 0,
      material_bruto_value: 0,
      type: 'Institucional',
      budget_date: now.toISOString(),
      client_phone: '(11) 98888-2025',
    };

    setStorage(STORAGE_KEYS.budgets, [demo]);
  }
}

seed();

export const supabase = {
  auth: {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
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
          if (table === 'price_list') rows = (rows as PriceListItem[]).map(normalizePrice);
          const data = rows.find((row) => String(field(row, column)) === value) || null;
          return { data, error: null };
        },
        order: () => ({
          data: async () => {
            let rows = readTable(table).filter((row) => String(field(row, column)) === value);
            if (table === 'budgets') rows = (rows as Budget[]).map(normalizeBudget);
            if (table === 'price_list') rows = (rows as PriceListItem[]).map(normalizePrice);
            return { data: rows, error: null };
          },
        }),
      }),
      order: (column: string, opts?: { ascending?: boolean }) => ({
        data: async () => {
          let rows = readTable(table);
          if (table === 'budgets') rows = (rows as Budget[]).map(normalizeBudget);
          if (table === 'price_list') rows = (rows as PriceListItem[]).map(normalizePrice);
          rows = rows.sort((a, b) => {
            const av = String(field(a, column) || '');
            const bv = String(field(b, column) || '');
            return opts?.ascending ? av.localeCompare(bv) : bv.localeCompare(av);
          });
          if (table === 'budgets' || table === 'price_list') writeTable(table, rows);
          return { data: rows, error: null };
        },
      }),
      data: async () => {
        let rows = readTable(table);
        if (table === 'budgets') rows = (rows as Budget[]).map(normalizeBudget);
        if (table === 'price_list') rows = (rows as PriceListItem[]).map(normalizePrice);
        if (table === 'budgets' || table === 'price_list') writeTable(table, rows);
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
