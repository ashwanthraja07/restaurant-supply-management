import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Package, Loader2, Shield, Factory, UtensilsCrossed } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname;

  const [form, setForm]       = useState({ email: '', password: '', role: 'SUPPLIER' });
  const [showPw, setShowPw]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      let dest = '/admin/dashboard';
      if (user.role === 'SUPPLIER') dest = '/supplier/dashboard';
      else if (user.role === 'RESTAURANT') dest = '/restaurant/dashboard';
      navigate(dest, { replace: true });
    }
  }, [user, navigate]);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    setErrors({});
    setLoading(true);
    try {
      const loggedUser = await login(form.email, form.password, form.role);
      toast.success(`Welcome back!`);
      let defaultDest = '/admin/dashboard';
      if (loggedUser.role === 'SUPPLIER') defaultDest = '/supplier/dashboard';
      else if (loggedUser.role === 'RESTAURANT') defaultDest = '/restaurant/dashboard';
      const dest = from || defaultDest;
      navigate(dest, { replace: true });
    } catch (err) {
      const msg = err.response?.data?.error || 'Login failed. Please check your credentials and account type.';
      toast.error(msg);
      setErrors({ general: msg });
    } finally {
      setLoading(false);
    }
  };

  const roleThemes = {
    SUPPLIER: {
      accent: 'from-blue-600 to-indigo-600',
      borderActive: 'border-blue-500 bg-blue-500/10 text-blue-400',
      ring: 'focus:ring-blue-500',
      badge: 'Supplier Portal'
    },
    RESTAURANT: {
      accent: 'from-emerald-600 to-teal-600',
      borderActive: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
      ring: 'focus:ring-emerald-500',
      badge: 'Restaurant Portal'
    },
    ADMIN: {
      accent: 'from-violet-600 to-purple-600',
      borderActive: 'border-violet-500 bg-violet-500/10 text-violet-400',
      ring: 'focus:ring-violet-500',
      badge: 'System Administrator'
    }
  };

  const currentTheme = roleThemes[form.role];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Background decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${currentTheme.accent} shadow-xl shadow-blue-500/10 mb-4 transition-all duration-300`}>
            {form.role === 'ADMIN' ? (
              <Shield className="w-8 h-8 text-white" />
            ) : form.role === 'RESTAURANT' ? (
              <UtensilsCrossed className="w-8 h-8 text-white" />
            ) : (
              <Factory className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">SupplyFlow</h1>
          <p className="text-slate-400 mt-1 text-sm">Restaurant Supply Management System</p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8 shadow-2xl">
          {/* Role Selection Tabs */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Select Role / Account Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, role: 'SUPPLIER' }))}
                className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all duration-150 flex flex-col items-center gap-1 ${
                  form.role === 'SUPPLIER'
                    ? 'border-blue-500 bg-blue-500/15 text-blue-400 shadow-sm'
                    : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <Factory className="w-4 h-4" />
                Supplier
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, role: 'RESTAURANT' }))}
                className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all duration-150 flex flex-col items-center gap-1 ${
                  form.role === 'RESTAURANT'
                    ? 'border-emerald-500 bg-emerald-500/15 text-emerald-400 shadow-sm'
                    : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <UtensilsCrossed className="w-4 h-4" />
                Restaurant
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, role: 'ADMIN' }))}
                className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all duration-150 flex flex-col items-center gap-1 ${
                  form.role === 'ADMIN'
                    ? 'border-violet-500 bg-violet-500/15 text-violet-400 shadow-sm'
                    : 'border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <Shield className="w-4 h-4" />
                Admin
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
            <h2 className="text-base font-semibold text-white">Sign In</h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-medium">
              {currentTheme.badge}
            </span>
          </div>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
              <input
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className={`w-full bg-slate-800 border rounded-lg px-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 ${currentTheme.ring} focus:border-transparent transition-colors ${errors.email ? 'border-red-500' : 'border-slate-600'}`}
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className={`w-full bg-slate-800 border rounded-lg px-4 py-2.5 pr-11 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 ${currentTheme.ring} focus:border-transparent transition-colors ${errors.password ? 'border-red-500' : 'border-slate-600'}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r ${currentTheme.accent} hover:opacity-95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-black/30 mt-3 cursor-pointer`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                `Sign In as ${form.role === 'ADMIN' ? 'Administrator' : form.role === 'SUPPLIER' ? 'Supplier' : 'Restaurant'}`
              )}
            </button>
          </form>

          {/* Registration links (ONLY shown for Supplier and Restaurant; Admin is strictly protected) */}
          <div className="mt-6 pt-5 border-t border-slate-700/50">
            {form.role === 'ADMIN' ? (
              <div className="text-center p-3 bg-violet-950/30 border border-violet-800/40 rounded-lg">
                <p className="text-xs text-violet-300 font-medium">
                  🔒 Restricted Administrative Portal
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Admin accounts must be provisioned via the secure CLI setup script.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-center text-xs text-slate-400">
                  Don&apos;t have an account?
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-3">
                  <Link
                    to="/register/supplier"
                    className="text-center py-2 px-3 rounded-lg border border-slate-700 text-slate-300 hover:border-blue-500 hover:text-blue-400 text-xs font-medium transition-colors"
                  >
                    Register as Supplier
                  </Link>
                  <Link
                    to="/register/restaurant"
                    className="text-center py-2 px-3 rounded-lg border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-emerald-400 text-xs font-medium transition-colors"
                  >
                    Register as Restaurant
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
