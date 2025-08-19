import React from 'react';

// Generic skeleton list for unified DataState usage across features
export default function GenericSkeletonList({ count = 8, lineHeight = 16, gap = 12, rounded = 6, 'data-testid': testId }) {
  const items = Array.from({ length: count });
  return (
    <div
      className="flex flex-col w-full items-stretch mx-auto max-w-3xl"
      style={{ gap }}
      data-testid={testId || 'generic-skeleton-list'}
      role="list"
      aria-label="loading"
    >
      {items.map((_, i) => (
        <div
          key={i}
          role="listitem"
          className="animate-pulse bg-muted/40 dark:bg-muted/20"
          style={{ height: lineHeight, borderRadius: rounded }}
          data-testid={`generic-skeleton-${i}`}
        />
      ))}
    </div>
  );
}
