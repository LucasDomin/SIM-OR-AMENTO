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
import { t } from '../lib/i18n';
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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="min-w-0"
        >
          <h1 className="truncate text-3xl font-display font-semibold tracking-tight text-white">
            {t.templatesTitle}
          </h1>
          <p className="mt-1 text-sm text-white/40">
            {t.templatesSubtitle}
          </p>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-sim-surface" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template, index) => {
              const Icon = iconMap[template.id] || Layers;
              const totalValue = (template.service_names || []).reduce((sum: number, name: string) => {
                const price = priceList.find((item) => item.name === name);
                return sum + (price?.sale_price || 0);
              }, 0);

              return (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.5 }}
                  className="group flex flex-col rounded-xl border border-sim-border bg-sim-surface p-6 transition-all duration-300 hover:border-white/15"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="rounded-xl bg-white/5 p-3 transition-colors group-hover:bg-white/10">
                      <Icon size={22} className="text-white/60" />
                    </div>
                    <span className="rounded bg-white/5 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white/20">
                      {template.project_type || template.type}
                    </span>
                  </div>

                  <h3 className="mb-2 line-clamp-1 text-lg font-display font-semibold text-white">
                    {template.name}
                  </h3>
                  <p className="mb-4 line-clamp-2 flex-1 text-sm text-white/40">
                    {template.description}
                  </p>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-white/30">
                        {(template.service_names?.length || 0) +
                          (template.reel_names?.length || 0) +
                          (template.equipment_names?.length || 0) +
                          (template.professional_names?.length || 0)} {t.items}
                      </p>
                      <p className="truncate text-sm font-medium text-white">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(totalValue)}
                      </p>
                    </div>
                    <button
                      onClick={() => useTemplate(template)}
                      className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-white hover:text-sim-black"
                    >
                      <Play size={14} />
                      {t.useTemplate}
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
