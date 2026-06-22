import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Search, SlidersHorizontal } from 'lucide-react';
import { Layout } from '../components/Layout';
import { formatCurrency, getSettings, supabase } from '../lib/supabase';
import type { PriceListItem, SystemSettings } from '../types';

export function PriceList() {
  const [items, setItems] = useState<PriceListItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(getSettings());
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');

  useEffect(() => { load(); }, []);

  async function load() {
    const priceResult = await supabase.from('price_list').select().data();
    const settingsResult = await supabase.from('system_settings').select().data();
    setItems((priceResult.data || []) as PriceListItem[]);
    setSettings(((settingsResult.data || []) as SystemSettings[])[0] || getSettings());
  }

  async function updatePrice(id: string, updates: Partial<PriceListItem>) {
    const next = items.map((item) => (item.id === id ? { ...item, ...updates, updated_at: new Date().toISOString() } : item));
    setItems(next);
    await supabase.from('price_list').update(updates).eq('id', id);
  }

  async function saveSettings() {
    await supabase.from('system_settings').update(settings).eq('id', settings.id);
    alert('Configurações salvas.');
  }

  const categories = useMemo(() => ['all', ...Array.from(new Set(items.map((item) => item.category)))], [items]);
  const filtered = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'all' || item.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <Layout>
      <div className="mx-auto max-w-6xl space-y-8">
        <motion.header initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4 border-b border-white/10 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="mb-3 text-xs uppercase tracking-[0.34em] text-accent">Master Pricing Source 2025</p>
            <h1 className="truncate font-display text-4xl text-white md:text-5xl">Price List</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/45">Lista editável de serviços com preço de venda, custo interno e configurações globais do sistema.</p>
          </div>
          <button onClick={saveSettings} className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-white/90"><Save size={16} />Salvar</button>
        </motion.header>

        <section className="grid gap-4 md:grid-cols-3">
          <Setting label="Fee %" value={settings.fee_percentage} onChange={(value) => setSettings({ ...settings, fee_percentage: value })} suffix="%" />
          <Setting label="Tax %" value={settings.tax_percentage} onChange={(value) => setSettings({ ...settings, tax_percentage: value })} suffix="%" />
          <Setting label="Validity" value={settings.proposal_validity_days} onChange={(value) => setSettings({ ...settings, proposal_validity_days: value })} suffix="days" />
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
          <div className="mb-5 flex flex-col gap-3 md:flex-row">
            <div className="relative flex-1"><Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/25" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar serviço" className="w-full rounded-2xl border border-white/10 bg-black/30 py-3 pl-11 pr-4 text-sm text-white focus:border-white/35" /></div>
            <div className="flex shrink-0 gap-2 overflow-x-auto">{categories.map((cat) => <button key={cat} onClick={() => setCategory(cat)} className={`whitespace-nowrap rounded-xl px-3 py-2 text-xs transition ${category === cat ? 'bg-white text-black' : 'bg-white/5 text-white/45 hover:text-white'}`}>{cat === 'all' ? 'Todos' : cat}</button>)}</div>
          </div>

          <div className="space-y-2">
            {filtered.map((item) => <div key={item.id} className="grid gap-3 rounded-2xl border border-white/10 bg-black/25 p-4 md:grid-cols-[1fr_140px_140px_100px] md:items-center">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{item.name}</p>
                <p className="truncate text-xs text-white/35">{item.category}</p>
              </div>
              <Money label="Sale" value={item.sale_price} onChange={(value) => updatePrice(item.id, { sale_price: value })} />
              <Money label="Cost" value={item.cost_price} onChange={(value) => updatePrice(item.id, { cost_price: value })} />
              <div className="shrink-0 text-right text-xs text-white/35"><p>Spread</p><p className="text-sm text-white/70">{formatCurrency(item.sale_price - item.cost_price)}</p></div>
            </div>)}
          </div>
        </section>
      </div>
    </Layout>
  );
}

function Setting({ label, value, onChange, suffix }: { label: string; value: number; onChange: (value: number) => void; suffix: string }) {
  return <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5"><SlidersHorizontal size={16} className="mb-4 text-accent" /><p className="truncate text-xs uppercase tracking-[0.24em] text-white/30">{label}</p><div className="mt-3 flex items-end gap-2"><input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-20 bg-transparent font-display text-3xl text-white outline-none md:text-4xl" /><span className="shrink-0 pb-2 text-sm text-white/35">{suffix}</span></div></div>;
}

function Money({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
  return <label><span className="mb-1 block text-[10px] uppercase tracking-wider text-white/25">{label}</span><input type="number" value={Math.round(value)} onChange={(e) => onChange(Number(e.target.value))} className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white focus:border-white/35" /></label>;
}
