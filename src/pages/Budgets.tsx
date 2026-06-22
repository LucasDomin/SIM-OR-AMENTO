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
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;
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

  const statuses = ['all', 'Draft', 'Sent', 'Approved', 'Rejected', 'Expired'];

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-3xl font-display font-semibold text-white tracking-tight">
              Orçamentos
            </h1>
            <p className="text-white/40 mt-1 text-sm">
              {budgets.length} orçamento{budgets.length !== 1 ? 's' : ''} no sistema
            </p>
          </div>
          <button
            onClick={() => navigate('/budgets/new')}
            className="inline-flex items-center gap-2 bg-white text-sim-black font-medium text-sm rounded-lg px-5 py-2.5 hover:bg-white/90 transition-colors"
          >
            <Plus size={16} />
            Novo Orçamento
          </button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por projeto, cliente ou empresa..."
              className="w-full bg-sim-surface border border-sim-border rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:border-white/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Filter size={14} className="text-white/30 shrink-0" />
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  statusFilter === s
                    ? 'bg-white/10 text-white'
                    : 'text-white/40 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                {s === 'all' ? 'Todos' : s}
              </button>
            ))}
          </div>
        </motion.div>

        {/* List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-sim-surface rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-sim-surface border border-sim-border rounded-xl p-12 text-center">
            <AlertCircle size={32} className="text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-sm">
              {search || statusFilter !== 'all'
                ? 'Nenhum orçamento encontrado com os filtros aplicados'
                : 'Nenhum orçamento criado ainda'}
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
                className="group bg-sim-surface border border-sim-border rounded-xl p-5 hover:border-white/10 transition-all duration-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <button
                    onClick={() => navigate(`/budgets/${budget.id}`)}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <p className="text-sm font-medium text-white">{budget.project_name}</p>
                      <BudgetStatusBadge status={budget.status} />
                      <span className="text-xs text-white/30 px-2 py-0.5 rounded bg-white/5">
                        {budget.project_type || budget.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/40">
                      <span>{budget.client_name}</span>
                      <span className="text-white/20">•</span>
                      <span>{budget.client_company}</span>
                      <span className="text-white/20">•</span>
                      <span>{formatDate(budget.created_at)}</span>
                      <span className="text-white/20">•</span>
                      <span>Expira em {formatDate(budget.expires_at || budget.expiration_date || budget.created_at)}</span>
                    </div>
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm font-semibold text-white">
                        {formatCurrency(budget.final_price)}
                      </p>
                      <p className="text-xs text-white/30">
                        {budget.items.length} itens
                      </p>
                    </div>
                    <button
                      onClick={() => navigate(`/budgets/${budget.id}`)}
                      className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors"
                    >
                      <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => duplicateBudget(budget)}
                      className="p-2 rounded-lg hover:bg-white/5 text-white/30 hover:text-white/60 transition-colors opacity-0 group-hover:opacity-100"
                      title="Duplicar orçamento"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => deleteBudget(budget.id)}
                      className="p-2 rounded-lg hover:bg-red-500/10 text-white/30 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
