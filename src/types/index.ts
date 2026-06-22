export interface User {
  id: string;
  email: string;
}

export interface Client {
  id: string;
  name: string;
  company: string;
  whatsapp: string;
  email: string;
  created_at?: string;
}

export type ProjectType =
  | 'Institucional'
  | 'Evento'
  | 'Publicidade'
  | 'Podcast'
  | 'Reels'
  | 'Cobertura'
  | 'Personalizado';

export type BudgetType = ProjectType | 'Guerrilha' | 'Publi';
export type BudgetStatus = 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Expired';

export type ServiceCategory =
  | 'Pré Produção'
  | 'Produção'
  | 'Fotografia'
  | 'Pós Produção'
  | 'Finalização'
  | 'Logística'
  | 'Equipamentos'
  | 'Extras'
  | string;

export interface SystemSettings {
  id: string;
  fee_percentage: number;
  tax_percentage: number;
  proposal_validity_days: number;
  updated_at: string;
}

export interface PriceListItem {
  id: string;
  category: ServiceCategory;
  name: string;
  sale_price: number;
  cost_price: number;
  active: boolean;
  updated_at: string;
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  price_list_id?: string;
  category: ServiceCategory;
  name: string;
  quantity: number;
  sale_price: number;
  cost_price: number;
  subtotal_sale: number;
  subtotal_cost: number;
  custom_pricing: boolean;
  unit_price?: number;
  subtotal?: number;
}

export interface ProductionSetup {
  shooting_days: number;
  city: string;
  need_transportation: boolean;
  need_lodging: boolean;
}

export interface Deliverables {
  videos: number;
  photos: number;
  reels: number;
  pilulas: number;
  sameday: boolean;
  aftermovie: boolean;
  videocase: boolean;
}

export interface Budget {
  id: string;
  client_id: string;
  client_name: string;
  client_company: string;
  client_whatsapp: string;
  client_email: string;
  project_name: string;
  project_type: ProjectType;
  project_description: string;
  production: ProductionSetup;
  deliverables: Deliverables;
  status: BudgetStatus;
  created_at: string;
  updated_at: string;
  expires_at: string;
  proposal_date: string;
  online_slug: string;
  cost_total: number;
  fee_value: number;
  tax_value: number;
  final_price: number;
  profit: number;
  margin: number;
  material_bruto_value: number;
  items: BudgetItem[];
  client_phone?: string;
  budget_date?: string;
  type?: BudgetType;
  expiration_date?: string;
}

export interface Template {
  id: string;
  name: ProjectType;
  description: string;
  project_type: ProjectType;
  production: ProductionSetup;
  deliverables: Deliverables;
  price_item_names: string[];
  created_at: string;
  items?: Omit<BudgetItem, 'id' | 'budget_id'>[];
  type?: BudgetType;
}

export interface DashboardStats {
  total_budgets: number;
  approved_budgets: number;
  total_revenue: number;
  average_ticket: number;
}