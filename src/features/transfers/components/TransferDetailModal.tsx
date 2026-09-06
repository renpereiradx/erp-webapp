// ===========================================================================
// TransferDetailModal (F.4 — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Detalle de una transferencia y acciones del workflow
// (APPROVED/REJECTED → SHIPPED → IN_TRANSIT → RECEIVED), gated con
// `transfers:write`. Las reglas por sucursal (origen/destino writable) las
// aplica el backend; la UI expone la acción y traduce el 403 a toast.
// ===========================================================================

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FileText, Loader2, Truck } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import type { BranchTransferItem } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useTransferDetail, useTransferStatusChange } from '../hooks/useBranchTransfers'
import type { BranchTransfer } from '../types'

type TransferAction = 'APPROVED' | 'REJECTED' | 'SHIPPED' | 'IN_TRANSIT' | 'RECEIVED'

interface TransferDetailModalProps {
  transfer: BranchTransfer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Siguiente acción disponible según el estado actual del workflow. */
export function nextActionForStatus(status: string): TransferAction | null {
  switch (status) {
    case 'PENDING':
      return 'APPROVED'
    case 'APPROVED':
      return 'SHIPPED'
    case 'SHIPPED':
      return 'IN_TRANSIT'
    case 'IN_TRANSIT':
      return 'RECEIVED'
    default:
      return null
  }
}

const TransferDetailModal = ({ transfer, open, onOpenChange }: TransferDetailModalProps) => {
  const { t } = useI18n()
  const { hasPermission } = useAuth()
  const { addToast } = useToast()
  const { data: detailResponse, isLoading } = useTransferDetail(open && transfer ? transfer.id : null)
  const statusMutation = useTransferStatusChange(open && transfer ? transfer.id : null)

  const [actionMode, setActionMode] = useState<TransferAction | null>(null)
  const [reason, setReason] = useState('')
  const [tracking, setTracking] = useState('')

  const canWrite = hasPermission('transfers:write')
  const items: BranchTransferItem[] =
    (detailResponse as { items?: BranchTransferItem[] } | undefined)?.items || []
  // Estado fresco tras cada acción (la mutación invalida el detalle); la fila
  // de la bandeja es solo el fallback inicial.
  const current: BranchTransfer | null =
    (detailResponse as { transfer?: BranchTransfer } | undefined)?.transfer || transfer

  const closeModal = () => {
    setActionMode(null)
    setReason('')
    setTracking('')
    onOpenChange(false)
  }

  const applyStatus = (newStatus: TransferAction, extras: { rejection_reason?: string; shipping_tracking_number?: string } = {}) => {
    if (!transfer) return
    statusMutation.mutate(
      { new_status: newStatus, ...extras },
      {
        onSuccess: () => {
          addToast(t('transfers.statusUpdated', 'Transferencia actualizada'), 'success')
          setActionMode(null)
          setReason('')
          setTracking('')
        },
        onError: (error: Error) => addToast(error.message || t('transfers.statusError', 'Error al actualizar la transferencia'), 'error'),
      },
    )
  }

  const handleConfirmAction = () => {
    if (actionMode === 'REJECTED') {
      if (!reason.trim()) return
      applyStatus('REJECTED', { rejection_reason: reason.trim() })
      return
    }
    if (actionMode === 'SHIPPED') {
      if (!tracking.trim()) return
      applyStatus('SHIPPED', { shipping_tracking_number: tracking.trim() })
      return
    }
    if (actionMode) applyStatus(actionMode)
  }

  const nextAction = current ? nextActionForStatus(current.status) : null
  const showActionForm = actionMode === 'REJECTED' || actionMode === 'SHIPPED'

  // F.6: compras de origen de los ítems (una transferencia post-compra las
  // trae todas de la misma compra; líneas manuales no registran ninguna).
  const sourcePurchaseIds = [
    ...new Set(
      items
        .map((item) => item.purchase_order_id)
        .filter((id): id is number => typeof id === 'number'),
    ),
  ]

  return (
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : closeModal())}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="gap-xs">
          <DialogTitle className="text-title-md text-foreground">
            {t('transfers.detailTitle', 'Transferencia {code}', { code: current?.transfer_code ?? '' })}
          </DialogTitle>
          <DialogDescription className="text-body-md text-on-surface-deep">
            {current
              ? `${current.source_branch_name ?? current.source_branch_id} → ${current.destination_branch_name ?? current.destination_branch_id}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center p-lg">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-md">
            <div className="flex flex-wrap items-center gap-sm">
              <Badge variant={current?.status === 'RECEIVED' ? 'success' : current?.status === 'REJECTED' || current?.status === 'CANCELLED' ? 'destructive' : current?.status === 'PENDING' ? 'warning' : 'info'}>
                {current?.status}
              </Badge>
              {current?.shipping_tracking_number && (
                <span className="flex items-center gap-xs text-body-sm text-on-surface-deep">
                  <Truck className="size-4" /> {current.shipping_tracking_number}
                </span>
              )}
              {current?.rejection_reason && (
                <span className="text-body-sm text-error">{current.rejection_reason}</span>
              )}
            </div>

            <ul className="divide-y divide-border-subtle rounded-md border border-border-subtle">
              {items.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-sm p-sm">
                  <span className="min-w-0 flex-1 truncate text-body-md text-foreground">
                    {item.product_name || item.product_id}
                  </span>
                  <span className="text-body-sm-bold text-foreground">
                    {t('transfers.requestedQty', '{qty} u.', { qty: String(item.quantity_requested) })}
                  </span>
                </li>
              ))}
              {items.length === 0 && (
                <li className="p-sm text-body-sm text-on-surface-deep">
                  {t('transfers.noItems', 'Sin ítems')}
                </li>
              )}
            </ul>

            {sourcePurchaseIds.length > 0 && (
              <p className="flex flex-wrap items-center gap-xs text-body-sm text-on-surface-deep">
                <FileText className="size-4" aria-hidden="true" />
                {t('transfers.sourcePurchase', 'Compra de origen')}:
                {sourcePurchaseIds.map((id) => (
                  <Link
                    key={id}
                    to="/compras"
                    data-testid={`transfer-source-purchase-${id}`}
                    aria-label={t('transfers.sourcePurchaseAria', 'Ver la compra de origen #{id} en el historial de compras', { id: String(id) })}
                    className="text-body-sm-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 rounded-sm"
                  >
                    #{id}
                  </Link>
                ))}
              </p>
            )}

            {canWrite && actionMode === null && nextAction && (
              <div className="flex flex-wrap items-center gap-sm">
                {nextAction === 'APPROVED' && (
                  <>
                    <Button data-testid='transfer-approve' onClick={() => applyStatus('APPROVED')} disabled={statusMutation.isPending}>
                      {t('transfers.approve', 'Aprobar')}
                    </Button>
                    <Button variant="secondary" data-testid='transfer-reject' onClick={() => setActionMode('REJECTED')}>
                      {t('transfers.reject', 'Rechazar')}
                    </Button>
                  </>
                )}
                {nextAction === 'SHIPPED' && (
                  <Button data-testid='transfer-ship' onClick={() => setActionMode('SHIPPED')}>
                    {t('transfers.ship', 'Despachar')}
                  </Button>
                )}
                {nextAction === 'IN_TRANSIT' && (
                  <Button data-testid='transfer-in-transit' onClick={() => applyStatus('IN_TRANSIT')} disabled={statusMutation.isPending}>
                    {t('transfers.markInTransit', 'Marcar en tránsito')}
                  </Button>
                )}
                {nextAction === 'RECEIVED' && (
                  <Button data-testid='transfer-receive' onClick={() => applyStatus('RECEIVED')} disabled={statusMutation.isPending}>
                    {t('transfers.receive', 'Recibir')}
                  </Button>
                )}
              </div>
            )}

            {showActionForm && (
              <div className="space-y-xs rounded-md border border-border-subtle bg-surface-muted p-md">
                <Label htmlFor="transfer-action-field">
                  {actionMode === 'REJECTED'
                    ? t('transfers.rejectionReason', 'Motivo del rechazo')
                    : t('transfers.trackingNumber', 'Número de seguimiento')}
                </Label>
                <Input
                  id="transfer-action-field"
                  value={actionMode === 'REJECTED' ? reason : tracking}
                  onChange={(e) => (actionMode === 'REJECTED' ? setReason(e.target.value) : setTracking(e.target.value))}
                />
                <div className="flex justify-end gap-sm pt-xs">
                  <Button variant="ghost" onClick={() => setActionMode(null)}>
                    {t('common.cancel', 'Cancelar')}
                  </Button>
                  <Button
                    data-testid='transfer-action-confirm'
                    onClick={handleConfirmAction}
                    disabled={statusMutation.isPending || (actionMode === 'REJECTED' ? !reason.trim() : actionMode === 'SHIPPED' ? !tracking.trim() : false)}
                  >
                    {t('transfers.confirm', 'Confirmar')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-sm">
          <span className="flex items-center gap-xs text-body-sm text-on-surface-deep">
            <ArrowRight className="size-4" />
            {t('transfers.flowHint', 'PENDING → APPROVED → SHIPPED → IN_TRANSIT → RECEIVED')}
          </span>
          <Button variant="secondary" onClick={closeModal}>
            {t('common.close', 'Cerrar')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default TransferDetailModal
