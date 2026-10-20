import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { TrendIndicator } from './TrendIndicator'

type KpiTone = 'primary' | 'success' | 'warning' | 'error' | 'neutral'

const TONE_CLASSES: Record<KpiTone, string> = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  neutral: 'bg-surface-muted text-on-surface-deep',
}

interface KpiCardProps {
  icon: LucideIcon
  label: string
  value: ReactNode
  hint?: ReactNode
  tone?: KpiTone
  trend?: { direction: string | null | undefined; percentage: number | null | undefined }
  compact?: boolean
  className?: string
  testId?: string
}

/**
 * Tarjeta de indicador: icono, label, valor y hint. El valor llega ya
 * formateado (`KpiValue`/`formatPYG`) y el trend es opcional (solo cuando el
 * endpoint lo entrega).
 */
export const KpiCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = 'neutral',
  trend,
  compact = false,
  className,
  testId,
}: KpiCardProps) => (
  <article
    className={cn(
      'flex flex-col gap-sm rounded-md bg-surface p-lg shadow-whisper',
      compact && 'p-md',
      className,
    )}
    data-testid={testId}
  >
    <div className="flex items-start justify-between gap-sm">
      <span
        className={cn(
          'flex size-10 shrink-0 items-center justify-center rounded-md',
          compact && 'size-9',
          TONE_CLASSES[tone],
        )}
        aria-hidden="true"
      >
        <Icon size={compact ? 18 : 20} />
      </span>
      {trend ? (
        <TrendIndicator direction={trend.direction} percentage={trend.percentage} />
      ) : null}
    </div>
    <p className="text-label-caps uppercase text-on-surface-deep">{label}</p>
    <p
      className={cn(
        'font-data-mono text-foreground',
        compact ? 'text-title-md' : 'text-headline-lg-mobile',
      )}
    >
      {value}
    </p>
    {hint ? <p className="text-body-md text-on-surface-deep">{hint}</p> : null}
  </article>
)
