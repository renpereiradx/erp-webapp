import { Card } from '@/components/ui/card'
import { Minus, TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react'
import { formatNumber } from '@/utils/currencyUtils'

/**
 * KpiCard único del feature (antes triplicado en los 6 monolitos).
 * Tokens DESIGN §2/§3: label caps, valor en mono tabular, chip de icono con
 * tinte semántico y badge de tendencia success/error/neutro.
 * FASE 2 — PLAN_ALINEACION_BI_FRONTEND.
 */

type KpiTone = 'primary' | 'success' | 'warning' | 'info'

export interface KpiCardProps {
  title: string
  value?: number | null
  trendValue?: number | null
  /** `true` (default): importa en Gs.; `false`: porcentaje. */
  isCurrency?: boolean
  icon: LucideIcon
  tone?: KpiTone
  /** Card destacada del periodo (antes: gradiente azul profundo). */
  isAnchor?: boolean
  testId?: string
}

const TONE_CHIP: Record<KpiTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-secondary/10 text-secondary',
}

const KpiCard = ({
  title,
  value,
  trendValue,
  isCurrency = true,
  icon: Icon,
  tone = 'primary',
  isAnchor = false,
  testId,
}: KpiCardProps) => {
  const trend = Number(trendValue ?? 0)
  const isPositive = trend > 0
  const isNegative = trend < 0
  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus
  const trendLabel = `${formatNumber(Math.abs(trend), 1)}%`

  const trendChipTone = isPositive
    ? 'bg-success/10 text-success'
    : isNegative
      ? 'bg-error/10 text-error'
      : 'bg-surface-muted text-on-surface-deep'

  const displayValue = isCurrency ? `Gs. ${formatNumber(value ?? 0)}` : `${formatNumber(value ?? 0)}%`

  if (isAnchor) {
    return (
      <Card
        className="bg-primary text-on-primary border-0 shadow-whisper h-full animate-in fade-in slide-in-from-bottom-4 duration-300"
        data-testid={testId}
      >
        <div className="p-lg flex flex-col justify-between h-full gap-md">
          <div className="flex justify-between items-start gap-sm">
            <p className="text-label-caps uppercase opacity-80">{title}</p>
            <div className={`flex items-center gap-xs px-sm py-0.5 rounded-xs text-body-sm-bold font-data-mono bg-white/15`}>
              <TrendIcon className="w-3 h-3" strokeWidth={3} />
              {trendLabel}
            </div>
          </div>
          <div className="flex items-end justify-between gap-sm">
            <span className="text-headline-lg font-data-mono text-data-mono tracking-tight truncate">
              {displayValue}
            </span>
            <div className="p-sm bg-white/15 rounded-sm shrink-0">
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card
      className="border-border-subtle shadow-whisper h-full animate-in fade-in slide-in-from-bottom-4 duration-300"
      data-testid={testId}
    >
      <div className="p-lg flex flex-col justify-between h-full gap-md">
        <div className="flex justify-between items-start gap-sm">
          <div className="p-sm rounded-sm border border-border-subtle bg-surface-muted">
            <Icon className={`w-5 h-5 ${TONE_CHIP[tone].split(' ')[1]}`} />
          </div>
          <div
            className={`flex items-center gap-xs px-sm py-0.5 rounded-xs text-body-sm-bold font-data-mono ${trendChipTone}`}
          >
            <TrendIcon className="w-3 h-3" strokeWidth={3} />
            {trendLabel}
          </div>
        </div>

        <div className="flex flex-col gap-xs">
          <p className="text-label-caps uppercase text-on-surface-deep">{title}</p>
          <span className="text-title-md font-data-mono text-data-mono tracking-tight text-foreground truncate">
            {displayValue}
          </span>
        </div>
      </div>
    </Card>
  )
}

export default KpiCard
