import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Layers,
  SlidersHorizontal,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../lib/i18n';

const navItems = [
  { path: '/', label: t.dashboard, icon: LayoutDashboard },
  { path: '/budgets', label: t.budgets, icon: FileText },
  { path: '/budgets/new', label: t.newBudget, icon: PlusCircle },
  { path: '/templates', label: t.templates, icon: Layers },
  { path: '/price-list', label: t.priceList, icon: SlidersHorizontal },
];

export function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg border border-sim-border bg-sim-surface p-2 text-white/80 lg:hidden"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 z-40 flex h-full flex-col border-r border-sim-border bg-sim-dark transition-transform duration-300 w-64 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="border-b border-sim-border px-6 py-7">
          <div className="overflow-hidden">
            <Logo className="h-8 w-auto text-white" animated />
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-[0.32em] text-white/30">Budget System</p>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'} />
                <span className="truncate">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto shrink-0"
                  >
                    <ChevronRight size={14} className="text-white/60" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-sim-border p-4">
          <button
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-white/40 transition-all duration-200 hover:text-white/70 hover:bg-white/5"
          >
            <LogOut size={18} />
            <span>{t.logout}</span>
          </button>

          <a
            href="https://www.instagram.com/domi.n.arte/"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex flex-col items-center rounded-lg px-4 py-3 text-center transition-colors hover:bg-white/5"
          >
            <span className="text-[9px] uppercase tracking-[0.3em] text-white/25">Produzido por</span>
            <span className="creator-credit mt-1 font-display text-sm font-semibold tracking-wide">
              @domi.n.arte
            </span>
          </a>
        </div>
      </motion.aside>
    </>
  );
}
