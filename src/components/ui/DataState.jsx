/**
 * DataState simplificado para MVP - Sin hooks problemáticos
 * Componente unificado para estados loading/error/empty
 * Actualizado para soportar sistema de temas
 */

import React from 'react';
import { CircleAlert, RefreshCw } from 'lucide-react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import GenericSkeletonList from './GenericSkeletonList';

// Skeleton simple
const SimpleSkeleton = ({ count = 3, list = false, testId }) => {
  const { styles } = useThemeStyles();
  const items = Array.from({ length: count });
  const Wrapper = ({ children }) => list ? (
    <div role="list" aria-label="loading" className="space-y-4" data-testid={testId ? `${testId}-list` : undefined}>{children}</div>
  ) : (
    <div className="space-y-4" data-testid={testId ? `${testId}-stack` : undefined}>{children}</div>
  );
  return (
    <Wrapper>
      {items.map((_, i) => (
        <div key={i} className="animate-pulse" role={list ? 'listitem' : undefined}>
          <div className={`${styles.card('p-4')} space-y-3`} data-testid={`simple-skeleton-${i}`}>
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-1/2" />
            <div className="h-3 bg-muted rounded w-5/6" />
          </div>
        </div>
      ))}
    </Wrapper>
  );
};

export default function DataState({
  variant = 'empty',
  title,
  description,
  message,
  actionLabel,
  onAction,
  onRetry,
  testId,
  skeletonProps = {},
  skeletonVariant,
}) {
  const { styles } = useThemeStyles();
  if (variant === 'loading') {
    const count = skeletonProps.count || 3;
    const sv = skeletonVariant || skeletonProps.variant;
    return (
      <div className="data-state-wrapper" data-testid={testId || 'data-state-loading'}>
        {sv === 'list' ? (
          <GenericSkeletonList count={count} data-testid="data-state-loading-list" />
        ) : (
          <SimpleSkeleton count={count} list={sv === 'list'} testId={testId || 'data-state-loading'} />
        )}
      </div>
    );
  }

  if (variant === 'error') {
    return (
      <div className="data-state-wrapper" data-testid={testId || 'data-state-error'}>
        <div className="text-center p-8" data-testid="error-state-inner">
          <div className="mb-4">
            <CircleAlert className="w-16 h-16 mx-auto text-destructive" aria-hidden="true" />
          </div>
          <h3 className="text-2xl font-semibold mb-2">
            {title || 'Error'}
          </h3>
          <p className="text-muted-foreground mb-4" role="status" aria-live="polite" aria-label={message}>
            {message || 'Ha ocurrido un error'}
          </p>
          <div className="flex gap-3 justify-center">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium transition-colors hover:bg-primary/90"
                data-testid="error-retry"
              >
                Reintentar
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  return (
    <div className="data-state-wrapper" data-testid={testId || 'data-state-empty'}>
      <div className="text-center p-8">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <div className="w-8 h-8 bg-muted-foreground/30 rounded-full"></div>
          </div>
        </div>
        <h3 className="text-2xl font-semibold mb-2">
          {title || 'Sin datos'}
        </h3>
        <p className="text-muted-foreground mb-4">
          {description || 'No hay información para mostrar'}
        </p>
        {onAction && actionLabel && (
          <button
            onClick={onAction}
            className="inline-flex items-center justify-center px-6 py-2.5 bg-primary text-primary-foreground rounded-md font-medium transition-colors hover:bg-primary/90"
            data-testid="empty-action"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}