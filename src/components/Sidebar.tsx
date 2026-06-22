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

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/budgets', label: 'Orçamentos', icon: FileText },
  { path: '/budgets/new', label: 'Novo Orçamento', icon: PlusCircle },
  { path: '/templates', label: 'Templates', icon: Layers },
  { path: '/price-list', label: 'Price List', icon: SlidersHorizontal },
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
        className="fixed top-4 left-4 z-50 lg:hidden p-2 rounded-lg bg-sim-surface border border-sim-border text-white/80"
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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 h-full w-64 bg-sim-dark border-r border-sim-border z-40 flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300`}
      >
        <div className="px-6 py-7 border-b border-sim-border">
          <Logo className="h-9 w-auto text-white" animated />
          <p className="mt-3 text-[10px] uppercase tracking-[0.32em] text-white/30">Budget System</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={18} className={isActive ? 'text-white' : 'text-white/40 group-hover:text-white/70'} />
                <span>{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="ml-auto"
                  >
                    <ChevronRight size={14} className="text-white/60" />
                  </motion.div>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sim-border">
          <button
            onClick={signOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/40 hover:text-white/70 hover:bg-white/5 transition-all duration-200"
          >
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
