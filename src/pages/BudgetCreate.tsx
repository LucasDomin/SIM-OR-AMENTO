import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { formatCurrency, generateId, getSettings, supabase } from '../lib/supabase';
import { calcFinancials, formatPercent, type PricedItem } from '../lib/calc';
import { t } from '../lib/i18n';
import {
  clearDraft,
  EMPTY_DRAFT,
  loadDraft,
  saveDraft,
  type BudgetDraft,
  type DraftItemOverride,
} from '../lib/draftStorage';
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
  t.steps.equipment,
  t.steps.professionals,
  t.steps.financial,
  t.steps.proposal,
];

const PROJECT_TYPES: ProjectType[] = [
  'Institucional', 'Evento', 'Publicidade', 'Podcast',
  'Reels', 'Cobertura', 'Personalizado',
];

const SELECTABLE_CATEGORIES = [
  'Pré Produção', 'Produção', 'Fotografia', 'Pós Produção',
  'Reels', 'Finalização', 'Logística', 'Extras',
];

const VARIANT_ITEMS: Record<string, string[]> = {
  'Edição de Vídeo': ['Reels', 'Wide'],
};

// -------------------------------------------------------
// Tipo do modal de adição/edição de item
// -------------------------------------------------------
interface ItemModal {
  price: PriceListItem;
  group: 'services' | 'reels' | 'equipment' | 'professionals';
  currentOverride?: DraftItemOverride;
}

export function BudgetCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useMemo(() => getSettings(), []);

  // ── Estado: draft carregado do localStorage ──────────────────────
  const [draft, setDraftRaw] = useState<BudgetDraft>(() => {
    const saved = loadDraft();
    // Se vier via router state (template/duplicate), prioriza
    return saved;
  });

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [itemModal, setItemModal] = useState<ItemModal | null>(null);
  const [variantModal, setVariantModal] = useState<{ price: PriceListItem } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // ── Atalhos de leitura do draft ───────────────────────────────────
  const { client, lgpdConsent, project, production } = draft;
  const selectedServices = draft.services;
  const selectedReels = draft.reels;
  const selectedEquipment = draft.equipment;
  const selectedProfessionals = draft.professionals;

  // ── Persistência automática: salva no localStorage sempre que draft muda ─
  const draftRef = useRef(draft);
  draftRef.current = draft;
  useEffect(() => {
    saveDraft(draft);
  }, [draft]);

  // ── Helper de escrita tipada ───────────────────────────────────────
  const setDraft = useCallback((updater: (prev: BudgetDraft) => BudgetDraft) => {
    setDraftRaw((prev) => {
      const next = updater(prev);
      return next;
    });
  }, []);

  // ── Carregamento inicial ──────────────────────────────────────────
  useEffect(() => {
    async function load() {
      const [prices, tpls] = await Promise.all([
        supabase.from('price_list').select().data(),
        supabase.from('templates').select().data(),
      ]);
      const priceItems = (prices.data || []) as PriceListItem[];
      setPriceList(priceItems);
      setTemplates((tpls.data || []) as Template[]);

      const state = location.state as { template?: Template; duplicate?: Budget; clearDraft?: boolean } | null;
      if (state?.clearDraft) {
        clearDraft();
        setDraftRaw({ ...EMPTY_DRAFT });
      } else if (state?.template) {
        applyTemplate(state.template, priceItems);
      } else if (state?.duplicate) {
        applyDuplicate(state.duplicate, priceItems);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Helpers para criar DraftItemOverride ─────────────────────────
  function makeOverride(price: PriceListItem, qty = 1, applied?: number): DraftItemOverride {
    return {
      qty,
      applied_price: applied ?? price.sale_price,
      base_price: price.sale_price,
    };
  }

  // ── Abre o modal de configuração ao clicar num item ──────────────
  function openItemModal(
    price: PriceListItem,
    group: 'services' | 'reels' | 'equipment' | 'professionals',
  ) {
    const existing = draft[group][price.id];
    setItemModal({ price, group, currentOverride: existing });
  }

  function handleServiceClick(price: PriceListItem) {
    if (VARIANT_ITEMS[price.name]) {
      setVariantModal({ price });
    } else {
      openItemModal(price, 'services');
    }
  }

  // ── Confirmar adição/edição via modal ────────────────────────────
  function confirmItemModal(qty: number, applied_price: number) {
    if (!itemModal) return;
    const { price, group } = itemModal;
    if (qty <= 0) {
      // Remove
      setDraft((prev) => {
        const next = { ...prev[group] };
        delete next[price.id];
        return { ...prev, [group]: next };
      });
    } else {
      setDraft((prev) => ({
        ...prev,
        [group]: {
          ...prev[group],
          [price.id]: makeOverride(price, qty, applied_price),
        },
      }));
    }
    setItemModal(null);
  }

  // ── Remover item ─────────────────────────────────────────────────
  function removeItem(group: 'services' | 'reels' | 'equipment' | 'professionals', priceId: string) {
    setDraft((prev) => {
      const next = { ...prev[group] };
      delete next[priceId];
      return { ...prev, [group]: next };
    });
  }

  // ── Editar override direto no resumo (Qty ou PreçoAplicado) ──────
  function updateOverride(
    group: 'services' | 'reels' | 'equipment' | 'professionals',
    priceId: string,
    patch: Partial<DraftItemOverride>,
  ) {
    setDraft((prev) => {
      const existing = prev[group][priceId];
      if (!existing) return prev;
      return {
        ...prev,
        [group]: {
          ...prev[group],
          [priceId]: { ...existing, ...patch },
        },
      };
    });
  }

  // ── Restaurar valor da tabela ─────────────────────────────────────
  function restoreBasePrice(
    group: 'services' | 'reels' | 'equipment' | 'professionals',
    priceId: string,
  ) {
    setDraft((prev) => {
      const existing = prev[group][priceId];
      if (!existing) return prev;
      return {
        ...prev,
        [group]: {
          ...prev[group],
          [priceId]: { ...existing, applied_price: existing.base_price },
        },
      };
    });
  }

  // ── Variante edição ───────────────────────────────────────────────
  function selectVariant(variant: 'Reels' | 'Wide') {
    if (!variantModal) return;
    const { price } = variantModal;
    setVariantModal(null);
    if (variant === 'Reels') {
      const reelPrice = priceList.find((p) => p.name === 'Edição de Reel');
      if (reelPrice) openItemModal(reelPrice, 'reels');
    } else {
      openItemModal(price, 'services');
    }
  }

  // ── Modelos ───────────────────────────────────────────────────────
  function applyTemplate(template: Template, prices = priceList) {
    const findPrice = (name: string) => prices.find((p) => p.name === name);
    const services: Record<string, DraftItemOverride> = {};
    template.service_names.forEach((name) => {
      const p = findPrice(name);
      if (p) services[p.id] = { ...makeOverride(p, (services[p.id]?.qty || 0) + 1) };
    });
    const reels: Record<string, DraftItemOverride> = {};
    template.reel_names.forEach((name) => {
      const p = findPrice(name);
      if (p) reels[p.id] = { ...makeOverride(p, (reels[p.id]?.qty || 0) + 1) };
    });
    const equipment: Record<string, DraftItemOverride> = {};
    template.equipment_names.forEach((name) => {
      const p = findPrice(name);
      if (p) equipment[p.id] = makeOverride(p, 1);
    });
    const professionals: Record<string, DraftItemOverride> = {};
    template.professional_names.forEach((name) => {
      const p = findPrice(name);
      if (p) professionals[p.id] = makeOverride(p, 1);
    });
    setDraft((prev) => ({
      ...prev,
      project: { ...prev.project, type: template.project_type },
      production: { ...template.production, start_date: '' },
      services,
      reels,
      equipment,
      professionals,
    }));
  }

  function applyDuplicate(budget: Budget, prices = priceList) {
    const findByName = (name: string) => prices.find((p) => p.name === name);
    const services: Record<string, DraftItemOverride> = {};
    budget.services.forEach((item) => {
      if (item.price_list_id) {
        services[item.price_list_id] = {
          qty: item.quantity,
          applied_price: item.unit_price,
          base_price: findByName(item.name)?.sale_price ?? item.unit_price,
        };
      }
    });
    const reels: Record<string, DraftItemOverride> = {};
    budget.reels.forEach((item) => {
      const p = findByName(item.name);
      reels[p?.id ?? generateId()] = {
        qty: item.quantity,
        applied_price: item.unit_price,
        base_price: p?.sale_price ?? item.unit_price,
      };
    });
    const equipment: Record<string, DraftItemOverride> = {};
    budget.equipment.forEach((item) => {
      const p = findByName(item.name);
      equipment[p?.id ?? generateId()] = {
        qty: item.days,
        applied_price: item.daily_rate,
        base_price: p?.sale_price ?? item.daily_rate,
      };
    });
    const professionals: Record<string, DraftItemOverride> = {};
    budget.professionals.forEach((item) => {
      const p = findByName(item.name);
      professionals[p?.id ?? generateId()] = {
        qty: item.days,
        applied_price: item.daily_rate,
        base_price: p?.sale_price ?? item.daily_rate,
      };
    });
    setDraftRaw({
      client: { name: budget.client_name, company: budget.client_company, whatsapp: budget.client_whatsapp, email: budget.client_email },
      lgpdConsent: false,
      project: { name: `${budget.project_name} (cópia)`, type: budget.project_type, description: budget.project_description },
      production: {
        shooting_days: budget.production.shooting_days,
        city: budget.production.city,
        need_transportation: budget.production.need_transportation,
        need_lodging: budget.production.need_lodging,
        start_date: budget.production.start_date || '',
        delivery_days: budget.production.delivery_days,
      },
      services,
      reels,
      equipment,
      professionals,
      savedAt: '',
    });
  }

  // ── Materializar itens (aplicando valorAplicado) ──────────────────
  const servicesList = useMemo(
    () =>
      Object.entries(selectedServices)
        .map(([priceId, ov]) => {
          const price = priceList.find((p) => p.id === priceId);
          if (!price) return null;
          return {
            id: priceId,
            category: price.category,
            name: price.name,
            quantity: ov.qty,
            unit_price: ov.applied_price,   // VALOR APLICADO (customizável)
            cost_price: price.cost_price,
            subtotal: ov.qty * ov.applied_price,
            base_price: ov.base_price,
            custom_pricing: ov.applied_price !== ov.base_price,
            price_list_id: priceId,
          } as BudgetItem & { base_price: number };
        })
        .filter(Boolean) as (BudgetItem & { base_price: number })[],
    [selectedServices, priceList],
  );

  const reelsList = useMemo(
    () =>
      Object.entries(selectedReels)
        .map(([priceId, ov]) => {
          const price = priceList.find((p) => p.id === priceId);
          if (!price) return null;
          return {
            id: priceId,
            name: price.name,
            quantity: ov.qty,
            unit_price: ov.applied_price,
            cost_base: price.cost_base,
            price_base: price.price_base,
            cost_price: price.cost_base,
            fee_percent: price.fee_percent,
            tax_percent: price.tax_percent,
            subtotal: ov.qty * ov.applied_price,
            base_price: ov.base_price,
          } as ReelItem & { base_price: number };
        })
        .filter(Boolean) as (ReelItem & { base_price: number })[],
    [selectedReels, priceList],
  );

  const equipmentList = useMemo(
    () =>
      Object.entries(selectedEquipment)
        .map(([priceId, ov]) => {
          const price = priceList.find((p) => p.id === priceId);
          if (!price) return null;
          return {
            id: priceId,
            name: price.name,
            daily_rate: ov.applied_price,
            days: ov.qty,
            cost_base: price.cost_base,
            price_base: price.price_base,
            cost_price: price.cost_base,
            fee_percent: price.fee_percent,
            tax_percent: price.tax_percent,
            subtotal: ov.qty * ov.applied_price,
            base_price: ov.base_price,
            pickup_date: undefined,
            return_date: undefined,
          } as EquipmentItem & { base_price: number };
        })
        .filter(Boolean) as (EquipmentItem & { base_price: number })[],
    [selectedEquipment, priceList],
  );

  const professionalsList = useMemo(
    () =>
      Object.entries(selectedProfessionals)
        .map(([priceId, ov]) => {
          const price = priceList.find((p) => p.id === priceId);
          if (!price) return null;
          return {
            id: priceId,
            name: price.name,
            daily_rate: ov.applied_price,
            days: ov.qty,
            cost_base: price.cost_base,
            price_base: price.price_base,
            cost_price: price.cost_base,
            fee_percent: price.fee_percent,
            tax_percent: price.tax_percent,
            subtotal: ov.qty * ov.applied_price,
            base_price: ov.base_price,
          } as ProfessionalItem & { base_price: number };
        })
        .filter(Boolean) as (ProfessionalItem & { base_price: number })[],
    [selectedProfessionals, priceList],
  );

  const allPricedItems: PricedItem[] = useMemo(
    () => [
      ...servicesList.map((item) => ({ quantity: item.quantity, unit_price: item.unit_price, cost_base: item.cost_base, price_base: item.price_base, fee_percent: item.fee_percent, tax_percent: item.tax_percent, name: item.name })),
      ...reelsList.map((item) => ({ quantity: item.quantity, unit_price: item.unit_price, cost_base: item.cost_base, price_base: item.price_base, fee_percent: item.fee_percent, tax_percent: item.tax_percent, name: item.name })),
      ...equipmentList.map((item) => ({ quantity: item.days, unit_price: item.daily_rate, cost_base: item.cost_base, price_base: item.price_base, fee_percent: item.fee_percent, tax_percent: item.tax_percent, name: item.name })),
      ...professionalsList.map((item) => ({ quantity: item.days, unit_price: item.daily_rate, cost_base: item.cost_base, price_base: item.price_base, fee_percent: item.fee_percent, tax_percent: item.tax_percent, name: item.name })),
    ],
    [servicesList, reelsList, equipmentList, professionalsList],
  );

  // categorySummary not used as a separate prop – computed inline in LivePreview

  const financials = useMemo(() => calcFinancials(allPricedItems, settings), [allPricedItems, settings]);

  // ── Validação por etapa ───────────────────────────────────────────
  function canContinue() {
    if (step === 1) return client.name.trim() !== '' && client.email.trim() !== '' && lgpdConsent;
    if (step === 2) return project.name.trim() !== '';
    if (step === 3) return production.delivery_days > 0 && production.city.trim() !== '';
    if (step === 4) return Object.keys(selectedServices).length > 0;
    return true;
  }

  // ── Salvar orçamento ──────────────────────────────────────────────
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
      project_type: project.type as ProjectType,
      project_description: project.description,
      production,
      services: servicesList.map((item) => ({
        ...item,
        id: generateId(),
        budget_id: budgetId,
        custom_pricing: item.custom_pricing,
        price_list_id: item.id,
      })),
      reels: reelsList.map((item) => ({ ...item, id: generateId() })),
      equipment: equipmentList.map((item) => ({ ...item, id: generateId() })),
      professionals: professionalsList.map((item) => ({ ...item, id: generateId() })),
      status,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      expires_at: expires.toISOString(),
      expiration_date: expires.toISOString(),
      proposal_date: now.toISOString(),
      online_slug: `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${budgetId.slice(0, 6)}`,
      cost_total: financials.cost_total,
      fee_value: financials.fee_value,
      tax_value: financials.tax_value,
      final_price: financials.final_price,
      profit: financials.profit,
      margin: financials.margin,
      material_bruto_value: financials.material_bruto_value,
      type: project.type as ProjectType,
      budget_date: now.toISOString(),
      client_phone: client.whatsapp,
    };

    await supabase.from('clients').insert({ id: clientId, ...client, created_at: now.toISOString() });
    await supabase.from('budgets').insert(budget);
    await supabase.from('budget_items').insert(budget.services || []);
    clearDraft();
    setSaving(false);
    navigate(`/budgets/${budgetId}`);
  }

  // ── Limpar orçamento ──────────────────────────────────────────────
  function handleClear() {
    clearDraft();
    setDraftRaw({ ...EMPTY_DRAFT });
    setStep(1);
    setShowClearConfirm(false);
  }

  // ─────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────
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
              Clique nos serviços para adicionar. Valores são personalizáveis por orçamento sem alterar a tabela global.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-center text-xs text-white/45">
              Taxa {settings.fee_percentage}% · Imposto {settings.tax_percentage}% · Validade {settings.proposal_validity_days} dias
            </div>
            <button
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-400 transition hover:bg-red-500/20"
            >
              <Trash2 size={14} /> Limpar orçamento
            </button>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[260px_1fr_340px]">
          {/* Sidebar de etapas */}
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
                    active ? 'bg-white text-black' : done ? 'bg-white/10 text-white' : 'text-white/35 hover:bg-white/5 hover:text-white/70'
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${active ? 'bg-black text-white' : 'bg-white/10 text-white/70'}`}>
                    {done ? <Check size={14} /> : number}
                  </span>
                  <span className="min-w-0 truncate text-sm font-medium">{label}</span>
                </button>
              );
            })}
          </aside>

          {/* Conteúdo principal */}
          <main className="min-h-[620px]">
            <AnimatePresence mode="wait">

              {/* STEP 1 — CLIENTE */}
              {step === 1 && (
                <StepPanel key="client" title={t.steps.client} subtitle="Informações comerciais essenciais.">
                  <Input label={t.clientName} value={client.name}
                    onChange={(v) => setDraft((p) => ({ ...p, client: { ...p.client, name: v } }))} placeholder="Nome do contato" />
                  <Input label={t.company} value={client.company}
                    onChange={(v) => setDraft((p) => ({ ...p, client: { ...p.client, company: v } }))} placeholder="Nome da empresa" />
                  <Input label={t.whatsapp} value={client.whatsapp}
                    onChange={(v) => setDraft((p) => ({ ...p, client: { ...p.client, whatsapp: v } }))} placeholder="(31) 99999-9999" />
                  <Input label={t.emailField} value={client.email}
                    onChange={(v) => setDraft((p) => ({ ...p, client: { ...p.client, email: v } }))} placeholder="cliente@empresa.com" />
                  <div className="sm:col-span-2 mt-4 flex items-start gap-3 rounded-2xl border border-white/5 bg-white/[0.02] p-4">
                    <input type="checkbox" id="lgpd" checked={lgpdConsent}
                      onChange={(e) => setDraft((p) => ({ ...p, lgpdConsent: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-white/10 bg-black/30 accent-amber-400" />
                    <label htmlFor="lgpd" className="text-xs leading-5 text-white/50 select-none cursor-pointer">
                      Confirmo que o cliente autorizou a coleta e o armazenamento de seus dados comerciais para fins exclusivos de elaboração e validade deste orçamento, em conformidade com a LGPD (Lei nº 13.709/18).
                    </label>
                  </div>
                </StepPanel>
              )}

              {/* STEP 2 — PROJETO */}
              {step === 2 && (
                <StepPanel key="project" title={t.steps.project} subtitle="Defina o formato e o escopo do projeto.">
                  <Input label={t.projectName} value={project.name}
                    onChange={(v) => setDraft((p) => ({ ...p, project: { ...p.project, name: v } }))}
                    placeholder="Nome da campanha ou produção" wide />
                  <div className="sm:col-span-2">
                    <Label>{t.projectType}</Label>
                    <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                      {PROJECT_TYPES.map((type) => (
                        <button key={type} onClick={() => setDraft((p) => ({ ...p, project: { ...p.project, type } }))}
                          className={`rounded-xl border px-3 py-3 text-left text-sm transition whitespace-normal break-words ${
                            project.type === type ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white'
                          }`}>
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <Label>Escopo do projeto</Label>
                    <textarea value={project.description}
                      onChange={(e) => setDraft((p) => ({ ...p, project: { ...p.project, description: e.target.value } }))}
                      rows={6}
                      className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-white transition focus:border-white/35"
                      placeholder="Descreva o briefing, objetivos da produção, referências visuais, tom de comunicação, formato de entrega e observações importantes." />
                  </div>
                  <div className="sm:col-span-2 border-t border-white/10 pt-5">
                    <Label>Modelos</Label>
                    <div className="grid gap-3 md:grid-cols-3">
                      {templates.map((template) => (
                        <button key={template.id} onClick={() => applyTemplate(template)}
                          className="group flex min-h-[130px] flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06]">
                          <Copy size={15} className="mb-4 shrink-0 text-white/35 group-hover:text-white" />
                          <p className="truncate text-sm font-medium text-white">{template.name}</p>
                          <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/35">{template.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </StepPanel>
              )}

              {/* STEP 3 — PRODUÇÃO */}
              {step === 3 && (
                <StepPanel key="production" title={t.steps.production} subtitle="Dados de operação que impactam logística e calendário.">
                  <Input label={t.deliveryTime} type="number" value={String(production.delivery_days)}
                    onChange={(v) => setDraft((p) => ({ ...p, production: { ...p.production, delivery_days: Number(v) } }))} />
                  <Input label={t.city} value={production.city}
                    onChange={(v) => setDraft((p) => ({ ...p, production: { ...p.production, city: v } }))} />
                  <Toggle label={t.needTransportation} checked={production.need_transportation}
                    onChange={(v) => setDraft((p) => ({ ...p, production: { ...p.production, need_transportation: v } }))} />
                  <Toggle label={t.needLodging} checked={production.need_lodging}
                    onChange={(v) => setDraft((p) => ({ ...p, production: { ...p.production, need_lodging: v } }))} />
                </StepPanel>
              )}

              {/* STEP 4 — SERVIÇOS */}
              {step === 4 && (
                <>
                  <SelectStep
                    title={t.steps.services}
                    subtitle="Clique nos itens para adicionar. Configure valor e quantidade no modal."
                    categories={SELECTABLE_CATEGORIES}
                    priceList={priceList}
                    selected={selectedServices}
                    onToggle={(price) => handleServiceClick(price)}
                    onEdit={(price) => openItemModal(price, 'services')}
                  />
                  {Object.keys(selectedReels).length > 0 && (
                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                      <h4 className="mb-3 text-xs uppercase tracking-[0.28em] text-white/30">Reels adicionados</h4>
                      <div className="space-y-2">
                        {Object.entries(selectedReels).map(([priceId, ov]) => {
                          const price = priceList.find((p) => p.id === priceId);
                          if (!price) return null;
                          return (
                            <div key={priceId} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-white">{price.name}</p>
                                <p className="text-xs text-white/40">{formatCurrency(ov.applied_price)} por unidade
                                  {ov.applied_price !== ov.base_price && <span className="ml-2 text-yellow-400">• Personalizado</span>}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button onClick={() => openItemModal(price, 'reels')} className="rounded-lg border border-white/10 px-2 py-1 text-xs text-white/50 hover:text-white">Editar</button>
                                <button onClick={() => removeItem('reels', priceId)} className="rounded-lg p-2 text-white/30 hover:text-red-400"><X size={14} /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* STEP 5 — EQUIPAMENTOS */}
              {step === 5 && (
                <SelectStep
                  title={t.steps.equipment}
                  subtitle="Clique para adicionar. Configure diária e dias no modal."
                  categories={['Equipamentos']}
                  priceList={priceList}
                  selected={selectedEquipment}
                  onToggle={(price) => openItemModal(price, 'equipment')}
                  onEdit={(price) => openItemModal(price, 'equipment')}
                />
              )}

              {/* STEP 6 — EQUIPE */}
              {step === 6 && (
                <SelectStep
                  title={t.steps.professionals}
                  subtitle="Clique para adicionar membros da equipe. Configure diária e dias no modal."
                  categories={['Equipe']}
                  priceList={priceList}
                  selected={selectedProfessionals}
                  onToggle={(price) => openItemModal(price, 'professionals')}
                  onEdit={(price) => openItemModal(price, 'professionals')}
                />
              )}

              {/* STEP 7 — RESUMO FINANCEIRO */}
              {step === 7 && (
                <FinancialStep
                  financials={financials}
                  servicesList={servicesList as (BudgetItem & { base_price: number })[]}
                  reelsList={reelsList as (ReelItem & { base_price: number })[]}
                  equipmentList={equipmentList as (EquipmentItem & { base_price: number })[]}
                  professionalsList={professionalsList as (ProfessionalItem & { base_price: number })[]}
                  onUpdateService={(priceId, patch) => updateOverride('services', priceId, patch)}
                  onRestoreService={(priceId) => restoreBasePrice('services', priceId)}
                  onUpdateReel={(priceId, patch) => updateOverride('reels', priceId, patch)}
                  onRestoreReel={(priceId) => restoreBasePrice('reels', priceId)}
                  onUpdateEquipment={(priceId, patch) => updateOverride('equipment', priceId, patch)}
                  onRestoreEquipment={(priceId) => restoreBasePrice('equipment', priceId)}
                  onUpdateProfessional={(priceId, patch) => updateOverride('professionals', priceId, patch)}
                  onRestoreProfessional={(priceId) => restoreBasePrice('professionals', priceId)}
                />
              )}

              {/* STEP 8 — PROPOSTA */}
              {step === 8 && <ProposalStep onSave={saveBudget} saving={saving} />}

            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
              <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}
                className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white disabled:opacity-25">
                <ChevronLeft size={16} /> {t.backBtn}
              </button>
              {step < 8 ? (
                <button onClick={() => setStep(step + 1)} disabled={!canContinue()}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-30">
                  {t.continue} <ArrowRight size={16} />
                </button>
              ) : (
                <button onClick={() => saveBudget('Sent')} disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-30">
                  {saving ? 'Salvando...' : t.finish} <Check size={16} />
                </button>
              )}
            </div>
          </main>

          {/* Preview lateral */}
          <aside className="lg:sticky lg:top-8 lg:h-fit">
            <LivePreview
              servicesList={servicesList}
              reelsList={reelsList}
              equipmentList={equipmentList}
              professionalsList={professionalsList}
              financials={financials}
            />
          </aside>
        </div>
      </div>

      {/* Modal de configuração de item (novo comportamento) */}
      {itemModal && (
        <ItemConfigModal
          modal={itemModal}
          group={itemModal.group}
          onConfirm={confirmItemModal}
          onCancel={() => setItemModal(null)}
        />
      )}

      {/* Modal de variante (Edição Reel vs Wide) */}
      {variantModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setVariantModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#131315] p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="font-display text-xl text-white">Selecionar formato</h3>
              <button onClick={() => setVariantModal(null)} className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"><X size={18} /></button>
            </div>
            <p className="mb-6 text-sm text-white/50">
              "{variantModal.price.name}" está disponível em dois formatos. Escolha qual adicionar:
            </p>
            <div className="space-y-3">
              <button onClick={() => selectVariant('Reels')}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06]">
                <p className="text-sm font-medium text-white">Edição de Reel</p>
                <p className="mt-1 text-xs text-white/40">Formato vertical para redes sociais</p>
                <p className="mt-2 text-sm font-display text-white">{formatCurrency(priceList.find((p) => p.name === 'Edição de Reel')?.sale_price || 180)}</p>
              </button>
              <button onClick={() => selectVariant('Wide')}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06]">
                <p className="text-sm font-medium text-white">Edição de Vídeo (Wide)</p>
                <p className="mt-1 text-xs text-white/40">Formato horizontal 16:9</p>
                <p className="mt-2 text-sm font-display text-white">{formatCurrency(priceList.find((p) => p.name === 'Edição de Vídeo')?.sale_price || 3600)}</p>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Modal de confirmação para limpar orçamento */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm rounded-3xl border border-red-500/20 bg-[#131315] p-6 shadow-2xl">
            <h3 className="font-display text-xl text-white mb-3">Limpar orçamento?</h3>
            <p className="text-sm text-white/50 mb-6">Todos os dados deste orçamento serão apagados permanentemente. Esta ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowClearConfirm(false)}
                className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/60 hover:bg-white/5">
                Cancelar
              </button>
              <button onClick={handleClear}
                className="flex-1 rounded-xl bg-red-500/80 py-3 text-sm font-medium text-white hover:bg-red-500">
                Sim, limpar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Modal de configuração de item (novo comportamento)
// ═══════════════════════════════════════════════════════════════════
function ItemConfigModal({
  modal,
  group,
  onConfirm,
  onCancel,
}: {
  modal: ItemModal;
  group: string;
  onConfirm: (qty: number, applied_price: number) => void;
  onCancel: () => void;
}) {
  const { price, currentOverride } = modal;
  const [qty, setQty] = useState(currentOverride?.qty ?? 1);
  const [appliedPrice, setAppliedPrice] = useState(currentOverride?.applied_price ?? price.sale_price);
  const isEquipOrPro = group === 'equipment' || group === 'professionals';
  const isCustom = appliedPrice !== price.sale_price;
  const subtotal = qty * appliedPrice;

  const qtyLabel = isEquipOrPro ? 'Diárias / Dias' : 'Quantidade';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#131315] p-7 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-accent mb-1">{price.category}</p>
            <h3 className="font-display text-2xl text-white break-words leading-tight">{price.name}</h3>
            <p className="mt-1 text-sm text-white/40">Valor base da tabela: <span className="text-white/70">{formatCurrency(price.sale_price)}</span></p>
          </div>
          <button onClick={onCancel} className="shrink-0 rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"><X size={18} /></button>
        </div>

        {/* Campos */}
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">{qtyLabel}</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setQty(Math.max(1, qty - 1))}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-white/60 hover:text-white">
                <Minus size={16} />
              </button>
              <input type="number" value={qty} min={1}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="flex-1 rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-center text-lg font-display font-semibold text-white focus:border-white/35" />
              <button onClick={() => setQty(qty + 1)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-white/60 hover:text-white">
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs uppercase tracking-[0.22em] text-white/35">Valor neste orçamento</label>
              {isCustom && (
                <button onClick={() => setAppliedPrice(price.sale_price)}
                  className="flex items-center gap-1 rounded-lg text-xs text-amber-400 hover:text-amber-300">
                  <RotateCcw size={12} /> Restaurar base
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/40">R$</span>
              <input type="number" value={appliedPrice} min={0}
                onChange={(e) => setAppliedPrice(Math.max(0, Number(e.target.value)))}
                className="w-full rounded-xl border border-white/10 bg-black/30 pl-9 pr-4 py-2.5 text-base text-white focus:border-white/35" />
            </div>
            {isCustom && (
              <p className="mt-1.5 text-xs text-amber-400">
                ⚠ Valor personalizado — tabela global permanece R$ {price.sale_price.toLocaleString('pt-BR')}
              </p>
            )}
          </div>

          {/* Subtotal */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-white/30">Subtotal</span>
              <span className="font-display text-2xl text-white">{formatCurrency(subtotal)}</span>
            </div>
            {qty > 1 && (
              <p className="mt-1 text-xs text-white/35 text-right">
                {qty} × {formatCurrency(appliedPrice)}
              </p>
            )}
          </div>
        </div>

        {/* Botões */}
        <div className="mt-6 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-white/60 transition hover:bg-white/5">
            Cancelar
          </button>
          <button onClick={() => onConfirm(qty, appliedPrice)}
            className="flex-1 rounded-xl bg-white py-3 text-sm font-semibold text-black transition hover:bg-white/90">
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Etapa de Seleção (clicar e selecionar)
// ═══════════════════════════════════════════════════════════════════
function SelectStep({
  title, subtitle, categories, priceList, selected, onToggle, onEdit,
}: {
  title: string;
  subtitle: string;
  categories: string[];
  priceList: PriceListItem[];
  selected: Record<string, DraftItemOverride>;
  onToggle: (price: PriceListItem) => void;
  onEdit: (price: PriceListItem) => void;
}) {
  return (
    <StepPanel title={title} subtitle={subtitle}>
      <div className="sm:col-span-2 space-y-8">
        {categories.map((category) => {
          const items = priceList.filter((p) => p.category === category && p.active !== false);
          if (!items.length) return null;
          return (
            <section key={category}>
              <h4 className="mb-3 text-xs uppercase tracking-[0.28em] text-white/30">{category}</h4>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((price) => {
                  const ov = selected[price.id];
                  const isSelected = !!ov;
                  const isCustom = isSelected && ov.applied_price !== ov.base_price;
                  return (
                    <div key={price.id}
                      className={`group relative min-h-[110px] w-full rounded-2xl border p-4 transition ${
                        isSelected
                          ? isCustom
                            ? 'border-yellow-500/50 bg-yellow-500/10 text-black'
                            : 'border-white bg-white text-black'
                          : 'border-white/10 bg-white/[0.03] text-white hover:border-white/25 hover:bg-white/[0.06]'
                      }`}
                    >
                      <button onClick={() => onToggle(price)} className="mb-3 flex w-full items-start justify-between gap-2 text-left">
                        <p className={`min-w-0 flex-1 text-sm font-medium break-words ${isSelected ? (isCustom ? 'text-yellow-100' : 'text-black') : 'text-white'}`}>
                          {price.name}
                        </p>
                        <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          isSelected ? 'bg-black text-white' : 'bg-white/10 text-white/50'
                        }`}>
                          {isSelected ? <Check size={14} /> : <Plus size={14} />}
                        </span>
                      </button>
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className={`truncate font-medium ${isSelected ? (isCustom ? 'text-yellow-200' : 'text-black/70') : 'text-white/50'}`}>
                          {isSelected && isCustom
                            ? <><span className="line-through opacity-50">R$ {price.sale_price.toLocaleString('pt-BR')}</span> → R$ {ov.applied_price.toLocaleString('pt-BR')}</>
                            : `R$ ${price.sale_price.toLocaleString('pt-BR')}`}
                        </span>
                        {isSelected && (
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isCustom ? 'text-yellow-200' : 'text-black'}`}>×{ov.qty}</span>
                            <button onClick={(e) => { e.stopPropagation(); onEdit(price); }}
                              className={`rounded-lg px-2 py-0.5 text-[10px] font-medium transition ${
                                isCustom ? 'border border-yellow-400/30 bg-yellow-400/10 text-yellow-300 hover:bg-yellow-400/20' : 'border border-black/20 bg-black/10 text-black/60 hover:bg-black/20'
                              }`}>
                              Editar
                            </button>
                          </div>
                        )}
                      </div>
                      {isSelected && isCustom && (
                        <div className="mt-2">
                          <span className="inline-flex items-center rounded-full bg-yellow-400/20 px-2 py-0.5 text-[10px] font-semibold text-yellow-300">
                            Valor personalizado
                          </span>
                        </div>
                      )}
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

// ═══════════════════════════════════════════════════════════════════
// Etapa Financeira — edição inline no relatório final
// ═══════════════════════════════════════════════════════════════════
function FinancialStep({
  financials,
  servicesList, reelsList, equipmentList, professionalsList,
  onUpdateService, onRestoreService,
  onUpdateReel, onRestoreReel,
  onUpdateEquipment, onRestoreEquipment,
  onUpdateProfessional, onRestoreProfessional,
}: {
  financials: ReturnType<typeof calcFinancials>;
  servicesList: (BudgetItem & { base_price: number })[];
  reelsList: (ReelItem & { base_price: number })[];
  equipmentList: (EquipmentItem & { base_price: number })[];
  professionalsList: (ProfessionalItem & { base_price: number })[];
  onUpdateService: (id: string, p: Partial<DraftItemOverride>) => void;
  onRestoreService: (id: string) => void;
  onUpdateReel: (id: string, p: Partial<DraftItemOverride>) => void;
  onRestoreReel: (id: string) => void;
  onUpdateEquipment: (id: string, p: Partial<DraftItemOverride>) => void;
  onRestoreEquipment: (id: string) => void;
  onUpdateProfessional: (id: string, p: Partial<DraftItemOverride>) => void;
  onRestoreProfessional: (id: string) => void;
}) {
  return (
    <StepPanel title={t.steps.financial} subtitle="Edite valores e quantidades diretamente. Recalculo automático instantâneo.">
      {/* TOTAL GERAL */}
      <div className="sm:col-span-2 rounded-3xl border border-accent/30 bg-accent/[0.06] p-8">
        <p className="mb-2 text-xs uppercase tracking-[0.22em] text-accent">{t.finalPriceLabel}</p>
        <p className="font-display text-5xl text-white md:text-7xl">
          {financials.final_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <FinMetric label="Subtotal" value={financials.subtotal} />
          <FinMetric label={`Fee (${t.fee})`} value={financials.fee_value} />
          <FinMetric label={`Impostos (${t.tax})`} value={financials.tax_value} />
        </div>
      </div>

      {/* TABELAS EDITÁVEIS */}
      {servicesList.length > 0 && (
        <div className="sm:col-span-2">
          <EditableItemTable
            title="Serviços"
            items={servicesList.map((item) => ({
              id: item.price_list_id || item.id,
              name: item.name,
              category: item.category,
              qty: item.quantity,
              unit_price: item.unit_price,
              base_price: item.base_price,
              subtotal: item.subtotal,
            }))}
            onUpdate={(id, patch) => onUpdateService(id, patch)}
            onRestore={(id) => onRestoreService(id)}
            qtyLabel="Qtd"
          />
        </div>
      )}
      {reelsList.length > 0 && (
        <div className="sm:col-span-2">
          <EditableItemTable
            title="Reels"
            items={reelsList.map((item) => ({
              id: item.id,
              name: item.name,
              category: 'Reels',
              qty: item.quantity,
              unit_price: item.unit_price,
              base_price: item.base_price,
              subtotal: item.subtotal,
            }))}
            onUpdate={(id, patch) => onUpdateReel(id, patch)}
            onRestore={(id) => onRestoreReel(id)}
            qtyLabel="Qtd"
          />
        </div>
      )}
      {equipmentList.length > 0 && (
        <div className="sm:col-span-2">
          <EditableItemTable
            title="Equipamentos"
            items={equipmentList.map((item) => ({
              id: item.id,
              name: item.name,
              category: 'Equipamentos',
              qty: item.days,
              unit_price: item.daily_rate,
              base_price: item.base_price,
              subtotal: item.subtotal,
            }))}
            onUpdate={(id, patch) => onUpdateEquipment(id, patch)}
            onRestore={(id) => onRestoreEquipment(id)}
            qtyLabel="Diárias"
          />
        </div>
      )}
      {professionalsList.length > 0 && (
        <div className="sm:col-span-2">
          <EditableItemTable
            title="Equipe"
            items={professionalsList.map((item) => ({
              id: item.id,
              name: item.name,
              category: 'Equipe',
              qty: item.days,
              unit_price: item.daily_rate,
              base_price: item.base_price,
              subtotal: item.subtotal,
            }))}
            onUpdate={(id, patch) => onUpdateProfessional(id, patch)}
            onRestore={(id) => onRestoreProfessional(id)}
            qtyLabel="Diárias"
          />
        </div>
      )}

      {/* CONTROLE INTERNO */}
      <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45">
        <SlidersHorizontal size={18} className="mb-3 text-accent" />
        {t.materialBrutoNote}
      </div>
    </StepPanel>
  );
}

// Tabela editável de itens no relatório final
interface EditableRow {
  id: string;
  name: string;
  category: string;
  qty: number;
  unit_price: number;
  base_price: number;
  subtotal: number;
}

function EditableItemTable({
  title, items, onUpdate, onRestore, qtyLabel,
}: {
  title: string;
  items: EditableRow[];
  onUpdate: (id: string, patch: Partial<DraftItemOverride>) => void;
  onRestore: (id: string) => void;
  qtyLabel: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-5 py-3">
        <h4 className="min-w-0 truncate text-sm font-semibold text-white">{title}</h4>
        <p className="shrink-0 text-xs text-white/30">{items.length} {items.length === 1 ? 'item' : 'itens'}</p>
      </div>
      {/* Cabeçalho: aparece apenas em telas muito largas para não sobrepor textos */}
      <div className="hidden 2xl:grid 2xl:grid-cols-[minmax(180px,1fr)_76px_128px_132px_106px] gap-4 bg-black/20 px-5 py-2 text-[10px] uppercase tracking-wider text-white/30">
        <span>Item</span>
        <span>{qtyLabel}</span>
        <span>Valor Unit.</span>
        <span>Total</span>
        <span></span>
      </div>
      {/* Linhas editáveis */}
      {items.map((item) => {
        const isCustom = item.unit_price !== item.base_price;
        const total = item.qty * item.unit_price;
        return (
          <div key={item.id}
            className={`grid grid-cols-1 gap-4 border-b border-white/5 px-5 py-4 last:border-0 2xl:grid-cols-[minmax(180px,1fr)_76px_128px_132px_106px] 2xl:items-center ${
              isCustom ? 'bg-yellow-500/5' : ''
            }`}
          >
            <div className="min-w-0">
              <p className="break-words text-sm font-medium leading-5 text-white" title={item.name}>{item.name}</p>
              <p className="mt-0.5 truncate text-xs text-white/35">{item.category}</p>
              {isCustom && <span className="mt-2 inline-block rounded-full bg-yellow-400/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">Valor personalizado</span>}
            </div>
            {/* Quantidade */}
            <label className="block min-w-0">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/25 2xl:hidden">{qtyLabel}</span>
              <input type="number" value={item.qty} min={1}
                onChange={(e) => onUpdate(item.id, { qty: Math.max(1, Number(e.target.value)) })}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-center text-sm text-white focus:border-white/35" />
            </label>
            {/* Valor unitário */}
            <label className="block min-w-0">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/25 2xl:hidden">Valor unit.</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/35">R$</span>
                <input type="number" value={item.unit_price} min={0}
                  onChange={(e) => onUpdate(item.id, { applied_price: Math.max(0, Number(e.target.value)) })}
                  className={`w-full rounded-xl border bg-black/30 py-2 pl-8 pr-3 text-sm text-white focus:border-white/35 ${
                    isCustom ? 'border-yellow-500/30' : 'border-white/10'
                  }`} />
              </div>
            </label>
            {/* Total */}
            <div className="min-w-0">
              <span className="mb-1 block text-[10px] uppercase tracking-wider text-white/25 2xl:hidden">Total</span>
              <p className="break-words font-display text-base font-semibold leading-5 text-white 2xl:text-sm">
                {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            {/* Restaurar */}
            <button onClick={() => onRestore(item.id)}
              title={`Restaurar valor base: R$ ${item.base_price.toLocaleString('pt-BR')}`}
              disabled={!isCustom}
              className={`inline-flex w-fit items-center gap-1 rounded-xl px-3 py-2 text-xs transition ${
                isCustom
                  ? 'border border-yellow-500/20 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 cursor-pointer'
                  : 'border border-white/5 text-white/20 cursor-not-allowed'
              }`}>
              <RotateCcw size={12} /> Restaurar
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Proposta
// ═══════════════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════════════
// Live Preview
// ═══════════════════════════════════════════════════════════════════
function LivePreview({
  servicesList, reelsList, equipmentList, professionalsList, financials,
}: {
  servicesList: (BudgetItem & { base_price: number })[];
  reelsList: (ReelItem & { base_price: number })[];
  equipmentList: (EquipmentItem & { base_price: number })[];
  professionalsList: (ProfessionalItem & { base_price: number })[];
  financials: ReturnType<typeof calcFinancials>;
}) {
  const hasCustom =
    servicesList.some((i) => i.custom_pricing) ||
    reelsList.some((i) => i.unit_price !== i.base_price) ||
    equipmentList.some((i) => i.daily_rate !== i.base_price) ||
    professionalsList.some((i) => i.daily_rate !== i.base_price);
  const hasAny = servicesList.length + reelsList.length + equipmentList.length + professionalsList.length > 0;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-accent/30 bg-accent/[0.06] p-5">
        <div className="flex items-start justify-between mb-1">
          <p className="text-xs uppercase tracking-[0.22em] text-accent">Total Geral</p>
          {hasCustom && (
            <span className="rounded-full bg-yellow-400/15 px-2 py-0.5 text-[10px] font-semibold text-yellow-400">
              Valores personalizados
            </span>
          )}
        </div>
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

      {hasAny && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
          <p className="mb-3 text-xs uppercase tracking-[0.22em] text-white/30">Por categoria</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-white/55">Serviços</span><span>{servicesList.reduce((s,i)=>s+i.subtotal,0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div>
            {reelsList.length > 0 && <div className="flex justify-between"><span className="text-white/55">Reels</span><span>{reelsList.reduce((s,i)=>s+i.subtotal,0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div>}
            {equipmentList.length > 0 && <div className="flex justify-between"><span className="text-white/55">Equipamentos</span><span>{equipmentList.reduce((s,i)=>s+i.subtotal,0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div>}
            {professionalsList.length > 0 && <div className="flex justify-between"><span className="text-white/55">Equipe</span><span>{professionalsList.reduce((s,i)=>s+i.subtotal,0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})}</span></div>}
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

// ═══════════════════════════════════════════════════════════════════
// Helpers de UI
// ═══════════════════════════════════════════════════════════════════
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

function Input({ label, value, onChange, placeholder, type = 'text', wide }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; wide?: boolean;
}) {
  return (
    <div className={wide ? 'sm:col-span-2' : ''}>
      <Label>{label}</Label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition focus:border-white/35" />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)}
      className={`rounded-2xl border p-5 text-left transition ${
        checked ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25'
      }`}>
      <span className="block text-sm font-medium break-words">{label}</span>
      <span className="mt-3 block text-xs opacity-55">{checked ? t.enabled : t.disabled}</span>
    </button>
  );
}

function FinMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30">{label}</p>
      <p className="mt-1 font-display text-lg text-white">{value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
    </div>
  );
}

function Action({ label, onClick, primary, icon: Icon = Save }: {
  label: string; onClick: () => void; primary?: boolean; icon?: React.ElementType;
}) {
  return (
    <button onClick={onClick}
      className={`flex min-w-0 items-center gap-3 rounded-2xl border p-5 text-left transition ${
        primary ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.03] text-white hover:border-white/25'
      }`}>
      <Icon size={18} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{label}</span>
    </button>
  );
}
