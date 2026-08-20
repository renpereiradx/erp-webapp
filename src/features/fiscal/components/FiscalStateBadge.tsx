/**
 * FiscalStateBadge — badge del estado SIFEN de un DE (FE5.1).
 *
 * Reutiliza el mapeo estado → i18nKey + badgeVariant de
 * domain/fiscal/states.ts (FISCAL_STATE_META). Sin estado (venta no fiscal,
 * D3) renderiza un badge neutro con `emptyLabel`.
 */
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { fiscalStateMeta } from '@/domain/fiscal/states';

interface FiscalStateBadgeProps {
  /** Estado del DE (fiscal_documents.estado). '' / undefined = no fiscal. */
  state?: string;
  /** Label cuando no hay estado (default: '—'). */
  emptyLabel?: string;
  /** Tamaño del badge (default: sm para tablas). */
  size?: 'default' | 'sm' | 'lg';
}

const FiscalStateBadge: React.FC<FiscalStateBadgeProps> = ({
  state,
  emptyLabel,
  size = 'sm',
}) => {
  const { t } = useI18n();

  if (!state) {
    return (
      <Badge variant="secondary" size={size}>
        {emptyLabel ?? '—'}
      </Badge>
    );
  }

  const meta = fiscalStateMeta(state);
  return (
    <Badge variant={meta.badgeVariant} size={size}>
      {t(meta.i18nKey, state)}
    </Badge>
  );
};

export default FiscalStateBadge;
