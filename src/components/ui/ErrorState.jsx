import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n';

const ErrorState = ({ title, message, code, hint, onRetry, onSecondary, actions = [], 'data-testid': testId }) => {
  const { t } = useI18n();
  const ariaLabel = code === 'NETWORK' ? t('announce.error_network', { msg: message }) : code === 'VALIDATION' ? t('announce.error_validation', { msg: message }) : message;
  return (
    <div className="text-center p-8" data-testid={testId || 'error-state'}>
      <div className="mb-4">
        <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
      </div>
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4" role="status" aria-live="polite" aria-label={ariaLabel}>{message}</p>
      {code && (
        <div className="text-xs text-muted-foreground mb-2" aria-label={t('errors.code_label', { code })}>{t('errors.code_label', { code })}</div>
      )}
      {hint && (
        <div className="text-xs text-muted-foreground mb-4" aria-label={`${t('errors.hint.label')}: ${hint}`}>{hint}</div>
      )}
      <div className="flex gap-3 justify-center">
        {onRetry && <Button onClick={onRetry} variant="primary" data-testid="error-retry">{t('products.retry') || 'Reintentar'}</Button>}
        {onSecondary && <Button onClick={onSecondary} variant="secondary" data-testid="error-secondary">{t('errors.toast.diagnostics') || 'Diagnóstico'}</Button>}
        {actions.map((a, i) => (
          <Button key={i} onClick={a.onClick} variant={a.variant || 'ghost'} data-testid={`error-action-${i}`}>{a.label}</Button>
        ))}
      </div>
    </div>
  );
};

export default ErrorState;
