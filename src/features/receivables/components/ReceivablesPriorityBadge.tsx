import { useI18n } from '@/lib/i18n'
import {
  RECEIVABLES_PRIORITY_TONE,
  receivablesPriorityKey,
  type ReceivablesPriorityKey,
} from '@/domain/receivables/status'
import { ReceivablesBadge } from './ReceivablesBadge'

const PRIORITY_FALLBACK: Record<Exclude<ReceivablesPriorityKey, 'none'>, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
}

/**
 * Prioridad por días vencidos: alta >60 (misma regla que
 * `summary.high_priority_count`), media 31-60, baja 1-30. Al día no muestra
 * badge.
 */
export const ReceivablesPriorityBadge = ({
  daysOverdue,
  testId,
}: {
  daysOverdue: number | null | undefined
  testId?: string
}) => {
  const { t } = useI18n()
  const key = receivablesPriorityKey(daysOverdue)
  if (key === 'none') return null
  return (
    <ReceivablesBadge tone={RECEIVABLES_PRIORITY_TONE[key]} testId={testId}>
      {t(`receivables.priority.${key}`, PRIORITY_FALLBACK[key])}
    </ReceivablesBadge>
  )
}

export default ReceivablesPriorityBadge
