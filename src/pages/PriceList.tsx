import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Save, Search, SlidersHorizontal, Trash2 } from 'lucide-react';
import { Layout } from '../components/Layout';
import { t } from '../lib/i18n';
import { formatCurrency, generateId, getSettings, supabase } from '../lib/supabase';
import type { PriceListItem, ServiceCategory, SystemSettings } from '../types';

const CATEGORIES: ServiceCategory[] = [
  'Pré Produção',
  'Produção',
  'Fotografia',
  'Pós Produção',
  'Reels',
  'Finalização',
  'Logística',
  'Equipamentos',
  'Profissionais',
  'Extras',
];

export function PriceList() {
  const [items, setItems] = useState<PriceListItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | 'all'>('all');

  useEffect(() => {
    async function load() {
      const [priceResult, settingsResult] = await Promise.all([
        supabase.from('price_list').select().data(),
        supabase.from('system_settings').select().data(),
      ]);
      setItems((priceResult.data || []) as PriceListItem[]);
      setSettings(((settingsResult.data || []) as SystemSettings[])[0] || getSettings());
    }
    load();
  }, []);

  async function updatePrice(id: string, updates: Partial<PriceListItem>) {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item,
      ),
    );
    await supabase.from('price_list').update(updates).eq('id', id);
  }

  async function addItem() {
    const category = activeCategory === 'all' ? CATEGORIES[0] : activeCategory;
    const newItem: PriceListItem = {
      id: generateId(),
      category,
      name: 'Novo item',
      sale_price: 0,
      cost_price: 0,
      active: true,
      updated_at: new Date().toISOString(),
    };
    await supabase.from('price_list').insert(newItem);
    setItems((current) => [...current, newItem]);
  }

  async function removeItem(id: string) {
    if (!confirm('Remover este item da tabela?')) return;
    await supabase.from('price_list').delete().eq('id', id);
    setItems((current) => current.filter((item) => item.id !== id));
  }

  async function saveSettings() {
    await supabase.from('system_settings').update(settings).eq('id', settings.id);
    alert(t.settingsSaved);
  }

  const categoriesInUse = useMemo(() => Array.from(new Set(items.map((item) => item.category))), [items]);

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, activeCategory]);

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between"
        >
          <div>
            <p className="mb-3 text-xs uppercase tracking-[0.34em] text-accent">Master Pricing 2025</p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-white md:text-5xl">
              {t.priceListHeader}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">{t.priceListSubtitle}</p>
          </div>
          <button
            onClick={saveSettings}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"
          >
            <Save size={16} /> {t.saveSettings}
          </button>
        </motion.header>

        <section className="grid gap-4 md:grid-cols-3">
          <SettingField label={t.feePercentage} value={settings.fee_percentage} onChange={(v) => setSettings({ ...settings, fee_percentage: v })} suffix="%" />
          <SettingField label={t.taxPercentage} value={settings.tax_percentage} onChange={(v) => setSettings({ ...settings, tax_percentage: v })} suffix="%" />
          <SettingField label={t.proposalValidity} value={settings.proposal_validity_days} onChange={(v) => setSettings({ ...settings, proposal_validity_days: v })} suffix={t.days.toLowerCase()} />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchService}
                className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white focus:border-white/35"
              />
            </div>
            <button
              onClick={addItem}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white transition hover:border-white/25 hover:bg-white/10"
            >
              <Plus size={16} /> {t.addItem}
            </button>
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <CategoryChip label="Todos" active={activeCategory === 'all'} onClick={() => setActiveCategory('all')} />
            {CATEGORIES.map((cat) => {
              if (!categoriesInUse.includes(cat)) return null;
              return <CategoryChip key={cat} label={cat} active={activeCategory === cat} onClick={() => setActiveCategory(cat)} />;
            })}
          </div>

          <div className="space-y-2">
            {filtered.map((item) => (
              <PriceRow key={item.id} item={item} onUpdate={updatePrice} onRemove={removeItem} />
            ))}
            {filtered.length === 0 && (
              <p className="rounded-2xl border border-dashed border-white/10 px-5 py-8 text-center text-sm text-white/35">
                Nenhum item encontrado
              </p>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

function CategoryChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs transition ${active ? 'bg-white text-black' : 'bg-white/5 text-white/45 hover:text-white'}`}
    >
      {label}
    </button>
  );
}

function PriceRow({
  item,
  onUpdate,
  onRemove,
}: {
  item: PriceListItem;
  onUpdate: (id: string, u: Partial<PriceListItem>) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 overflow-hidden rounded-2xl border border-white/10 bg-black/25 p-4 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_120px_60px] md:items-center">
      <div className="min-w-0">
        <input
          type="text"
          value={item.name}
          onChange={(e) => onUpdate(item.id, { name: e.target.value })}
          className="w-full bg-transparent text-sm font-medium text-white focus:outline-none"
        />
        <p className="mt-1 text-xs text-white/35">{item.category}</p>
      </div>
      <MoneyInput label="Venda" value={item.sale_price} onChange={(v) => onUpdate(item.id, { sale_price: v })} />
      <MoneyInput label="Custo" value={item.cost_price} onChange={(v) => onUpdate(item.id, { cost_price: v })} />
      <div className="text-right text-xs text-white/35">
        <p>Spread</p>
        <p className="truncate text-sm text-white/70" title={formatCurrency(item.sale_price - item.cost_price)}>
          {formatCurrency(item.sale_price - item.cost_price)}
        </p>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="self-center rounded-xl p-2 text-white/30 hover:bg-red-500/10 hover:text-red-400"
        title={t.removeItem}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function SettingField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  suffix: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <SlidersHorizontal size={16} className="mb-5 text-accent" />
      <p className="text-xs uppercase tracking-[0.24em] text-white/30">{label}</p>
      <div className="mt-3 flex items-end gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 bg-transparent font-display text-4xl text-white outline-none"
        />
        <span className="pb-2 text-sm text-white/35">{suffix}</span>
      </div>
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
