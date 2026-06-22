import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Play,
  Building2,
  Megaphone,
  Mic,
  Film,
  Camera,
  Calendar,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { supabase } from '../lib/supabase';
import type { PriceListItem, Template } from '../types';

const iconMap: Record<string, React.ElementType> = {
  'template-institucional': Building2,
  'template-evento': Calendar,
  'template-publicidade': Megaphone,
  'template-podcast': Mic,
  'template-reels': Film,
  'template-cobertura': Camera,
};

export function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [priceList, setPriceList] = useState<PriceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadTemplates();
  }, []);

  async function loadTemplates() {
    const [templateResult, priceResult] = await Promise.all([
      supabase.from('templates').select().data(),
      supabase.from('price_list').select().data(),
    ]);
    setTemplates((templateResult.data || []) as Template[]);
    setPriceList((priceResult.data || []) as PriceListItem[]);
    setLoading(false);
  }

  function useTemplate(template: Template) {
    navigate('/budgets/new', { state: { template } });
  }

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-display font-semibold text-white tracking-tight">
            Templates
          </h1>
          <p className="text-white/40 mt-1 text-sm">
            Modelos pré-configurados para acelerar a criação de orçamentos
          </p>
        </motion.div>

        {/* Templates Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-sim-surface rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template, index) => {
              const Icon = iconMap[template.id] || Layers;
              const totalValue = template.price_item_names?.reduce((sum, name) => {
                const price = priceList.find((item) => item.name === name);
                return sum + (price?.sale_price || 0);
              }, 0) || (template.items || []).reduce((sum, item) => sum + item.quantity * (item.unit_price || item.sale_price || 0), 0);

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  className="group bg-sim-surface border border-sim-border rounded-xl p-6 hover:border-white/15 transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-white/5 group-hover:bg-white/10 transition-colors">
                      <Icon size={22} className="text-white/60" />
                    </div>
                    <span className="text-[10px] font-medium text-white/20 uppercase tracking-wider px-2 py-1 rounded bg-white/5">
                      {template.project_type || template.type}
                    </span>
                  </div>

                  <h3 className="text-lg font-display font-semibold text-white mb-2">
                    {template.name}
                  </h3>
                  <p className="text-sm text-white/40 mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div>
                      <p className="text-xs text-white/30">{template.price_item_names?.length || template.items?.length || 0} itens</p>
                      <p className="text-sm font-medium text-white">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(totalValue)}
                      </p>
                    </div>
                    <button
                      onClick={() => useTemplate(template)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white text-white hover:text-sim-black text-sm font-medium transition-all duration-200"
                    >
                      <Play size={14} />
                      Usar
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
