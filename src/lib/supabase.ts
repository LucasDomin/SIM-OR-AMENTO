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
import { calcItemSalePrice, calcSubtotal } from './calc';

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

// Define-se apenas o custo base — fee, imposto e sale_price são calculados.
const priceSeedRaw: Array<{ category: string; name: string; cost_price: number }> = [
  { category: 'Pré Produção', name: 'Roteiro', cost_price: 1600 },
  { category: 'Pré Produção', name: 'Storyboard', cost_price: 1200 },
  { category: 'Pré Produção', name: 'Produtor', cost_price: 1500 },
  { category: 'Pré Produção', name: 'Produtor Executivo', cost_price: 2800 },
  { category: 'Produção', name: 'Diretor', cost_price: 2000 },
  { category: 'Produção', name: 'Filmmaker', cost_price: 900 },
  { category: 'Produção', name: 'Diretor de Fotografia', cost_price: 2200 },
  { category: 'Produção', name: 'Assistente de Câmera', cost_price: 750 },
  { category: 'Produção', name: 'Assistente de Direção', cost_price: 900 },
  { category: 'Produção', name: 'Logger', cost_price: 600 },
  { category: 'Produção', name: 'Gaffer', cost_price: 1400 },
  { category: 'Produção', name: 'Operador de Áudio', cost_price: 1100 },
  { category: 'Produção', name: 'Drone / FPV', cost_price: 1800 },
  { category: 'Fotografia', name: 'Fotógrafo', cost_price: 1500 },
  { category: 'Fotografia', name: 'Assistente de Fotografia', cost_price: 650 },
  { category: 'Pós Produção', name: 'Edição de Vídeo', cost_price: 2000 },
  { category: 'Pós Produção', name: 'Edição Sameday', cost_price: 2600 },
  { category: 'Pós Produção', name: 'Motion', cost_price: 1800 },
  { category: 'Pós Produção', name: 'VFX', cost_price: 3000 },
  { category: 'Reels', name: 'Edição de Reel', cost_price: 90 },
  { category: 'Reels', name: 'Motion Design Reel', cost_price: 160 },
  { category: 'Reels', name: 'Color Grading Reel', cost_price: 110 },
  { category: 'Finalização', name: 'Color Grading', cost_price: 1500 },
  { category: 'Finalização', name: 'Sound Design', cost_price: 1200 },
  { category: 'Finalização', name: 'Trilha', cost_price: 1700 },
  { category: 'Finalização', name: 'Locução', cost_price: 800 },
  { category: 'Logística', name: 'Alimentação', cost_price: 500 },
  { category: 'Logística', name: 'Catering', cost_price: 1300 },
  { category: 'Logística', name: 'Transporte Van', cost_price: 700 },
  { category: 'Logística', name: 'Transporte Uber', cost_price: 300 },
  { category: 'Logística', name: 'Hospedagem', cost_price: 650 },
  { category: 'Equipamentos', name: 'Câmera', cost_price: 700 },
  { category: 'Equipamentos', name: 'Lentes', cost_price: 350 },
  { category: 'Equipamentos', name: 'Iluminação', cost_price: 500 },
  { category: 'Equipamentos', name: 'Drone', cost_price: 800 },
  { category: 'Equipamentos', name: 'Estabilizador / Gimbal', cost_price: 280 },
  { category: 'Equipamentos', name: 'Áudio / Microfones', cost_price: 250 },
  { category: 'Equipamentos', name: 'Tripé / Suportes', cost_price: 100 },
  { category: 'Equipamentos', name: 'Cartões / Storage', cost_price: 150 },
  { category: 'Equipe', name: 'Diretor', cost_price: 1500 },
  { category: 'Equipe', name: 'Diretor de Fotografia', cost_price: 1200 },
  { category: 'Equipe', name: 'Filmmaker', cost_price: 900 },
  { category: 'Equipe', name: 'Operador de Câmera', cost_price: 600 },
  { category: 'Equipe', name: 'Assistente de Câmera', cost_price: 350 },
  { category: 'Equipe', name: 'Fotógrafo', cost_price: 900 },
  { category: 'Equipe', name: 'Produtor', cost_price: 700 },
  { category: 'Equipe', name: 'Operador de Áudio', cost_price: 500 },
  { category: 'Equipe', name: 'Gaffer / Elétrica', cost_price: 550 },
  { category: 'Equipe', name: 'Piloto de Drone', cost_price: 700 },
  { category: 'Extras', name: 'Verba Extra', cost_price: 2500 },
  { category: 'Extras', name: 'Material Bruto', cost_price: 0 },
];

const templateSeed: Template[] = [
  {
    id: 'template-institucional',
    name: 'Institucional',
    description: 'Narrativa de marca com entrevistas, cenas de atmosfera e acabamento premium.',
    project_type: 'Institucional',
    production: { shooting_days: 2, city: 'Belo Horizonte', need_transportation: true, need_lodging: false, delivery_days: 20 },
    service_names: ['Roteiro', 'Diretor', 'Filmmaker', 'Diretor de Fotografia', 'Câmera', 'Lentes', 'Iluminação', 'Edição de Vídeo', 'Color Grading', 'Sound Design'],
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
    service_names: ['Roteiro', 'Storyboard', 'Produtor Executivo', 'Produtor', 'Diretor', 'Diretor de Fotografia', 'Assistente de Câmera', 'Gaffer', 'Câmera', 'Lentes', 'Iluminação', 'Edição de Vídeo', 'Motion', 'Color Grading', 'Sound Design'],
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
    reel_names: ['Edição de Reel', 'Edição de Reel', 'Edição de Reel', 'Edição de Reel', 'Edição de Reel', 'Edição de Reel'],
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

function normalizeBudget(raw: Budget): Budget {
  const now = new Date().toISOString();
  const expires = raw.expires_at || raw.expiration_date || now;
  const status = raw.status !== 'Approved' && raw.status !== 'Rejected' && expires < now ? 'Expired' : raw.status;
  return {
    ...raw,
    services: (raw.services || []).map((item) => ({
      ...item,
      subtotal: item.subtotal ?? calcSubtotal(item),
    })),
    reels: (raw.reels || []).map((item) => ({
      ...item,
      subtotal: item.subtotal ?? calcSubtotal(item),
    })),
    equipment: (raw.equipment || []).map((item) => ({
      ...item,
      subtotal: item.subtotal ?? (item.daily_rate || 0) * (item.days || 0),
    })),
    professionals: (raw.professionals || []).map((item) => ({
      ...item,
      subtotal: item.subtotal ?? (item.daily_rate || 0) * (item.days || 0),
    })),
    production: {
      ...raw.production,
      delivery_days: raw.production?.delivery_days ?? 15,
    },
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
    const fee = defaultSettings.fee_percentage;
    const tax = defaultSettings.tax_percentage;
    setStorage(
      STORAGE_KEYS.price_list,
      priceSeedRaw.map((item) => ({
        ...item,
        id: generateId(),
        fee_percent: fee,
        tax_percent: tax,
        sale_price: calcItemSalePrice(item.cost_price, fee, tax),
        active: true,
        updated_at: now,
      })),
    );
  }
  if (getStorage<Template[]>(STORAGE_KEYS.templates, []).length === 0) {
    setStorage(STORAGE_KEYS.templates, templateSeed);
  }
  if (getStorage<User[]>(STORAGE_KEYS.users, []).length === 0) {
    setStorage(STORAGE_KEYS.users, [{ id: 'user-1', email: 'jay@admin.com.br' }]);
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
