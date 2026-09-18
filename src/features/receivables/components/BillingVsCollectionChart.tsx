import { useI18n } from '@/lib/i18n'

/**
 * Gráfico de comparación entre facturación y cobranza.
 * Migración FASE 3: .tsx + tokens + i18n.
 */

interface TrendEntry {
  date?: string
  name?: string
  billed?: number | string
  amount_billed?: number | string
  total_billed?: number | string
  totalBilled?: number | string
  collected?: number | string
  amount_collected?: number | string
  total_collected?: number | string
  totalCollected?: number | string
  [key: string]: unknown
}

interface BillingVsCollectionChartProps {
  trendData?: TrendEntry[]
}

const num = (d: TrendEntry, ...keys: string[]): number => {
  for (const k of keys) {
    const v = d[k]
    if (v !== undefined && v !== null) return Number(v) || 0
  }
  return 0
}

const BillingVsCollectionChart = ({ trendData }: BillingVsCollectionChartProps) => {
  const { t } = useI18n()
  const safeData = Array.isArray(trendData) && trendData.length > 0 ? trendData : []

  const maxBilled = safeData.reduce((max, d) => {
    return Math.max(max, num(d, 'billed', 'amount_billed', 'total_billed', 'totalBilled'), num(d, 'collected', 'amount_collected', 'total_collected', 'totalCollected'))
  }, 1)
  const scale = 100 / (maxBilled * 1.1)

  const months = safeData.map((d, index) => ({
    name: d.date || d.name || `P${index + 1}`,
    billed: num(d, 'billed', 'amount_billed', 'total_billed', 'totalBilled') * scale,
    collected: num(d, 'collected', 'amount_collected', 'total_collected', 'totalCollected') * scale,
    active: index === safeData.length - 1,
  }))

  return (
    <div className="w-full bg-surface rounded-md border border-border-subtle shadow-whisper flex flex-col transition-shadow hover:shadow-fluent-8">
      <div className="p-md border-b border-border-subtle">
        <h3 className="text-title-md text-foreground">{t('bi.receivables.bvc.title', 'Facturación vs. Cobranzas', {})}</h3>
        <p className="text-body-md text-on-surface-deep mt-xs">
          {t('bi.receivables.bvc.subtitle', 'Tendencia de los últimos 6 meses', {})}
        </p>
      </div>
      <div className="p-md flex-1 flex flex-col justify-end">
        <div className="relative h-64 w-full flex items-end justify-between gap-sm md:gap-md px-sm">
          {/* Líneas de cuadrícula */}
          <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-full h-px bg-divider border-t border-dashed border-divider" />
            ))}
          </div>

          {/* Barras */}
          {months.map((m, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center gap-xs flex-1">
              <div className="w-full flex justify-center items-end gap-xs h-[200px]">
                {/* Facturado (neutro) */}
                <div
                  className="w-3 bg-on-surface-deep/30 rounded-t-sm transition-all hover:brightness-95"
                  style={{ height: `${m.billed}%` }}
                />
                {/* Cobrado (primario) */}
                <div
                  className="w-3 bg-primary rounded-t-sm transition-all hover:brightness-110"
                  style={{ height: `${m.collected}%` }}
                />
              </div>
              <span
                className={`text-body-sm-bold text-center leading-tight font-data-mono text-data-mono ${
                  m.active ? 'text-foreground' : 'text-on-surface-deep'
                }`}
              >
                {m.name}
              </span>
            </div>
          ))}
        </div>

        {/* Leyenda */}
        <div className="flex justify-center gap-md mt-md">
          <div className="flex items-center gap-sm">
            <span className="w-3 h-3 rounded-full bg-on-surface-deep/30" aria-hidden="true" />
            <span className="text-body-md text-on-surface-deep">{t('bi.receivables.bvc.billed', 'Facturado', {})}</span>
          </div>
          <div className="flex items-center gap-sm">
            <span className="w-3 h-3 rounded-full bg-primary" aria-hidden="true" />
            <span className="text-body-md text-on-surface-deep">{t('bi.receivables.bvc.collected', 'Cobrado', {})}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingVsCollectionChart
