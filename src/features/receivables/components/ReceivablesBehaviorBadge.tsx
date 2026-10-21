import { useI18n } from '@/lib/i18n'
import { paymentBehaviorKey, type PaymentBehaviorKey } from '@/domain/receivables/risk'
import { ReceivablesBadge, type ReceivablesBadgeTone } from './ReceivablesBadge'

const BEHAVIOR_TONE: Record<PaymentBehaviorKey, ReceivablesBadgeTone> = {
  excellent: 'success',
  good: 'success',
  regular: 'warning',
  poor: 'error',
}

const BEHAVIOR_FALLBACK: Record<PaymentBehaviorKey, string> = {
  excellent: 'Excelente',
  good: 'Bueno',
  regular: 'Regular',
  poor: 'Malo',
}

/**
 * Comportamiento de pago calculado por el BE. Un valor desconocido no se
 * renderiza como código crudo: devuelve `null` y la tabla muestra `—`.
 */
export const ReceivablesBehaviorBadge = ({
  behavior,
  testId,
}: {
  behavior: string | null | undefined
  testId?: string
}) => {
  const { t } = useI18n()
  const key = paymentBehaviorKey(behavior)
  if (!key) return null
  return (
    <ReceivablesBadge tone={BEHAVIOR_TONE[key]} testId={testId}>
      {t(`receivables.behavior.${key}`, BEHAVIOR_FALLBACK[key])}
    </ReceivablesBadge>
  )
}

export default ReceivablesBehaviorBadge
