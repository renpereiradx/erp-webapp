// ===========================================================================
// Settings Page - Fluent Design System 2 + BEM
// Patrón: Fluent Design System 2 + BEM + Zustand
// Basado en: docs/GUIA_MVP_DESARROLLO.md
// ===========================================================================

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  Moon, 
  Sun, 
  User, 
  Users, 
  Globe, 
  Bell, 
  ChevronRight,
  Info,
  ShieldCheck,
  Palette,
  Monitor,
  Command
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';

const SettingsPage = () => {
  const { t } = useI18n();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-background-light text-text-main p-4 md:p-8 animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Page Header */}
        <header className="flex flex-col gap-1 border-l-4 border-primary pl-4 mb-10">
          <h1 className="text-3xl font-black text-text-main tracking-tighter uppercase leading-none">
            {t('settings.title', 'Configuración')}
          </h1>
          <p className="text-text-secondary text-sm font-medium mt-2">
            {t('settings.subtitle', 'Personaliza tu experiencia y gestiona tu cuenta corporativa.')}
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Section: Account & Security */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <span className="material-symbols-outlined text-primary text-xl">manage_accounts</span>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t('settings.sections.account', 'Cuenta y Seguridad')}
              </h2>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => handleNavigate('/perfil')}
                className="w-full group bg-white p-4 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all flex items-center gap-4 text-left"
              >
                <div className="size-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center transition-colors group-hover:bg-primary group-hover:text-white">
                  <User size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-text-main leading-tight">{t('settings.profile.title', 'Mi Perfil')}</h4>
                  <p className="text-[11px] text-text-secondary font-medium truncate">{t('settings.profile.desc', 'Gestiona tu información personal y seguridad')}</p>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-primary transition-colors" size={18} />
              </button>

              <button 
                onClick={() => handleNavigate('/usuarios')}
                className="w-full group bg-white p-4 rounded-xl border border-border-subtle shadow-fluent-2 hover:shadow-fluent-8 transition-all flex items-center gap-4 text-left"
              >
                <div className="size-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                  <Users size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-text-main leading-tight">{t('settings.users.title', 'Gestión de Usuarios')}</h4>
                  <p className="text-[11px] text-text-secondary font-medium truncate">{t('settings.users.desc', 'Administra accesos, roles y permisos del sistema')}</p>
                </div>
                <ChevronRight className="text-slate-300 group-hover:text-indigo-600 transition-colors" size={18} />
              </button>
            </div>
          </section>

          {/* Section: Appearance */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <span className="material-symbols-outlined text-amber-500 text-xl">palette</span>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t('settings.sections.appearance', 'Personalización')}
              </h2>
            </div>

            <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-fluent-2 space-y-6">
              <div>
                <h4 className="text-sm font-bold text-text-main">{t('settings.theme.title', 'Tema Visual')}</h4>
                <p className="text-[11px] text-text-secondary font-medium">{t('settings.theme.description', 'Selecciona el modo de apariencia preferido')}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-1 bg-slate-50 rounded-lg border border-slate-100">
                <button
                  onClick={() => isDark && toggleTheme()}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all ${
                    !isDark ? 'bg-white shadow-sm text-primary' : 'text-text-secondary hover:text-text-main'
                  }`}
                >
                  <Sun size={16} />
                  <span>{t('settings.theme.light', 'Modo Claro')}</span>
                </button>

                <button
                  onClick={() => !isDark && toggleTheme()}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-md text-xs font-bold transition-all ${
                    isDark ? 'bg-[#1b2631] shadow-sm text-white' : 'text-text-secondary hover:text-text-main'
                  }`}
                >
                  <Moon size={16} />
                  <span>{t('settings.theme.dark', 'Modo Oscuro')}</span>
                </button>
              </div>
            </div>
          </section>

          {/* Section: System */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <span className="material-symbols-outlined text-blue-500 text-xl">settings_suggest</span>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t('settings.sections.system', 'Sistema')}
              </h2>
            </div>

            <div className="bg-white p-6 rounded-xl border border-border-subtle shadow-fluent-2 divide-y divide-slate-50">
              <div className="py-4 first:pt-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="text-blue-500" size={18} />
                  <span className="text-sm font-bold text-text-main">{t('settings.language.title', 'Idioma')}</span>
                </div>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full uppercase tracking-tighter">Español</span>
              </div>

              <div className="py-4 flex items-center justify-between opacity-50">
                <div className="flex items-center gap-3">
                  <Bell className="text-rose-500" size={18} />
                  <span className="text-sm font-bold text-text-main">{t('settings.notifications.title', 'Notificaciones')}</span>
                </div>
                <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-full uppercase tracking-tighter">Desactivado</span>
              </div>
            </div>
          </section>

          {/* Section: Shortcuts */}
          <section className="space-y-4">
            <div className="flex items-center gap-3 px-1">
              <span className="material-symbols-outlined text-emerald-500 text-xl">keyboard</span>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">
                {t('settings.sections.shortcuts', 'Accesibilidad')}
              </h2>
            </div>
            <div className="bg-white rounded-xl border border-border-subtle shadow-fluent-2 overflow-hidden">
              <KeyboardShortcuts />
            </div>
          </section>
        </div>

        {/* Footer Info */}
        <footer className="pt-10 border-t border-slate-100 flex flex-col items-center gap-2 opacity-60">
          <div className="flex items-center gap-2 text-text-secondary">
            <Info size={14} />
            <span className="text-[10px] font-black uppercase tracking-widest">ERP Business Intelligence v1.2.0</span>
          </div>
          <p className="text-[10px] font-medium text-slate-400">© {new Date().getFullYear()} Corporación Industrial • Paraguay Compliance</p>
        </footer>
      </div>
    </div>
  );
};

export default SettingsPage;