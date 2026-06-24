import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  ArrowRight,
  Trash2,
  AlertCircle,
  Copy,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { BudgetStatusBadge } from '../components/BudgetStatusBadge';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import { t } from '../lib/i18n';
import { clearDraft } from '../lib/draftStorage';
import type { Budget } from '../types';

export function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBudgets();
  }, []);

  async function loadBudgets() {
    const result = await supabase.from('budgets').select().order('created_at', { ascending: false }).data();
    setBudgets((result.data || []) as Budget[]);
    setLoading(false);
  }

  async function deleteBudget(id: string) {
    if (!confirm(t.confirmDelete)) return;
    await supabase.from('budgets').delete().eq('id', id);
    loadBudgets();
  }

  async function duplicateBudget(budget: Budget) {
    navigate('/budgets/new', { state: { duplicate: budget } });
  }

  const filtered = budgets.filter((b) => {
    const matchesSearch =
      b.project_name.toLowerCase().includes(search.toLowerCase()) ||
      b.client_name.toLowerCase().includes(search.toLowerCase()) ||
      b.client_company.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statuses = ['all', 'Draft', 'Sent', 'Approved', 'Rejected', 'Expired'] as const;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-display font-semibold tracking-tight text-white">
              {t.budgets}
            </h1>
            <p className="mt-1 text-sm text-white/40">
              {budgets.length} {budgets.length === 1 ? 'orçamento' : 'orçamentos'} no sistema
            </p>
          </div>
          <button
            onClick={() => { clearDraft(); navigate('/budgets/new'); }}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-sim-black transition-colors hover:bg-white/90"
          >
            <Plus size={16} />
            {t.newBudget}
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.searchBudgets}
              className="w-full rounded-lg border border-sim-border bg-sim-surface pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 transition-all focus:border-white/30"
            />
          </div>
          <div className="flex shrink-0 gap-2 overflow-x-auto pb-1">
            <Filter size={14} className="shrink-0 text-white/30" />
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-all ${
                  statusFilter === s
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {s === 'all' ? 'Todos' : t.status[s as keyof typeof t.status] || s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-sim-surface" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-sim-border bg-sim-surface p-12 text-center">
            <AlertCircle size={32} className="mx-auto mb-4 text-white/20" />
            <p className="text-sm text-white/40">
              {search || statusFilter !== 'all' ? t.noBudgetsFound : t.noBudgetsYet}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((budget, index) => (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="group rounded-xl border border-sim-border bg-sim-surface p-5 transition-all duration-200 hover:border-white/10"
              >
                <div className="flex items-start gap-4">
                  <button
                    onClick={() => navigate(`/budgets/${budget.id}`)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-white">
                        {budget.project_name}
                      </p>
                      <BudgetStatusBadge status={budget.status} />
                      <span className="rounded bg-white/5 px-2 py-0.5 text-xs text-white/30">
                        {budget.project_type || budget.type}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-white/40">
                      <span className="truncate">{budget.client_name}</span>
                      <span className="text-white/20">•</span>
                      <span className="truncate">{budget.client_company}</span>
                      <span className="text-white/20">•</span>
                      <span className="shrink-0">{formatDate(budget.created_at)}</span>
                      <span className="text-white/20">•</span>
                        <span className="shrink-0">Expira em {formatDate(budget.expires_at || budget.expiration_date || budget.created_at)}</span>
                    </div>
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(budget.final_price)}
                      </p>
                      <p className="text-xs text-white/30">
                        {budget.services.length + budget.reels.length + budget.equipment.length + budget.professionals.length} itens
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/budgets/${budget.id}`)}
                      className="rounded-lg p-2 text-white/30 transition-colors hover:bg-white/5 hover:text-white/60"
                    >
                      <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => duplicateBudget(budget)}
                      className="rounded-lg p-2 text-white/30 opacity-0 transition-colors group-hover:opacity-100 hover:bg-white/5 hover:text-white/60"
                      title="Duplicar orçamento"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => deleteBudget(budget.id)}
                      className="rounded-lg p-2 text-white/30 opacity-0 transition-colors group-hover:opacity-100 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
