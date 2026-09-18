import { AlertTriangle, CheckCircle2, Wallet } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import type { LoosePayload } from '../types'

/**
 * Tarjetas de KPI para el reporte de antigüedad de CxC.
 * Migración FASE 3: .tsx + tokens + i18n.
 */

interface AgingOverviewCardsProps {
  stats?: LoosePayload
  overview?: LoosePayload
}

const AgingOverviewCards = ({ stats = {}, overview = {} }: AgingOverviewCardsProps) => {
  const { t } = useI18n()
  const o = overview as Record<string, any>
  const s = stats as Record<string, any>

  const cardBaseClass =
    'bg-surface border border-border-subtle shadow-whisper p-md rounded-md flex flex-col justify-between h-full overflow-hidden transition-shadow hover:shadow-fluent-8'

  // Data mapping from overview API
  const totalReceivables = o.total_pending ?? 0
  const currentReceivables = o.aging_summary?.current?.amount ?? 0
  const totalOverdue = o.total_overdue ?? 0
  const criticalOverdue = o.aging_summary?.over_90_days?.amount ?? 0

  // Percentages and trends
  const collectionRate = o.collection_rate ?? s.collection_rate ?? 0
  const overduePercentage = s.overdue_percentage ?? 0
  const over90Percentage = o.aging_summary?.over_90_days?.percentage ?? 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
      {/* Total Receivables */}
      <div className={cardBaseClass} data-testid="aging-card-portfolio">
        <div className="flex items-start justify-between gap-sm mb-md">
          <div className="flex-1 min-w-0">
            <p className="text-label-caps uppercase text-on-surface-deep truncate">
              {t('bi.receivables.aging.cards.portfolio', 'Total Cartera', {})}
            </p>
            <h2 className="text-title-md font-data-mono text-data-mono tracking-tight text-foreground mt-xs">
              {formatPYG(totalReceivables)}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary border border-primary/5 shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div className="w-full bg-surface-muted h-1 rounded-full overflow-hidden mt-auto">
          <div className="bg-primary h-full w-full opacity-30" />
        </div>
      </div>

      {/* Current Portfolio */}
      <div className={`${cardBaseClass} border-l-4 border-l-success`}>
        <div className="flex items-start justify-between gap-sm mb-md">
          <div className="flex-1 min-w-0">
            <p className="text-label-caps uppercase text-on-surface-deep truncate">
              {t('bi.receivables.aging.cards.current', 'Al Día (Corriente)', {})}
            </p>
            <h2 className="text-title-md font-data-mono text-data-mono tracking-tight text-success mt-xs">
              {formatPYG(currentReceivables)}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-md bg-success/10 text-success border border-success/10 shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center gap-xs mt-auto">
          <span className="text-label-caps uppercase text-success">
            {formatNumber(collectionRate)}% {t('bi.receivables.aging.cards.effectiveness', 'de efectividad', {})}
          </span>
        </div>
      </div>

      {/* Total Overdue */}
      <div className={`${cardBaseClass} border-l-4 border-l-error`}>
        <div className="flex items-start justify-between gap-sm mb-md">
          <div className="flex-1 min-w-0">
            <p className="text-label-caps uppercase text-on-surface-deep truncate">
              {t('bi.receivables.aging.cards.overdue', 'Cartera Vencida', {})}
            </p>
            <h2 className="text-title-md font-data-mono text-data-mono tracking-tight text-error mt-xs">
              {formatPYG(totalOverdue)}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-md bg-error/10 text-error border border-error/10 shrink-0">
            <AlertTriangle className="h-5 w-5" />
          </div>
        </div>
        <div className="flex items-center gap-xs mt-auto">
          <span className="flex items-center px-xs py-0.5 rounded-xs bg-error/10 text-error text-body-sm-bold uppercase">
            {formatNumber(overduePercentage)}%
          </span>
          <span className="text-body-sm-bold text-on-surface-deep uppercase">
            {t('bi.receivables.cards.overdueShare', 'mora total', {})}
          </span>
        </div>
      </div>

      {/* Critical Overdue */}
      <div className={`${cardBaseClass} border-l-4 border-l-warning`}>
        <div className="flex items-start justify-between gap-sm mb-md">
          <div className="flex-1 min-w-0">
            <p className="text-label-caps uppercase text-on-surface-deep truncate">
              {t('bi.receivables.aging.cards.over90', 'Mora > 90 Días', {})}
            </p>
            <h2 className="text-title-md font-data-mono text-data-mono tracking-tight text-warning mt-xs">
              {formatPYG(criticalOverdue)}
            </h2>
          </div>
          <div className="flex size-9 items-center justify-center rounded-md bg-warning/10 text-warning border border-warning/10 shrink-0">
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">priority_high</span>
          </div>
        </div>
        <div className="w-full bg-surface-muted h-1.5 rounded-full overflow-hidden mt-auto">
          <div className="bg-warning h-full transition-all duration-300" style={{ width: `${formatNumber(over90Percentage)}%` }} />
        </div>
      </div>
    </div>
  )
}

export default AgingOverviewCards
