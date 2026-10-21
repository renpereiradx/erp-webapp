import { useI18n } from '@/lib/i18n'
import {
  RECEIVABLE_STATUS_TONE,
  receivableStatusKey,
  type ReceivableStatusKey,
} from '@/domain/receivables/status'
import { ReceivablesBadge } from './ReceivablesBadge'

const STATUS_FALLBACK: Record<ReceivableStatusKey, string> = {
  pending: 'Pendiente',
  partial: 'Parcial',
  overdue: 'Vencida',
  paid: 'Pagada',
  unknown: 'Sin estado',
}

/** Estado de una cuenta; un valor desconocido se rotula sin código crudo. */
export const ReceivablesStatusBadge = ({
  status,
  testId,
}: {
  status: string | null | undefined
  testId?: string
}) => {
  const { t } = useI18n()
  const key = receivableStatusKey(status)
  return (
    <ReceivablesBadge tone={RECEIVABLE_STATUS_TONE[key]} testId={testId}>
      {t(`receivables.status.${key}`, STATUS_FALLBACK[key])}
    </ReceivablesBadge>
  )
}

export default ReceivablesStatusBadge
