import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { Logo } from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { t } from '../lib/i18n';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('jay@admin.com.br');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      setError(error === 'Credenciais inválidas' ? t.invalidCredentials : error);
      setLoading(false);
      return;
    }
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-sim-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-12 flex flex-col items-center">
          <div className="w-full max-w-[220px] overflow-hidden">
            <Logo className="h-12 w-full text-white" animated />
          </div>
          <p className="mt-4 text-center text-[10px] uppercase tracking-[0.34em] text-white/35">Still In Movement · Budget System</p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="text-2xl font-display font-semibold text-white text-center mb-2">
            {t.loginWelcome}
          </h1>
          <p className="text-sm text-white/40 text-center mb-8">
            {t.loginSubtitle}
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              {t.email}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-sim-surface border border-sim-border rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-sim-elevated transition-all duration-200"
              placeholder="seu@email.com"
              required
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-xs font-medium text-white/50 mb-1.5 uppercase tracking-wider">
              {t.password}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-sim-surface border border-sim-border rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:border-white/30 focus:bg-sim-elevated transition-all duration-200 pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </motion.div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-red-400 text-center"
            >
              {error}
            </motion.p>
          )}

          <motion.button
            type="submit"
            disabled={loading}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="w-full bg-white text-sim-black font-medium text-sm rounded-lg px-4 py-3 flex items-center justify-center gap-2 hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-sim-black/30 border-t-sim-black rounded-full animate-spin" />
            ) : (
              <>
                {t.enter}
                <ArrowRight size={16} />
              </>
            )}
          </motion.button>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-xs text-white/25 text-center mt-6"
        >
          SIM Budget — Sistema Interno de Gestão
        </motion.p>
      </motion.div>
    </div>
  );
}
