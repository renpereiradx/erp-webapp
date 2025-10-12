/**
 * Componente EmptyState mejorado - Estilo modal de inventario
 * Proporciona estados vacíos atractivos y útiles para el usuario
 */

import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { Button } from '@/components/ui/button';

const EmptyState = ({ 
  icon: Icon,
  title, 
  description, 
  actionLabel, 
  onAction,
  size = 'medium',
  variant = 'default',
  'data-testid': testId 
}) => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();

  // Configuración de tamaños
  const sizeConfig = {
    small: {
      container: 'p-6',
      icon: 'w-8 h-8',
      titleClass: 'text-base font-medium mb-1',
      descClass: 'text-xs'
    },
    medium: {
      container: 'p-8',
      icon: 'w-12 h-12',
      titleClass: 'text-lg font-medium mb-2',
      descClass: 'text-sm'
    },
    large: {
      container: 'p-12',
      icon: 'w-16 h-16',
      titleClass: 'text-xl font-medium mb-3',
      descClass: 'text-base'
    }
  };

  // Configuración de variantes - estilo modal inventario
  const variantConfig = {
    default: {
      container: 'text-muted-foreground border-2 border-dashed border-muted rounded-lg',
      icon: 'opacity-50'
    },
    search: {
      container: 'text-muted-foreground border-2 border-dashed border-muted/60 rounded-lg',
      icon: 'opacity-40'
    },
    instruction: {
      container: 'text-muted-foreground border-2 border-dashed border-muted/40 rounded-lg bg-muted/5',
      icon: 'opacity-50'
    }
  };

  const config = sizeConfig[size];
  const variantStyle = variantConfig[variant];

  return (
    <div 
      className={`text-center ${config.container} ${variantStyle.container}`} 
      data-testid={testId || 'empty-state'}
    >
      {Icon && (
        <Icon className={`${config.icon} mx-auto mb-3 ${variantStyle.icon}`} />
      )}
      
      {title && (
        <p className={config.titleClass}>
          {title}
        </p>
      )}
      
      {description && (
        <p className={config.descClass}>
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <div className="mt-4">
          <Button 
            onClick={onAction}
            variant="secondary"
            size="sm"
            aria-label={actionLabel || t('products.create_first')}
            data-testid="empty-action"
          >
            {actionLabel || t('products.create_first')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default EmptyState;
