import { Info } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatNumber, formatPYG } from '@/utils/currencyUtils';
import type { PayablesAgingBar, PayablesAgingStats } from '@/domain/payables/dashboard';

/**
 * Resumen de antigüedad del dashboard de CxP (consumen
 * domain/payables/dashboard). Migración FASE 4: .tsx + tokens planos
 * (gradientes fuera, DESIGN §1.9) + i18n.
 */

interface AgingSummaryProps {
  aging?: PayablesAgingBar[]
  stats?: PayablesAgingStats
}

const AgingSummary = ({ aging = [], stats = {} }: AgingSummaryProps) => {
  const { t } = useI18n();

  const barTone = (item: PayablesAgingBar) => {
    if (item.critical) return 'bg-error';
    if (item.label.includes('61')) return 'bg-warning';
    if (item.label.includes('31')) return 'bg-warning/70';
    return 'bg-primary';
  };
  const textTone = (item: PayablesAgingBar) => {
    if (item.critical) return 'text-error';
    if (item.label.includes('61') || item.label.includes('31')) return 'text-warning';
    return 'text-on-surface-deep';
  };

  return (
    <div className="bg-surface border border-border-subtle shadow-whisper rounded-md p-md overflow-hidden h-full">
      <div className="flex justify-between items-center mb-lg">
        <div>
          <h3 className="text-title-md tracking-tight text-foreground">
            {t('bi.payables.agingSummary.title', 'Resumen de Antigüedad (Aging)', {})}
          </h3>
          <p className="text-body-sm-bold text-on-surface-deep uppercase mt-0.5">
            {t('bi.payables.agingSummary.subtitle', 'Distribución de deuda por vencimiento', {})}
          </p>
        </div>
        <div className="flex items-center gap-xs px-sm py-xs bg-surface-muted rounded-sm border border-border-subtle">
          <span className="text-label-caps uppercase text-on-surface-deep">PYG</span>
          <Info className="text-primary w-3.5 h-3.5" />
        </div>
      </div>

      <div className="space-y-lg">
        {aging.map((item, index) => {
          const tone = barTone(item);
          const pctValue = Number(item.percentage) || 0;

          return (
            <div key={index} className="space-y-sm">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  <span className={`text-body-sm-bold uppercase ${textTone(item)}`}>{item.label}</span>
                  <span className="text-label-caps uppercase text-on-surface-deep mt-0.5">
                    {formatNumber(pctValue)}% {t('bi.payables.agingSummary.ofTotal', 'del total', {})}
                  </span>
                </div>
                <span className={`font-data-mono text-data-mono text-body-md-bold ${textTone(item)}`}>
                  {formatPYG(item.amount ?? 0)}
                </span>
              </div>
              <div className="w-full bg-surface-muted h-8 rounded-md overflow-hidden flex p-xs border border-border-subtle">
                <div
                  className={`${tone} h-full flex items-center justify-end px-sm rounded-sm transition-all duration-300`}
                  style={{ width: `${pctValue}%` }}
                >
                  {pctValue >= 15 && (
                    <span className="text-body-sm-bold text-on-primary font-data-mono text-data-mono">
                      {formatNumber(pctValue)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-lg pt-md border-t border-border-subtle grid grid-cols-4 gap-sm text-center">
        <div className="space-y-xs">
          <p className="text-label-caps uppercase text-on-surface-deep">{t('bi.payables.agingSummary.total', 'Deuda Total', {})}</p>
          <p className="text-body-md-bold font-data-mono text-data-mono text-foreground truncate">{stats.total}</p>
        </div>
        <div className="space-y-xs px-xs">
          <p className="text-label-caps uppercase text-on-surface-deep">{t('bi.payables.agingSummary.onTime', 'Al Día', {})}</p>
          <p className="text-body-md-bold font-data-mono text-data-mono text-success">{stats.onTime}</p>
        </div>
        <div className="space-y-xs pr-xs">
          <p className="text-label-caps uppercase text-on-surface-deep">{t('bi.payables.agingSummary.critical', 'Venc. Crítico', {})}</p>
          <p className="text-body-md-bold font-data-mono text-data-mono text-error">{stats.critical}</p>
        </div>
        <div className="space-y-xs border-l border-border-subtle pl-xs">
          <p className="text-label-caps uppercase text-on-surface-deep">{t('bi.payables.agingSummary.avgPayment', 'Prom. Pago', {})}</p>
          <p className="text-body-md-bold font-data-mono text-data-mono text-foreground truncate">{stats.avgDays}</p>
        </div>
      </div>
    </div>
  );
};

export default AgingSummary
