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
  Trash2,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { generateId, getSettings, supabase } from '../lib/supabase';
import {
  calcFinancials,
  calcSubtotal,
  calcTotalSale,
  formatPercent,
  type PricedItem,
} from '../lib/calc';
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
  t.steps.scope,
  t.steps.delivery,
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

const SERVICE_CATEGORIES = [
  'Pré Produção',
  'Produção',
  'Fotografia',
  'Pós Produção',
  'Reels',
  'Finalização',
  'Logística',
  'Equipamentos',
  'Extras',
];

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
    city: 'São Paulo',
    need_transportation: false,
    need_lodging: false,
    start_date: '',
    delivery_days: 15,
  });
  const [services, setServices] = useState<BudgetItem[]>([]);
  const [reels, setReels] = useState<ReelItem[]>([]);
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [professionals, setProfessionals] = useState<ProfessionalItem[]>([]);

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

  // ----- Operações de Serviços -----
  function addService(price: PriceListItem) {
    setServices((current) => {
      const existing = current.find((item) => item.price_list_id === price.id);
      if (existing) {
        return current.map((item) =>
          item.id === existing.id ? { ...item, quantity: item.quantity + 1, subtotal: calcSubtotal({ quantity: item.quantity + 1, unit_price: item.unit_price }) } : item,
        );
      }
      const newItem: BudgetItem = {
        id: generateId(),
        budget_id: '',
        price_list_id: price.id,
        category: price.category,
        name: price.name,
        quantity: 1,
        unit_price: price.sale_price,
        cost_price: price.cost_price,
        subtotal: price.sale_price,
        custom_pricing: false,
      };
      return [...current, newItem];
    });
  }

  function updateService(id: string, updates: Partial<BudgetItem>) {
    setServices((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...updates };
        next.subtotal = calcSubtotal(next);
        return next;
      }),
    );
  }

  function removeService(id: string) {
    setServices((current) => current.filter((item) => item.id !== id));
  }

  function addCustomService() {
    const newItem: BudgetItem = {
      id: generateId(),
      budget_id: '',
      category: 'Extras',
      name: 'Item personalizado',
      quantity: 1,
      unit_price: 0,
      cost_price: 0,
      subtotal: 0,
      custom_pricing: true,
    };
    setServices((current) => [...current, newItem]);
  }

  // ----- Operações de Reels (categoria independente) -----
  function addReel() {
    setReels((current) => [
      ...current,
      { id: generateId(), name: 'Reel', quantity: 1, unit_price: 180, cost_price: 90, subtotal: 180 },
    ]);
  }

  function updateReel(id: string, updates: Partial<ReelItem>) {
    setReels((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...updates };
        next.subtotal = calcSubtotal(next);
        return next;
      }),
    );
  }

  function removeReel(id: string) {
    setReels((current) => current.filter((item) => item.id !== id));
  }

  // ----- Operações de Equipamentos -----
  function addEquipment() {
    setEquipment((current) => [
      ...current,
      { id: generateId(), name: '', daily_rate: 0, days: 1, pickup_date: '', return_date: '', cost_price: 0, subtotal: 0 },
    ]);
  }

  function updateEquipment(id: string, updates: Partial<EquipmentItem>) {
    setEquipment((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...updates };
        next.subtotal = (next.daily_rate || 0) * (next.days || 0);
        return next;
      }),
    );
  }

  function removeEquipment(id: string) {
    setEquipment((current) => current.filter((item) => item.id !== id));
  }

  // ----- Operações de Profissionais -----
  function addProfessional() {
    setProfessionals((current) => [
      ...current,
      { id: generateId(), name: '', daily_rate: 0, days: 1, cost_price: 0, subtotal: 0 },
    ]);
  }

  function updateProfessional(id: string, updates: Partial<ProfessionalItem>) {
    setProfessionals((current) =>
      current.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...updates };
        next.subtotal = (next.daily_rate || 0) * (next.days || 0);
        return next;
      }),
    );
  }

  function removeProfessional(id: string) {
    setProfessionals((current) => current.filter((item) => item.id !== id));
  }

  // ----- Modelos -----
  function applyTemplate(template: Template, prices = priceList) {
    const findPrice = (name: string) => prices.find((p) => p.name === name);
    setProject({ name: '', type: template.project_type, description: '' });
    setProduction({ ...template.production, start_date: '' });
    setServices(
      template.service_names
        .map((name) => findPrice(name))
        .filter(Boolean)
        .map((p) => ({
          id: generateId(),
          budget_id: '',
          price_list_id: p!.id,
          category: p!.category,
          name: p!.name,
          quantity: 1,
          unit_price: p!.sale_price,
          cost_price: p!.cost_price,
          subtotal: p!.sale_price,
          custom_pricing: false,
        })),
    );
    setReels(
      template.reel_names
        .map((name) => findPrice(name))
        .filter(Boolean)
        .map((p) => ({
          id: generateId(),
          name: p!.name,
          quantity: 1,
          unit_price: p!.sale_price,
          cost_price: p!.cost_price,
          subtotal: p!.sale_price,
        })),
    );
    setEquipment(
      template.equipment_names
        .map((name) => findPrice(name))
        .filter(Boolean)
        .map((p) => ({
          id: generateId(),
          name: p!.name,
          daily_rate: p!.sale_price,
          days: 1,
          pickup_date: '',
          return_date: '',
          cost_price: p!.cost_price,
          subtotal: p!.sale_price,
        })),
    );
    setProfessionals(
      template.professional_names
        .map((name) => findPrice(name))
        .filter(Boolean)
        .map((p) => ({
          id: generateId(),
          name: p!.name,
          daily_rate: p!.sale_price,
          days: 1,
          cost_price: p!.cost_price,
          subtotal: p!.sale_price,
        })),
    );
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
    setServices(budget.services.map((item) => ({ ...item, id: generateId() })));
    setReels(budget.reels.map((item) => ({ ...item, id: generateId() })));
    setEquipment(budget.equipment.map((item) => ({ ...item, id: generateId() })));
    setProfessionals(budget.professionals.map((item) => ({ ...item, id: generateId() })));
  }

  // ----- Cálculos (preview instantâneo) -----
  const allPricedItems: PricedItem[] = useMemo(
    () => [
      ...services.map((item) => ({ quantity: item.quantity, unit_price: item.unit_price, cost_price: item.cost_price })),
      ...equipment.map((item) => ({ quantity: item.days, unit_price: item.daily_rate, cost_price: item.cost_price })),
      ...professionals.map((item) => ({ quantity: item.days, unit_price: item.daily_rate, cost_price: item.cost_price })),
      ...reels.map((item) => ({ quantity: item.quantity, unit_price: item.unit_price, cost_price: item.cost_price })),
    ],
    [services, equipment, professionals, reels],
  );

  const totalSale = useMemo(() => calcTotalSale(allPricedItems), [allPricedItems]);
  const categorySummary = useMemo(() => {
    return [
      ...services.map((item) => ({ category: item.category, subtotal: item.subtotal, items: 1 })),
      ...reels.map((item) => ({ category: 'Reels', subtotal: item.subtotal, items: 1 })),
      ...equipment.map((item) => ({ category: 'Equipamentos', subtotal: item.subtotal, items: 1 })),
      ...professionals.map((item) => ({ category: 'Profissionais', subtotal: item.subtotal, items: 1 })),
    ];
  }, [services, equipment, professionals, reels]).reduce<{ category: string; subtotal: number; items: number }[]>(
    (acc, row) => {
      const existing = acc.find((a) => a.category === row.category);
      if (existing) {
        existing.subtotal += row.subtotal;
        existing.items += 1;
      } else {
        acc.push({ ...row });
      }
      return acc;
    },
    [],
  );

  const financials = useMemo(
    () =>
      calcFinancials(
        [
          ...services.map((item) => ({ name: item.name, quantity: item.quantity, unit_price: item.unit_price, cost_price: item.cost_price })),
          ...reels.map((item) => ({ name: item.name, quantity: item.quantity, unit_price: item.unit_price, cost_price: item.cost_price })),
          ...equipment.map((item) => ({ name: item.name, quantity: item.days, unit_price: item.daily_rate, cost_price: item.cost_price })),
          ...professionals.map((item) => ({ name: item.name, quantity: item.days, unit_price: item.daily_rate, cost_price: item.cost_price })),
        ],
        settings,
      ),
    [services, reels, equipment, professionals, settings],
  );

  function canContinue() {
    if (step === 1) return client.name.trim() !== '' && client.email.trim() !== '';
    if (step === 2) return project.name.trim() !== '';
    if (step === 3) return production.shooting_days > 0 && production.city.trim() !== '';
    if (step === 4) return services.length > 0;
    if (step === 5) return reels.length > 0;
    if (step === 8) return production.delivery_days > 0;
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
      services: services.map((item) => ({ ...item, budget_id: budgetId })),
      reels: reels.map((item) => ({ ...item })),
      equipment: equipment.map((item) => ({ ...item })),
      professionals: professionals.map((item) => ({ ...item })),
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
      ...financials,
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
              Fluxo guiado para transformar briefing, produção e investimento em uma proposta premium.
            </p>
          </div>
          <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-xs text-white/45">
            Taxa {settings.fee_percentage}% · Imposto {settings.tax_percentage}% · Validade {settings.proposal_validity_days} dias
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr_320px]">
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
                      placeholder="Contexto e objetivo do projeto (pode detalhar mais na etapa de Escopo)."
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
                    label={t.shootingDays}
                    type="number"
                    value={String(production.shooting_days)}
                    onChange={(v) => setProduction({ ...production, shooting_days: Number(v) })}
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

              {step === 4 && <ServicesStep services={services} priceList={priceList} onAdd={addService} onUpdate={updateService} onRemove={removeService} onAddCustom={addCustomService} />}

              {step === 5 && <ReelsStep reels={reels} onAdd={addReel} onUpdate={updateReel} onRemove={removeReel} />}

              {step === 6 && <EquipmentStep equipment={equipment} onAdd={addEquipment} onUpdate={updateEquipment} onRemove={removeEquipment} />}

              {step === 7 && <ProfessionalsStep professionals={professionals} onAdd={addProfessional} onUpdate={updateProfessional} onRemove={removeProfessional} />}

              {step === 8 && (
                <StepPanel key="scope" title={t.steps.scope} subtitle="Descreva detalhadamente o projeto, contexto, objetivos e referências.">
                  <div className="sm:col-span-2">
                    <Label>{t.scopeDescription}</Label>
                    <textarea
                      value={project.description}
                      onChange={(e) => setProject({ ...project, description: e.target.value })}
                      rows={10}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white transition focus:border-white/35"
                      placeholder="Descreva o briefing, os objetivos da produção, referências visuais, tom de comunicação, formato de entrega e qualquer observação importante."
                    />
                  </div>
                </StepPanel>
              )}

              {step === 9 && (
                <StepPanel key="delivery" title={t.steps.delivery} subtitle="Defina o tempo de entrega do projeto.">
                  <Input
                    label={t.startDate}
                    type="date"
                    value={production.start_date || ''}
                    onChange={(v) => setProduction({ ...production, start_date: v })}
                  />
                  <Input
                    label={t.deliveryTime}
                    type="number"
                    value={String(production.delivery_days)}
                    onChange={(v) => setProduction({ ...production, delivery_days: Number(v) })}
                  />
                </StepPanel>
              )}

              {step === 10 && <FinancialStep financials={financials} categorySummary={categorySummary} totalSale={totalSale} />}

              {step === 11 && <ProposalStep onSave={saveBudget} saving={saving} />}
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white disabled:opacity-25"
              >
                <ChevronLeft size={16} /> {t.backBtn}
              </button>
              {step < 11 ? (
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
              services={services}
              reels={reels}
              equipment={equipment}
              professionals={professionals}
              categorySummary={categorySummary}
              totalSale={totalSale}
              financials={financials}
            />
          </aside>
        </div>
      </div>
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

function Section({ title, onAdd, children }: { title: string; onAdd: () => void; children: React.ReactNode }) {
  return (
    <div className="sm:col-span-2 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">{title}</h3>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <Plus size={14} /> {t.addItem}
        </button>
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-white/35">
      {message}
    </div>
  );
}

// =================== Etapas específicas ===================

function ServicesStep({
  services,
  priceList,
  onAdd,
  onUpdate,
  onRemove,
  onAddCustom,
}: {
  services: BudgetItem[];
  priceList: PriceListItem[];
  onAdd: (p: PriceListItem) => void;
  onUpdate: (id: string, u: Partial<BudgetItem>) => void;
  onRemove: (id: string) => void;
  onAddCustom: () => void;
}) {
  const categories = SERVICE_CATEGORIES.filter((c) => c !== 'Reels');
  return (
    <StepPanel title={t.steps.services} subtitle="Selecione serviços pela tabela master 2025.">
      <div className="sm:col-span-2 space-y-8">
        {categories.map((category) => {
          const items = priceList.filter((p) => p.category === category && p.active);
          if (!items.length) return null;
          return (
            <section key={category}>
              <h4 className="mb-3 text-xs uppercase tracking-[0.28em] text-white/30">{category}</h4>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((price) => {
                  const selected = services.some((s) => s.price_list_id === price.id);
                  return (
                    <button
                      key={price.id}
                      onClick={() => onAdd(price)}
                      className={`group min-h-[110px] w-full rounded-2xl border p-4 text-left transition ${
                        selected
                          ? 'border-white bg-white text-black'
                          : 'border-white/10 bg-white/[0.03] text-white hover:border-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="mb-4 flex min-w-0 items-start justify-between gap-2">
                        <p className="min-w-0 flex-1 text-sm font-medium break-words">{price.name}</p>
                        <Plus
                          size={16}
                          className={`mt-0.5 shrink-0 ${selected ? 'text-black' : 'text-white/30 group-hover:text-white'}`}
                        />
                      </div>
                      <div className="flex justify-between gap-2 text-xs opacity-60">
                        <span className="truncate">R$ {price.sale_price.toLocaleString('pt-BR')}</span>
                        <span className="truncate opacity-60">+R$ {price.cost_price.toLocaleString('pt-BR')}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}

        <Section title="Itens personalizados" onAdd={onAddCustom}>
          {services.length === 0 && <EmptyState message="Nenhum item adicionado" />}
          {services.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[minmax(0,1.5fr)_80px_120px_120px_40px] md:items-center"
            >
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-wider text-white/30">{item.category}</p>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                  className="w-full bg-transparent text-sm font-medium text-white focus:outline-none"
                />
              </div>
              <NumberInput value={item.quantity} onChange={(v) => onUpdate(item.id, { quantity: v })} />
              <MoneyInput label="Unit." value={item.unit_price} onChange={(v) => onUpdate(item.id, { unit_price: v })} />
              <MoneyInput label="Custo" value={item.cost_price} onChange={(v) => onUpdate(item.id, { cost_price: v })} />
              <button
                onClick={() => onRemove(item.id)}
                className="rounded-xl p-2 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                title={t.removeItem}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </Section>
      </div>
    </StepPanel>
  );
}

function ReelsStep({
  reels,
  onAdd,
  onUpdate,
  onRemove,
}: {
  reels: ReelItem[];
  onAdd: () => void;
  onUpdate: (id: string, u: Partial<ReelItem>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <StepPanel title={t.steps.reels} subtitle="Categoria independente — cada reel tem valor unitário próprio.">
      <div className="sm:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Reels</h3>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Plus size={14} /> {t.addItem}
          </button>
        </div>
        {reels.length === 0 && <EmptyState message="Adicione reels com valor unitário próprio" />}
        <div className="space-y-3">
          {reels.map((reel, index) => (
            <div
              key={reel.id}
              className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[60px_minmax(0,1.5fr)_90px_120px_120px_40px] md:items-center"
            >
              <span className="text-xs text-white/30">#{index + 1}</span>
              <input
                type="text"
                value={reel.name}
                onChange={(e) => onUpdate(reel.id, { name: e.target.value })}
                placeholder="Nome do reel"
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35"
              />
              <NumberInput value={reel.quantity} onChange={(v) => onUpdate(reel.id, { quantity: v })} />
              <MoneyInput label="Unit." value={reel.unit_price} onChange={(v) => onUpdate(reel.id, { unit_price: v })} />
              <MoneyInput label="Custo" value={reel.cost_price} onChange={(v) => onUpdate(reel.id, { cost_price: v })} />
              <button
                onClick={() => onRemove(reel.id)}
                className="rounded-xl p-2 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                title={t.removeItem}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </StepPanel>
  );
}

function EquipmentStep({
  equipment,
  onAdd,
  onUpdate,
  onRemove,
}: {
  equipment: EquipmentItem[];
  onAdd: () => void;
  onUpdate: (id: string, u: Partial<EquipmentItem>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <StepPanel title={t.steps.equipment} subtitle="Equipamentos alugados por diária, com datas de locação.">
      <div className="sm:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Equipamentos</h3>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Plus size={14} /> {t.addItem}
          </button>
        </div>
        {equipment.length === 0 && <EmptyState message="Adicione equipamentos" />}
        <div className="space-y-3">
          {equipment.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,1.4fr)_120px_70px_140px_140px_120px_40px] md:items-end"
            >
              <Field label="Nome">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                  placeholder="Ex: Câmera"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35"
                />
              </Field>
              <Field label="Diária (R$)">
                <input
                  type="number"
                  value={item.daily_rate}
                  onChange={(e) => onUpdate(item.id, { daily_rate: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35"
                />
              </Field>
              <Field label="Dias">
                <input
                  type="number"
                  min={1}
                  value={item.days}
                  onChange={(e) => onUpdate(item.id, { days: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35"
                />
              </Field>
              <Field label="Retirada">
                <input
                  type="date"
                  value={item.pickup_date || ''}
                  onChange={(e) => onUpdate(item.id, { pickup_date: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35"
                />
              </Field>
              <Field label="Devolução">
                <input
                  type="date"
                  value={item.return_date || ''}
                  onChange={(e) => onUpdate(item.id, { return_date: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35"
                />
              </Field>
              <Field label="Custo">
                <input
                  type="number"
                  value={item.cost_price}
                  onChange={(e) => onUpdate(item.id, { cost_price: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35"
                />
              </Field>
              <button
                onClick={() => onRemove(item.id)}
                className="self-center rounded-xl p-2 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                title={t.removeItem}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </StepPanel>
  );
}

function ProfessionalsStep({
  professionals,
  onAdd,
  onUpdate,
  onRemove,
}: {
  professionals: ProfessionalItem[];
  onAdd: () => void;
  onUpdate: (id: string, u: Partial<ProfessionalItem>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <StepPanel title={t.steps.professionals} subtitle="Profissionais contratados por diária.">
      <div className="sm:col-span-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white">Profissionais</h3>
          <button
            onClick={onAdd}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <Plus size={14} /> {t.addItem}
          </button>
        </div>
        {professionals.length === 0 && <EmptyState message="Adicione profissionais" />}
        <div className="space-y-3">
          {professionals.map((item) => (
            <div
              key={item.id}
              className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,1.4fr)_120px_70px_120px_40px] md:items-end"
            >
              <Field label="Nome do profissional">
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => onUpdate(item.id, { name: e.target.value })}
                  placeholder="Ex: Diretor"
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35"
                />
              </Field>
              <Field label="Diária (R$)">
                <input
                  type="number"
                  value={item.daily_rate}
                  onChange={(e) => onUpdate(item.id, { daily_rate: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35"
                />
              </Field>
              <Field label="Dias">
                <input
                  type="number"
                  min={1}
                  value={item.days}
                  onChange={(e) => onUpdate(item.id, { days: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35"
                />
              </Field>
              <Field label="Custo">
                <input
                  type="number"
                  value={item.cost_price}
                  onChange={(e) => onUpdate(item.id, { cost_price: Number(e.target.value) })}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35"
                />
              </Field>
              <button
                onClick={() => onRemove(item.id)}
                className="self-center rounded-xl p-2 text-white/30 hover:bg-red-500/10 hover:text-red-400"
                title={t.removeItem}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </StepPanel>
  );
}

function FinancialStep({
  financials,
  categorySummary,
  totalSale,
}: {
  financials: ReturnType<typeof calcFinancials>;
  categorySummary: { category: string; subtotal: number; items: number }[];
  totalSale: number;
}) {
  return (
    <StepPanel title={t.steps.financial} subtitle="Cálculo automático baseado em quantidade × valor unitário.">
      <div className="sm:col-span-2 rounded-3xl border border-white/10 bg-black/30 p-6">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-accent">{t.finalPriceLabel}</p>
        <p className="font-display text-4xl text-white md:text-5xl">{financials.final_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Metric label={t.totalSale} value={totalSale.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <Metric label={t.totalCost} value={financials.cost_total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <Metric label={t.fee} value={financials.fee_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
          <Metric label={t.tax} value={financials.tax_value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Metric label={t.profit} value={financials.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} positive />
          <Metric label={t.margin} value={formatPercent(financials.margin)} />
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
  totalSale,
  financials,
}: {
  services: BudgetItem[];
  reels: ReelItem[];
  equipment: EquipmentItem[];
  professionals: ProfessionalItem[];
  categorySummary: { category: string; subtotal: number; items: number }[];
  totalSale: number;
  financials: ReturnType<typeof calcFinancials>;
}) {
  const hasAny = services.length + reels.length + equipment.length + professionals.length > 0;
  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5">
        <p className="mb-1 text-xs uppercase tracking-[0.22em] text-accent">Pré-visualização</p>
        <p className="text-sm text-white/45">Atualiza em tempo real conforme você edita.</p>
        <div className="mt-5 space-y-3">
          <PreviewRow label="Serviços" count={services.length} subtotal={services.reduce((s, i) => s + i.subtotal, 0)} />
          <PreviewRow label="Reels" count={reels.length} subtotal={reels.reduce((s, i) => s + i.subtotal, 0)} />
          <PreviewRow label="Equipamentos" count={equipment.length} subtotal={equipment.reduce((s, i) => s + i.subtotal, 0)} />
          <PreviewRow label="Profissionais" count={professionals.length} subtotal={professionals.reduce((s, i) => s + i.subtotal, 0)} />
        </div>
        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-xs uppercase tracking-wider text-white/30">Subtotal</p>
          <p className="mt-1 font-display text-2xl text-white">{totalSale.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
        </div>
        <div className="mt-4 rounded-2xl bg-black/30 p-4">
          <p className="text-[10px] uppercase tracking-[0.22em] text-accent">Investimento final</p>
          <p className="mt-1 font-display text-3xl text-white">{financials.final_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          <p className="mt-1 text-[10px] text-white/40">Lucro {financials.profit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} · Margem {formatPercent(financials.margin)}</p>
        </div>
      </div>

      {hasAny && categorySummary.length > 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/30">Por categoria</p>
          <div className="space-y-2">
            {categorySummary.map((cat) => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <span className="text-white/55">{cat.category}</span>
                <span className="text-white/85">{cat.subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PreviewRow({ label, count, subtotal }: { label: string; count: number; subtotal: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-white/55">
        {label} <span className="text-white/30">({count})</span>
      </span>
      <span className="text-white">{subtotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
    </div>
  );
}

// =================== Helpers visuais ===================

function NumberInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-2 py-2">
      <button onClick={() => onChange(Math.max(1, value - 1))} className="text-white/40 hover:text-white">
        <Minus size={14} />
      </button>
      <span className="text-sm text-white">{value}</span>
      <button onClick={() => onChange(value + 1)} className="text-white/40 hover:text-white">
        <Plus size={14} />
      </button>
    </div>
  );
}

function MoneyInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/25">{label}</span>
      <input
        type="number"
        value={Math.round(value)}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35"
      />
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/25">{label}</span>
      {children}
    </label>
  );
}

function Metric({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{label}</p>
      <p className={`mt-1 font-display text-lg ${positive ? 'text-emerald-400' : 'text-white'}`}>{value}</p>
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
