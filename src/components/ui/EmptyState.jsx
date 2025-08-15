import React from 'react';
import { useI18n } from '@/lib/i18n';

const EmptyState = ({ title, description, actionLabel, onAction }) => {
  const { t } = useI18n();
  return (
    <div className="text-center p-8">
      <div className="mb-4">
        <svg className="w-16 h-16 mx-auto text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M5 7v11a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7"/></svg>
      </div>
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      {description && <p className="text-muted-foreground mb-4">{description}</p>}
      {actionLabel && (
        <button onClick={onAction} className="inline-flex items-center px-4 py-2 bg-primary text-white rounded" aria-label={actionLabel || t('products.create_first')}>
          {actionLabel || t('products.create_first')}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
