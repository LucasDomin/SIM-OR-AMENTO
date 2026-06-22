import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { StatCard } from '../components/StatCard';
import { BudgetStatusBadge } from '../components/BudgetStatusBadge';
import { supabase } from '../lib/supabase';
import { formatCurrency, formatDate } from '../lib/utils';
import type { Budget, DashboardStats } from '../types';

export function Dashboard() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total_budgets: 0,
    approved_budgets: 0,
    total_revenue: 0,
    average_ticket: 0,
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const result = await supabase.from('budgets').select().order('created_at', { ascending: false }).data();
    const budgetList = (result.data || []) as Budget[];
    setBudgets(budgetList);

    const approved = budgetList.filter((b: Budget) => b.status === 'Approved');
    const revenue = approved.reduce((sum: number, b: Budget) => sum + b.final_price, 0);

    setStats({
      total_budgets: budgetList.length,
      approved_budgets: approved.length,
      total_revenue: revenue,
      average_ticket: approved.length > 0 ? revenue / approved.length : 0,
    });
    setLoading(false);
  }

  const recentBudgets = budgets.slice(0, 5);

  const quickActions = [
    { label: 'Novo Orçamento', icon: Plus, path: '/budgets/new', color: 'bg-white text-sim-black' },
    { label: 'Ver Todos', icon: FileText, path: '/budgets', color: 'bg-white/5 text-white' },
    { label: 'Templates', icon: Clock, path: '/templates', color: 'bg-white/5 text-white' },
  ];

  return (
    <Layout>
      <div className="space-y-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-display font-semibold text-white tracking-tight">
            Dashboard
          </h1>
          <p className="text-white/40 mt-1 text-sm">
            Visão geral dos seus orçamentos
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total de Orçamentos"
            value={stats.total_budgets}
            icon={FileText}
            delay={0.1}
          />
          <StatCard
            title="Aprovados"
            value={stats.approved_budgets}
            icon={CheckCircle2}
            delay={0.2}
          />
          <StatCard
            title="Receita Total"
            value={stats.total_revenue}
            isCurrency
            icon={DollarSign}
            delay={0.3}
          />
          <StatCard
            title="Ticket Médio"
            value={stats.average_ticket}
            isCurrency
            icon={TrendingUp}
            delay={0.4}
          />
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider mb-4">
            Ações Rápidas
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.label}
                  onClick={() => navigate(action.path)}
                  className={`flex items-center gap-3 px-5 py-4 rounded-xl text-sm font-medium transition-all duration-200 hover:scale-[1.02] ${action.color}`}
                >
                  <Icon size={18} />
                  <span>{action.label}</span>
                  <ArrowRight size={14} className="ml-auto opacity-50" />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Budgets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-white/50 uppercase tracking-wider">
              Orçamentos Recentes
            </h2>
            <button
              onClick={() => navigate('/budgets')}
              className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
            >
              Ver todos <ArrowRight size={12} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-sim-surface rounded-xl animate-pulse" />
              ))}
            </div>
          ) : recentBudgets.length === 0 ? (
            <div className="bg-sim-surface border border-sim-border rounded-xl p-8 text-center">
              <AlertCircle size={24} className="text-white/20 mx-auto mb-3" />
              <p className="text-sm text-white/40">Nenhum orçamento criado ainda</p>
              <button
                onClick={() => navigate('/budgets/new')}
                className="mt-4 text-sm text-white/60 hover:text-white transition-colors"
              >
                Criar primeiro orçamento
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentBudgets.map((budget, index) => (
                <motion.button
                  key={budget.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => navigate(`/budgets/${budget.id}`)}
                  className="w-full flex items-center gap-4 p-4 bg-sim-surface border border-sim-border rounded-xl hover:border-white/10 transition-all duration-200 text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <p className="text-sm font-medium text-white truncate">
                        {budget.project_name}
                      </p>
                      <BudgetStatusBadge status={budget.status} />
                    </div>
                    <p className="text-xs text-white/40 truncate">
                      {budget.client_name} — {budget.client_company}
                    </p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-white">
                      {formatCurrency(budget.final_price)}
                    </p>
                    <p className="text-xs text-white/30">{formatDate(budget.created_at)}</p>
                  </div>
                  <ArrowRight size={16} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
}
