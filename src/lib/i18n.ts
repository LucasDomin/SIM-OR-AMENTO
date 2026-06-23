// i18n — toda a interface é PT-BR. Centraliza rótulos para evitar strings espalhadas.

export const t = {
  // Cabeçalhos / navegação
  appName: 'SIM Budget',
  appTagline: 'Still In Movement',
  dashboard: 'Painel',
  budgets: 'Orçamentos',
  newBudget: 'Novo Orçamento',
  templates: 'Modelos',
  priceList: 'Tabela de Preços',
  settings: 'Configurações',
  logout: 'Sair',

  // Login
  loginWelcome: 'Bem-vindo',
  loginSubtitle: 'Entre com suas credenciais para acessar o sistema',
  email: 'E-mail',
  password: 'Senha',
  enter: 'Entrar',
  invalidCredentials: 'Credenciais inválidas',

  // Dashboard
  totalBudgets: 'Total de Orçamentos',
  approved: 'Aprovados',
  totalRevenue: 'Receita Total',
  averageTicket: 'Ticket Médio',
  recentBudgets: 'Orçamentos Recentes',
  quickActions: 'Ações Rápidas',
  viewAll: 'Ver todos',
  noBudgetsYet: 'Nenhum orçamento criado ainda',
  createFirst: 'Criar primeiro orçamento',
  templatesAvailable: 'Modelos disponíveis',
  createBudget: 'Criar orçamento',
  searchBudgets: 'Buscar por projeto, cliente ou empresa...',
  noBudgetsFound: 'Nenhum orçamento encontrado',

  // Status
  status: {
    Draft: 'Rascunho',
    Sent: 'Enviado',
    Approved: 'Aprovado',
    Rejected: 'Rejeitado',
    Expired: 'Expirado',
  },

  // Etapas do orçamento
  steps: {
    client: 'Cliente',
    project: 'Projeto',
    production: 'Produção',
    services: 'Serviços',
    reels: 'Reels',
    equipment: 'Equipamentos',
    professionals: 'Profissionais',
    scope: 'Escopo',
    delivery: 'Entrega',
    financial: 'Resumo',
    proposal: 'Proposta',
  },

  // Campos — Cliente
  clientName: 'Nome do Cliente',
  company: 'Empresa',
  whatsapp: 'WhatsApp',
  emailField: 'E-mail',

  // Campos — Projeto
  projectName: 'Nome do Projeto',
  projectType: 'Tipo do Projeto',
  projectDescription: 'Descrição do Projeto',
  projectTypes: {
    Institucional: 'Institucional',
    Evento: 'Evento',
    Publicidade: 'Publicidade',
    Podcast: 'Podcast',
    Reels: 'Reels',
    Cobertura: 'Cobertura',
    Personalizado: 'Personalizado',
  },

  // Campos — Produção
  shootingDays: 'Dias de Filmagem',
  city: 'Cidade',
  needTransportation: 'Precisa de transporte?',
  needLodging: 'Precisa de hospedagem?',

  // Serviços
  services: 'Serviços',
  addItem: 'Adicionar item',
  removeItem: 'Remover item',
  itemName: 'Nome do item',
  quantity: 'Quantidade',
  unitPrice: 'Valor Unitário',
  cost: 'Custo',
  subtotal: 'Subtotal',
  category: 'Categoria',
  addService: 'Adicionar serviço',
  selectService: 'Selecionar serviço',
  customItem: 'Item personalizado',
  customPricing: 'Preço customizado',
  enabled: 'Ativado',
  disabled: 'Desativado',

  // Categorias
  categories: {
    'Pré Produção': 'Pré Produção',
    'Produção': 'Produção',
    'Fotografia': 'Fotografia',
    'Pós Produção': 'Pós Produção',
    'Reels': 'Reels',
    'Finalização': 'Finalização',
    'Logística': 'Logística',
    'Equipamentos': 'Equipamentos',
    'Profissionais': 'Profissionais',
    'Extras': 'Extras',
  },

  // Equipamentos
  equipment: 'Equipamentos',
  equipmentName: 'Nome do equipamento',
  dailyRate: 'Valor da diária',
  rentalDays: 'Quantidade de dias',
  pickupDate: 'Data de retirada',
  returnDate: 'Data de devolução',

  // Profissionais
  professionals: 'Profissionais',
  professionalName: 'Nome do profissional',
  days: 'Dias',

  // Escopo
  scope: 'Escopo',
  scopeDescription: 'Descrição detalhada do projeto',

  // Entrega
  delivery: 'Entrega',
  deliveryTime: 'Tempo de entrega (dias)',
  startDate: 'Data de início',

  // Financeiro
  financial: 'Resumo Financeiro',
  costTotal: 'Custo Total',
  fee: 'Taxa',
  tax: 'Imposto',
  profit: 'Lucro',
  margin: 'Margem',
  finalPrice: 'Investimento Final',
  finalPriceLabel: 'INVESTIMENTO TOTAL',
  totalCost: 'Custo Total',
  totalSale: 'Venda Total',
  spread: 'Spread',
  pricingPreview: 'Pré-visualização',
  instantCalculation: 'Cálculo instantâneo',
  materialBrutoNote:
    'Material Bruto, quando selecionado, é calculado automaticamente como 20% do preço final do projeto.',

  // Proposta
  proposal: 'Proposta',
  generate: 'Gerar',
  saveDraft: 'Salvar Rascunho',
  generateSent: 'Gerar Orçamento Enviado',
  onlineLink: 'Link da proposta online',
  pdfClient: 'PDF Cliente',
  pdfInternal: 'PDF Interno',
  docxClient: 'DOCX Cliente',
  copyLink: 'Copiar link',
  linkCopied: 'Link copiado para a área de transferência',

  // Detalhe
  back: 'Voltar',
  duplicate: 'Duplicar',
  approve: 'Aprovar',
  reject: 'Rejeitar',
  send: 'Enviar',
  internal: 'Interno',
  internalItems: 'Itens Internos',
  budgetId: 'ID do Orçamento',
  expiresOn: 'Expira em',
  proposalDate: 'Data da Proposta',
  paymentTerms: 'Condições de Pagamento',

  // Validação
  required: 'Campo obrigatório',
  minOneItem: 'Adicione ao menos um item',

  // Botões de fluxo
  backBtn: 'Voltar',
  continue: 'Continuar',
  finish: 'Finalizar',
  cancel: 'Cancelar',
  confirm: 'Confirmar',
  delete: 'Excluir',
  save: 'Salvar',
  close: 'Fechar',
  edit: 'Editar',
  add: 'Adicionar',
  remove: 'Remover',
  yes: 'Sim',
  no: 'Não',

  // Tabela de Preços
  priceListHeader: 'Tabela de Preços',
  priceListSubtitle: 'Lista editável de serviços com preço de venda e custo interno',
  searchService: 'Buscar serviço',
  spreadLabel: 'Spread',
  feePercentage: 'Taxa (%)',
  taxPercentage: 'Imposto (%)',
  proposalValidity: 'Validade (dias)',
  saveSettings: 'Salvar configurações',
  settingsSaved: 'Configurações salvas com sucesso',
  addCustomItem: '+ Adicionar item',
  confirmDelete: 'Tem certeza que deseja excluir este orçamento?',
  notFound: 'Orçamento não encontrado',

  // Modelos
  templatesTitle: 'Modelos',
  templatesSubtitle: 'Modelos pré-configurados para acelerar a criação de orçamentos',
  useTemplate: 'Usar',
  items: 'itens',

  // Proposta Online
  aboutSim: 'Sobre a SIM',
  aboutSimText:
    'A SIM é um estúdio audiovisual que combina linguagem cinematográfica, precisão comercial e execução premium para marcas, campanhas e experiências ao vivo.',
  investment: 'Investimento',
  paymentTermsText: 'Pagamento: 50% na aprovação e 50% na entrega final.',
  validityText: 'Este orçamento é válido por 30 dias após a emissão.',
  proposalCommercial: 'PROPOSTA COMERCIAL',
  internalDocument: 'ORÇAMENTO INTERNO',
  generalInfo: 'Informações Gerais',
  totalInvestment: 'Investimento Total',
  productionInfo: 'Dados de Produção',
  schedule: 'Cronograma',
  scopeLabel: 'Escopo',
  deliverablesLabel: 'Entregáveis',
  reelCount: 'Reels',
  videoCount: 'Vídeos',
  proposalNotFound: 'Proposta não encontrada',
} as const;

export type Translation = typeof t;
