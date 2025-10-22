import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarRange,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import DataState from '@/components/ui/DataState'
import DateRangeFilter from '@/components/DateRangeFilter'
import reportService from '@/services/reportService'
import { useThemeStyles } from '@/hooks/useThemeStyles'

const formatCurrency = value => {
  const numericValue = Number(value) || 0
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numericValue)
}

const formatNumber = value => {
  if (value == null) {
    return '-'
  }

  const numericValue = Number(value)
  if (Number.isNaN(numericValue)) {
    return '-'
  }

  return numericValue.toLocaleString('es-CL')
}

const formatPercentage = value => {
  if (value == null || Number.isNaN(value)) {
    return '0%'
  }

  return `${value.toFixed(1)}%`
}

const calculatePercentage = (part, total) => {
  const numerator = Number(part) || 0
  const denominator = Number(total) || 0

  if (denominator <= 0) {
    return 0
  }

  return (numerator / denominator) * 100
}

const composeDateRange = () => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

  const toIsoDate = date => date.toISOString().split('T')[0]

  return {
    start_date: toIsoDate(startOfMonth),
    end_date: toIsoDate(today),
  }
}

const MetricTile = ({ label, value, helper, tone = 'neutral', icon: Icon }) => {
  const toneClasses = {
    positive:
      'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-900/40 dark:text-emerald-200',
    negative:
      'border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-900/40 dark:text-red-200',
    warning:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-900/40 dark:text-amber-100',
    neutral:
      'border-muted/40 bg-muted/10 text-foreground dark:border-muted/30 dark:bg-muted/5',
  }

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        toneClasses[tone] || toneClasses.neutral
      }`}
    >
      <div className='flex items-center justify-between gap-3'>
        <p className='text-xs uppercase tracking-wide text-muted-foreground'>
          {label}
        </p>
        {Icon ? (
          <Icon className='h-4 w-4 opacity-70' aria-hidden='true' />
        ) : null}
      </div>
      <p className='mt-2 text-xl font-semibold'>{value}</p>
      {helper ? (
        <p className='mt-1 text-xs text-muted-foreground'>{helper}</p>
      ) : null}
    </div>
  )
}

const SectionHeading = ({ title, description, icon: Icon = BarChart3 }) => (
  <div className='flex flex-col gap-1'>
    <div className='flex items-center gap-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
      <Icon className='h-4 w-4' aria-hidden='true' />
      {title}
    </div>
    {description ? (
      <p className='text-sm text-muted-foreground'>{description}</p>
    ) : null}
  </div>
)

const ReportsPage = () => {
  const { styles } = useThemeStyles()
  const [dateRange, setDateRange] = useState(() => composeDateRange())
  const [showDateFilter, setShowDateFilter] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [salesTotals, setSalesTotals] = useState(null)
  const [purchaseTotals, setPurchaseTotals] = useState(null)

  const netCashFlow = useMemo(() => {
    const inflow = Number(salesTotals?.completed_amount) || 0
    const outflow = Number(purchaseTotals?.completed_amount) || 0
    return inflow - outflow
  }, [salesTotals, purchaseTotals])

  const refundRate = useMemo(
    () =>
      calculatePercentage(
        salesTotals?.refunded_payments,
        salesTotals?.total_payments
      ),
    [salesTotals]
  )

  const changeRate = useMemo(
    () =>
      calculatePercentage(
        salesTotals?.payments_with_change,
        salesTotals?.total_payments
      ),
    [salesTotals]
  )

  const cancellationRate = useMemo(
    () =>
      calculatePercentage(
        purchaseTotals?.cancelled_payments,
        purchaseTotals?.total_payments
      ),
    [purchaseTotals]
  )

  const isFallbackData = Boolean(
    salesTotals?._isFallback || purchaseTotals?._isFallback
  )

  const fetchPaymentTotals = useCallback(async range => {
    setLoading(true)
    setError(null)

    try {
      const [sales, purchases] = await Promise.all([
        reportService.getSalesPaymentTotals(range),
        reportService.getPurchasePaymentTotals(range),
      ])

      setSalesTotals(sales)
      setPurchaseTotals(purchases)
    } catch (fetchError) {
      const message =
        fetchError?.message || 'Error al cargar los totales de pagos'
      setError(message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPaymentTotals(dateRange)
  }, [dateRange, fetchPaymentTotals])

  const handleApplyDateRange = range => {
    setDateRange(range)
    setShowDateFilter(false)
  }

  const handleRefresh = () => {
    fetchPaymentTotals(dateRange)
  }

  if (loading && !salesTotals && !purchaseTotals) {
    return (
      <DataState
        variant='loading'
        skeletonVariant='list'
        skeletonProps={{ count: 6 }}
      />
    )
  }

  if (error && !loading && !salesTotals && !purchaseTotals) {
    return (
      <DataState
        variant='error'
        title='Error al cargar reportes'
        message={error}
        onRetry={() => fetchPaymentTotals(dateRange)}
      />
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex flex-col gap-3 md:flex-row md:items-start md:justify-between'>
        <div className='space-y-2'>
          <h1 className={styles.header('h1')}>Reportes financieros</h1>
          <p className={styles.body('muted')}>
            Analiza los totales de pagos por rango de fechas para comprender el
            flujo de caja del negocio.
          </p>
          <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
            <Badge variant='outline' className='font-mono'>
              {dateRange.start_date} → {dateRange.end_date}
            </Badge>
            {loading ? (
              <span className='flex items-center gap-1'>
                <RefreshCw
                  className='h-3 w-3 animate-spin'
                  aria-hidden='true'
                />
                Actualizando datos...
              </span>
            ) : null}
            {isFallbackData ? (
              <span className='flex items-center gap-1 text-amber-600 dark:text-amber-300'>
                <AlertTriangle className='h-3 w-3' aria-hidden='true' />
                Datos simulados (modo desarrollo)
              </span>
            ) : null}
          </div>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Button
            variant='outline'
            onClick={() => setShowDateFilter(prev => !prev)}
          >
            <CalendarRange className='mr-2 h-4 w-4' aria-hidden='true' />
            Seleccionar fechas
          </Button>
          <Button onClick={handleRefresh} disabled={loading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              aria-hidden='true'
            />
            Actualizar
          </Button>
        </div>
      </div>

      {showDateFilter ? (
        <DateRangeFilter
          initialRange={dateRange}
          onApply={handleApplyDateRange}
          onCancel={() => setShowDateFilter(false)}
        />
      ) : null}

      {error && !loading ? (
        <Card className='border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-900/30 dark:text-red-100'>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5' aria-hidden='true' />
              <CardTitle>Hubo un problema al cargar los datos</CardTitle>
            </div>
            <CardDescription>
              Reintenta actualizar o ajusta el rango de fechas seleccionado.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='flex flex-wrap items-center gap-3'>
              <span className='text-sm'>{error}</span>
              <Button variant='outline' size='sm' onClick={handleRefresh}>
                Reintentar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className='pb-2'>
          <SectionHeading
            title='Resumen general'
            description='Diferencia entre ingresos por ventas y egresos por compras en el periodo seleccionado.'
          />
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            <MetricTile
              label='Flujo de caja neto'
              value={formatCurrency(netCashFlow)}
              helper='Ingresos (ventas) menos egresos (compras) completados'
              tone={netCashFlow >= 0 ? 'positive' : 'negative'}
              icon={netCashFlow >= 0 ? TrendingUp : TrendingDown}
            />
            <MetricTile
              label='Pagos completados (ventas)'
              value={formatNumber(salesTotals?.completed_payments)}
              helper={formatCurrency(salesTotals?.completed_amount)}
              icon={ArrowUpRight}
            />
            <MetricTile
              label='Pagos completados (compras)'
              value={formatNumber(purchaseTotals?.completed_payments)}
              helper={formatCurrency(purchaseTotals?.completed_amount)}
              icon={ArrowDownRight}
            />
          </div>
        </CardContent>
      </Card>

      <div className='grid gap-6 lg:grid-cols-2'>
        <Card>
          <CardHeader className='pb-2'>
            <SectionHeading
              title='Totales de pagos de ventas'
              description='Incluye ventas completadas, reembolsadas y métricas de vuelto.'
            />
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <MetricTile
                label='Monto completado'
                value={formatCurrency(salesTotals?.completed_amount)}
                helper={`${formatNumber(
                  salesTotals?.completed_payments
                )} pagos completados`}
              />
              <MetricTile
                label='Total procesado'
                value={formatCurrency(salesTotals?.total_amount)}
                helper={`${formatNumber(
                  salesTotals?.total_payments
                )} pagos totales`}
              />
              <MetricTile
                label='Reembolsos'
                value={formatCurrency(salesTotals?.refunded_amount)}
                helper={`${formatNumber(
                  salesTotals?.refunded_payments
                )} pagos (${formatPercentage(refundRate)})`}
                tone={refundRate > 0 ? 'warning' : 'neutral'}
                icon={AlertTriangle}
              />
              <MetricTile
                label='Promedio por pago'
                value={formatCurrency(salesTotals?.average_payment)}
                helper='Calculado sobre pagos completados'
              />
            </div>
            <Separator />
            <div className='grid gap-3 sm:grid-cols-2'>
              <MetricTile
                label='Pagos con vuelto'
                value={formatNumber(salesTotals?.payments_with_change)}
                helper={`${formatCurrency(
                  salesTotals?.total_change_given
                )} entregado como vuelto (${formatPercentage(changeRate)})`}
              />
              <MetricTile
                label='Fecha del periodo'
                value={`${salesTotals?.start_date ?? dateRange.start_date} → ${
                  salesTotals?.end_date ?? dateRange.end_date
                }`}
                helper='El backend ajusta horas automáticamente'
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <SectionHeading
              title='Totales de pagos de compras'
              description='Cantidad pagada a proveedores y compras canceladas dentro del rango.'
            />
          </CardHeader>
          <CardContent className='space-y-5'>
            <div className='grid gap-3 sm:grid-cols-2'>
              <MetricTile
                label='Monto completado'
                value={formatCurrency(purchaseTotals?.completed_amount)}
                helper={`${formatNumber(
                  purchaseTotals?.completed_payments
                )} pagos completados`}
              />
              <MetricTile
                label='Total procesado'
                value={formatCurrency(purchaseTotals?.total_amount)}
                helper={`${formatNumber(
                  purchaseTotals?.total_payments
                )} pagos totales`}
              />
              <MetricTile
                label='Pagos cancelados'
                value={formatCurrency(purchaseTotals?.cancelled_amount)}
                helper={`${formatNumber(
                  purchaseTotals?.cancelled_payments
                )} pagos (${formatPercentage(cancellationRate)})`}
                tone={cancellationRate > 0 ? 'warning' : 'neutral'}
                icon={TrendingDown}
              />
              <MetricTile
                label='Promedio por pago'
                value={formatCurrency(purchaseTotals?.average_payment)}
                helper='Calculado sobre pagos completados'
              />
            </div>
            <Separator />
            <div className='grid gap-3 sm:grid-cols-2'>
              <MetricTile
                label='Órdenes únicas'
                value={formatNumber(purchaseTotals?.unique_purchases)}
                helper='Compras únicas con pagos completados'
              />
              <MetricTile
                label='Fecha del periodo'
                value={`${
                  purchaseTotals?.start_date ?? dateRange.start_date
                } → ${purchaseTotals?.end_date ?? dateRange.end_date}`}
                helper='El backend ajusta horas automáticamente'
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className='bg-muted/10'>
        <CardHeader className='pb-2'>
          <SectionHeading
            title='Contexto y recomendaciones'
            description='Consejos rápidos basados en la documentación del backend para interpretar los totales.'
          />
        </CardHeader>
        <CardContent className='space-y-3 text-sm text-muted-foreground'>
          <div className='flex items-start gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-background/40 p-4'>
            <CalendarRange
              className='mt-0.5 h-4 w-4 text-muted-foreground'
              aria-hidden='true'
            />
            <div>
              <p className='font-medium text-foreground'>
                Usa rangos razonables
              </p>
              <p>
                Evita solicitar más de un año por consulta. Para análisis
                históricos, es preferible trabajar mes a mes.
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-background/40 p-4'>
            <RefreshCw
              className='mt-0.5 h-4 w-4 text-muted-foreground'
              aria-hidden='true'
            />
            <div>
              <p className='font-medium text-foreground'>
                Cachea periodos cerrados
              </p>
              <p>
                Los datos históricos no cambian. Puedes almacenar respuestas y
                reutilizarlas para mejorar la velocidad.
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3 rounded-lg border border-dashed border-muted-foreground/30 bg-background/40 p-4'>
            <TrendingUp
              className='mt-0.5 h-4 w-4 text-muted-foreground'
              aria-hidden='true'
            />
            <div>
              <p className='font-medium text-foreground'>
                Compara periodos equivalentes
              </p>
              <p>
                Para evaluar crecimiento o caída, contrasta meses completos o
                semanas equivalentes en lugar de periodos parciales.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ReportsPage
