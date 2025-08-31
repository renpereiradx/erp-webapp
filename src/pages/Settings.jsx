import React from 'react';
import { useI18n } from '../lib/i18n';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { ThemeSwitcher } from '../components/ThemeSwitcher';

const SettingsPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();

  return (
    <div className="space-y-6">
      <h1 className={styles.header('h1')}>{t('settings.title', 'Configuración')}</h1>
      
      <div className={`p-6 ${styles.card()}`}>
        <h2 className={styles.header('h2')}>{t('settings.theme.title', 'Tema de Apariencia')}</h2>
        <p className={`mt-2 mb-4 ${styles.body()}`}>
          {t('settings.theme.description', 'Selecciona el tema que mejor se adapte a tus preferencias.')}
        </p>
        <div className="max-w-xs">
          <ThemeSwitcher />
        </div>
      </div>

      <div className={`p-6 ${styles.card()}`}>
        <h2 className={styles.header('h2')}>{t('settings.language.title', 'Idioma')}</h2>
        <p className={`mt-2 ${styles.body()}`}>
          {t('settings.language.description', 'Próximamente: Opciones de idioma.')}
        </p>
      </div>

      <div className={`p-6 ${styles.card()}`}>
        <h2 className={styles.header('h2')}>{t('settings.notifications.title', 'Notificaciones')}</h2>
        <p className={`mt-2 ${styles.body()}`}>
          {t('settings.notifications.description', 'Próximamente: Ajustes de notificaciones.')}
        </p>
      </div>

    </div>
  );
};

export default SettingsPage;
