import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, PlusCircle } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import RegisterPaymentModal from '@/components/purchase-payments/RegisterPaymentModal'
import DataState from '@/components/ui/DataState'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { purchasePaymentsMvpService } from '@/services/purchasePaymentsMvpService'
import { useToast } from '@/hooks/useToast'
import '@/styles/scss/pages/_purchase-payments-mvp.scss'

const currencyFormatter = (lang, currency) =>
  new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    style: 'currency',
    currency: currency || 'PYG',
    minimumFractionDigits: currency === 'PYG' ? 0 : 2,
    maximumFractionDigits: currency === 'PYG' ? 0 : 2,
  })

const dateFormatterFactory = lang =>
  new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    dateStyle: 'medium',
  })

const historyBadgeVariants = {
  approved: 'secondary',
  delayed: 'destructive',
}

const PurchasePaymentsMvpDetail = () => {
  const { orderId: rawOrderId } = useParams()
  const orderId = rawOrderId ? decodeURIComponent(rawOrderId) : ''
  const navigate = useNavigate()
  const { t, lang } = useI18n()
  const { info: showInfo, success: showSuccess, error: showError } = useToast()

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false)
  const [modalOrder, setModalOrder] = useState(null)

  const isMountedRef = useRef(true)
  useEffect(
    () => () => {
      isMountedRef.current = false
    },
    []
  )

  const dateFormatter = useMemo(() => dateFormatterFactory(lang), [lang])

  const translate = useCallback(
    (key, params, fallback) => {
      const translated = t(key, params)
      if (translated === key) {
        if (typeof fallback === 'function') {
          return fallback(params ?? {}, lang)
        }
        if (fallback !== undefined) {
          return fallback
        }
      }
      return translated
    },
    [t, lang]
  )

  const fetchDetail = useCallback(async () => {
    if (!orderId) {
      setDetail(null)
      setError(t('purchasePaymentsMvp.data.error.description'))
      setLoading(false)
      return
    }

    if (isMountedRef.current) {
      setLoading(true)
      setError(null)
      setDetail(null)
    }

    try {
      const data = await purchasePaymentsMvpService.getOrderDetail(orderId)
      if (!isMountedRef.current) return
      setDetail(data)
    } catch (err) {
      if (!isMountedRef.current) return
      setError(err?.message || t('purchasePaymentsMvp.data.error.description'))
    } finally {
      if (isMountedRef.current) {
        setLoading(false)
      }
    }
  }, [orderId, t])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  const handleRetry = useCallback(() => {
    fetchDetail()
  }, [fetchDetail])

  const formatAmount = useCallback(
    (value, currencyOverride) =>
      currencyFormatter(lang, currencyOverride || detail?.currency).format(
        Number(value || 0)
      ),
    [lang, detail?.currency]
  )

  const formatDate = useCallback(
    value => {
      if (!value) return '—'
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return value
      }
      return dateFormatter.format(date)
    },
    [dateFormatter]
  )

  const handleGoBack = useCallback(() => {
    navigate('/pagos/compras-mvp')
  }, [navigate])

  const handleRegisterPayment = useCallback(() => {
    if (!detail) {
      showInfo(t('purchasePaymentsMvp.registerModal.feedback.missingOrder'))
      return
    }

    const pendingAmount = Number(detail?.totals?.pendingAmount || 0)

    if (!Number.isFinite(pendingAmount) || pendingAmount <= 0) {
      showInfo(
        t('purchasePaymentsMvp.registerModal.feedback.noPending', {
          orderId: detail.id,
        })
      )
      return
    }

    setModalOrder({
      id: detail.id,
      pendingAmount,
      currency: detail.currency || 'PYG',
      supplierName: detail.supplier?.name || '',
    })
    setRegisterModalOpen(true)
  }, [detail, showInfo, t])

  const handleRegisterPaymentSubmit = useCallback(
    async payload => {
      try {
        await purchasePaymentsMvpService.registerPayment(
          payload.orderId,
          payload
        )
        showSuccess(
          t('purchasePaymentsMvp.registerModal.feedback.success', {
            orderId: payload.orderId,
          })
        )
        await fetchDetail()
      } catch (err) {
        showError(
          err?.message || t('purchasePaymentsMvp.registerModal.feedback.error')
        )
        throw err
      }
    },
    [fetchDetail, showError, showSuccess, t]
  )

  const handleModalOpenChange = useCallback(nextOpen => {
    setRegisterModalOpen(nextOpen)
    if (!nextOpen) {
      setModalOrder(null)
    }
  }, [])

  const statusLabel = detail
    ? translate(
        `purchasePaymentsMvp.status.${detail.status}`,
        { status: detail.status },
        detail.status
      )
    : ''

  const progressValue = detail?.totals?.progress ?? 0
  const clampedProgress = Math.max(0, Math.min(100, progressValue))

  const isOverdue = Boolean(detail?.totals?.isOverdue)
  const trackLabel = isOverdue
    ? t('purchasePaymentsMvp.detail.statusBadge.overdue')
    : t('purchasePaymentsMvp.detail.statusBadge.onTrack')

  const paymentsCount = detail?.meta?.paymentsCount ?? 0
  const lastPaymentDate = detail?.meta?.lastPaymentDate
    ? formatDate(detail.meta.lastPaymentDate)
    : t('purchasePaymentsMvp.detail.meta.none')

  const ownerName = detail?.meta?.owner || '—'
  const summaryItems = detail
    ? [
        {
          key: 'total',
          label: t('purchasePaymentsMvp.detail.summary.total'),
          value: formatAmount(detail.totals?.totalAmount, detail.currency),
        },
        {
          key: 'paid',
          label: t('purchasePaymentsMvp.detail.summary.paid'),
          value: formatAmount(detail.totals?.paidAmount, detail.currency),
        },
        {
          key: 'pending',
          label: t('purchasePaymentsMvp.detail.summary.pending'),
          value: formatAmount(detail.totals?.pendingAmount, detail.currency),
        },
        {
          key: 'issue',
          label: t('purchasePaymentsMvp.detail.summary.issueDate'),
          value: formatDate(detail.issueDate),
        },
      ]
    : []

  const supplierDetails = detail
    ? [
        {
          key: 'contact',
          label: t('purchasePaymentsMvp.detail.supplier.contact'),
          value: detail.supplier?.contact,
        },
        {
          key: 'email',
          label: t('purchasePaymentsMvp.detail.supplier.email'),
          value: detail.supplier?.email,
        },
        {
          key: 'phone',
          label: t('purchasePaymentsMvp.detail.supplier.phone'),
          value: detail.supplier?.phone,
        },
        {
          key: 'taxId',
          label: t('purchasePaymentsMvp.detail.supplier.taxId'),
          value: detail.supplier?.taxId,
        },
        {
          key: 'address',
          label: t('purchasePaymentsMvp.detail.supplier.address'),
          value: detail.supplier?.address,
        },
      ].filter(item => item.value)
    : []

  const renderContent = () => {
    if (loading) {
      return (
        <div className='purchase-payments-mvp-detail__state'>
          <DataState
            variant='loading'
            skeletonVariant='list'
            skeletonProps={{ count: 2 }}
          />
        </div>
      )
    }

    if (error) {
      return (
        <div className='purchase-payments-mvp-detail__state'>
          <DataState
            variant='error'
            title={t('purchasePaymentsMvp.data.error.title')}
            message={error}
            onRetry={handleRetry}
          />
        </div>
      )
    }

    if (!detail) {
      return (
        <div className='purchase-payments-mvp-detail__state'>
          <DataState
            variant='empty'
            title={t('purchasePaymentsMvp.data.empty.title')}
            description={t('purchasePaymentsMvp.data.empty.description')}
          />
        </div>
      )
    }

    return (
      <div className='purchase-payments-mvp-detail__grid'>
        <section className='purchase-payments-mvp-detail__main'>
          <Card className='purchase-payments-mvp-detail__card purchase-payments-mvp-detail__card--summary'>
            <CardHeader className='purchase-payments-mvp-detail__card-header'>
              <div className='purchase-payments-mvp-detail__summary-heading'>
                <CardTitle className='purchase-payments-mvp-detail__card-title'>
                  {t('purchasePaymentsMvp.detail.summary.title')}
                </CardTitle>
                <div className='purchase-payments-mvp-detail__summary-tags'>
                  <Badge
                    variant='outline'
                    className='purchase-payments-mvp-detail__status-badge'
                  >
                    {statusLabel}
                  </Badge>
                  <Badge
                    variant={isOverdue ? 'destructive' : 'secondary'}
                    className='purchase-payments-mvp-detail__status-badge'
                  >
                    {trackLabel}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className='purchase-payments-mvp-detail__card-content'>
              <div className='purchase-payments-mvp-detail__progress'>
                <div className='purchase-payments-mvp-detail__progress-header'>
                  <span className='purchase-payments-mvp-detail__progress-label'>
                    {t('purchasePaymentsMvp.detail.summary.progress')}
                  </span>
                  <span className='purchase-payments-mvp-detail__progress-value'>
                    {clampedProgress}%
                  </span>
                </div>
                <Progress
                  value={clampedProgress}
                  className='purchase-payments-mvp-detail__progress-bar'
                />
              </div>
              <div className='purchase-payments-mvp-detail__summary-grid'>
                {summaryItems.map(item => (
                  <div
                    key={item.key}
                    className='purchase-payments-mvp-detail__summary-item'
                  >
                    <span className='purchase-payments-mvp-detail__summary-label'>
                      {item.label}
                    </span>
                    <span className='purchase-payments-mvp-detail__summary-value'>
                      {item.value}
                    </span>
                  </div>
                ))}
                <div className='purchase-payments-mvp-detail__summary-item'>
                  <span className='purchase-payments-mvp-detail__summary-label'>
                    {t('purchasePaymentsMvp.detail.summary.dueDate')}
                  </span>
                  <span
                    className={`purchase-payments-mvp-detail__summary-value${
                      isOverdue
                        ? ' purchase-payments-mvp-detail__summary-value--overdue'
                        : ''
                    }`}
                  >
                    {formatDate(detail.dueDate)}
                  </span>
                </div>
                <div className='purchase-payments-mvp-detail__summary-item'>
                  <span className='purchase-payments-mvp-detail__summary-label'>
                    {t('purchasePaymentsMvp.detail.summary.owner')}
                  </span>
                  <span className='purchase-payments-mvp-detail__summary-value'>
                    {ownerName}
                  </span>
                </div>
              </div>
            </CardContent>
            <CardFooter className='purchase-payments-mvp-detail__card-footer'>
              <div className='purchase-payments-mvp-detail__meta-item'>
                <span className='purchase-payments-mvp-detail__meta-label'>
                  {t('purchasePaymentsMvp.detail.meta.paymentsRecorded')}
                </span>
                <span className='purchase-payments-mvp-detail__meta-value'>
                  {paymentsCount}
                </span>
              </div>
              <div className='purchase-payments-mvp-detail__meta-item'>
                <span className='purchase-payments-mvp-detail__meta-label'>
                  {t('purchasePaymentsMvp.detail.meta.lastPayment')}
                </span>
                <span className='purchase-payments-mvp-detail__meta-value'>
                  {lastPaymentDate}
                </span>
              </div>
            </CardFooter>
          </Card>

          <Card className='purchase-payments-mvp-detail__card'>
            <CardHeader className='purchase-payments-mvp-detail__card-header'>
              <CardTitle className='purchase-payments-mvp-detail__card-title'>
                {t('purchasePaymentsMvp.detail.history.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className='purchase-payments-mvp-detail__card-content'>
              {detail.paymentHistory?.length ? (
                <div className='purchase-payments-mvp-detail__table-wrapper'>
                  <table className='purchase-payments-mvp-detail__table'>
                    <thead>
                      <tr>
                        <th>
                          {t('purchasePaymentsMvp.detail.history.columns.date')}
                        </th>
                        <th>
                          {t('purchasePaymentsMvp.detail.history.columns.user')}
                        </th>
                        <th className='purchase-payments-mvp-detail__cell--numeric'>
                          {t(
                            'purchasePaymentsMvp.detail.history.columns.amount'
                          )}
                        </th>
                        <th className='purchase-payments-mvp-detail__cell--status'>
                          {t(
                            'purchasePaymentsMvp.detail.history.columns.status'
                          )}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.paymentHistory.map(payment => {
                        const variant =
                          historyBadgeVariants[payment.status] || 'outline'
                        const paymentLabel = translate(
                          `purchasePaymentsMvp.detail.history.status.${payment.status}`,
                          { status: payment.status },
                          payment.status
                        )
                        return (
                          <tr key={payment.id}>
                            <td>{formatDate(payment.date)}</td>
                            <td>{payment.user || '—'}</td>
                            <td className='purchase-payments-mvp-detail__cell--numeric'>
                              {formatAmount(payment.amount, detail.currency)}
                            </td>
                            <td className='purchase-payments-mvp-detail__cell--status'>
                              <Badge variant={variant}>{paymentLabel}</Badge>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className='purchase-payments-mvp-detail__empty'>
                  {t('purchasePaymentsMvp.detail.history.empty')}
                </div>
              )}
            </CardContent>
          </Card>
        </section>
        <aside className='purchase-payments-mvp-detail__sidebar'>
          <Card className='purchase-payments-mvp-detail__card'>
            <CardHeader className='purchase-payments-mvp-detail__card-header'>
              <CardTitle className='purchase-payments-mvp-detail__card-title'>
                {t('purchasePaymentsMvp.detail.supplier.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className='purchase-payments-mvp-detail__card-content'>
              <div className='purchase-payments-mvp-detail__supplier'>
                <span className='purchase-payments-mvp-detail__supplier-name'>
                  {detail.supplier?.name || '—'}
                </span>
                {detail.supplier?.id && (
                  <span className='purchase-payments-mvp-detail__supplier-id'>
                    {detail.supplier.id}
                  </span>
                )}
              </div>
              {supplierDetails.length ? (
                <dl className='purchase-payments-mvp-detail__supplier-details'>
                  {supplierDetails.map(item => (
                    <div
                      key={item.key}
                      className='purchase-payments-mvp-detail__supplier-detail'
                    >
                      <dt>{item.label}</dt>
                      <dd>{item.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <div className='purchase-payments-mvp-detail__empty purchase-payments-mvp-detail__empty--subtle'>
                  {t('purchasePaymentsMvp.detail.meta.none')}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className='purchase-payments-mvp-detail__card'>
            <CardHeader className='purchase-payments-mvp-detail__card-header'>
              <CardTitle className='purchase-payments-mvp-detail__card-title'>
                {t('purchasePaymentsMvp.detail.products.title')}
              </CardTitle>
            </CardHeader>
            <CardContent className='purchase-payments-mvp-detail__card-content'>
              {detail.products?.length ? (
                <ul className='purchase-payments-mvp-detail__products'>
                  {detail.products.map(product => (
                    <li
                      key={product.id}
                      className='purchase-payments-mvp-detail__product'
                    >
                      <div className='purchase-payments-mvp-detail__product-info'>
                        <span className='purchase-payments-mvp-detail__product-name'>
                          {product.name}
                        </span>
                        <span className='purchase-payments-mvp-detail__product-quantity'>
                          {t(
                            'purchasePaymentsMvp.detail.products.headers.quantity'
                          )}
                          : {product.quantity}
                        </span>
                      </div>
                      <span className='purchase-payments-mvp-detail__product-total'>
                        {formatAmount(product.total, detail.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='purchase-payments-mvp-detail__empty'>
                  {t('purchasePaymentsMvp.detail.products.empty')}
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    )
  }

  return (
    <div className='purchase-payments-mvp-detail'>
      <div className='purchase-payments-mvp-detail__container'>
        <header className='purchase-payments-mvp-detail__header'>
          <Button
            type='button'
            variant='ghost'
            onClick={handleGoBack}
            className='purchase-payments-mvp-detail__back'
          >
            <ArrowLeft className='purchase-payments-mvp-detail__back-icon' />
            <span>{t('purchasePaymentsMvp.detail.back')}</span>
          </Button>
          <div className='purchase-payments-mvp-detail__heading'>
            <div className='purchase-payments-mvp-detail__heading-text'>
              <h1 className='purchase-payments-mvp-detail__title'>
                {t('purchasePaymentsMvp.detail.heading', { orderId })}
              </h1>
              <p className='purchase-payments-mvp-detail__description'>
                {t('purchasePaymentsMvp.detail.description')}
              </p>
            </div>
            <Button
              type='button'
              size='lg'
              onClick={handleRegisterPayment}
              className='purchase-payments-mvp-detail__primary-action'
            >
              <PlusCircle className='purchase-payments-mvp-detail__primary-icon' />
              {t('purchasePaymentsMvp.detail.registerPayment')}
            </Button>
          </div>
        </header>
        {renderContent()}
      </div>
      <RegisterPaymentModal
        open={isRegisterModalOpen}
        onOpenChange={handleModalOpenChange}
        order={modalOrder}
        onSubmit={handleRegisterPaymentSubmit}
      />
    </div>
  )
}

export default PurchasePaymentsMvpDetail
