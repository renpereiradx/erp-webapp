import React from 'react';
import { useI18n } from '@/lib/i18n';

const ICONS = {
  box: (cls) => (<svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M5 7v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7"/></svg>),
};

const EmptyState = ({ title, description, actionLabel, onAction, icon = 'box', 'data-testid': testId }) => {
  const { t } = useI18n();
  return (
    <div className="text-center p-8" data-testid={testId || 'empty-state'}>
      <div className="mb-4">
        {(ICONS[icon] || ICONS.box)('w-16 h-16 mx-auto text-muted-foreground')}
      </div>
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-4">{description}</p>}
      {actionLabel && (
        <button onClick={onAction} className="inline-flex items-center px-4 py-2 bg-primary text-white rounded" aria-label={actionLabel || t('products.create_first')} data-testid="empty-action">
          {actionLabel || t('products.create_first')}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
