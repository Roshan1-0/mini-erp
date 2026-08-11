import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, Mail, Lock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data.data;
      login(token, user);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-forest-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-8"
        >
          <div className="w-14 h-14 bg-sage-400 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Building2 size={28} className="text-forest-950" />
          </div>
          <h1 className="text-sage-50 text-2xl font-bold tracking-tight">AgriDist ERP</h1>
          <p className="text-sage-400 text-sm mt-1">Operations Portal — Staff Login</p>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-forest-900 rounded-2xl p-6 border border-forest-800"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-900/40 border border-red-700/50 rounded-lg px-3 py-2.5 text-red-400 text-sm">
                <AlertCircle size={14} className="flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sage-400 text-xs font-medium mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-forest-800 border border-forest-700 text-sage-50 text-sm rounded-lg
                             pl-9 pr-4 py-2.5 placeholder-forest-700
                             focus:outline-none focus:ring-2 focus:ring-sage-400/40 focus:border-sage-400
                             transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sage-400 text-xs font-medium mb-1.5">Password</label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-sage-400" />
                <input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-forest-800 border border-forest-700 text-sage-50 text-sm rounded-lg
                             pl-9 pr-4 py-2.5 placeholder-forest-700
                             focus:outline-none focus:ring-2 focus:ring-sage-400/40 focus:border-sage-400
                             transition-colors"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={loading}
              className="w-full bg-forest-700 hover:bg-forest-800 text-sage-50 font-medium text-sm py-2.5
                         rounded-lg transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center mt-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-sage-50 mr-2" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </motion.button>
          </form>

          {/* Dev credentials hint */}
          <div className="mt-5 pt-4 border-t border-forest-800">
            <p className="text-forest-700 text-xs text-center font-medium mb-2">Demo Credentials</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { role: 'Admin', email: 'admin@example.com' },
                { role: 'Sales', email: 'sales@example.com' },
                { role: 'Warehouse', email: 'warehouse@example.com' },
                { role: 'Accounts', email: 'accounts@example.com' },
              ].map((cred) => (
                <button
                  key={cred.role}
                  type="button"
                  onClick={() => { setEmail(cred.email); setPassword('password123'); }}
                  className="text-left bg-forest-800/50 hover:bg-forest-800 rounded-lg px-2.5 py-1.5
                             transition-colors cursor-pointer"
                >
                  <p className="text-sage-400 text-[10px] font-medium">{cred.role}</p>
                  <p className="text-forest-700 text-[9px] truncate">{cred.email}</p>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
