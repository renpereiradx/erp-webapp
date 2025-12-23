import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Mail,
  Download,
  Calendar,
  User,
  CreditCard,
  FileText,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import DataState from '@/components/ui/DataState'
import RegisterSalePaymentModal from '@/components/sales/RegisterSalePaymentModal'
import { useI18n } from '@/lib/i18n'
import { salePaymentService } from '@/services/salePaymentService'
import { saleService } from '@/services/saleService'
import { clientService } from '@/services/clientService'
import { useToast } from '@/hooks/useToast'
import '@/styles/scss/pages/_sales-order-detail.scss'

const SalesOrderDetail = () => {
  const { saleId } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { error: showError, success: showSuccess } = useToast()

  const [sale, setSale] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const loadSale = useCallback(async () => {
    if (!saleId) return

    setLoading(true)
    setError(null)

    try {
      // PASO 1: Obtener estado de pago con historial de pagos
      // Endpoint: GET /sale/{id}/payment-status (SALE_PAYMENT_API.md)
      const paymentStatusResponse =
        await salePaymentService.getSalePaymentStatus(saleId)

      if (!paymentStatusResponse) {
        setError('Sale not found')
        return
      }

      // PASO 2: Obtener detalles completos de la venta (con items/productos)
      // Endpoint: GET /sale/client_id/{id} (SALE_API.md)
      // Este endpoint devuelve: {data: [{sale: {...}, details: [...]}, ...], pagination: {...}}
      // También contiene user_name (vendedor que creó la venta)
      let saleDetails = null

      try {
        const clientSalesResponse = await saleService.getSalesByClient(
          paymentStatusResponse.client_id
        )

        // Buscar la venta específica en la lista de ventas del cliente
        if (clientSalesResponse?.data && Array.isArray(clientSalesResponse.data)) {
          // clientSalesResponse.data es un array de ventas
          // Cada elemento puede tener formato: {sale: {...}, details: [...]} o formato plano
          const saleItem = clientSalesResponse.data.find(item => {
            const itemSaleId = item.sale_id || item.id || item.sale?.sale_id
            return itemSaleId === saleId
          })

          if (saleItem) {
            saleDetails = saleItem
          }
        }
      } catch (err) {
        console.warn('Error loading sale details from client endpoint:', err)
        // No critical - continue with payment status data only
      }

      // PASO 3: Obtener datos completos del cliente desde CLIENT_API
      let clientDetails = null

      try {
        if (paymentStatusResponse.client_id) {
          clientDetails = await clientService.getById(paymentStatusResponse.client_id)
        }
      } catch (err) {
        console.warn('Error loading client details:', err)
        // No crítico - continuar sin datos de cliente
      }

      // PASO 4: Combinar datos de todos los endpoints
      const balanceDue = paymentStatusResponse.balance_due || 0
      let correctedStatus = paymentStatusResponse.status

      // CORRECCIÓN: Si balance_due = 0, el estado debe ser PAID, no PARTIAL_PAYMENT
      if (balanceDue === 0 && correctedStatus === 'PARTIAL_PAYMENT') {
        correctedStatus = 'PAID'
      }

      const saleData = {
        ...paymentStatusResponse,
        // ID de la venta (asegurar que esté disponible)
        id: paymentStatusResponse.sale_id,
        sale_id: paymentStatusResponse.sale_id,
        // Estado corregido
        status: correctedStatus,
        balance_due: balanceDue,
        // Agregar items/details desde saleDetails si existen
        items:
          saleDetails?.details ||
          saleDetails?.items ||
          saleDetails?.sale?.details ||
          [],
        // Agregar user_name (vendedor) desde SALE_API
        user_name:
          saleDetails?.sale?.user_name ||
          saleDetails?.user_name,
        user_id:
          saleDetails?.sale?.user_id ||
          saleDetails?.user_id,
        // Datos de cliente desde CLIENT_API (document_id, contact)
        client_document: clientDetails?.document_id,
        client_contact: clientDetails?.contact,
        client_last_name: clientDetails?.last_name,
      }

      setSale(saleData)

      // Los pagos vienen en paymentStatusResponse.payments
      if (
        paymentStatusResponse.payments &&
        Array.isArray(paymentStatusResponse.payments)
      ) {
        setPayments(paymentStatusResponse.payments)
      }
    } catch (err) {
      console.error('Error loading sale:', err)

      // Manejar 404 apropiadamente
      const statusCode = err?.status ?? err?.statusCode ?? err?.response?.status
      if (statusCode === 404) {
        setError('Sale not found')
      } else {
        setError(err.message || 'Error loading sale details')
      }

      showError('Error loading sale details')
    } finally {
      setLoading(false)
    }
  }, [saleId, showError])


  useEffect(() => {
    loadSale()
  }, [loadSale])

  const handlePrint = () => {
    window.print()
  }

  const handlePaymentSubmit = async paymentData => {
    try {
      await salePaymentService.processSalePaymentWithCashRegister(paymentData)
      showSuccess(
        t('common.success'),
        t('sales.registerPaymentModal.successMessage', 'Pago registrado exitosamente')
      )
      // Reload sale data to update balance and payment history
      await loadSale()
    } catch (error) {
      console.error('Error registering payment:', error)
      throw error // Re-throw so modal can handle it
    }
  }

  const getStatusBadgeVariant = status => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      case 'cancelled':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const formatDate = dateString => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  const formatCurrency = amount => {
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)
  }

  const items = sale?.items || sale?.details || []

  const totalAmount = sale?.total_amount ?? sale?.total ?? 0
  const paidAmount = sale?.paid_amount ?? sale?.total_paid ?? 0
  const balanceDue =
    sale?.balance_due ?? sale?.balance ?? Math.max(totalAmount - paidAmount, 0)

  // Normalizar pagos desde el endpoint GET /sale/{id}/payment-status
  // Este endpoint devuelve los pagos con: payment_id, amount_paid, status, payment_date, etc.
  const normalizedPayments = payments.length
    ? payments.map(payment => ({
        id: payment.payment_id || payment.id,
        date: payment.payment_date,
        user: payment.processed_by_name || '—',
        // payment-status usa amount_paid; /sales/{id}/payments usa amount_received
        amount: payment.amount_paid || payment.amount_received || 0,
        change: payment.change_amount || 0,
        // Algunos pagos pueden no tener método especificado
        method: payment.payment_method_code || payment.payment_method || 'CASH',
        reference: payment.payment_reference || '—',
        notes: payment.payment_notes || '',
        status: (payment.status || 'COMPLETED').toLowerCase(),
      }))
    : []

  if (loading) {
    return (
      <div className='sales-order-detail'>
        <DataState variant='loading' />
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className='sales-order-detail'>
        <DataState
          variant='error'
          title={t('common.error')}
          description={error || t('sales.detail.notFound')}
          action={
            <Button onClick={() => navigate('/cobros-ventas')}>
              {t('action.back')}
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div className='sales-order-detail'>
      <div className='sales-order-detail__breadcrumbs'>
        <Link
          to='/cobros-ventas'
          className='sales-order-detail__breadcrumb-link'
        >
          {t('sales.detail.breadcrumb.sales')}
        </Link>
        <span className='sales-order-detail__breadcrumb-separator'>/</span>
        <Link
          to='/cobros-ventas'
          className='sales-order-detail__breadcrumb-link'
        >
          {t('sales.detail.breadcrumb.orders')}
        </Link>
        <span className='sales-order-detail__breadcrumb-separator'>/</span>
        <span className='sales-order-detail__breadcrumb-current'>
          {t('sales.detail.breadcrumb.current', { id: sale.id })}
        </span>
      </div>

      <div className='sales-order-detail__heading'>
        <div className='sales-order-detail__heading-text'>
          <div className='sales-order-detail__heading-row'>
            <h1 className='sales-order-detail__title'>
              {t('sales.detail.orderTitle', { id: sale.id })}
            </h1>
            <span
              className={`sales-order-detail__status sales-order-detail__status--${(
                sale.status || 'pending'
              ).toLowerCase()}`}
            >
              {t(
                `sales.detail.status.${(
                  sale.status || 'pending'
                ).toLowerCase()}`,
                sale.status || 'Pendiente'
              )}
            </span>
          </div>
          <p className='sales-order-detail__subtitle'>
            {t('sales.detail.headingDescription')}
          </p>
        </div>

        <Button
          className='sales-order-detail__primary-action btn btn--primary'
          onClick={() => setIsPaymentModalOpen(true)}
          disabled={!sale || balanceDue <= 0}
        >
          <CreditCard size={16} />
          {t('sales.detail.registerPayment')}
        </Button>
      </div>

      <div className='sales-order-detail__stats'>
        <div className='sales-order-detail__stat-card'>
          <p className='sales-order-detail__stat-label'>
            {t('sales.detail.totalAmount')}
          </p>
          <p className='sales-order-detail__stat-value'>
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className='sales-order-detail__stat-card'>
          <p className='sales-order-detail__stat-label'>
            {t('sales.detail.paidAmount')}
          </p>
          <p className='sales-order-detail__stat-value sales-order-detail__stat-value--positive'>
            {formatCurrency(paidAmount)}
          </p>
        </div>
        <div className='sales-order-detail__stat-card'>
          <p className='sales-order-detail__stat-label'>
            {t('sales.detail.balanceDue')}
          </p>
          <p className='sales-order-detail__stat-value sales-order-detail__stat-value--warning'>
            {formatCurrency(balanceDue)}
          </p>
        </div>
      </div>

      <div className='sales-order-detail__grid'>
        <div className='sales-order-detail__column sales-order-detail__column--left'>
          <div className='sales-order-detail__card'>
            <h3 className='sales-order-detail__card-title'>
              {t('sales.detail.customer')}
            </h3>
            <div className='sales-order-detail__info-list'>
              <div className='sales-order-detail__info-row'>
                <span className='sales-order-detail__label'>
                  {t('sales.detail.customerName')}
                </span>
                <span className='sales-order-detail__value'>
                  {sale.client_name || '—'}
                </span>
              </div>
              <div className='sales-order-detail__info-row'>
                <span className='sales-order-detail__label'>
                  {t('sales.detail.clientDocument')}
                </span>
                <span className='sales-order-detail__value'>
                  {sale.client_document || '—'}
                </span>
              </div>
              <div className='sales-order-detail__info-row'>
                <span className='sales-order-detail__label'>
                  {t('sales.detail.customerContact')}
                </span>
                <span className='sales-order-detail__value'>
                  {sale.client_contact || '—'}
                </span>
              </div>
            </div>
          </div>

          <div className='sales-order-detail__card'>
            <h3 className='sales-order-detail__card-title'>
              {t('sales.detail.orderInfo')}
            </h3>
            <div className='sales-order-detail__info-list'>
              <div className='sales-order-detail__info-row'>
                <span className='sales-order-detail__label'>
                  {t('sales.detail.date')}
                </span>
                <span className='sales-order-detail__value'>
                  {formatDate(sale.sale_date || sale.date)}
                </span>
              </div>
              <div className='sales-order-detail__info-row'>
                <span className='sales-order-detail__label'>
                  {t('sales.detail.seller')}
                </span>
                <span className='sales-order-detail__value'>
                  {sale.user_name || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className='sales-order-detail__column sales-order-detail__column--right'>
          <div className='sales-order-detail__card'>
            <div className='sales-order-detail__card-header'>
              <h3 className='sales-order-detail__card-title'>
                {t('sales.detail.productsTitle')}
              </h3>
            </div>
            <div className='sales-order-detail__table-wrapper'>
              <table className='sales-order-detail__table'>
                <thead>
                  <tr>
                    <th>{t('sales.detail.productId')}</th>
                    <th className='text-center'>
                      {t('sales.detail.quantityShort')}
                    </th>
                    <th className='text-right'>
                      {t('sales.detail.unitPrice')}
                    </th>
                    <th className='text-right'>{t('sales.detail.subtotal')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr key={`${item.id || item.code || index}`}>
                      <td>
                        <div className='sales-order-detail__cell-title'>
                          {item.product_name || item.name || '—'}
                        </div>
                        <div className='sales-order-detail__cell-sub'>
                          ID: {item.product_id || item.id || '—'}
                        </div>
                      </td>
                      <td className='text-center'>{item.quantity || 0}</td>
                      <td className='text-right'>
                        {formatCurrency(item.unit_price || item.price || 0)}
                      </td>
                      <td className='text-right sales-order-detail__cell-strong'>
                        {formatCurrency(
                          (item.quantity || 0) *
                            (item.unit_price || item.price || 0)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className='sales-order-detail__card'>
            <div className='sales-order-detail__card-header'>
              <h3 className='sales-order-detail__card-title'>
                {t('sales.detail.paymentHistory')}
              </h3>
              <Button
                onClick={() => navigate(`/cobros-ventas/${saleId}/pagos`)}
                variant='ghost'
                size='sm'
                className='btn btn--ghost btn--small'
              >
                {t('sales.detail.viewPaymentHistory', 'Ver Historial Completo')}
              </Button>
            </div>
            {normalizedPayments.length > 0 ? (
              <div className='sales-order-detail__table-wrapper'>
                <table className='sales-order-detail__table'>
                  <thead>
                    <tr>
                      <th>{t('sales.detail.paymentDate')}</th>
                      <th>{t('sales.detail.paymentUser')}</th>
                      <th>{t('sales.detail.paymentMethod')}</th>
                      <th className='text-right'>
                        {t('sales.detail.paymentAmount')}
                      </th>
                      <th className='text-right'>
                        {t('sales.detail.paymentChange')}
                      </th>
                      <th className='text-center'>
                        {t('sales.detail.paymentStatus')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedPayments.map((payment, index) => (
                      <tr key={payment.id || index}>
                        <td>{formatDate(payment.date)}</td>
                        <td>{payment.user}</td>
                        <td>{payment.method}</td>
                        <td className='text-right sales-order-detail__cell-strong'>
                          {formatCurrency(payment.amount)}
                        </td>
                        <td className='text-right'>
                          {formatCurrency(payment.change)}
                        </td>
                        <td className='text-center'>
                          <span
                            className={`sales-order-detail__chip sales-order-detail__chip--${payment.status}`}
                          >
                            {t(
                              `sales.detail.status.${payment.status}`,
                              payment.status
                            )}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='sales-order-detail__empty'>
                <AlertCircle size={48} />
                <p>{t('sales.detail.noPayments')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de registro de pago */}
      <RegisterSalePaymentModal
        open={isPaymentModalOpen}
        onOpenChange={setIsPaymentModalOpen}
        sale={sale}
        onSubmit={handlePaymentSubmit}
      />
    </div>
  )
}

export default SalesOrderDetail
