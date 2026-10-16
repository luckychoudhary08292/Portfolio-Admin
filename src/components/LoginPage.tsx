import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCheck,
  Sparkles,
  LogIn,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api.ts';
import { AuthUser } from '../types.ts';

interface LoginPageProps {
  onLoginSuccess: (user: AuthUser) => void;
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'info') => void;
}

export function LoginPage({ onLoginSuccess, showToast }: LoginPageProps) {
  // Default values requested by user:
  const DEFAULT_ADMIN_EMAIL = 'luckypc08292@gmail.com';
  const DEFAULT_ADMIN_PASSWORD = 'its@Lucky.1';

  const [email, setEmail] = useState(DEFAULT_ADMIN_EMAIL);
  const [password, setPassword] = useState(DEFAULT_ADMIN_PASSWORD);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAdminLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg(null);

    if (!email.trim() || !password) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await api.login(email.trim(), password, false);
      if (res.success && res.user) {
        showToast('Welcome back, Admin!', `Logged in as ${res.user.name}`, 'success');
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      const msg = err.message || 'Invalid email or password. Please try again.';
      setErrorMsg(msg);
      showToast('Login Failed', msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setErrorMsg(null);
    try {
      setIsLoading(true);
      const res = await api.login(undefined, undefined, true);
      if (res.success && res.user) {
        showToast(
          'Guest Demo Access Granted',
          'You can explore the full admin panel & live data in read-only mode.',
          'info'
        );
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to initialize guest session.';
      setErrorMsg(msg);
      showToast('Guest Login Failed', msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetToDefaultAdmin = () => {
    setEmail(DEFAULT_ADMIN_EMAIL);
    setPassword(DEFAULT_ADMIN_PASSWORD);
    setErrorMsg(null);
  };

  return (
    <div className="min-h-screen bg-[#f4f6fa] text-slate-900 flex flex-col justify-between selection:bg-amber-200 selection:text-amber-900">
      {/* Top subtle bar */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-sky-100 bg-white/70 backdrop-blur-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-linear-to-tr from-sky-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
            LC
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-tight">Lucky Choudhary</h1>
            <p className="text-[11px] text-slate-600">Portfolio Control Center</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            System Live & Secure
          </span>
        </div>
      </header>

      {/* Main Login Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-2xl border border-sky-200 shadow-xl shadow-sky-100/50 overflow-hidden">
            {/* Header banner */}
            <div className="p-6 sm:p-7 border-b border-sky-100 bg-linear-to-b from-sky-50/60 to-transparent">
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  JWT Authenticated
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Admin & Demo Portal</h2>
              <p className="text-xs text-slate-600 mt-1">
                Sign in with Admin credentials or continue as a Guest visitor to preview the live dashboard.
              </p>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mx-6 mt-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Authentication Error</p>
                  <p className="text-rose-600 mt-0.5">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleAdminLogin} className="p-6 sm:p-7 space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1.5">
                  Admin Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="luckypc08292@gmail.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-sky-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-800">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={handleResetToDefaultAdmin}
                    className="text-[11px] font-semibold text-amber-600 hover:text-amber-700 hover:underline"
                  >
                    Reset to Default Admin
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter admin password"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-sky-200 rounded-xl text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Default Credentials Notice */}
              <div className="p-3 bg-sky-50/70 border border-sky-200/80 rounded-xl text-[11px] text-slate-700 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">Default Admin Credentials</span>
                  <div className="mt-0.5 font-mono text-[10.5px] text-slate-600 break-all">
                    Email: <span className="font-semibold text-slate-800">luckypc08292@gmail.com</span>
                    <br />
                    Password: <span className="font-semibold text-slate-800">its@Lucky.1</span>
                  </div>
                </div>
              </div>

              {/* Submit Admin Login */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    Sign In as Admin (Full Control)
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-sky-100"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-3 bg-white text-slate-600 font-medium">Or explore demo</span>
                </div>
              </div>

              {/* Guest Account Button */}
              <button
                type="button"
                onClick={handleGuestLogin}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-300 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-50 group"
              >
                <UserCheck className="w-4 h-4 text-sky-600 group-hover:scale-110 transition-transform" />
                <span>Enter as Guest (Read-Only Demo Mode)</span>
              </button>
            </form>

            {/* Footer Notice */}
            <div className="px-6 py-4 bg-slate-50/70 border-t border-sky-100 text-center">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Guest visitors can view all live dashboard screens, metrics, projects, and skills.
                All mutations and database modifications are strictly protected.
              </p>
            </div>
          </div>

          {/* Environmental Variable Security Note */}
          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-600 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Credentials securely verified against environment variables
            </p>
          </div>
        </div>
      </main>

      {/* Bottom Footer */}
      <footer className="py-4 text-center text-xs text-slate-600 border-t border-sky-100/80 bg-white/50">
        Portfolio Administration System • Designed for Lucky Choudhary
      </footer>
    </div>
  );
}
