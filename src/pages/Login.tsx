/**
 * Login Page - Diseño refactorizado con Fluent 2.0 Design System
 * Página de acceso al sistema ERP
 */

import React, { useState, useEffect } from 'react';
import { useI18n } from '../lib/i18n';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, ShieldCheck, Lock, User } from 'lucide-react';
import { DEMO_CONFIG } from '../config/demoAuth';

const Login = () => {
  const { t } = useI18n();
  const { login, loading, error, clearError } = useAuth();

  const [formData, setFormData] = useState({ username: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Limpiar errores previos al montar el componente
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await login(formData);
    } catch (error) {
      // El error es manejado por el AuthContext y mostrado al usuario.
    }
  };

  return (
    <div className="min-h-screen bg-background-light flex items-center justify-center p-4 font-display">
      {DEMO_CONFIG.enabled && (
        <div className="fixed top-6 right-6 z-50 animate-pulse">
          <div className="bg-warning text-text-main px-4 py-2 rounded shadow-fluent-8 flex items-center gap-2 font-black uppercase tracking-tighter text-[10px] border border-border-subtle">
            <ShieldCheck size={14} />
            {t('login.demo_mode', 'Modo Demo Activo')}
          </div>
        </div>
      )}

      <div className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-fluent-16 border border-border-subtle overflow-hidden transition-all duration-300">
          {/* Header */}
          <div className="p-10 pb-6 text-center">
            <div className="size-14 bg-[#106ebe] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#106ebe]/20 mx-auto mb-6">
              <span className="material-symbols-outlined text-3xl font-bold">architecture</span>
            </div>
            <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase mb-2">
              {t('login.title', 'Acceso al Sistema')}
            </h1>
            <p className="text-text-secondary text-sm font-medium">
              {t('login.subtitle', 'Ingresa tus credenciales para continuar')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                {t('login.username_label', 'Email o Usuario')}
              </label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-[#106ebe] transition-colors">
                  <User size={18} />
                </span>
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-4 h-11 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#106ebe] focus:border-transparent outline-none transition-all placeholder:text-slate-300 font-medium"
                  placeholder={t('login.email_placeholder', 'ej: admin')}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end pr-1">
                <label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                  {t('login.password_label', 'Contraseña')}
                </label>
                <button 
                  type="button" 
                  className="text-[10px] font-bold text-[#106ebe] hover:underline uppercase tracking-wider"
                >
                  {t('login.forgot_password', '¿Olvidaste tu contraseña?')}
                </button>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 group-focus-within:text-[#106ebe] transition-colors">
                  <Lock size={18} />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleChange}
                  className="block w-full pl-11 pr-12 h-11 border border-border-subtle rounded-lg bg-white text-sm focus:ring-2 focus:ring-[#106ebe] focus:border-transparent outline-none transition-all placeholder:text-slate-300 font-medium"
                  placeholder={t('login.password_placeholder', 'ej: admin123')}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-text-main transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-error/10 border-l-4 border-error p-4 rounded flex items-center gap-3 animate-in fade-in slide-in-from-top-1 duration-200" role="alert">
                <div className="text-error">
                  <span className="material-symbols-outlined text-lg">error</span>
                </div>
                <p className="text-xs font-bold text-error">
                  {t(error, t('login.error.generic', 'Error: Credenciales incorrectas.'))}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#106ebe] text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-fluent-8 hover:bg-[#005a9e] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>{t('login.loading', 'Iniciando Sesión...')}</span>
                </>
              ) : (
                <>
                  <span>{t('login.submit', 'Iniciar Sesión')}</span>
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </>
              )}
            </button>
          </form>

          {/* Footer Branding */}
          <div className="px-10 py-6 bg-slate-50/50 border-t border-border-subtle flex justify-center items-center gap-4">
            <div className="flex items-center gap-1.5 opacity-40">
               <span className="material-symbols-outlined text-base">verified_user</span>
               <span className="text-[9px] font-black uppercase tracking-widest">Secure Endpoint</span>
            </div>
            <div className="w-px h-3 bg-slate-200"></div>
            <div className="flex items-center gap-1.5 opacity-40">
               <span className="material-symbols-outlined text-base">cloud_done</span>
               <span className="text-[9px] font-black uppercase tracking-widest">Azure Powered</span>
            </div>
          </div>
        </div>
        
        <p className="mt-8 text-center text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em]">
          &copy; 2026 ERP Webapp &bull; Version 2.0.4
        </p>
      </div>
    </div>
  );
};

export default Login;
