// ===========================================================================
// Settings Page - Fluent Design System 2 + BEM
// Patrón: Fluent Design System 2 + BEM + Zustand
// Basado en: docs/GUIA_MVP_DESARROLLO.md
// ===========================================================================

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/contexts/ThemeContext';
import { Moon, Sun } from 'lucide-react';
import '@/styles/scss/pages/_settings.scss';

const SettingsPage = () => {
  const { t } = useI18n();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className="settings-page">
      {/* Page Header */}
      <header className="page-header">
        <div className="page-header__content">
          <h1 className="page-header__title">
            {t('settings.title', 'Configuración')}
          </h1>
          <p className="page-header__subtitle">
            {t('settings.subtitle', 'Personaliza tu experiencia en la aplicación')}
          </p>
        </div>
      </header>

      {/* Theme Settings Card */}
      <div className="settings-card">
        <div className="settings-card__header">
          <h2 className="settings-card__title">
            {t('settings.theme.title', 'Tema de Apariencia')}
          </h2>
          <p className="settings-card__description">
            {t('settings.theme.description', 'Selecciona entre modo claro u oscuro.')}
          </p>
        </div>

        <div className="settings-card__content">
          <div className="theme-toggle">
            <button
              className={`theme-toggle__option ${!isDark ? 'theme-toggle__option--active' : ''}`}
              onClick={() => isDark && toggleTheme()}
              aria-label={t('settings.theme.light', 'Modo Claro')}
            >
              <Sun className="theme-toggle__icon" size={20} />
              <span className="theme-toggle__label">
                {t('settings.theme.light', 'Claro')}
              </span>
            </button>

            <button
              className={`theme-toggle__option ${isDark ? 'theme-toggle__option--active' : ''}`}
              onClick={() => !isDark && toggleTheme()}
              aria-label={t('settings.theme.dark', 'Modo Oscuro')}
            >
              <Moon className="theme-toggle__icon" size={20} />
              <span className="theme-toggle__label">
                {t('settings.theme.dark', 'Oscuro')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Language Settings Card */}
      <div className="settings-card">
        <div className="settings-card__header">
          <h2 className="settings-card__title">
            {t('settings.language.title', 'Idioma')}
          </h2>
          <p className="settings-card__description">
            {t('settings.language.description', 'Selecciona el idioma de la interfaz.')}
          </p>
        </div>

        <div className="settings-card__content">
          <p className="settings-card__info">
            {t('settings.language.coming_soon', 'Próximamente: Opciones de idioma.')}
          </p>
        </div>
      </div>

      {/* Notifications Settings Card */}
      <div className="settings-card">
        <div className="settings-card__header">
          <h2 className="settings-card__title">
            {t('settings.notifications.title', 'Notificaciones')}
          </h2>
          <p className="settings-card__description">
            {t('settings.notifications.description', 'Gestiona tus preferencias de notificaciones.')}
          </p>
        </div>

        <div className="settings-card__content">
          <p className="settings-card__info">
            {t('settings.notifications.coming_soon', 'Próximamente: Ajustes de notificaciones.')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
