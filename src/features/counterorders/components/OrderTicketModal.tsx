// ===========================================================================
// OrderTicketModal (FASE 5 — ticket QR del pedido, decisión §5.5: render FE)
// Preview del ticket (80mm) + impresión local por iframe. El QR codifica el
// código PED-XXXXXX: la búsqueda de la bandeja /pedidos lo matchea por ILIKE,
// así el cajero escanea y encuentra el pedido. Los precios son los resueltos
// al leer (resolve-on-read): el pie lo deja explícito — el cobro se confirma
// en caja.
// ===========================================================================

import { useRef, type CSSProperties } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Printer } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import EnhancedModal from '@/components/ui/EnhancedModal'
import { formatCurrency } from '@/utils/currencyUtils'
import type { CounterOrderDetail } from '../types'
import { printTicketHtml } from '../utils/printTicket'

interface OrderTicketModalProps {
  open: boolean
  /** Detalle resuelto (precios vigentes); null = nada que imprimir. */
  order: CounterOrderDetail | null
  onClose: () => void
}

const th: CSSProperties = { textAlign: 'left', fontSize: 11, padding: '2px 0' }
const td: CSSProperties = { fontSize: 12, padding: '2px 0', verticalAlign: 'top' }

/** Ticket en sí: SOLO estilos inline — viajan al iframe vía innerHTML. */
export function OrderTicketContent({ order }: { order: CounterOrderDetail }) {
  const { t } = useI18n()
  const emitted = new Date(order.created_at).toLocaleString()

  return (
    <div
      style={{ width: '72mm', margin: '0 auto', fontFamily: "'Courier New', ui-monospace, monospace" }}
      data-testid="counterorder-ticket"
    >
      <p style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>
        {t('counterorders.ticket.heading', 'PEDIDO DE MOSTRADOR')}
      </p>
      <p style={{ textAlign: 'center', fontSize: 22, fontWeight: 700, letterSpacing: 2, margin: '0 0 8px' }}>
        {order.code}
      </p>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <QRCodeSVG value={order.code} size={96} data-testid="counterorder-ticket-qr" />
      </div>
      <p style={td}>{t('counterorders.ticket.client', 'Cliente: {name}', { name: order.client_name })}</p>
      <p style={td}>{t('counterorders.ticket.vendor', 'Vendedor: {name}', { name: order.created_by_name })}</p>
      <p style={td}>{t('counterorders.ticket.emitted', 'Emitido: {date}', { date: emitted })}</p>
      <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={th}>{t('counterorders.ticket.col_item', 'ÍTEM')}</th>
            <th style={{ ...th, textAlign: 'right' }}>{t('counterorders.ticket.col_qty', 'CANT')}</th>
            <th style={{ ...th, textAlign: 'right' }}>{t('counterorders.ticket.col_total', 'TOTAL')}</th>
          </tr>
        </thead>
        <tbody>
          {(order.items ?? []).map(item => (
            <tr key={item.id}>
              <td style={td}>
                {item.product_name}
                {(item.price_warning || item.tax_warning) && ' *'}
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                {item.quantity} {item.unit}
              </td>
              <td style={{ ...td, textAlign: 'right', whiteSpace: 'nowrap' }}>
                {item.price_warning || item.tax_warning ? '—' : formatCurrency(item.line_total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <hr style={{ border: 'none', borderTop: '1px dashed #000', margin: '8px 0' }} />
      <p style={{ ...td, fontSize: 14, fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
        <span>{t('counterorders.ticket.total', 'TOTAL')}</span>
        <span>{formatCurrency(order.total)}</span>
      </p>
      {order.notes && (
        <p style={{ ...td, marginTop: 6 }}>
          {t('counterorders.ticket.notes', 'Nota: {notes}', { notes: order.notes })}
        </p>
      )}
      <p style={{ fontSize: 10, marginTop: 10, textAlign: 'center' }}>
        {t(
          'counterorders.ticket.footer',
          'Precios vigentes al emitir. Presentá este código en caja para procesar el pedido.',
        )}
      </p>
    </div>
  )
}

export function OrderTicketModal({ open, order, onClose }: OrderTicketModalProps) {
  const { t } = useI18n()
  // Fuente única de verdad: la impresión serializa el preview ya renderizado
  // (incluye el SVG del QR) en vez de duplicar el markup para el iframe.
  const ticketRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    if (!ticketRef.current || !order) return
    printTicketHtml(ticketRef.current.innerHTML, order.code)
  }

  return (
    <EnhancedModal
      isOpen={open}
      onClose={onClose}
      title={t('counterorders.ticket.title', 'Ticket {code}', { code: order?.code ?? '' })}
      size="md"
      testId="counterorder-ticket-modal"
      footer={
        <div className="flex justify-end gap-sm">
          <Button variant="secondary" onClick={onClose}>
            {t('common.close', 'Cerrar')}
          </Button>
          <Button onClick={handlePrint} data-testid="counterorder-ticket-print">
            <Printer size={16} className="mr-1" />
            {t('counterorders.ticket.print', 'Imprimir')}
          </Button>
        </div>
      }
    >
      {order ? (
        <div ref={ticketRef} className="bg-surface rounded-md border border-border-subtle p-4 overflow-x-auto">
          <OrderTicketContent order={order} />
        </div>
      ) : (
        <p className="text-body-md text-on-surface-deep">
          {t('counterorders.ticket.empty', 'No hay detalle de pedido para imprimir.')}
        </p>
      )}
    </EnhancedModal>
  )
}
