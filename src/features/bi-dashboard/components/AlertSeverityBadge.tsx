import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'
import { getSeverityKey } from '@/domain/dashboard/alerts'

const VARIANTS = {
  critical: 'destructive',
  warning: 'warning',
  info: 'info',
  unknown: 'secondary',
} as const

const LABELS = {
  critical: 'Crítica',
  warning: 'Advertencia',
  info: 'Informativa',
  unknown: 'Desconocida',
} as const

/** Badge de severidad con color + texto (nunca solo color, DESIGN §6.5). */
export const AlertSeverityBadge = ({ severity }: { severity?: string | null }) => {
  const { t } = useI18n()
  const key = getSeverityKey(severity) as keyof typeof VARIANTS

  return (
    <Badge variant={VARIANTS[key]} size="sm">
      {t(`dashboard.alerts.severity.${key}`, LABELS[key])}
    </Badge>
  )
}
