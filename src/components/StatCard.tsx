import { motion } from 'framer-motion';
import { type LucideIcon } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  isCurrency?: boolean;
  icon: LucideIcon;
  delay?: number;
}

export function StatCard({ title, value, isCurrency = false, icon: Icon, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="bg-sim-surface border border-sim-border rounded-xl p-6 hover:border-white/10 transition-colors duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-lg bg-white/5">
          <Icon size={20} className="text-white/60" />
        </div>
      </div>
      <p className="text-sm text-white/40 font-medium mb-1">{title}</p>
      <p className="text-2xl font-display font-semibold text-white tracking-tight">
        {isCurrency ? formatCurrency(value) : value.toLocaleString('pt-BR')}
      </p>
    </motion.div>
  );
}
