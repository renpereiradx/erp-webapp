/**
 * DataState simplificado para MVP - Sin hooks problemáticos
 * Componente unificado para estados loading/error/empty
 */

import React from 'react';
import { CircleAlert, RefreshCw } from 'lucide-react';

// Skeleton simple
const SimpleSkeleton = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="animate-pulse">
        <div className="bg-gray-200 rounded-lg p-4 space-y-3">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    ))}
  </div>
);

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
}) {
  if (variant === 'loading') {
    return (
      <div className="data-state-wrapper" data-testid={testId || 'data-state-loading'}>
        <SimpleSkeleton count={skeletonProps.count || 3} />
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
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}