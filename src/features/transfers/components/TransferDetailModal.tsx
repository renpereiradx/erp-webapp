// ===========================================================================
// TransferDetailModal (F.4 — PLAN_VENDOR_ROLE_SUCURSALES_TERMINALES)
// Detalle de una transferencia y acciones del workflow
// (APPROVED/REJECTED → SHIPPED → IN_TRANSIT → RECEIVED), gated con
// `transfers:write`. Las reglas por sucursal (origen/destino writable) las
// aplica el backend; la UI expone la acción y traduce el 403 a toast.
// ===========================================================================

import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeftRight, ArrowRight, FileText, Loader2, Package, Printer, Truck } from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/useToast'
import type { Branch, BranchTransferItem } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { branchService } from '@/features/branches/services/branchService'
import { productService } from '@/services/productService'
import { useTransferDetail, useTransferStatusChange } from '../hooks/useBranchTransfers'
import TransferTicketModal from './TransferTicketModal'
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
  const [isTicketOpen, setIsTicketOpen] = useState(false)

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
    setIsTicketOpen(false)
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
      // Tracking opcional: vacío → el backend autogenera TRK-<transfer_code>;
      // con valor → se usa el tracking manual (transportista externo).
      const trimmed = tracking.trim()
      applyStatus('SHIPPED', trimmed ? { shipping_tracking_number: trimmed } : {})
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

  // Nombres de sucursal: el detalle del backend no trae el JOIN (solo IDs);
  // se resuelve contra el catálogo cacheado, con fallback a la fila de la
  // bandeja (que sí puede traer *_name) y por último al ID.
  const { data: branchesResponse } = useQuery({
    queryKey: ['branches-names'],
    queryFn: () => branchService.getBranches({ is_active: true, page_size: 100 }),
    staleTime: 1000 * 60 * 5,
    enabled: open,
  })
  const branchNameById = useMemo(() => {
    const branches = (branchesResponse as { branches?: Branch[] })?.branches || []
    return new Map(branches.map((b) => [b.id, b.name]))
  }, [branchesResponse])
  const sourceLabel = current
    ? (current.source_branch_name || branchNameById.get(current.source_branch_id) || String(current.source_branch_id))
    : ''
  const destinationLabel = current
    ? (current.destination_branch_name || branchNameById.get(current.destination_branch_id) || String(current.destination_branch_id))
    : ''

  // Nombres de producto: el detalle tampoco trae product_name (el backend
  // devuelve solo product_id/variant_id). Se resuelven bajo demanda y se
  // cachean 5 min; si la lookup falla se muestra el ID (nunca vacío).
  const missingProductIds = useMemo(
    () => [...new Set(items.filter((i) => !i.product_name).map((i) => i.product_id))],
    [items],
  )
  const { data: productNameById } = useQuery({
    queryKey: ['transfer-product-names', ...[...missingProductIds].sort()],
    queryFn: async () => {
      const entries = await Promise.allSettled(
        missingProductIds.map(async (id) => {
          const p = await productService.getProductById(id)
          const raw = p as unknown as { name?: string; product_name?: string }
          return [id, String(raw?.name || raw?.product_name || id)] as const
        }),
      )
      return new Map(
        entries
          .filter((e): e is PromiseFulfilledResult<readonly [string, string]> => e.status === 'fulfilled')
          .map((e) => e.value),
      )
    },
    staleTime: 1000 * 60 * 5,
    enabled: open && missingProductIds.length > 0,
  })
  const itemDisplayName = (item: BranchTransferItem) =>
    item.product_name || productNameById?.get(item.product_id) || item.product_id

  const totalRequested = items.reduce((acc, i) => acc + (Number(i.quantity_requested) || 0), 0)
  const totalShipped = items.reduce((acc, i) => acc + (Number(i.quantity_shipped ?? i.quantity_requested) || 0), 0)

  return (
    <>
    <Dialog open={open} onOpenChange={(next) => (next ? onOpenChange(true) : closeModal())}>
      {/* DESIGN.md §6.6: mismo patrón que CreateTransferModal — padding/ancho propios
          de la composición Radix, header/cuerpo/footer separados, cuerpo scrollable. */}
      <DialogContent className="w-[calc(100%-3rem)] sm:max-w-[680px] max-h-[90vh] flex flex-col overflow-hidden p-0 rounded-xl border-border-subtle bg-surface shadow-fluent-16">
        <DialogHeader className="mb-0 shrink-0 space-y-xs border-b border-divider bg-surface-muted p-lg">
          <div className="flex items-center gap-sm">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <ArrowLeftRight className="size-5" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-title-md text-foreground">
                {t('transfers.detailTitle', 'Transferencia {code}', { code: current?.transfer_code ?? '' })}
              </DialogTitle>
              <DialogDescription className="text-body-md text-on-surface-deep">
                {current ? `${sourceLabel} → ${destinationLabel}` : ''}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-lg">
          {isLoading ? (
            <div className="flex justify-center py-lg">
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
                {current?.shipping_tracking_number && (
                  <Button
                    variant="secondary"
                    size="sm"
                    data-testid="transfer-print-ticket"
                    onClick={() => setIsTicketOpen(true)}
                  >
                    <Printer className="size-4" />
                    {t('transfers.ticket.print', 'Imprimir')}
                  </Button>
                )}
                {current?.rejection_reason && (
                  <span className="text-body-sm text-error">{current.rejection_reason}</span>
                )}
              </div>
  
              {current && (
                <dl className="grid grid-cols-2 gap-x-md gap-y-xs rounded-md bg-surface-muted p-md text-body-md">
                  <div>
                    <dt className="text-label-caps uppercase text-on-surface-deep">{t('transfers.detail.route', 'Ruta')}</dt>
                    <dd className="text-body-md-bold text-foreground">{sourceLabel} → {destinationLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-label-caps uppercase text-on-surface-deep">{t('transfers.detail.type', 'Tipo')}</dt>
                    <dd className="text-body-md text-foreground">{current.transfer_type}</dd>
                  </div>
                  <div>
                    <dt className="text-label-caps uppercase text-on-surface-deep">{t('transfers.detail.requestedAt', 'Solicitada el')}</dt>
                    <dd className="text-data-mono font-data-mono text-foreground">
                      {new Date(current.requested_date || current.created_at).toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-label-caps uppercase text-on-surface-deep">{t('transfers.detail.requestedBy', 'Solicitada por')}</dt>
                    <dd className="truncate text-body-md text-foreground" title={current.requested_by}>{current.requested_by}</dd>
                  </div>
                  {current.notes && (
                    <div className="col-span-2">
                      <dt className="text-label-caps uppercase text-on-surface-deep">{t('transfers.notes', 'Notas')}</dt>
                      <dd className="text-body-md text-foreground">{current.notes}</dd>
                    </div>
                  )}
                </dl>
              )}

              <div className="space-y-xs">
                <h3 className="text-body-md-bold text-foreground">
                  {t('transfers.detail.itemsTitle', 'Ítems ({count})', { count: String(items.length) })}
                </h3>
                {items.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border-subtle p-md text-body-sm text-on-surface-deep">
                    {t('transfers.noItems', 'Sin ítems')}
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-md border border-border-subtle bg-surface shadow-whisper">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                          <TableHead className="text-label-caps uppercase text-on-surface-deep">
                            {t('transfers.col.product', 'Producto')}
                          </TableHead>
                          <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                            {t('transfers.col.requested', 'Solicitada')}
                          </TableHead>
                          <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                            {t('transfers.col.approved', 'Aprobada')}
                          </TableHead>
                          <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                            {t('transfers.col.shipped', 'Enviada')}
                          </TableHead>
                          <TableHead className="text-label-caps uppercase text-on-surface-deep text-right">
                            {t('transfers.col.received', 'Recibida')}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow
                            key={item.id}
                            data-testid={`transfer-item-${item.id}`}
                            className="hover:bg-surface-muted transition-colors duration-150"
                          >
                            <TableCell className="min-w-44 max-w-72">
                              <span className="flex items-start gap-xs text-body-md-bold text-foreground">
                                <Package className="mt-0.5 size-4 shrink-0 text-on-surface-deep" aria-hidden="true" />
                                <span className="block break-words whitespace-normal" title={itemDisplayName(item)}>
                                  {itemDisplayName(item)}
                                </span>
                              </span>
                              <span className="mt-0.5 block break-all text-data-mono font-data-mono text-on-surface-deep" title={item.variant_id ? `${item.product_id} · ${item.variant_id}` : item.product_id}>
                                {item.product_id}
                                {item.variant_id ? ` · ${item.variant_id}` : ''}
                              </span>
                              {item.notes && (
                                <span className="mt-0.5 block break-words whitespace-normal text-body-sm text-on-surface-deep" title={item.notes}>
                                  {item.notes}
                                </span>
                              )}
                            </TableCell>
                            <TableCell data-testid={`transfer-item-${item.id}-requested`} className="text-data-mono font-data-mono text-right text-foreground">
                              {String(item.quantity_requested)}
                            </TableCell>
                            <TableCell data-testid={`transfer-item-${item.id}-approved`} className="text-data-mono font-data-mono text-right text-foreground">
                              {item.quantity_approved ?? '—'}
                            </TableCell>
                            <TableCell data-testid={`transfer-item-${item.id}-shipped`} className="text-data-mono font-data-mono text-right text-body-md-bold text-foreground">
                              {item.quantity_shipped ?? '—'}
                            </TableCell>
                            <TableCell data-testid={`transfer-item-${item.id}-received`} className="text-data-mono font-data-mono text-right text-foreground">
                              {item.quantity_received ?? '—'}
                            </TableCell>
                          </TableRow>
                        ))}
                        {items.length > 1 && (
                          <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                            <TableCell className="text-body-sm-bold uppercase text-on-surface-deep">
                              {t('transfers.detail.total', 'Total')}
                            </TableCell>
                            <TableCell className="text-data-mono font-data-mono text-right text-foreground">{totalRequested}</TableCell>
                            <TableCell className="text-data-mono font-data-mono text-right text-on-surface-deep">—</TableCell>
                            <TableCell className="text-data-mono font-data-mono text-right text-body-md-bold text-foreground">{totalShipped}</TableCell>
                            <TableCell className="text-data-mono font-data-mono text-right text-on-surface-deep">—</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
  
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
                    placeholder={actionMode === 'SHIPPED' ? t('transfers.trackingPlaceholder', 'Se genera automáticamente (TRK-…). Opcional: tracking del transportista') : undefined}
                  />
                  {actionMode === 'SHIPPED' && (
                    <p className="text-body-sm text-on-surface-deep">
                      {t('transfers.trackingAutoHint', 'Si lo dejás vacío, el sistema genera la guía automáticamente al despachar.')}
                    </p>
                  )}
                  <div className="flex justify-end gap-sm pt-xs">
                    <Button variant="ghost" onClick={() => setActionMode(null)}>
                      {t('common.cancel', 'Cancelar')}
                    </Button>
                    <Button
                      data-testid='transfer-action-confirm'
                      onClick={handleConfirmAction}
                      disabled={statusMutation.isPending || (actionMode === 'REJECTED' ? !reason.trim() : false)}
                    >
                      {t('transfers.confirm', 'Confirmar')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex shrink-0 items-center justify-between gap-sm border-t border-divider p-lg pt-md">
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
    {current && (
      <TransferTicketModal
        open={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        transfer={current}
        items={items}
        sourceLabel={sourceLabel}
        destinationLabel={destinationLabel}
      />
    )}
    </>
  )
}

export default TransferDetailModal
