import { AlertTriangle, StickyNote } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { formatCurrency } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'
import type { CounterOrderDetail, CounterOrderSummary } from '../types'
import { OrderStatusBadge } from './OrderStatusBadge'

interface OrderDetailModalProps {
  open: boolean
  /** Detalle resuelto (de useCounterOrder) mientras open; null = cargando. */
  detail: CounterOrderDetail | null
  isLoading: boolean
  /** Fila de la bandeja (para encabezado mientras llega el detalle). */
  summary: CounterOrderSummary | null
  onClose: () => void
}

/**
 * Detalle resuelto del pedido (FASE 2.1): precios vigentes + IVA por ítem,
 * warnings informativos de stock (§4.4), nota del vendedor y, si fue
 * procesado, la venta enlazada (§4.8).
 */
export function OrderDetailModal({ open, detail, isLoading, summary, onClose }: OrderDetailModalProps) {
  const { t } = useI18n()
  const order = detail ?? summary

  return (
    <EnhancedModal
      isOpen={open}
      onClose={onClose}
      title={t('counterorders.detail.title', 'Pedido {code}', { code: order?.code ?? '' })}
      size="lg"
      testId="counterorder-detail-modal"
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={onClose}>
            {t('common.close', 'Cerrar')}
          </Button>
        </div>
      }
    >
      {isLoading && (
        <p className="text-body-md text-on-surface-deep animate-pulse" data-testid="counterorder-detail-loading">
          {t('counterorders.detail.loading', 'Resolviendo precios vigentes…')}
        </p>
      )}
      {!isLoading && detail && (
        <div className="space-y-md">
          <div className="flex items-center gap-sm flex-wrap">
            <OrderStatusBadge status={detail.status} />
            <span className="text-body-sm text-on-surface-deep">{detail.client_name}</span>
            <span className="text-body-sm text-on-surface-deep">
              · {t('counterorders.detail.created_by', 'por {name}', { name: detail.created_by_name })}
            </span>
            {detail.claimed_by_name && (
              <span className="text-body-sm text-warning">
                · {t('counterorders.detail.claimed_by', 'en caja con {name}', { name: detail.claimed_by_name })}
              </span>
            )}
          </div>

          {detail.notes && (
            <div
              className="bg-warning/10 text-warning rounded-sm p-sm flex items-start gap-sm"
              data-testid="counterorder-detail-notes"
            >
              <StickyNote className="size-4 mt-0.5 shrink-0" aria-hidden="true" />
              <p className="text-body-sm whitespace-pre-line">{detail.notes}</p>
            </div>
          )}

          {detail.converted_sale_id && (
            <p className="text-body-sm text-success" data-testid="counterorder-detail-sale">
              {t('counterorders.detail.sale_link', 'Procesado como venta {saleId}', {
                saleId: detail.converted_sale_id,
              })}
            </p>
          )}
          {detail.cancelled_reason && (
            <p className="text-body-sm text-error" data-testid="counterorder-detail-cancel-reason">
              {t('counterorders.detail.cancel_reason', 'Cancelado: {reason}', { reason: detail.cancelled_reason })}
            </p>
          )}

          <ul className="divide-y divide-border-subtle" data-testid="counterorder-detail-items">
            {detail.items.map(item => (
              <li key={item.id} className="py-sm flex items-start justify-between gap-md">
                <div className="min-w-0">
                  <p className="text-body-md-bold text-foreground truncate">
                    {item.product_name}
                    {item.variant_id && (
                      <span className="text-body-sm text-on-surface-deep"> · {item.variant_id}</span>
                    )}
                  </p>
                  <p className="text-body-sm text-on-surface-deep font-data-mono">
                    {item.quantity} {item.unit} × {formatCurrency(item.unit_price_with_tax)}
                  </p>
                  {item.stock_warning && (
                    <p className="text-body-sm-bold text-warning flex items-center gap-1 mt-xs">
                      <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
                      {t('counterorders.detail.stock_warning', 'Stock disponible: {stock}', {
                        stock: item.stock_available ?? 0,
                      })}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span
                    className={cn('font-data-mono text-body-md-bold text-foreground')}
                    data-testid={`counterorder-item-total-${item.id}`}
                  >
                    {formatCurrency(item.line_total)}
                  </span>
                  <span className="text-label-caps uppercase text-on-surface-deep block">
                    {item.tax_rate_code || `IVA ${item.tax_rate}%`}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between pt-sm border-t border-border-subtle">
            <span className="text-body-md text-on-surface-deep">
              {t('counterorders.detail.total', 'Total estimado (precios de hoy)')}
            </span>
            <span
              data-testid="counterorder-detail-total"
              className="font-data-mono text-headline-sm text-primary"
            >
              {formatCurrency(detail.total)}
            </span>
          </div>
        </div>
      )}
    </EnhancedModal>
  )
}
