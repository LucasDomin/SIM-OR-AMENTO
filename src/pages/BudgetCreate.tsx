import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  Copy,
  Link2,
  Minus,
  Plus,
  Save,
  SlidersHorizontal,
  Sparkles,
  X,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { generateId, getSettings, supabase } from '../lib/supabase';
import {
  calcFinancials,
  formatPercent,
  type PricedItem,
} from '../lib/calc';
import { formatCurrency } from '../lib/supabase';
import { t } from '../lib/i18n';
import type {
  Budget,
  BudgetItem,
  EquipmentItem,
  PriceListItem,
  ProfessionalItem,
  ProjectType,
  ReelItem,
  Template,
} from '../types';

const STEPS = [
  t.steps.client,
  t.steps.project,
  t.steps.production,
  t.steps.services,
  t.steps.reels,
  t.steps.equipment,
  t.steps.professionals,
  t.steps.financial,
  t.steps.proposal,
];

const PROJECT_TYPES: ProjectType[] = [
  'Institucional',
  'Evento',
  'Publicidade',
  'Podcast',
  'Reels',
  'Cobertura',
  'Personalizado',
];

// Categorias que aparecem como "clicar e selecionar" (não Reels, Equipamentos, Profissionais)
const SELECTABLE_CATEGORIES = [
  'Pré Produção',
  'Produção',
  'Fotografia',
  'Pós Produção',
  'Finalização',
  'Logística',
  'Extras',
];

// Itens que têm variante (Reels vs Wide)
const VARIANT_ITEMS: Record<string, string[]> = {
  'Edição de Vídeo': ['Reels', 'Wide'],
};

export function BudgetCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useMemo(() => getSettings(), []);
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);

  // Estado do orçamento
  const [client, setClient] = useState({ name: '', company: '', whatsapp: '', email: '' });
  const [project, setProject] = useState({ name: '', type: 'Personalizado' as ProjectType, description: '' });
  const [production, setProduction] = useState<{
    shooting_days: number;
    city: string;
    need_transportation: boolean;
    need_lodging: boolean;
    start_date: string;
    delivery_days: number;
  }>({
    shooting_days: 1,
    city: 'Belo Horizonte',
    need_transportation: false,
    need_lodging: false,
    start_date: '',
    delivery_days: 15,
  });

  // Itens selecionados (clicar e selecionar)
  const [selectedServices, setSelectedServices] = useState<Record<string, number>>({});
  const [selectedReels, setSelectedReels] = useState<Record<string, number>>({});
  const [selectedEquipment, setSelectedEquipment] = useState<Record<string, number>>({});
  const [selectedProfessionals, setSelectedProfessionals] = useState<Record<string, number>>({});

  // Modal de variante
  const [variantModal, setVariantModal] = useState<{ price: PriceListItem } | null>(null);

  useEffect(() => {
    async function load() {
      const [prices, tpls] = await Promise.all([
        supabase.from('price_list').select().data(),
        supabase.from('templates').select().data(),
      ]);
      const priceItems = (prices.data || []) as PriceListItem[];
      setPriceList(priceItems);
      setTemplates((tpls.data || []) as Template[]);

      const state = location.state as { template?: Template; duplicate?: Budget } | null;
      if (state?.template) applyTemplate(state.template, priceItems);
      if (state?.duplicate) applyDuplicate(state.duplicate);
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----- Operações de Serviços (clicar e selecionar) -----
  function toggleService(price: PriceListItem) {
    const key = price.id;
    setSelectedServices((current) => {
      if (current[key]) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: 1 };
    });
  }

  function updateServiceQty(priceId: string, qty: number) {
    if (qty <= 0) {
      setSelectedServices((current) => {
        const next = { ...current };
        delete next[priceId];
        return next;
      });
      return;
    }
    setSelectedServices((current) => ({ ...current, [priceId]: qty }));
  }

  // ----- Operações de Reels -----
  function toggleReel(price: PriceListItem) {
    const key = price.id;
    setSelectedReels((current) => {
      if (current[key]) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: 1 };
    });
  }

  function updateReelQty(priceId: string, qty: number) {
    if (qty <= 0) {
      setSelectedReels((current) => {
        const next = { ...current };
        delete next[priceId];
        return next;
      });
      return;
    }
    setSelectedReels((current) => ({ ...current, [priceId]: qty }));
  }

  // ----- Operações de Equipamentos -----
  function toggleEquipment(price: PriceListItem) {
    const key = price.id;
    setSelectedEquipment((current) => {
      if (current[key]) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: 1 };
    });
  }

  function updateEquipmentQty(priceId: string, qty: number) {
    if (qty <= 0) {
      setSelectedEquipment((current) => {
        const next = { ...current };
        delete next[priceId];
        return next;
      });
      return;
    }
    setSelectedEquipment((current) => ({ ...current, [priceId]: qty }));
  }

  // ----- Operações de Profissionais -----
  function toggleProfessional(price: PriceListItem) {
    const key = price.id;
    setSelectedProfessionals((current) => {
      if (current[key]) {
        const next = { ...current };
        delete next[key];
        return next;
      }
      return { ...current, [key]: 1 };
    });
  }

  function updateProfessionalQty(priceId: string, qty: number) {
    if (qty <= 0) {
      setSelectedProfessionals((current) => {
        const next = { ...current };
        delete next[priceId];
        return next;
      });
      return;
    }
    setSelectedProfessionals((current) => ({ ...current, [priceId]: qty }));
  }

  // ----- Modal de Variante -----
  function handleServiceClick(price: PriceListItem) {
    const variants = VARIANT_ITEMS[price.name];
    if (variants) {
      setVariantModal({ price });
    } else {
      toggleService(price);
    }
  }

  function selectVariant(variant: 'Reels' | 'Wide') {
    if (!variantModal) return;
    // Buscar o item correspondente à variante
    const variantName = variant === 'Reels' ? 'Edição de Reel' : 'Edição de Vídeo';
    const variantPrice = priceList.find((p) => p.name === variantName);
    if (variantPrice) {
      toggleService(variantPrice);
    }
    setVariantModal(null);
  }

  // ----- Modelos -----
  function applyTemplate(template: Template, prices = priceList) {
    const findPrice = (name: string) => prices.find((p) => p.name === name);
    setProject({ name: '', type: template.project_type, description: '' });
    setProduction({ ...template.production, start_date: '' });

    const services: Record<string, number> = {};
    template.service_names.forEach((name) => {
      const p = findPrice(name);
      if (p) services[p.id] = (services[p.id] || 0) + 1;
    });
    setSelectedServices(services);

    const reels: Record<string, number> = {};
    template.reel_names.forEach((name) => {
      const p = findPrice(name);
      if (p) reels[p.id] = (reels[p.id] || 0) + 1;
    });
    setSelectedReels(reels);

    const equipment: Record<string, number> = {};
    template.equipment_names.forEach((name) => {
      const p = findPrice(name);
      if (p) equipment[p.id] = (equipment[p.id] || 0) + 1;
    });
    setSelectedEquipment(equipment);

    const professionals: Record<string, number> = {};
    template.professional_names.forEach((name) => {
      const p = findPrice(name);
      if (p) professionals[p.id] = (professionals[p.id] || 0) + 1;
    });
    setSelectedProfessionals(professionals);
  }

  function applyDuplicate(budget: Budget) {
    setClient({ name: budget.client_name, company: budget.client_company, whatsapp: budget.client_whatsapp, email: budget.client_email });
    setProject({ name: `${budget.project_name} (cópia)`, type: budget.project_type, description: budget.project_description });
    setProduction({
      shooting_days: budget.production.shooting_days,
      city: budget.production.city,
      need_transportation: budget.production.need_transportation,
      need_lodging: budget.production.need_lodging,
      start_date: budget.production.start_date || '',
      delivery_days: budget.production.delivery_days,
    });

    const services: Record<string, number> = {};
    budget.services.forEach((item) => {
      if (item.price_list_id) services[item.price_list_id] = item.quantity;
    });
    setSelectedServices(services);

    const reels: Record<string, number> = {};
    budget.reels.forEach((item, i) => {
      reels[`reel-${i}`] = item.quantity;
    });
    setSelectedReels(reels);

    const equipment: Record<string, number> = {};
    budget.equipment.forEach((item, i) => {
      equipment[`eq-${i}`] = item.days;
    });
    setSelectedEquipment(equipment);

    const professionals: Record<string, number> = {};
    budget.professionals.forEach((item, i) => {
      professionals[`prof-${i}`] = item.days;
    });
    setSelectedProfessionals(professionals);
  }

  // ----- Cálculos (preview instantâneo) -----
  const servicesList = useMemo(
    () =>
      Object.entries(selectedServices).map(([priceId, qty]) => {
        const price = priceList.find((p) => p.id === priceId);
        if (!price) return null;
        return {
          id: priceId,
          category: price.category,
          name: price.name,
          quantity: qty,
          unit_price: price.sale_price,
          cost_price: price.cost_price,
          subtotal: qty * price.sale_price,
        };
      }).filter(Boolean) as BudgetItem[],
    [selectedServices, priceList],
  );

  const reelsList = useMemo(
    () =>
      Object.entries(selectedReels).map(([priceId, qty]) => {
        const price = priceList.find((p) => p.id === priceId);
        if (!price) return null;
        return {
          id: priceId,
          name: price.name,
          quantity: qty,
          unit_price: price.sale_price,
          cost_price: price.cost_price,
          subtotal: qty * price.sale_price,
        };
      }).filter(Boolean) as ReelItem[],
    [selectedReels, priceList],
  );

  const equipmentList = useMemo(
    () =>
      Object.entries(selectedEquipment).map(([priceId, qty]) => {
        const price = priceList.find((p) => p.id === priceId);
        if (!price) return null;
        return {
          id: priceId,
          name: price.name,
          daily_rate: price.sale_price,
          days: qty,
          cost_price: price.cost_price,
          subtotal: qty * price.sale_price,
          pickup_date: undefined,
          return_date: undefined,
        };
      }).filter(Boolean) as EquipmentItem[],
    [selectedEquipment, priceList],
  );

  const professionalsList = useMemo(
    () =>
      Object.entries(selectedProfessionals).map(([priceId, qty]) => {
        const price = priceList.find((p) => p.id === priceId);
        if (!price) return null;
        return {
          id: priceId,
          name: price.name,
          daily_rate: price.sale_price,
          days: qty,
          cost_price: price.cost_price,
          subtotal: qty * price.sale_price,
        };
      }).filter(Boolean) as ProfessionalItem[],
    [selectedProfessionals, priceList],
  );

  const allPricedItems: PricedItem[] = useMemo(
    () => [
      ...servicesList.map((item) => ({ quantity: item.quantity, unit_price: item.unit_price, cost_price: item.cost_price, name: item.name })),
      ...reelsList.map((item) => ({ quantity: item.quantity, unit_price: item.unit_price, cost_price: item.cost_price, name: item.name })),
      ...equipmentList.map((item) => ({ quantity: item.days, unit_price: item.daily_rate, cost_price: item.cost_price, name: item.name })),
      ...professionalsList.map((item) => ({ quantity: item.days, unit_price: item.daily_rate, cost_price: item.cost_price, name: item.name })),
    ],
    [servicesList, reelsList, equipmentList, professionalsList],
  );

  const categorySummary = useMemo(() => {
    const map = new Map<string, { subtotal: number; items: number }>();
    servicesList.forEach((item) => {
      const current = map.get(item.category) ?? { subtotal: 0, items: 0 };
      current.subtotal += item.subtotal;
      current.items += 1;
      map.set(item.category, current);
    });
    if (reelsList.length > 0) {
      const current = map.get('Reels') ?? { subtotal: 0, items: 0 };
      current.subtotal += reelsList.reduce((s, r) => s + r.subtotal, 0);
      current.items += reelsList.length;
      map.set('Reels', current);
    }
    if (equipmentList.length > 0) {
      const current = map.get('Equipamentos') ?? { subtotal: 0, items: 0 };
      current.subtotal += equipmentList.reduce((s, e) => s + e.subtotal, 0);
      current.items += equipmentList.length;
      map.set('Equipamentos', current);
    }
    if (professionalsList.length > 0) {
      const current = map.get('Equipe') ?? { subtotal: 0, items: 0 };
      current.subtotal += professionalsList.reduce((s, p) => s + p.subtotal, 0);
      current.items += professionalsList.length;
      map.set('Equipe', current);
    }
    return Array.from(map.entries())
      .map(([category, value]) => ({ category, ...value }))
      .sort((a, b) => b.subtotal - a.subtotal);
  }, [servicesList, reelsList, equipmentList, professionalsList]);

  const financials = useMemo(
    () => calcFinancials(allPricedItems, settings),
    [allPricedItems, settings],
  );

  function canContinue() {
    if (step === 1) return client.name.trim() !== '' && client.email.trim() !== '';
    if (step === 2) return project.name.trim() !== '';
    if (step === 3) return production.delivery_days > 0 && production.city.trim() !== '';
    if (step === 4) return Object.keys(selectedServices).length > 0;
    if (step === 5) return Object.keys(selectedReels).length > 0;
    return true;
  }

  async function saveBudget(status: Budget['status']) {
    setSaving(true);
    const now = new Date();
    const expires = new Date(now);
    expires.setDate(expires.getDate() + settings.proposal_validity_days);
    const budgetId = generateId();
    const clientId = generateId();

    const budget: Budget = {
      id: budgetId,
      client_id: clientId,
      client_name: client.name,
      client_company: client.company,
      client_whatsapp: client.whatsapp,
      client_email: client.email,
      project_name: project.name,
      project_type: project.type,
      project_description: project.description,
      production,
      services: servicesList.map((item) => ({ ...item, id: generateId(), budget_id: budgetId, custom_pricing: false, price_list_id: item.id })),
      reels: reelsList.map((item) => ({ ...item, id: generateId() })),
      equipment: equipmentList.map((item) => ({ ...item, id: generateId() })),
      professionals: professionalsList.map((item) => ({ ...item, id: generateId() })),
      status,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      expires_at: expires.toISOString(),
      expiration_date: expires.toISOString(),
      proposal_date: now.toISOString(),
      online_slug: `${project.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}-${budgetId.slice(0, 6)}`,
      cost_total: financials.cost_total,
      fee_value: financials.fee_value,
      tax_value: financials.tax_value,
      final_price: financials.final_price,
      profit: financials.profit,
      margin: financials.margin,
      material_bruto_value: financials.material_bruto_value,
      type: project.type,
      budget_date: now.toISOString(),
      client_phone: client.whatsapp,
    };

    await supabase.from('clients').insert({ id: clientId, ...client, created_at: now.toISOString() });
    await supabase.from('budgets').insert(budget);
    await supabase.from('budget_items').insert(budget.services || []);
    setSaving(false);
    navigate(`/budgets/${budgetId}`);
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <div className="min-w-0">
            <p className="mb-3 text-xs uppercase tracking-[0.34em] text-accent">SIM Budget System</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white break-words md:text-5xl">
              {t.newBudget}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">
              Clique nos serviços para adicionar. Use a Tabela de Preços para gerenciar itens e valores.
            </p>
          </div>
          <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-xs text-white/45">
            Taxa {settings.fee_percentage}% · Imposto {settings.tax_percentage}% · Validade {settings.proposal_validity_days} dias
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr_340px]">
          <aside className="space-y-2 lg:sticky lg:top-8 lg:h-fit">
            {STEPS.map((label, index) => {
              const number = index + 1;
              const active = number === step;
              const done = number < step;
              return (
                <button
                  key={label}
                  onClick={() => setStep(number)}
                  className={`flex w-full min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                    active
                      ? 'bg-white text-black'
                      : done
                      ? 'bg-white/10 text-white'
                      : 'text-white/35 hover:bg-white/5 hover:text-white/70'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                      active ? 'bg-black text-white' : 'bg-white/10 text-white/70'
                    }`}
                  >
                    {done ? <Check size={14} /> : number}
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium">{label}</span>
                </button>
              );
            })}
          </aside>

          <main className="min-h-[620px]">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <StepPanel key="client" title={t.steps.client} subtitle="Informações comerciais essenciais.">
                  <Input label={t.clientName} value={client.name} onChange={(v) => setClient({ ...client, name: v })} placeholder="Nome do contato" />
                  <Input label={t.company} value={client.company} onChange={(v) => setClient({ ...client, company: v })} placeholder="Nome da empresa" />
                  <Input label={t.whatsapp} value={client.whatsapp} onChange={(v) => setClient({ ...client, whatsapp: v })} placeholder="(11) 99999-9999" />
                  <Input label={t.emailField} value={client.email} onChange={(v) => setClient({ ...client, email: v })} placeholder="cliente@empresa.com" />
                </StepPanel>
              )}

              {step === 2 && (
                <StepPanel key="project" title={t.steps.project} subtitle="Defina o formato para calibrar a proposta.">
                  <Input
                    label={t.projectName}
                    value={project.name}
                    onChange={(v) => setProject({ ...project, name: v })}
                    placeholder="Nome da campanha ou produção"
                    wide
                  />
                  <div className="sm:col-span-2">
                    <Label>{t.projectType}</Label>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {PROJECT_TYPES.map((type) => (
                        <button
                          key={type}
                          onClick={() => setProject({ ...project, type })}
                          className={`rounded-xl border px-3 py-3 text-left text-sm transition whitespace-normal break-words ${
                            project.type === type
                              ? 'border-white bg-white text-black'
                              : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Resumo inicial</Label>
                    <textarea
                      value={project.description}
                      onChange={(e) => setProject({ ...project, description: e.target.value })}
                      rows={3}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition focus:border-white/35"
                      placeholder="Contexto e objetivo do projeto (detalhe mais na etapa de Escopo)."
                    />
                  </div>
                  <div className="sm:col-span-2 border-t border-white/10 pt-5">
                    <Label>Modelos</Label>
                    <div className="grid gap-3 md:grid-cols-3">
                      {templates.map((template) => (
                        <button
                          key={template.id}
                          onClick={() => applyTemplate(template)}
                          className="group flex min-h-[130px] flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06]"
                        >
                          <Copy size={15} className="mb-4 shrink-0 text-white/35 group-hover:text-white" />
                          <p className="truncate text-sm font-medium text-white" title={template.name}>
                            {template.name}
                          </p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/35" title={template.description}>
                            {template.description}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </StepPanel>
              )}

              {step === 3 && (
                <StepPanel key="production" title={t.steps.production} subtitle="Dados de operação que impactam logística e calendário.">
                  <Input
                    label={t.deliveryTime}
                    type="number"
                    value={String(production.delivery_days)}
                    onChange={(v) => setProduction({ ...production, delivery_days: Number(v) })}
                  />
                  <Input label={t.city} value={production.city} onChange={(v) => setProduction({ ...production, city: v })} />
                  <Toggle
                    label={t.needTransportation}
                    checked={production.need_transportation}
                    onChange={(v) => setProduction({ ...production, need_transportation: v })}
                  />
                  <Toggle
                    label={t.needLodging}
                    checked={production.need_lodging}
                    onChange={(v) => setProduction({ ...production, need_lodging: v })}
                  />
                </StepPanel>
              )}

              {step === 4 && (
                <SelectStep
                  title={t.steps.services}
                  subtitle="Clique nos serviços para adicionar à proposta."
                  categories={SELECTABLE_CATEGORIES}
                  priceList={priceList}
                  selected={selectedServices}
                  onToggle={handleServiceClick}
                  onQtyChange={updateServiceQty}
                />
              )}

              {step === 5 && (
                <SelectStep
                  title={t.steps.reels}
                  subtitle="Clique nos reels para adicionar. Cada um tem valor unitário próprio."
                  categories={['Reels']}
                  priceList={priceList}
                  selected={selectedReels}
                  onToggle={toggleReel}
                  onQtyChange={updateReelQty}
                />
              )}

              {step === 6 && (
                <SelectStep
                  title={t.steps.equipment}
                  subtitle="Clique nos equipamentos. O valor é calculado por diária × dias."
                  categories={['Equipamentos']}
                  priceList={priceList}
                  selected={selectedEquipment}
                  onToggle={toggleEquipment}
                  onQtyChange={updateEquipmentQty}
                />
              )}

              {step === 7 && (
                <SelectStep
                  title={t.steps.professionals}
                  subtitle="Clique nos profissionais. O valor é calculado por diária × dias."
                  categories={['Equipe']}
                  priceList={priceList}
                  selected={selectedProfessionals}
                  onToggle={toggleProfessional}
                  onQtyChange={updateProfessionalQty}
                />
              )}

              {step === 8 && <FinancialStep financials={financials} categorySummary={categorySummary} />}

              {step === 9 && <ProposalStep onSave={saveBudget} saving={saving} />}
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white disabled:opacity-25"
              >
                <ChevronLeft size={16} /> {t.backBtn}
              </button>
              {step < 9 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canContinue()}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-30"
                >
                  {t.continue} <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={() => saveBudget('Sent')}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-30"
                >
                  {saving ? 'Salvando...' : t.finish} <Check size={16} />
                </button>
              )}
            </div>
          </main>

          <aside className="lg:sticky lg:top-8 lg:h-fit">
            <LivePreview
              services={servicesList}
              reels={reelsList}
              equipment={equipmentList}
              professionals={professionalsList}
              categorySummary={categorySummary}
              financials={financials}
            />
          </aside>
        </div>
      </div>

      {/* Modal de Variante */}
      {variantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setVariantModal(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-sim-dark p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-xl text-white">Selecionar formato</h3>
              <button onClick={() => setVariantModal(null)} className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white">
                <X size={18} />
              </button>
            </div>
            <p className="mb-6 text-sm text-white/50">
              "{variantModal.price.name}" está disponível em dois formatos. Escolha qual adicionar:
            </p>
            <div className="space-y-3">
              <button
                onClick={() => selectVariant('Reels')}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06]"
              >
                <p className="text-sm font-medium text-white">Edição de Reel</p>
                <p className="mt-1 text-xs text-white/40">Formato vertical para redes sociais</p>
                <p className="mt-2 text-sm font-display text-white">
                  {formatCurrency(priceList.find((p) => p.name === 'Edição de Reel')?.sale_price || 180)}
                </p>
              </button>
              <button
                onClick={() => selectVariant('Wide')}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06]"
              >
                <p className="text-sm font-medium text-white">Edição de Vídeo (Wide)</p>
                <p className="mt-1 text-xs text-white/40">Formato horizontal 16:9</p>
                <p className="mt-2 text-sm font-display text-white">
                  {formatCurrency(priceList.find((p) => p.name === 'Edição de Vídeo')?.sale_price || 3600)}
                </p>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}

// =================== Subcomponentes ===================

function StepPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 24, filter: 'blur(8px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, x: -24, filter: 'blur(8px)' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-2xl shadow-black/30 md:p-8"
    >
      <div className="mb-8">
        <p className="mb-2 text-xs uppercase tracking-[0.3em] text-accent">{title}</p>
        <h2 className="font-display text-3xl text-white">{subtitle}</h2>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </motion.section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">{children}</label>;
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  wide,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition focus:border-white/35"
      />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`rounded-2xl border p-5 text-left transition ${
        checked ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25'
      }`}
    >
      <span className="block text-sm font-medium break-words">{label}</span>
      <span className="mt-3 block text-xs opacity-55">{checked ? t.enabled : t.disabled}</span>
    </button>
  );
}

// Etapa de seleção "clicar e adicionar"
function SelectStep({
  title,
  subtitle,
  categories,
  priceList,
  selected,
  onToggle,
  onQtyChange,
}: {
  title: string;
  subtitle: string;
  categories: string[];
  priceList: PriceListItem[];
  selected: Record<string, number>;
  onToggle: (price: PriceListItem) => void;
  onQtyChange: (priceId: string, qty: number) => void;
}) {
  return (
    <StepPanel title={title} subtitle={subtitle}>
      <div className="sm:col-span-2 space-y-8">
        {categories.map((category) => {
          const items = priceList.filter((p) => p.category === category && p.active);
          if (!items.length) return null;
          return (
            <section key={category}>
              <h4 className="mb-3 text-xs uppercase tracking-[0.28em] text-white/30">{category}</h4>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((price) => {
                  const qty = selected[price.id] || 0;
                  const isSelected = qty > 0;
                  return (
                    <div
                      key={price.id}
                      className={`group min-h-[110px] w-full rounded-2xl border p-4 transition ${
                        isSelected
                          ? 'border-white bg-white text-black'
                          : 'border-white/10 bg-white/[0.03] text-white hover:border-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      <button
                        onClick={() => onToggle(price)}
                        className="mb-3 flex w-full items-start justify-between gap-2 text-left"
                      >
                        <p className="min-w-0 flex-1 text-sm font-medium break-words">{price.name}</p>
                        <span
                          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            isSelected ? 'bg-black text-white' : 'bg-white/10 text-white/50'
                          }`}
                        >
                          {isSelected ? <Check size={14} /> : <Plus size={14} />}
                        </span>
                      </button>
                      <div className="flex items-center justify-between gap-2 text-xs opacity-60">
                        <span className="truncate font-medium">
                          R$ {price.sale_price.toLocaleString('pt-BR')}
                        </span>
                        {isSelected && (
                          <div className="flex items-center gap-1 rounded-lg bg-black/10 px-2 py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onQtyChange(price.id, qty - 1);
                              }}
                              className="hover:text-black"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-4 text-center font-bold text-black">{qty}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onQtyChange(price.id, qty + 1);
                              }}
                              className="hover:text-black"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </StepPanel>
  );
}

function FinancialStep({
  financials,
  categorySummary,
}: {
  financials: ReturnType<typeof calcFinancials>;
  categorySummary: { category: string; subtotal: number; items: number }[];
}) {
  return (
    <StepPanel title={t.steps.financial} subtitle="Cálculo automático baseado em quantidade × valor unitário.">
      <div className="sm:col-span-2 rounded-3xl border border-accent/30 bg-accent/[0.06] p-8">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-accent">{t.finalPriceLabel}</p>
        <p className="font-display text-5xl text-white md:text-7xl">
          {financials.final_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Metric label="Subtotal" value={financials.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <Metric label={`Fee (${t.fee})`} value={financials.fee_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <Metric label={`Impostos (${t.tax})`} value={financials.tax_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
        </div>
      </div>

      <div className="sm:col-span-2 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
        <p className="mb-4 text-xs uppercase tracking-[0.22em] text-white/30">Subtotal por categoria</p>
        {categorySummary.length === 0 ? (
          <p className="text-sm text-white/35">Nenhum item adicionado.</p>
        ) : (
          <div className="space-y-2">
            {categorySummary.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between border-b border-white/5 pb-2 text-sm">
                <span className="text-white/60">{cat.category}</span>
                <span className="text-white">{cat.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
        <SlidersHorizontal size={18} className="mb-3 text-accent" />
        {t.materialBrutoNote}
      </div>
    </StepPanel>
  );
}

function ProposalStep({ onSave, saving: _saving }: { onSave: (status: Budget['status']) => void; saving: boolean }) {
  return (
    <StepPanel title={t.steps.proposal} subtitle="Gere a proposta e o link online para o cliente.">
      <Action label={t.saveDraft} onClick={() => onSave('Draft')} />
      <Action label={t.generateSent} onClick={() => onSave('Sent')} primary />
      <Action label="Gerar link online" onClick={() => onSave('Sent')} icon={Link2} />
      <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-white/45">
        <Sparkles size={18} className="mb-3 text-accent" />
        O link online mostra apenas cliente, projeto, escopo, entregáveis, cronograma, investimento final e condições de pagamento.
      </div>
    </StepPanel>
  );
}

// =================== Live Preview ===================

function LivePreview({
  services,
  reels,
  equipment,
  professionals,
  categorySummary,
  financials,
}: {
  services: BudgetItem[];
  reels: ReelItem[];
  equipment: EquipmentItem[];
  professionals: ProfessionalItem[];
  categorySummary: { category: string; subtotal: number; items: number }[];
  financials: ReturnType<typeof calcFinancials>;
}) {
  const hasAny = services.length + reels.length + equipment.length + professionals.length > 0;
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-accent/30 bg-accent/[0.06] p-5">
        <p className="mb-1 text-xs uppercase tracking-[0.22em] text-accent">Total Geral</p>
        <p className="font-display text-4xl text-white">
          {financials.final_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <div className="mt-4 space-y-2 text-sm">
          <PreviewRow label="Subtotal" value={financials.subtotal} />
          <PreviewRow label="Fee" value={financials.fee_value} />
          <PreviewRow label="Impostos" value={financials.tax_value} />
        </div>
        <div className="mt-4 rounded-2xl bg-black/30 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">Controle interno</p>
          <div className="mt-2 space-y-1 text-xs text-white/40">
            <p>Custo: {financials.cost_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p>Lucro: {financials.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
            <p>Margem: {formatPercent(financials.margin)}</p>
          </div>
        </div>
      </div>

      {hasAny && categorySummary.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/30">Por categoria</p>
          <div className="space-y-2">
            {categorySummary.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <span className="text-white/55">
                  {cat.category} <span className="text-white/30">({cat.items})</span>
                </span>
                <span className="text-white/85">{cat.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/55">{label}</span>
      <span className="text-white">{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
    </div>
  );
}

// =================== Helpers visuais ===================

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{label}</p>
      <p className="mt-1 font-display text-lg text-white">{value}</p>
    </div>
  );
}

function Action({ label, onClick, primary, icon: Icon = Save }: { label: string; onClick: () => void; primary?: boolean; icon?: React.ElementType }) {
  return (
    <button
      onClick={onClick}
      className={`flex min-w-0 items-center gap-3 rounded-2xl border p-5 text-left transition ${
        primary ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.03] text-white hover:border-white/25'
      }`}
    >
      <Icon size={18} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
    </button>
  );
}
