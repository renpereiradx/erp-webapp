import { useI18n } from '@/lib/i18n'
import { formatNumber, formatPYG } from '@/utils/currencyUtils'
import type { LoosePayload } from '../types'

/**
 * Gráfico de resumen de antigüedad (tramos) para Dashboard CxC y reportes.
 * Migración FASE 3: .tsx + tokens planos (los gradientes del legacy fuera,
 * DESIGN §1.9) + i18n.
 */
interface AgingSummaryChartProps {
  agingData?: LoosePayload
}

const TRAMOS = [
  { key: 'current', tone: 'bg-primary', text: 'text-primary', labelKey: 'bi.receivables.aging.current', label: 'Corriente' },
  { key: 'days_30_60', tone: 'bg-warning', text: 'text-warning', labelKey: 'bi.receivables.aging.days30_60', label: '30-60 Días' },
  { key: 'days_60_90', tone: 'bg-warning', text: 'text-warning', labelKey: 'bi.receivables.aging.days60_90', label: '60-90 Días' },
  { key: 'over_90_days', tone: 'bg-error', text: 'text-error', labelKey: 'bi.receivables.aging.over90', label: '> 90 Días' },
] as const

const AgingSummaryChart = ({ agingData = {} }: AgingSummaryChartProps) => {
  const { t } = useI18n()
  const data = agingData as Record<string, Record<string, number> | number | undefined>

  const getAmount = (key: string) => {
    const v = data[key]
    return (typeof v === 'object' ? v?.amount : v) ?? 0
  }
  const getPercentage = (key: string) => {
    const v = data[key]
    const raw = typeof v === 'object' ? v?.percentage : 0
    return typeof raw === 'number' ? Number(raw) : 0
  }

  return (
    <div className="bg-surface rounded-md shadow-whisper border border-border-subtle flex flex-col h-full overflow-hidden transition-shadow hover:shadow-fluent-8">
      {/* Header de Tarjeta */}
      <div className="p-md border-b border-border-subtle bg-surface-muted flex justify-between items-center">
        <div>
          <h3 className="text-title-md text-foreground tracking-tight">
            {t('bi.receivables.aging.chartTitle', 'Tramos de Antigüedad', {})}
          </h3>
          <p className="text-body-sm-bold text-on-surface-deep uppercase mt-0.5">
            {t('bi.receivables.aging.chartSubtitle', 'Desglose porcentual de cartera', {})}
          </p>
        </div>
      </div>

      <div className="p-md flex flex-col gap-lg">
        {/* Barra de Distribución Principal */}
        <div className="space-y-md">
          <div className="w-full h-14 flex rounded-md overflow-hidden border border-border-subtle p-xs bg-surface-muted">
            {TRAMOS.map((tramo, i) => {
              const pct = getPercentage(tramo.key)
              if (pct <= 0) return null

              return (
                <div
                  key={i}
                  style={{ width: `${pct}%` }}
                  className={`relative h-full ${tramo.tone} transition-all duration-300 hover:brightness-110 flex items-center justify-center rounded-sm mx-px overflow-hidden`}
                  title={`${t(tramo.labelKey, tramo.label, {})}: ${formatNumber(pct)}% (${formatPYG(getAmount(tramo.key))})`}
                >
                  {pct >= 12 && (
                    <span className="text-body-sm-bold text-on-primary pointer-events-none animate-in fade-in duration-300">
                      {formatNumber(pct)}%
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex justify-between text-label-caps uppercase text-on-surface-deep px-sm">
            <span className="flex items-center gap-xs">
              <span className="size-2 rounded-full bg-primary" aria-hidden="true" />
              {t('bi.receivables.aging.upToDate', 'Al Día', {})}
            </span>
            <span className="flex items-center gap-xs">
              {t('bi.receivables.aging.critical', 'Crítica', {})}
              <span className="size-2 rounded-full bg-error" aria-hidden="true" />
            </span>
          </div>
        </div>

        {/* Lista Detallada con Indicadores Individuales */}
        <div className="space-y-md">
          {TRAMOS.map((tramo) => {
            const amount = getAmount(tramo.key)
            const pct = getPercentage(tramo.key)

            return (
              <div key={tramo.key} className="flex flex-col gap-xs">
                <div className="flex justify-between items-end">
                  <div className="flex flex-col">
                    <h4 className="text-body-md-bold text-foreground">{t(tramo.labelKey, tramo.label, {})}</h4>
                    <p className="text-label-caps uppercase text-on-surface-deep mt-0.5">
                      {formatNumber(pct)}% {t('bi.receivables.aging.ofPortfolio', 'de la cartera', {})}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-body-md-bold font-data-mono text-data-mono text-foreground block leading-none">
                      {formatPYG(amount)}
                    </span>
                  </div>
                </div>
                {/* Mini barra de progreso individual */}
                <div className="w-full h-2 bg-surface-muted rounded-full overflow-hidden border border-border-subtle">
                  <div className={`${tramo.tone} h-full rounded-full transition-all duration-300`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Footer Informativo */}
      <div className="mt-auto p-sm bg-surface-muted border-t border-border-subtle flex items-center justify-between">
        <span className="text-label-caps uppercase text-on-surface-deep">
          {t('bi.receivables.aging.cutoff', 'Corte', {})}:{' '}
          <span className="font-data-mono text-data-mono">{new Date().toLocaleDateString('es-PY')}</span>
        </span>
      </div>
    </div>
  )
}

export default AgingSummaryChart
