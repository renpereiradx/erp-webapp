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
import { useI18n } from '@/lib/i18n'
import { saleService } from '@/services/saleService'
import { useToast } from '@/hooks/useToast'
import '@/styles/scss/pages/_sales-order-detail.scss'

const SalesOrderDetail = () => {
  const { saleId } = useParams()
  const navigate = useNavigate()
  const { t } = useI18n()
  const { error: showError } = useToast()

  const [sale, setSale] = useState(null)
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingPayments, setLoadingPayments] = useState(false)
  const [error, setError] = useState(null)

  const loadSale = useCallback(async () => {
    if (!saleId) return

    setLoading(true)
    setError(null)

    try {
      const response = await saleService.getSaleById(saleId)
      if (response) {
        // Handle both direct object and { data: ... } wrapper
        const saleData = response.data || response
        setSale(saleData)

        // Cargar historial de pagos usando el endpoint oficial
        loadPayments()
      } else {
        setError('Sale not found')
      }
    } catch (err) {
      console.error('Error loading sale:', err)
      setError(err.message || 'Error loading sale details')
      showError('Error loading sale details')
    } finally {
      setLoading(false)
    }
  }, [saleId, showError])

  const loadPayments = async () => {
    if (!saleId) return

    setLoadingPayments(true)
    try {
      const response = await saleService.getSalePayments(saleId)
      if (response && response.data) {
        setPayments(response.data)
      }
    } catch (err) {
      console.error('Error loading payments:', err)
      // No mostrar error crítico, solo mantener pagos vacíos
      setPayments([])
    } finally {
      setLoadingPayments(false)
    }
  }

  useEffect(() => {
    loadSale()
  }, [loadSale])

  const handlePrint = () => {
    window.print()
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
    return new Date(dateString).toLocaleDateString()
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

  // Normalizar pagos desde el endpoint oficial GET /sales/{id}/payments
  const normalizedPayments = payments.length
    ? payments.map(payment => ({
        id: payment.id,
        date: payment.payment_date,
        user: payment.processed_by_name || '—',
        amount: payment.amount_received || 0,
        change: payment.change_amount || 0,
        method: payment.payment_method_code || 'CASH',
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

        <Button className='sales-order-detail__primary-action btn btn--primary'>
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
                  {t('sales.detail.customerEmail')}
                </span>
                <span className='sales-order-detail__value'>
                  {sale.client_email || '—'}
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
                  {sale.user_name || sale.seller || '—'}
                </span>
              </div>
              <div className='sales-order-detail__info-row'>
                <span className='sales-order-detail__label'>
                  {t('sales.detail.branch')}
                </span>
                <span className='sales-order-detail__value'>
                  {sale.branch || sale.store || '—'}
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
                    <th>{t('sales.detail.productSku')}</th>
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
                          {item.sku || item.code || 'SKU'}
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
            </div>
            {loadingPayments ? (
              <div className='sales-order-detail__table-wrapper'>
                <DataState variant='loading' />
              </div>
            ) : normalizedPayments.length > 0 ? (
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
    </div>
  )
}

export default SalesOrderDetail
