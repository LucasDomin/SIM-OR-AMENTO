import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Check, ChevronLeft, Copy, FileText, Link2, Minus, Plus, Save, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Layout } from '../components/Layout';
import { calculateBudget, formatCurrency, generateId, getSettings, supabase } from '../lib/supabase';
import type { Budget, BudgetItem, Deliverables, PriceListItem, ProductionSetup, ProjectType, Template } from '../types';

const steps = ['Client', 'Project', 'Production', 'Services', 'Deliverables', 'Financial', 'Proposal'];
const projectTypes: ProjectType[] = ['Institucional', 'Evento', 'Publicidade', 'Podcast', 'Reels', 'Cobertura', 'Personalizado'];
const categories = ['Pré Produção', 'Produção', 'Fotografia', 'Pós Produção', 'Finalização', 'Logística', 'Equipamentos', 'Extras'];

const defaultProduction: ProductionSetup = { shooting_days: 1, city: 'São Paulo', need_transportation: false, need_lodging: false };
const defaultDeliverables: Deliverables = { videos: 1, photos: 0, reels: 0, pilulas: 0, sameday: false, aftermovie: false, videocase: false };

export function BudgetCreate() {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [client, setClient] = useState({ name: '', company: '', whatsapp: '', email: '' });
  const [project, setProject] = useState({ name: '', type: 'Personalizado' as ProjectType, description: '' });
  const [production, setProduction] = useState<ProductionSetup>(defaultProduction);
  const [deliverables, setDeliverables] = useState<Deliverables>(defaultDeliverables);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const settings = getSettings();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const priceResult = await supabase.from('price_list').select().data();
    const templateResult = await supabase.from('templates').select().data();
    const prices = (priceResult.data || []) as PriceListItem[];
    setPriceList(prices);
    setTemplates((templateResult.data || []) as Template[]);

    const state = location.state as { template?: Template; duplicate?: Budget } | null;
    if (state?.template) applyTemplate(state.template, prices);
    if (state?.duplicate) applyDuplicate(state.duplicate);
  }

  function buildItem(price: PriceListItem, quantity = 1): BudgetItem {
    return {
      id: generateId(),
      budget_id: '',
      price_list_id: price.id,
      category: price.category,
      name: price.name,
      quantity,
      sale_price: price.sale_price,
      cost_price: price.cost_price,
      subtotal_sale: price.sale_price * quantity,
      subtotal_cost: price.cost_price * quantity,
      custom_pricing: false,
      unit_price: price.sale_price,
      subtotal: price.cost_price * quantity,
    };
  }

  function addService(price: PriceListItem) {
    setItems((current) => {
      const found = current.find((item) => item.price_list_id === price.id && !item.custom_pricing);
      if (found) return current.map((item) => (item.id === found.id ? recalcItem({ ...item, quantity: item.quantity + 1 }) : item));
      return [...current, buildItem(price)];
    });
  }

  function recalcItem(item: BudgetItem): BudgetItem {
    return {
      ...item,
      subtotal_sale: item.sale_price * item.quantity,
      subtotal_cost: item.cost_price * item.quantity,
      unit_price: item.sale_price,
      subtotal: item.cost_price * item.quantity,
    };
  }

  function updateItem(id: string, updates: Partial<BudgetItem>) {
    setItems((current) => current.map((item) => (item.id === id ? recalcItem({ ...item, ...updates }) : item)));
  }

  function applyTemplate(template: Template, prices = priceList) {
    setProject((current) => ({ ...current, type: template.project_type }));
    setProduction(template.production);
    setDeliverables(template.deliverables);
    const selected = template.price_item_names
      .map((name) => prices.find((price) => price.name === name))
      .filter(Boolean) as PriceListItem[];
    setItems(selected.map((price) => buildItem(price)));
    setStep(4);
  }

  function applyDuplicate(budget: Budget) {
    setClient({ name: budget.client_name, company: budget.client_company, whatsapp: budget.client_whatsapp, email: budget.client_email });
    setProject({ name: `${budget.project_name} (cópia)`, type: budget.project_type, description: budget.project_description });
    setProduction(budget.production);
    setDeliverables(budget.deliverables);
    setItems(budget.items.map((item) => ({ ...item, id: generateId(), budget_id: '' })));
    setStep(6);
  }

  const financials = useMemo(() => calculateBudget(items, settings), [items, settings]);
  const materialAppliedItems = useMemo(() => {
    return items.map((item) => {
      if (item.name.toLowerCase() !== 'material bruto') return item;
      return recalcItem({ ...item, sale_price: financials.material_bruto_value, cost_price: financials.material_bruto_value, quantity: 1 });
    });
  }, [items, financials.material_bruto_value]);

  function canContinue() {
    if (step === 1) return client.name.trim() && client.email.trim();
    if (step === 2) return project.name.trim() && project.type;
    if (step === 3) return production.shooting_days > 0 && production.city.trim();
    if (step === 4) return items.length > 0;
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
      deliverables,
      status,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      expires_at: expires.toISOString(),
      expiration_date: expires.toISOString(),
      proposal_date: now.toISOString(),
      online_slug: `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${budgetId.slice(0, 6)}`,
      ...financials,
      items: materialAppliedItems.map((item) => ({ ...item, budget_id: budgetId })),
      type: project.type,
      budget_date: now.toISOString(),
      client_phone: client.whatsapp,
    };
    await supabase.from('clients').insert({ id: clientId, ...client, created_at: now.toISOString() });
    await supabase.from('budgets').insert(budget);
    await supabase.from('budget_items').insert(budget.items);
    setSaving(false);
    navigate(`/budgets/${budgetId}`);
  }

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-6 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-3 text-xs uppercase tracking-[0.34em] text-accent">SIM Budget System</p>
            <h1 className="truncate font-display text-3xl font-semibold tracking-tight text-white md:text-4xl">Novo orçamento</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Um fluxo guiado para transformar briefing, produção e investimento em uma proposta premium.</p>
          </div>
          <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-white/45">
            Fee {settings.fee_percentage}% / Tax {settings.tax_percentage}% / {settings.proposal_validity_days} dias
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-2 lg:sticky lg:top-8 lg:h-fit">
            {steps.map((label, index) => {
              const number = index + 1;
              const active = number === step;
              return (
                <button key={label} onClick={() => setStep(number)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${active ? 'bg-white text-black' : number < step ? 'bg-white/10 text-white' : 'text-white/35 hover:bg-white/5 hover:text-white/70'}`}>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs">{active ? <span className="flex h-full w-full items-center justify-center rounded-full bg-black text-white">{number < step ? <Check size={14} /> : number}</span> : <span className="flex h-full w-full items-center justify-center rounded-full bg-white/10 text-white/70">{number < step ? <Check size={14} /> : number}</span>}</span>
                  <span className="truncate text-sm font-medium">{label}</span>
                </button>
              );
            })}
          </aside>

          <main className="min-h-[620px]">
            <AnimatePresence mode="wait">
              {step === 1 && <StepPanel key="client" title="Client" subtitle="Informações comerciais essenciais, sem ruído.">
                <Input label="Client Name" value={client.name} onChange={(value) => setClient({ ...client, name: value })} placeholder="Nome do contato" />
                <Input label="Company" value={client.company} onChange={(value) => setClient({ ...client, company: value })} placeholder="Empresa" />
                <Input label="WhatsApp" value={client.whatsapp} onChange={(value) => setClient({ ...client, whatsapp: value })} placeholder="(11) 99999-9999" />
                <Input label="Email" value={client.email} onChange={(value) => setClient({ ...client, email: value })} placeholder="cliente@empresa.com" />
              </StepPanel>}

              {step === 2 && <StepPanel key="project" title="Project" subtitle="Defina o formato para calibrar a proposta.">
                <Input label="Project Name" value={project.name} onChange={(value) => setProject({ ...project, name: value })} placeholder="Nome da campanha ou produção" wide />
                <div className="sm:col-span-2">
                  <Label>Project Type</Label>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                    {projectTypes.map((type) => <button key={type} onClick={() => setProject({ ...project, type })} className={`truncate rounded-xl border px-3 py-3 text-left text-sm transition ${project.type === type ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25 hover:text-white'}`}>{type}</button>)}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label>Project Description</Label>
                  <textarea value={project.description} onChange={(e) => setProject({ ...project, description: e.target.value })} rows={5} className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition focus:border-white/35" placeholder="Contexto, objetivo, estética, referências e observações de escopo." />
                </div>
                <div className="sm:col-span-2 border-t border-white/10 pt-5">
                  <Label>Templates</Label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {templates.map((template) => <button key={template.id} onClick={() => applyTemplate(template)} className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-white/25 hover:bg-white/[0.06]"><Copy size={15} className="mb-3 text-white/35 group-hover:text-white" /><p className="truncate text-sm font-medium text-white">{template.name}</p><p className="mt-1 line-clamp-2 flex-1 text-xs leading-5 text-white/35">{template.description}</p></button>)}
                  </div>
                </div>
              </StepPanel>}

              {step === 3 && <StepPanel key="production" title="Production Setup" subtitle="Dados de operação que impactam logística e calendário.">
                <Input label="Shooting Days" type="number" value={String(production.shooting_days)} onChange={(value) => setProduction({ ...production, shooting_days: Number(value) })} />
                <Input label="City" value={production.city} onChange={(value) => setProduction({ ...production, city: value })} />
                <Toggle label="Need Transportation?" checked={production.need_transportation} onChange={(value) => setProduction({ ...production, need_transportation: value })} />
                <Toggle label="Need Lodging?" checked={production.need_lodging} onChange={(value) => setProduction({ ...production, need_lodging: value })} />
              </StepPanel>}

              {step === 4 && <StepPanel key="services" title="Services Selection" subtitle="Selecione serviços pela tabela master 2025. Ajustes customizados ficam explícitos.">
                <div className="sm:col-span-2 space-y-8">
                  {categories.map((category) => {
                    const categoryItems = priceList.filter((price) => price.category === category && price.active);
                    if (!categoryItems.length) return null;
                    return <section key={category}><h3 className="mb-3 text-xs uppercase tracking-[0.28em] text-white/30">{category}</h3><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{categoryItems.map((price) => <ServiceCard key={price.id} price={price} selected={items.some((item) => item.price_list_id === price.id)} onClick={() => addService(price)} />)}</div></section>;
                  })}
                  {items.length > 0 && <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
                    <h3 className="mb-4 text-sm font-medium text-white">Selected Services ({items.length})</h3>
                    <div className="space-y-3">
                      {items.map((item) => <div key={item.id} className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-[1fr_80px_120px_120px_40px] md:items-center">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-white">{item.name}</p>
                          <p className="truncate text-xs text-white/35">{item.category}</p>
                        </div>
                        <Stepper value={item.quantity} onChange={(value) => updateItem(item.id, { quantity: value })} />
                        <MoneyInput label="Sale" value={item.sale_price} onChange={(value) => updateItem(item.id, { sale_price: value, custom_pricing: true })} />
                        <MoneyInput label="Cost" value={item.cost_price} onChange={(value) => updateItem(item.id, { cost_price: value, custom_pricing: true })} />
                        <button onClick={() => setItems(items.filter((selected) => selected.id !== item.id))} className="rounded-xl p-2 text-white/30 hover:bg-white/10 hover:text-white"><Minus size={16} /></button>
                      </div>)}
                    </div>
                  </div>}
                </div>
              </StepPanel>}

              {step === 5 && <StepPanel key="deliverables" title="Deliverables" subtitle="A proposta de cliente mostra entregas, não planilhas internas.">
                <Input label="Number of videos" type="number" value={String(deliverables.videos)} onChange={(value) => setDeliverables({ ...deliverables, videos: Number(value) })} />
                <Input label="Number of photos" type="number" value={String(deliverables.photos)} onChange={(value) => setDeliverables({ ...deliverables, photos: Number(value) })} />
                <Input label="Reels" type="number" value={String(deliverables.reels)} onChange={(value) => setDeliverables({ ...deliverables, reels: Number(value) })} />
                <Input label="Pílulas" type="number" value={String(deliverables.pilulas)} onChange={(value) => setDeliverables({ ...deliverables, pilulas: Number(value) })} />
                <Toggle label="Sameday" checked={deliverables.sameday} onChange={(value) => setDeliverables({ ...deliverables, sameday: value })} />
                <Toggle label="Aftermovie" checked={deliverables.aftermovie} onChange={(value) => setDeliverables({ ...deliverables, aftermovie: value })} />
                <Toggle label="Videocase" checked={deliverables.videocase} onChange={(value) => setDeliverables({ ...deliverables, videocase: value })} />
              </StepPanel>}

              {step === 6 && <StepPanel key="financial" title="Financial Summary" subtitle="Resumo interno com custos, imposto, fee e margem.">
                <Summary financials={financials} />
                <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm text-white/45"><SlidersHorizontal size={18} className="mb-3 text-accent" />Material Bruto, quando selecionado, é calculado automaticamente como 20% do preço final do projeto.</div>
              </StepPanel>}

              {step === 7 && <StepPanel key="proposal" title="Proposal Generation" subtitle="Gere arquivos e link online com visão segura para cliente.">
                <Action label="Save Draft" icon={Save} onClick={() => saveBudget('Draft')} />
                <Action label="Generate Sent Budget" icon={FileText} onClick={() => saveBudget('Sent')} primary />
                <Action label="Online proposal link" icon={Link2} onClick={() => saveBudget('Sent')} />
                <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-6 text-white/45"><Sparkles size={18} className="mb-3 text-accent" />A proposta final mostra apenas cliente, projeto, escopo, entregáveis, agenda, investimento final e termos de pagamento.</div>
              </StepPanel>}
            </AnimatePresence>

            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
              <button onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1} className="inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm text-white/45 transition hover:bg-white/5 hover:text-white disabled:opacity-25"><ChevronLeft size={16} />Back</button>
              {step < 7 ? <button onClick={() => setStep(step + 1)} disabled={!canContinue()} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-30">Continue<ArrowRight size={16} /></button> : <button onClick={() => saveBudget('Sent')} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-30">{saving ? 'Saving...' : 'Finish'}<Check size={16} /></button>}
            </div>
          </main>
        </div>
      </div>
    </Layout>
  );
}

function StepPanel({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <motion.section initial={{ opacity: 0, x: 24, filter: 'blur(8px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, x: -24, filter: 'blur(8px)' }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-2xl shadow-black/30 md:p-8"><div className="mb-8"><p className="mb-2 text-xs uppercase tracking-[0.3em] text-accent">{title}</p><h2 className="line-clamp-2 font-display text-2xl text-white md:text-3xl">{subtitle}</h2></div><div className="grid gap-5 sm:grid-cols-2">{children}</div></motion.section>;
}

function Label({ children }: { children: React.ReactNode }) { return <label className="mb-2 block text-xs uppercase tracking-[0.22em] text-white/35">{children}</label>; }
function Input({ label, value, onChange, placeholder, type = 'text', wide }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; wide?: boolean }) { return <div className={wide ? 'sm:col-span-2' : ''}><Label>{label}</Label><input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white transition focus:border-white/35" /></div>; }
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <button onClick={() => onChange(!checked)} className={`rounded-2xl border p-5 text-left transition ${checked ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.03] text-white/55 hover:border-white/25'}`}><span className="text-sm font-medium">{label}</span><span className="mt-3 block text-xs opacity-55">{checked ? 'Enabled' : 'Disabled'}</span></button>; }
function ServiceCard({ price, selected, onClick }: { price: PriceListItem; selected: boolean; onClick: () => void }) { return <button onClick={onClick} className={`group flex flex-col rounded-2xl border p-4 text-left transition ${selected ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.03] text-white hover:border-white/25 hover:bg-white/[0.06]'}`}><div className="mb-4 flex items-start justify-between"><p className="min-w-0 flex-1 truncate text-sm font-medium">{price.name}</p><Plus size={16} className={`shrink-0 ml-2 ${selected ? 'text-black' : 'text-white/30 group-hover:text-white'}`} /></div><div className="flex justify-between text-xs opacity-60"><span>{formatCurrency(price.sale_price)}</span><span>cost {formatCurrency(price.cost_price)}</span></div></button>; }
function Stepper({ value, onChange }: { value: number; onChange: (value: number) => void }) { return <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/30 px-2 py-2"><button onClick={() => onChange(Math.max(1, value - 1))} className="text-white/40 hover:text-white"><Minus size={14} /></button><span className="text-sm text-white">{value}</span><button onClick={() => onChange(value + 1)} className="text-white/40 hover:text-white"><Plus size={14} /></button></div>; }
function MoneyInput({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) { return <label className="block"><span className="mb-1 block text-[10px] uppercase tracking-wider text-white/25">{label}</span><input type="number" value={Math.round(value)} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35" /></label>; }
function Summary({ financials }: { financials: ReturnType<typeof calculateBudget> }) { const rows = [['Total Cost', financials.cost_total], ['Fee', financials.fee_value], ['Tax', financials.tax_value], ['Profit', financials.profit]]; return <div className="sm:col-span-2 rounded-3xl border border-white/10 bg-black/30 p-6"><div className="grid gap-4 md:grid-cols-2">{rows.map(([label, value]) => <div key={String(label)}><p className="text-xs uppercase tracking-[0.22em] text-white/30">{label}</p><p className="mt-2 truncate font-display text-2xl text-white md:text-3xl">{formatCurrency(Number(value))}</p></div>)}<div><p className="text-xs uppercase tracking-[0.22em] text-white/30">Margin</p><p className="mt-2 font-display text-2xl text-white md:text-3xl">{(financials.margin * 100).toFixed(1)}%</p></div><div><p className="text-xs uppercase tracking-[0.22em] text-accent">Final Price</p><p className="mt-2 truncate font-display text-3xl text-white md:text-4xl">{formatCurrency(financials.final_price)}</p></div></div></div>; }
function Action({ label, icon: Icon, onClick, primary }: { label: string; icon: React.ElementType; onClick: () => void; primary?: boolean }) { return <button onClick={onClick} className={`flex items-center gap-3 rounded-2xl border p-5 text-left transition ${primary ? 'border-white bg-white text-black' : 'border-white/10 bg-white/[0.03] text-white hover:border-white/25'}`}><Icon size={18} /><span className="text-sm font-medium">{label}</span></button>; }
