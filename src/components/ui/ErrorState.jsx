import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n';

const ErrorState = ({ title, message, code, onRetry, onSecondary, actions = [] }) => {
  const { t } = useI18n();
  return (
    <div className="text-center p-8">
      <div className="mb-4">
        <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
      </div>
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4" role="status" aria-live="polite">{message}</p>
      {code && (
        <div className="text-xs text-muted-foreground mb-4">{t('errors.code_label', { code })}</div>
      )}
      <div className="flex gap-3 justify-center">
        {onRetry && <Button onClick={onRetry} variant="primary">{t('products.retry') || 'Reintentar'}</Button>}
        {onSecondary && <Button onClick={onSecondary} variant="secondary">{t('errors.toast.diagnostics') || 'Diagnóstico'}</Button>}
        {actions.map((a, i) => (
          <Button key={i} onClick={a.onClick} variant={a.variant || 'ghost'}>{a.label}</Button>
        ))}
      </div>
    </div>
  );
};

export default ErrorState;
