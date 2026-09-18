import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import type { DashboardSummary } from '../types'

/**
 * Grid de tarjetas de resumen para el dashboard de CxC.
 * Migración FASE 3: .tsx + tokens DESIGN (las clases semantic-* del legacy
 * no existían en el tema — reemplazadas por success/error reales) + i18n.
 */
interface SummaryCardsGridProps {
  summary?: Partial<DashboardSummary>
}

const SummaryCardsGrid = ({ summary = {} }: SummaryCardsGridProps) => {
  const { t } = useI18n()

  const totalAmount = summary.totalReceivables?.amount ?? 0
  const totalTrend = summary.totalReceivables?.trend ?? 0
  const overdueAmount = summary.overdueAmount?.amount ?? 0
  const overduePercentage = summary.overdueAmount?.percentage ?? 0
  const collectionRate = summary.collectionRate ?? 0
  const avgDays = Math.round(summary.avgDaysToCollect ?? 0)

  const cardBaseClass =
    'bg-surface border border-border-subtle shadow-whisper p-md rounded-md flex flex-col justify-between h-full overflow-hidden transition-shadow hover:shadow-fluent-8'

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
      {/* Total Pending */}
      <div className={cardBaseClass} data-testid="card-total-pending">
        <div className="flex items-start justify-between gap-sm mb-md">
          <div className="flex-1 min-w-0">
            <p className="text-label-caps uppercase text-on-surface-deep truncate">
              {t('bi.receivables.cards.totalPending', 'Total Pendiente', {})}
            </p>
            <h2 className="text-title-md font-data-mono text-data-mono tracking-tight text-foreground mt-xs">
              {formatPYG(totalAmount)}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/5 shrink-0">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">pending_actions</span>
          </div>
        </div>
        <div className="flex items-center gap-xs mt-auto">
          <span className="flex items-center px-xs py-0.5 rounded-xs bg-success/10 text-success text-body-sm-bold uppercase">
            <span className="material-symbols-outlined text-[14px] mr-0.5" aria-hidden="true">trending_up</span>
            {formatNumber(totalTrend)}%
          </span>
          <span className="text-body-sm-bold text-on-surface-deep uppercase">
            {t('bi.receivables.cards.vsLastMonth', 'vs mes anterior', {})}
          </span>
        </div>
      </div>

      {/* Total Overdue */}
      <div className={`${cardBaseClass} border-l-4 border-l-error`} data-testid="card-total-overdue">
        <div className="flex items-start justify-between gap-sm mb-md">
          <div className="flex-1 min-w-0">
            <p className="text-label-caps uppercase text-on-surface-deep truncate">
              {t('bi.receivables.cards.totalOverdue', 'Total en Mora', {})}
            </p>
            <h2 className="text-title-md font-data-mono text-data-mono tracking-tight text-error mt-xs">
              {formatPYG(overdueAmount)}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-md bg-error/10 text-error border border-error/10 shrink-0">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">warning</span>
          </div>
        </div>
        <div className="flex items-center gap-xs mt-auto">
          <span className="flex items-center px-xs py-0.5 rounded-xs bg-error/10 text-error text-body-sm-bold uppercase">
            <span className="material-symbols-outlined text-[14px] mr-0.5" aria-hidden="true">trending_up</span>
            {formatNumber(overduePercentage)}%
          </span>
          <span className="text-body-sm-bold text-on-surface-deep uppercase">
            {t('bi.receivables.cards.overdueShare', 'mora total', {})}
          </span>
        </div>
      </div>

      {/* Collection Rate */}
      <div className={cardBaseClass} data-testid="card-collection-rate">
        <div className="flex items-start justify-between gap-sm mb-md">
          <div className="flex-1 min-w-0">
            <p className="text-label-caps uppercase text-on-surface-deep truncate">
              {t('bi.receivables.cards.collectionRate', 'Tasa de Cobranza', {})}
            </p>
            <h2 className="text-title-md font-data-mono text-data-mono tracking-tight text-foreground mt-xs">
              {formatNumber(collectionRate)}%
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-md bg-success/10 text-success border border-success/10 shrink-0">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">percent</span>
          </div>
        </div>
        <div className="w-full bg-surface-muted h-1.5 rounded-full overflow-hidden mt-auto">
          <div className="bg-success h-full transition-all duration-300" style={{ width: `${collectionRate}%` }} />
        </div>
      </div>

      {/* Avg Days (DSO) */}
      <div className={cardBaseClass} data-testid="card-avg-days">
        <div className="flex items-start justify-between gap-sm mb-md">
          <div className="flex-1 min-w-0">
            <p className="text-label-caps uppercase text-on-surface-deep truncate">
              {t('bi.receivables.cards.avgDays', 'Días Prom. Cobro', {})}
            </p>
            <h2 className="text-title-md font-data-mono text-data-mono tracking-tight text-foreground mt-xs">
              {avgDays} {t('bi.receivables.cards.days', 'Días', {})}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-md bg-warning/10 text-warning border border-warning/10 shrink-0">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">calendar_clock</span>
          </div>
        </div>
        <div className="flex items-center gap-xs mt-auto">
          <span className="flex items-center px-xs py-0.5 rounded-xs bg-success/10 text-success text-body-sm-bold uppercase">
            <span className="material-symbols-outlined text-[14px] mr-0.5" aria-hidden="true">info</span>
          </span>
          <span className="text-body-sm-bold text-on-surface-deep uppercase">
            {t('bi.receivables.cards.mobileAvg', 'Promedio móvil', {})}
          </span>
        </div>
      </div>
    </div>
  )
}

export default SummaryCardsGrid
