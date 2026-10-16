import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Dumbbell, Eye, EyeOff, ShieldAlert, CheckCircle2, User, Mail, Lock } from 'lucide-react';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [inFlight, setInFlight] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState('');

  const { login, register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/sessions';

  // Inline Validation
  const validate = () => {
    const errors = {};
    if (!isLogin && (!formData.name || formData.name.trim().length < 2)) {
      errors.name = 'Name must be at least 2 characters long.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      errors.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email)) {
      errors.email = 'Please provide a valid email format (e.g., alex@domain.com).';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setServerError('');
    if (fieldErrors[name]) {
      setFieldErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setInFlight(true);
    setServerError('');

    try {
      if (isLogin) {
        const loggedUser = await login(formData.email, formData.password);
        success(`Welcome back, ${loggedUser.name}!`);
        if (loggedUser.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(from, { replace: true });
        }
      } else {
        const newUser = await register(formData.name, formData.email, formData.password);
        success(`Account created! Welcome to GymSlot, ${newUser.name}!`);
        navigate('/sessions');
      }
    } catch (err) {
      setServerError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setInFlight(false);
    }
  };

  // Demo credential autofill helpers
  const fillDemo = (role, email, pass) => {
    setIsLogin(true);
    setFormData({
      name: '',
      email,
      password: pass,
    });
    setFieldErrors({});
    setServerError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-emerald-400 text-slate-950 shadow-xl shadow-emerald-500/20 mb-4">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            GYM<span className="text-emerald-400">SLOT</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time gym session booking & attendance system
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-950/70 border border-slate-800 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsLogin(true);
                setServerError('');
                setFieldErrors({});
              }}
              className={`py-2 text-sm font-semibold rounded-xl transition-all ${
                isLogin
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsLogin(false);
                setServerError('');
                setFieldErrors({});
              }}
              className={`py-2 text-sm font-semibold rounded-xl transition-all ${
                !isLogin
                  ? 'bg-slate-800 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Server Error Message */}
          {serverError && (
            <div
              role="alert"
              className="mb-5 p-3.5 bg-rose-950/80 border border-rose-500/40 rounded-xl flex items-start gap-3 text-rose-200 text-sm animate-in fade-in"
            >
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Authentication Error</p>
                <p className="text-xs text-rose-300 mt-0.5">{serverError}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {/* Name Field (Register Only) */}
            {!isLogin && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
                >
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-name"
                    name="name"
                    type="text"
                    required
                    placeholder="Alex Morgan"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={inFlight}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-950 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                      fieldErrors.name
                        ? 'border-rose-500 focus:ring-rose-500/30'
                        : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                    }`}
                  />
                </div>
                {fieldErrors.name && (
                  <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1 font-medium">
                    <span>⚠️</span> {fieldErrors.name}
                  </p>
                )}
              </div>
            )}

            {/* Email Field */}
            <div>
              <label
                htmlFor="auth-email"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="auth-email"
                  name="email"
                  type="email"
                  required
                  placeholder="member@gymslot.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={inFlight}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-950 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.email
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1 font-medium">
                  <span>⚠️</span> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="auth-password"
                className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5"
              >
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={inFlight}
                  className={`w-full pl-10 pr-10 py-2.5 bg-slate-950 border rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all ${
                    fieldErrors.password
                      ? 'border-rose-500 focus:ring-rose-500/30'
                      : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1 font-medium">
                  <span>⚠️</span> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={inFlight}
              className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {inFlight ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : isLogin ? (
                'Sign In to GymSlot'
              ) : (
                'Create Member Account'
              )}
            </button>
          </form>

          {/* Quick Demo Login Credentials Bar */}
          <div className="mt-6 pt-5 border-t border-slate-800/80">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
              Quick Test Credentials (1-Click Fill)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin', 'admin@gymslot.com', 'AdminPassword123!')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-colors text-xs group"
              >
                <div className="flex items-center justify-between text-amber-400 font-bold">
                  <span>👑 Admin Account</span>
                  <span className="text-[10px] bg-amber-400/10 px-1.5 py-0.5 rounded">Fill</span>
                </div>
                <div className="text-slate-400 text-[11px] truncate mt-0.5">admin@gymslot.com</div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('member', 'amit@example.com', 'MemberPass123!')}
                className="p-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl text-left transition-colors text-xs group"
              >
                <div className="flex items-center justify-between text-emerald-400 font-bold">
                  <span>👤 Member (Amit)</span>
                  <span className="text-[10px] bg-emerald-400/10 px-1.5 py-0.5 rounded">Fill</span>
                </div>
                <div className="text-slate-400 text-[11px] truncate mt-0.5">amit@example.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Accessibility note */}
        <p className="text-center text-[11px] text-slate-500 mt-4">
          Operable by keyboard • Fully responsive (360px+) • Password secured with bcrypt
        </p>
      </div>
    </div>
  );
};
