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
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import KeyboardShortcuts from '@/components/ui/KeyboardShortcuts';
import '@/styles/scss/pages/_settings.scss';

const SettingsPage = () => {
  const { t } = useI18n();
  const { toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();

  const handleNavigate = (path) => {
    navigate(path);
  };

  return (
    <div className="settings-page">
      {/* Page Header */}
      <header className="page-header">
        <div className="page-header__content">
          <h1 className="page-header__title">
            {t('settings.title', 'Configuración')}
          </h1>
          <p className="page-header__subtitle">
            {t('settings.subtitle', 'Personaliza tu experiencia y gestiona tu cuenta')}
          </p>
        </div>
      </header>

      <div className="settings-grid">
        {/* User & Security Section */}
        <div className="settings-section">
          <h3 className="settings-section__title">
            {t('settings.sections.account', 'Cuenta y Seguridad')}
          </h3>
          
          <div className="settings-card settings-card--interactive" onClick={() => handleNavigate('/perfil')}>
            <div className="settings-card__body">
              <div className="settings-card__icon-wrapper settings-card__icon-wrapper--profile">
                <User size={20} />
              </div>
              <div className="settings-card__info">
                <h4 className="settings-card__item-title">{t('settings.profile.title', 'Mi Perfil')}</h4>
                <p className="settings-card__item-description">{t('settings.profile.desc', 'Gestiona tu información personal y seguridad')}</p>
              </div>
              <ChevronRight className="settings-card__chevron" size={18} />
            </div>
          </div>

          <div className="settings-card settings-card--interactive" onClick={() => handleNavigate('/usuarios')}>
            <div className="settings-card__body">
              <div className="settings-card__icon-wrapper settings-card__icon-wrapper--users">
                <Users size={20} />
              </div>
              <div className="settings-card__info">
                <h4 className="settings-card__item-title">{t('settings.users.title', 'Gestión de Usuarios')}</h4>
                <p className="settings-card__item-description">{t('settings.users.desc', 'Administra accesos, roles y permisos del sistema')}</p>
              </div>
              <ChevronRight className="settings-card__chevron" size={18} />
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="settings-section">
          <h3 className="settings-section__title">
            {t('settings.sections.appearance', 'Personalización')}
          </h3>
          
          <div className="settings-card">
            <div className="settings-card__header">
              <div className="flex items-center gap-2">
                <Sun className="text-amber-500" size={18} />
                <h2 className="settings-card__title">
                  {t('settings.theme.title', 'Tema Visual')}
                </h2>
              </div>
              <p className="settings-card__description">
                {t('settings.theme.description', 'Selecciona el modo de apariencia preferido')}
              </p>
            </div>

            <div className="settings-card__content">
              <div className="theme-toggle">
                <button
                  className={`theme-toggle__option ${!isDark ? 'theme-toggle__option--active' : ''}`}
                  onClick={() => isDark && toggleTheme()}
                >
                  <Sun size={20} />
                  <span className="theme-toggle__label">{t('settings.theme.light', 'Claro')}</span>
                </button>

                <button
                  className={`theme-toggle__option ${isDark ? 'theme-toggle__option--active' : ''}`}
                  onClick={() => !isDark && toggleTheme()}
                >
                  <Moon size={20} />
                  <span className="theme-toggle__label">{t('settings.theme.dark', 'Oscuro')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* System Section */}
        <div className="settings-section">
          <h3 className="settings-section__title">
            {t('settings.sections.system', 'Sistema')}
          </h3>

          <div className="settings-card">
            <div className="settings-card__header">
              <div className="flex items-center gap-2">
                <Globe className="text-blue-500" size={18} />
                <h2 className="settings-card__title">{t('settings.language.title', 'Idioma')}</h2>
              </div>
            </div>
            <div className="settings-card__content">
              <p className="settings-card__info text-sm opacity-70 italic">
                {t('settings.language.coming_soon', 'Próximamente: Soporte multi-idioma')}
              </p>
            </div>
          </div>

          <div className="settings-card">
            <div className="settings-card__header">
              <div className="flex items-center gap-2">
                <Bell className="text-rose-500" size={18} />
                <h2 className="settings-card__title">{t('settings.notifications.title', 'Notificaciones')}</h2>
              </div>
            </div>
            <div className="settings-card__content">
              <p className="settings-card__info text-sm opacity-70 italic">
                {t('settings.notifications.coming_soon', 'Próximamente: Centro de alertas')}
              </p>
            </div>
          </div>
        </div>

        {/* Shortcuts Section */}
        <div className="settings-section">
          <h3 className="settings-section__title">
            {t('settings.sections.shortcuts', 'Accesibilidad')}
          </h3>
          <KeyboardShortcuts />
        </div>
      </div>

      {/* System Info Footer */}
      <footer className="settings-footer">
        <div className="settings-footer__info">
          <Info size={14} />
          <span>ERP Webapp v1.0.0 • {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
};

export default SettingsPage;