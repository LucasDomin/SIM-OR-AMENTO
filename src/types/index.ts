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
  | 'Reels'
  | 'Finalização'
  | 'Logística'
  | 'Equipamentos'
  | 'Profissionais'
  | 'Extras'
  | string;

export interface SystemSettings {
  id: string;
  fee_percentage: number;
  tax_percentage: number;
  proposal_validity_days: number;
  updated_at: string;
}

// Item genérico usado no PriceList e nos itens do orçamento.
// O cálculo principal é unit_price * quantity.
// cost_price é mantido apenas para controle interno.
export interface PriceListItem {
  id: string;
  category: ServiceCategory;
  name: string;
  sale_price: number; // valor unitário
  cost_price: number; // custo unitário
  active: boolean;
  updated_at: string;
}

// Item de serviço dentro do orçamento (serviço da tabela)
export interface BudgetItem {
  id: string;
  budget_id: string;
  price_list_id?: string;
  category: ServiceCategory;
  name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  subtotal: number;
  custom_pricing: boolean;
}

// Reels como categoria independente (cada reel é um item com valor próprio)
export interface ReelItem {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  subtotal: number;
}

// Equipamento (com diárias e datas de locação)
export interface EquipmentItem {
  id: string;
  name: string;
  daily_rate: number;
  days: number;
  pickup_date?: string;
  return_date?: string;
  cost_price: number;
  subtotal: number;
}

// Profissional (com diárias)
export interface ProfessionalItem {
  id: string;
  name: string;
  daily_rate: number;
  days: number;
  cost_price: number;
  subtotal: number;
}

export interface ProductionSetup {
  shooting_days: number;
  city: string;
  need_transportation: boolean;
  need_lodging: boolean;
  start_date?: string;
  delivery_days: number; // tempo de entrega a partir da data de início
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
  services: BudgetItem[];
  reels: ReelItem[];
  equipment: EquipmentItem[];
  professionals: ProfessionalItem[];
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
  // campos legados (não usados pela nova lógica, mas mantidos para compatibilidade)
  items?: BudgetItem[];
  deliverables?: {
    videos: number;
    photos: number;
    reels: number;
    pilulas: number;
    sameday: boolean;
    aftermovie: boolean;
    videocase: boolean;
  };
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
  service_names: string[];
  reel_names: string[];
  equipment_names: string[];
  professional_names: string[];
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
