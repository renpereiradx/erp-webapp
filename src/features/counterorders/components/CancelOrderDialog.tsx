import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import EnhancedModal from '@/components/ui/EnhancedModal'
import type { CounterOrderSummary } from '../types'

interface CancelOrderDialogProps {
  order: CounterOrderSummary | null
  loading: boolean
  error?: string | null
  onConfirm: (orderId: string, reason: string) => void
  onClose: () => void
}

/** Cancelación de pedido con motivo obligatorio (§3.2: auditoría). */
export function CancelOrderDialog({ order, loading, error, onConfirm, onClose }: CancelOrderDialogProps) {
  const { t } = useI18n()
  const [reason, setReason] = useState('')

  const handleConfirm = () => {
    if (!order || !reason.trim()) return
    onConfirm(order.id, reason.trim())
  }

  return (
    <EnhancedModal
      isOpen={order !== null}
      onClose={onClose}
      title={t('counterorders.cancel.title', 'Cancelar pedido {code}', { code: order?.code ?? '' })}
      variant="warning"
      size="sm"
      testId="counterorder-cancel-dialog"
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {t('common.cancel', 'Cancelar')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !reason.trim()}
            data-testid="counterorder-cancel-confirm"
          >
            {t('counterorders.cancel.confirm', 'Cancelar pedido')}
          </Button>
        </div>
      }
    >
      <div className="space-y-md">
        <p className="text-body-md text-foreground">
          {t(
            'counterorders.cancel.message',
            'El pedido queda fuera del flujo de caja. Esta acción no se puede deshacer.',
          )}
        </p>
        <label className="block space-y-xs">
          <span className="text-body-sm-bold text-foreground">
            {t('counterorders.cancel.reason_label', 'Motivo (obligatorio)')}
          </span>
          <Input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={t('counterorders.cancel.reason_placeholder', 'Ej.: el cliente se fue sin comprar')}
            data-testid="counterorder-cancel-reason"
            autoFocus
          />
        </label>
        {error && (
          <p className="text-body-sm-bold text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </EnhancedModal>
  )
}
