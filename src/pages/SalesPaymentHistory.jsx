import React, { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Printer,
  Download,
  Plus,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import DataState from '@/components/ui/DataState'
import RegisterSalePaymentModal from '@/components/sales/RegisterSalePaymentModal'
import { useI18n } from '@/lib/i18n'
import { salePaymentService } from '@/services/salePaymentService'
import { saleService } from '@/services/saleService'
import { clientService } from '@/services/clientService'
import { useToast } from '@/hooks/useToast'
import '@/styles/scss/pages/_sales-payment-history.scss'

const SalesPaymentHistory = () => {
  const { saleId } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { error: showError, success: showSuccess } = useToast()

  const [sale, setSale] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false)

  const loadData = useCallback(async () => {
    if (!saleId) return

    setLoading(true)
    setError(null)

    try {
      // PASO 1: Obtener estado de pago con historial de pagos
      const paymentStatusResponse =
        await salePaymentService.getSalePaymentStatus(saleId)

      if (!paymentStatusResponse) {
        setError('Sale not found')
        return
      }

      // PASO 2: Obtener detalles completos de la venta (con items/productos)
      let saleDetails = null

      try {
        const clientSalesResponse = await saleService.getSalesByClient(
          paymentStatusResponse.client_id
        )

        if (clientSalesResponse?.data && Array.isArray(clientSalesResponse.data)) {
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
      }

      // PASO 3: Obtener datos completos del cliente
      let clientDetails = null

      try {
        if (paymentStatusResponse.client_id) {
          clientDetails = await clientService.getById(paymentStatusResponse.client_id)
        }
      } catch (err) {
        console.warn('Error loading client details:', err)
      }

      // PASO 4: Combinar datos
      const balanceDue = paymentStatusResponse.balance_due || 0
      let correctedStatus = paymentStatusResponse.status

      // CORRECCIÓN: Si balance_due = 0, el estado debe ser PAID, no PARTIAL_PAYMENT
      if (balanceDue === 0 && correctedStatus === 'PARTIAL_PAYMENT') {
        correctedStatus = 'PAID'
      }

      const saleData = {
        ...paymentStatusResponse,
        id: paymentStatusResponse.sale_id,
        sale_id: paymentStatusResponse.sale_id,
        // Estado corregido
        status: correctedStatus,
        balance_due: balanceDue,
        items:
          saleDetails?.details ||
          saleDetails?.items ||
          saleDetails?.sale?.details ||
          [],
        user_name:
          saleDetails?.sale?.user_name ||
          saleDetails?.user_name,
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
      console.error('Error loading payment history:', err)

      const statusCode = err?.status ?? err?.statusCode ?? err?.response?.status
      if (statusCode === 404) {
        setError('Sale not found')
      } else {
        setError(err.message || 'Error loading payment history')
      }

      showError('Error loading payment history')
    } finally {
      setLoading(false)
    }
  }, [saleId, showError])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    // TODO: Implementar descarga de reporte
    console.log('Descargar reporte de pagos')
  }

  const handleAddPayment = () => {
    setIsPaymentModalOpen(true)
  }

  const handlePaymentSubmit = async paymentData => {
    try {
      await salePaymentService.processSalePaymentWithCashRegister(paymentData)
      showSuccess(
        t('common.success'),
        t('sales.registerPaymentModal.successMessage', 'Pago registrado exitosamente')
      )
      // Reload data to update balance and payment history
      await loadData()
    } catch (error) {
      console.error('Error registering payment:', error)
      throw error // Re-throw so modal can handle it
    }
  }

  const formatDate = dateString => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day} de ${getMonthName(date.getMonth())}, ${year} ${hours}:${minutes}`
  }

  const getMonthName = monthIndex => {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return months[monthIndex]
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

  const paymentProgress =
    totalAmount > 0 ? ((paidAmount / totalAmount) * 100).toFixed(1) : 0

  // Normalizar pagos
  const normalizedPayments = payments.length
    ? payments.map(payment => ({
        id: payment.payment_id || payment.id,
        date: payment.payment_date,
        user: payment.processed_by_name || '—',
        amount: payment.amount_paid || payment.amount_received || 0,
        method: payment.payment_method_code || payment.payment_method || 'CASH',
        status: (payment.status || 'COMPLETED').toLowerCase(),
      }))
    : []

  const getStatusColor = status => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'warning'
      case 'partial_payment':
        return 'info'
      case 'paid':
      case 'completed':
        return 'success'
      case 'cancelled':
      case 'reversed':
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusLabel = status => {
    const statusKey = status?.toLowerCase()
    return t(`sales.paymentHistory.status.${statusKey}`, status)
  }

  if (loading) {
    return (
      <div className='payment-history'>
        <DataState variant='loading' />
      </div>
    )
  }

  if (error || !sale) {
    return (
      <div className='payment-history'>
        <DataState
          variant='error'
          title={t('common.error')}
          description={error || t('sales.paymentHistory.notFound')}
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
    <div className='payment-history'>
      {/* Breadcrumbs */}
      <div className='payment-history__breadcrumbs'>
        <Link to='/cobros-ventas' className='payment-history__breadcrumb-link'>
          {t('sales.paymentHistory.breadcrumb.sales', 'Ventas')}
        </Link>
        <span className='payment-history__breadcrumb-separator'>/</span>
        <Link to='/cobros-ventas' className='payment-history__breadcrumb-link'>
          {t('sales.paymentHistory.breadcrumb.orders', 'Órdenes')}
        </Link>
        <span className='payment-history__breadcrumb-separator'>/</span>
        <Link
          to={`/cobros-ventas/${saleId}`}
          className='payment-history__breadcrumb-link'
        >
          SO-{sale.id}
        </Link>
        <span className='payment-history__breadcrumb-separator'>/</span>
        <span className='payment-history__breadcrumb-current'>
          {t('sales.paymentHistory.breadcrumb.current', 'Historial de Pagos')}
        </span>
      </div>

      {/* Header */}
      <div className='payment-history__header'>
        <h1 className='payment-history__title'>
          {t('sales.paymentHistory.title', 'Historial de Pagos para')} SO-{sale.id}
        </h1>
        <div className='payment-history__actions'>
          <button
            onClick={handlePrint}
            className='payment-history__action-btn'
            title={t('action.print', 'Imprimir')}
          >
            <Printer className='payment-history__action-icon' />
          </button>
          <button
            onClick={handleDownload}
            className='payment-history__action-btn'
            title={t('action.download', 'Descargar')}
          >
            <Download className='payment-history__action-icon' />
          </button>
          <Button onClick={handleAddPayment} className='btn btn--primary'>
            <Plus className='btn__icon' />
            {t('sales.paymentHistory.action.addPayment', 'Añadir Nuevo Pago')}
          </Button>
        </div>
      </div>

      <div className='payment-history__layout'>
        {/* Main Content */}
        <div className='payment-history__main'>
          {/* Estado de la Orden */}
          {sale.status !== 'PAID' && (
            <div className='payment-history__alert payment-history__alert--warning'>
              <AlertCircle className='payment-history__alert-icon' />
              <div className='payment-history__alert-content'>
                <p className='payment-history__alert-title'>
                  {t('sales.paymentHistory.orderStatus', 'Estado de la Orden')}: {getStatusLabel(sale.status)}
                </p>
                <p className='payment-history__alert-message'>
                  {t('sales.paymentHistory.orderStatusMessage', 'Esta orden de venta tiene un saldo pendiente. Esperando pago completo.')}
                </p>
              </div>
              <Link
                to={`/cobros-ventas/${saleId}`}
                className='payment-history__alert-link'
              >
                {t('sales.paymentHistory.viewOrderDetails', 'Ver Detalles de la Orden')}
                <ArrowLeft className='payment-history__alert-link-icon' />
              </Link>
            </div>
          )}

          {/* Progreso del Pago */}
          <div className='payment-history__card'>
            <div className='payment-history__progress-header'>
              <p className='payment-history__progress-label'>
                {t('sales.paymentHistory.paymentProgress', 'Progreso del Pago')}
              </p>
              <p className='payment-history__progress-percentage'>{paymentProgress}%</p>
            </div>
            <div className='payment-history__progress-bar'>
              <div
                className='payment-history__progress-fill'
                style={{ width: `${paymentProgress}%` }}
              />
            </div>
            <div className='payment-history__progress-stats'>
              <div className='payment-history__progress-stat'>
                <span className='payment-history__progress-stat-value'>
                  {formatCurrency(paidAmount)}
                </span>
                <span className='payment-history__progress-stat-label'>
                  {t('sales.paymentHistory.paid', 'Pagado')}
                </span>
              </div>
              <div className='payment-history__progress-stat'>
                <span className='payment-history__progress-stat-value'>
                  {formatCurrency(balanceDue)}
                </span>
                <span className='payment-history__progress-stat-label'>
                  {t('sales.paymentHistory.balanceDue', 'Saldo Pendiente')}
                </span>
              </div>
              <div className='payment-history__progress-stat'>
                <span className='payment-history__progress-stat-value'>
                  {formatCurrency(totalAmount)}
                </span>
                <span className='payment-history__progress-stat-label'>
                  {t('sales.paymentHistory.total', 'Total')}
                </span>
              </div>
            </div>
          </div>

          {/* Tabla de Pagos */}
          <div className='payment-history__card'>
            {normalizedPayments.length > 0 ? (
              <div className='payment-history__table-wrapper'>
                <table className='payment-history__table'>
                  <thead>
                    <tr>
                      <th>{t('sales.paymentHistory.table.date', 'FECHA')}</th>
                      <th>{t('sales.paymentHistory.table.user', 'USUARIO')}</th>
                      <th>{t('sales.paymentHistory.table.method', 'MÉTODO DE PAGO')}</th>
                      <th className='text-right'>
                        {t('sales.paymentHistory.table.amount', 'MONTO')}
                      </th>
                      <th className='text-center'>
                        {t('sales.paymentHistory.table.status', 'ESTADO')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {normalizedPayments.map((payment, index) => (
                      <tr key={payment.id || index}>
                        <td>{formatDate(payment.date)}</td>
                        <td>
                          <div className='payment-history__user'>
                            <div className='payment-history__user-avatar'>
                              {payment.user.charAt(0).toUpperCase()}
                            </div>
                            <span>{payment.user}</span>
                          </div>
                        </td>
                        <td>{payment.method}</td>
                        <td className='text-right payment-history__amount'>
                          {payment.status === 'reversed' ? '(' : ''}
                          {formatCurrency(payment.amount)}
                          {payment.status === 'reversed' ? ')' : ''}
                        </td>
                        <td className='text-center'>
                          <span
                            className={`payment-history__status payment-history__status--${getStatusColor(
                              payment.status
                            )}`}
                          >
                            <span className='payment-history__status-dot' />
                            {getStatusLabel(payment.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className='payment-history__empty'>
                <AlertCircle size={48} />
                <p>{t('sales.paymentHistory.noPayments', 'No hay pagos registrados')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className='payment-history__sidebar'>
          {/* Cliente */}
          <div className='payment-history__sidebar-card'>
            <h3 className='payment-history__sidebar-title'>
              {t('sales.paymentHistory.customer', 'Cliente')}
            </h3>
            <div className='payment-history__customer'>
              <div className='payment-history__customer-avatar'>
                {(sale.client_name || 'C').charAt(0).toUpperCase()}
              </div>
              <div className='payment-history__customer-info'>
                <p className='payment-history__customer-name'>
                  {sale.client_name || '—'}
                </p>
                <p className='payment-history__customer-id'>
                  {t('sales.paymentHistory.customerId', 'ID Cliente')}: {sale.client_id || '—'}
                </p>
              </div>
            </div>
            <Link
              to={`/clientes/${sale.client_id}`}
              className='payment-history__sidebar-link'
            >
              {t('sales.paymentHistory.viewFullProfile', 'Ver Perfil Completo')}
              <ArrowLeft className='payment-history__sidebar-link-icon' />
            </Link>
          </div>

          {/* Productos */}
          <div className='payment-history__sidebar-card'>
            <h3 className='payment-history__sidebar-title'>
              {t('sales.paymentHistory.productsInOrder', 'Productos en la Orden')}
            </h3>
            {items.length > 0 ? (
              <ul className='payment-history__product-list'>
                {items.map((item, index) => (
                  <li key={index} className='payment-history__product-item'>
                    <Link
                      to={`/productos/${item.product_id || item.id}`}
                      className='payment-history__product-link'
                    >
                      {item.product_name || item.name || '—'}
                    </Link>
                    <span className='payment-history__product-quantity'>
                      {t('sales.paymentHistory.quantity', 'Cant')}: {item.quantity || 0}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='payment-history__sidebar-empty'>
                {t('sales.paymentHistory.noProducts', 'Sin productos')}
              </p>
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

export default SalesPaymentHistory
