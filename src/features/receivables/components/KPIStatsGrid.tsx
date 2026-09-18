import { Clock, TrendingUp } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { ClientCreditProfileBundle } from '../types';

/**
 * KPIs del perfil de crédito del cliente.
 * Migración FASE 3: .tsx + tokens + i18n.
 */

interface KPIStatsGridProps {
  metrics?: Partial<ClientCreditProfileBundle['metrics']>
}

const KPIStatsGrid = ({ metrics = {} }: KPIStatsGridProps) => {
  const { t } = useI18n();
  const notAvailable = t('bi.receivables.profile.notAvailable', 'No disp.', {})

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-md">
      {/* Total Outstanding */}
      <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper transition-shadow hover:shadow-fluent-8 min-w-0">
        <p className="text-label-caps uppercase text-on-surface-deep truncate">
          {t('bi.receivables.profile.kpi.outstanding', 'Saldo Pendiente Total', {})}
        </p>
        <p className="text-body-md-bold font-data-mono text-data-mono text-foreground mt-sm leading-none truncate" title={metrics.outstanding}>
          {metrics.outstanding || notAvailable}
        </p>
      </div>

      {/* Credit Limit */}
      <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper transition-shadow hover:shadow-fluent-8 min-w-0">
        <p className="text-label-caps uppercase text-on-surface-deep truncate">
          {t('bi.receivables.profile.kpi.limit', 'Límite de Crédito', {})}
        </p>
        <p className="text-body-md-bold font-data-mono text-data-mono text-foreground mt-sm leading-none truncate" title={metrics.limit}>
          {metrics.limit || notAvailable}
        </p>
        <div className="mt-md w-full bg-surface-muted rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-300"
            style={{ width: `${metrics.limit ? metrics.utilization || 0 : 0}%` }}
          />
        </div>
        <p className="text-label-caps uppercase text-on-surface-deep mt-sm text-right">
          {metrics.limit
            ? `${metrics.utilization || 0}% ${t('bi.receivables.profile.kpi.utilized', 'Utilizado', {})}`
            : t('bi.receivables.profile.kpi.noLimit', 'Crédito no definido', {})}
        </p>
      </div>

      {/* Avg Days to Pay */}
      <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper transition-shadow hover:shadow-fluent-8 min-w-0">
        <p className="text-label-caps uppercase text-on-surface-deep truncate">
          {t('bi.receivables.profile.kpi.avgDays', 'Prom. Días de Pago', {})}
        </p>
        <p className="text-body-md-bold font-data-mono text-data-mono text-foreground mt-sm leading-none truncate">
          {metrics.avgDays || notAvailable}
        </p>
        <div className="flex items-center gap-xs mt-md text-label-caps uppercase text-on-surface-deep">
          <Clock size={10} className="shrink-0" />
          <span className="truncate">{t('bi.receivables.profile.kpi.paymentCycle', 'Ciclo de pago', {})}</span>
        </div>
      </div>

      {/* Last Payment */}
      <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper transition-shadow hover:shadow-fluent-8 min-w-0">
        <p className="text-label-caps uppercase text-on-surface-deep truncate">
          {t('bi.receivables.profile.kpi.lastPayment', 'Último Pago', {})}
        </p>
        <p className="text-body-md-bold font-data-mono text-data-mono text-foreground mt-sm leading-none truncate" title={metrics.lastPayment}>
          {metrics.lastPayment || t('bi.receivables.profile.kpi.noPayments', 'Sin pagos', {})}
        </p>
        <p className="text-label-caps uppercase text-on-surface-deep mt-md flex items-center gap-xs truncate">
          <TrendingUp size={10} className="shrink-0" />{' '}
          {metrics.lastPayment
            ? t('bi.receivables.profile.kpi.recentPayment', 'Pago reciente', {})
            : t('bi.receivables.profile.kpi.emptyHistory', 'Historial vacío', {})}
        </p>
      </div>
    </div>
  );
};

export default KPIStatsGrid
