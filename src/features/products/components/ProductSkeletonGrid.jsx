import React from 'react';
import { useI18n } from '@/lib/i18n';

// Grid de skeletons para mantener layout estable mientras carga
export default function ProductSkeletonGrid({ count = 12, itemMinWidth = 260, gap = '1.5rem' }) {
  const { t } = useI18n();
  const items = Array.from({ length: count });
  return (
    <div
      data-testid="products-skeleton-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(auto-fill, minmax(${itemMinWidth}px, 1fr))`,
        gap,
      }}
      role="list"
      aria-label={t('products.loading')}
    >
      {items.map((_, i) => (
        <div key={i} role="listitem" data-testid={`product-skeleton-${i}`}>
          <div className="bg-white border rounded-md p-4 animate-pulse">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
              <div className="h-6 bg-gray-200 rounded w-20" />
            </div>
            <div className="space-y-3 mb-4">
              <div className="h-3 bg-gray-200 rounded w-full" />
              <div className="h-3 bg-gray-200 rounded w-5/6" />
              <div className="h-3 bg-gray-200 rounded w-4/6" />
            </div>
            <div className="flex gap-2">
              <div className="h-8 bg-gray-200 rounded w-full" />
              <div className="h-8 bg-gray-200 rounded w-full" />
              <div className="h-8 bg-gray-200 rounded w-10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
