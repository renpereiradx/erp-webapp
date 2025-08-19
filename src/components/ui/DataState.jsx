import React from 'react';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import ProductSkeletonGrid from '@/features/products/components/ProductSkeletonGrid';
import GenericSkeletonList from '@/components/ui/GenericSkeletonList';
import { useI18n } from '@/lib/i18n';

// Unified state component for products views
export default function DataState({
  variant = 'empty', // 'empty' | 'error' | 'loading'
  title,
  description,
  actionLabel,
  onAction,
  message,
  code,
  hint,
  onRetry,
  onSecondary,
  actions = [],
  testId,
  skeletonProps = {},
  skeletonVariant = 'productGrid', // 'productGrid' | 'list'
}) {
  const { t } = useI18n();

  if (variant === 'loading') {
    const SkeletonComp = skeletonVariant === 'productGrid' ? ProductSkeletonGrid : GenericSkeletonList;
    return (
  <div className="data-state-wrapper" data-testid={testId || 'data-state-loading'}>
        <SkeletonComp {...skeletonProps} />
      </div>
    );
  }

  if (variant === 'error') {
    return (
  <div className="data-state-wrapper" data-testid={testId || 'data-state-error'}>
        <ErrorState
          title={title || t('products.error.loading')}
          message={message}
          code={code}
          hint={hint}
          onRetry={onRetry}
          onSecondary={onSecondary}
          actions={actions}
          data-testid={testId ? `${testId}-inner` : 'error-state-inner'}
        />
      </div>
    );
  }

  // default: empty
  return (
  <div className="data-state-wrapper" data-testid={testId || 'data-state-empty'}>
      <EmptyState
        title={title}
        description={description}
        actionLabel={actionLabel}
        onAction={onAction}
        data-testid={testId ? `${testId}-inner` : 'empty-state-inner'}
      />
    </div>
  );
}
