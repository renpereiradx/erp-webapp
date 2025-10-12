import React from 'react';
import { useI18n } from '../lib/i18n';
import { useThemeStyles } from '../hooks/useThemeStyles';
import { ThemeSwitcher } from '../components/ThemeSwitcher';
import { Button } from '@/components/ui/button';
import { useTheme } from '../contexts/ThemeContext';

const SettingsPage = () => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();
  const { theme, isNeoBrutalism, isMaterial, isFluent } = useTheme();
  
  // Get theme values
  const isNeoBrutalismValue = isNeoBrutalism();
  const isMaterialValue = isMaterial();
  const isFluentValue = isFluent();
  
  // Get upgrade card styles based on theme
  const getUpgradeCardStyles = () => {
    if (isNeoBrutalismValue) {
      return {
        backgroundColor: 'var(--card)',
        border: '4px solid var(--border)',
        boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)'
      };
    }
    if (isFluentValue) {
      return {
        backgroundColor: 'var(--fluent-surface-primary)',
        border: '1px solid var(--fluent-neutral-grey-30)',
        boxShadow: 'var(--fluent-elevation-2)',
        borderRadius: 'var(--fluent-radius-medium)'
      };
    }
    if (isMaterialValue) {
      return {
        backgroundColor: 'var(--material-surface)',
        border: '1px solid var(--material-outline)',
        boxShadow: 'var(--material-elevation-2)',
        borderRadius: 'var(--material-radius-medium)'
      };
    }
    return {
      backgroundColor: 'var(--card)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      borderRadius: '0.5rem'
    };
  };

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

      {/* Pro Upgrade Section */}
      <div className={`p-6 ${isNeoBrutalismValue ? '' : isFluentValue ? 'fluent-radius-medium' : 'rounded-lg'}`}
           style={getUpgradeCardStyles()}>
        <h2 className={`${styles.header('h2')} mb-2`}
            style={{ color: 'var(--foreground)' }}>
          {isNeoBrutalismValue ? 'UPGRADE TO PRO' : 'Upgrade to Pro'}
        </h2>
        <p className={`${styles.body()} mb-4`}
           style={{ color: 'var(--muted-foreground)' }}>
          {isNeoBrutalismValue 
            ? 'ARE YOU LOOKING FOR MORE FEATURES? CHECK OUT OUR PRO VERSION.' 
            : 'Are you looking for more features? Check out our Pro version.'
          }
        </p>
        <Button 
          variant={isNeoBrutalismValue ? 'red' : 'default'} 
          size="sm" 
          className="w-full max-w-xs"
        >
          <span className="mr-2">→</span>
          {isNeoBrutalismValue ? 'UPGRADE NOW' : 'Upgrade Now'}
          {isNeoBrutalismValue && (
            <span className="ml-2 px-2 py-1 text-xs font-black border-2 border-black bg-yellow-400">
              22
            </span>
          )}
        </Button>
      </div>

    </div>
  );
};

export default SettingsPage;
