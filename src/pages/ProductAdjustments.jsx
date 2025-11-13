import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeftRight,
  CalendarDays,
  CheckCircle,
  MinusCircle,
  Package2,
  RefreshCcw,
  Search,
} from 'lucide-react'
import PageHeader from '@/components/ui/PageHeader'
import DataState from '@/components/ui/DataState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { useThemeStyles } from '@/hooks/useThemeStyles'
import { useI18n } from '@/lib/i18n'
import { productAdjustmentService } from '@/services/productAdjustmentService'

const DEFAULT_FILTERS = {
  status: 'all',
  search: '',
  page: 1,
  limit: 10,
}

const statusOptions = [
  { value: 'all', label: 'Todos' },
  { value: 'pending', label: 'Pendiente' },
  { value: 'active', label: 'Aplicado' },
  { value: 'reverted', label: 'Revertido' },
]

const getStatusIcon = status => {
  switch (status) {
    case 'active':
      return CheckCircle
    case 'reverted':
      return ArrowLeftRight
    case 'pending':
    default:
      return MinusCircle
  }
}

const formatDate = value => {
  if (!value) return 'Sin fecha'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-PY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const ProductAdjustmentsPage = () => {
  const { styles } = useThemeStyles()
  const { t } = useI18n()

  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [adjustments, setAdjustments] = useState([])
  const [pagination, setPagination] = useState(null)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const filtersRef = useRef({ ...DEFAULT_FILTERS })

  const loadAdjustments = useCallback(async (override = {}) => {
    setLoading(true)
    setError(null)
    const nextFilters = { ...filtersRef.current, ...override }
    filtersRef.current = nextFilters
    setFilters(nextFilters)

    try {
      const { data, pagination: pageInfo } =
        await productAdjustmentService.list(nextFilters)
      setAdjustments(data)
      setPagination(pageInfo)
    } catch (err) {
      setError(
        err?.message || 'No se pudo cargar la lista de ajustes de producto'
      )
      setAdjustments([])
    } finally {
      setLoading(false)
    }
  }, [])

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true)
    try {
      const summaryResponse = await productAdjustmentService.getSummary()
      setSummary(summaryResponse)
    } catch (error) {
      console.warn('No se pudo cargar el resumen de ajustes de producto', error)
      // Mantener la página funcional incluso si el resumen falla
      setSummary(null)
    } finally {
      setSummaryLoading(false)
    }
  }, [])

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([loadAdjustments(DEFAULT_FILTERS), loadSummary()])
    }

    bootstrap()
  }, [loadAdjustments, loadSummary])

  const effectiveFilters = useMemo(
    () => ({
      ...filters,
    }),
    [filters]
  )

  const handleSearchSubmit = event => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const searchTerm = formData.get('search')?.toString().trim() || ''
    loadAdjustments({ search: searchTerm, page: 1 })
  }

  const handleStatusChange = event => {
    const value = event.target.value
    loadAdjustments({ status: value, page: 1 })
  }

  const handlePageChange = direction => {
    if (!pagination) return
    const nextPage = filters.page + direction
    if (nextPage < 1 || nextPage > (pagination.totalPages || 1)) return
    loadAdjustments({ page: nextPage })
  }

  const renderContent = () => {
    if (loading) {
      return (
        <DataState
          variant='loading'
          skeletonVariant='list'
          skeletonProps={{ count: 5 }}
          testId='product-adjustments-loading'
        />
      )
    }

    if (error) {
      return (
        <DataState
          variant='error'
          title='No se pudo cargar'
          message={error}
          onRetry={() => loadAdjustments({ page: 1 })}
          testId='product-adjustments-error'
        />
      )
    }

    if (!adjustments.length) {
      return (
        <DataState
          variant='empty'
          title='Sin ajustes registrados'
          description='Cuando existan ajustes de producto, los verás listados aquí.'
          actionLabel='Actualizar'
          onAction={() => loadAdjustments({ page: 1 })}
          testId='product-adjustments-empty'
        />
      )
    }

    return (
      <div className='space-y-4' data-testid='product-adjustments-table'>
        {adjustments.map(adjustment => {
          const StatusIcon = getStatusIcon(adjustment.status)

          return (
            <Card
              key={adjustment.id}
              className='border-2 border-black/5 shadow-sm'
            >
              <CardContent className='p-5'>
                <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                  <div className='space-y-2 flex-1'>
                    <div className='flex items-center gap-3'>
                      <div className='p-2 rounded-md bg-primary/10 text-primary'>
                        <Package2 className='w-5 h-5' />
                      </div>
                      <div>
                        <h3 className='text-lg font-semibold text-foreground'>
                          {adjustment.product_name ||
                            adjustment.product_id ||
                            'Producto sin nombre'}
                        </h3>
                        <p className='text-sm text-muted-foreground'>
                          SKU: {adjustment.sku || 'N/D'} · ID Ajuste:{' '}
                          {adjustment.id}
                        </p>
                      </div>
                    </div>

                    <div className='grid grid-cols-1 gap-2 text-sm md:grid-cols-2'>
                      <div className='flex items-center gap-2'>
                        <CalendarDays className='w-4 h-4 text-muted-foreground' />
                        <span>{formatDate(adjustment.created_at)}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <StatusIcon className='w-4 h-4 text-muted-foreground' />
                        <span className='capitalize'>
                          {adjustment.status || 'pendiente'}
                        </span>
                      </div>
                      <div>
                        <span className='font-semibold text-foreground'>
                          Valor anterior:
                        </span>{' '}
                        <span>{adjustment.previous_value ?? 'N/D'}</span>
                      </div>
                      <div>
                        <span className='font-semibold text-foreground'>
                          Nuevo valor:
                        </span>{' '}
                        <span>{adjustment.new_value ?? 'N/D'}</span>
                      </div>
                    </div>
                  </div>

                  <div className='w-full md:w-auto md:text-right space-y-2'>
                    <div>
                      <span className='text-sm font-semibold text-foreground'>
                        Diferencia
                      </span>
                      <div
                        className={`text-xl font-bold ${
                          adjustment.difference > 0
                            ? 'text-green-600'
                            : adjustment.difference < 0
                            ? 'text-red-600'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {adjustment.difference > 0 ? '+' : ''}{' '}
                        {adjustment.difference ?? 0}
                      </div>
                      <span className='text-xs text-muted-foreground uppercase tracking-wide'>
                        {adjustment.unit || 'UNIDAD'}
                      </span>
                    </div>
                    <p className='text-sm text-muted-foreground max-w-xs md:ml-auto'>
                      {adjustment.reason || 'Sin motivo registrado'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}

        {pagination && (
          <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-4 border-t'>
            <div className='text-sm text-muted-foreground'>
              Página {filters.page} de {pagination.totalPages || 1} ·{' '}
              {pagination.total || adjustments.length} ajustes
            </div>
            <div className='flex items-center gap-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(-1)}
                disabled={filters.page <= 1}
              >
                Anterior
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => handlePageChange(1)}
                disabled={filters.page >= (pagination.totalPages || 1)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className='space-y-6' data-testid='product-adjustments-page'>
      <PageHeader
        title={t('productAdjustments.title', 'Ajustes de Producto')}
        subtitle={t(
          'productAdjustments.subtitle',
          'Gestiona ajustes manuales y sincronización de cambios de inventario'
        )}
        breadcrumb={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Inventario' },
          { label: 'Ajustes de Producto' },
        ]}
        actions={
          <Button
            onClick={() => loadAdjustments({ page: 1 })}
            variant='outline'
            className='gap-2'
          >
            <RefreshCcw className='w-4 h-4' />
            Actualizar
          </Button>
        }
      />

      <section className={`${styles.card('p-4 sm:p-6')} space-y-4`}>
        <form
          onSubmit={handleSearchSubmit}
          className='grid gap-3 md:grid-cols-[260px_1fr_auto] items-center'
        >
          <div>
            <label htmlFor='status' className={styles.label()}>
              Estado
            </label>
            <select
              id='status'
              name='status'
              value={effectiveFilters.status}
              onChange={handleStatusChange}
              className={`${styles.input()} capitalize`}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className='flex flex-col'>
            <label htmlFor='search' className={styles.label()}>
              Buscar ajustes
            </label>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <Input
                id='search'
                name='search'
                defaultValue={effectiveFilters.search}
                placeholder='ID de producto, SKU o referencia'
                className='pl-9'
              />
            </div>
          </div>

          <div className='flex items-end'>
            <Button type='submit' className='w-full md:w-auto gap-2'>
              <Search className='w-4 h-4' />
              Buscar
            </Button>
          </div>
        </form>
      </section>

      <section
        className='grid gap-4 md:grid-cols-3'
        data-testid='product-adjustments-summary'
      >
        {summaryLoading
          ? // Mostrar esqueleto de resumen mientras carga
            [1, 2, 3].map(i => (
              <Card
                key={`skeleton-${i}`}
                className='border-2 border-black/5 shadow-sm'
              >
                <CardContent className='p-5'>
                  <div className='animate-pulse'>
                    <div className='h-4 bg-gray-200 rounded w-1/3 mb-3' />
                    <div className='h-8 bg-gray-200 rounded w-2/3' />
                  </div>
                </CardContent>
              </Card>
            ))
          : summary && summary.metrics
          ? summary.metrics.map(metric => (
              <Card
                key={metric.id || metric.label}
                className='border-2 border-black/5 shadow-sm'
              >
                <CardContent className='p-5'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-sm text-muted-foreground uppercase tracking-wide'>
                        {metric.label || 'Total'}
                      </p>
                      <p className='text-2xl font-bold text-foreground'>
                        {metric.value ?? 0}
                      </p>
                    </div>
                    <div className='p-2 rounded-md bg-primary/10 text-primary'>
                      <Package2 className='w-5 h-5' />
                    </div>
                  </div>
                  {metric.delta !== undefined && (
                    <p className='mt-2 text-xs text-muted-foreground'>
                      Última actualización: {formatDate(metric.updated_at)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          : // Fallback: mostrar tarjetas vacías si no hay resumen pero la página debe permanecer visible
            [1, 2, 3].map(i => (
              <Card
                key={`empty-${i}`}
                className='border-2 border-black/5 shadow-sm'
              >
                <CardContent className='p-5'>
                  <div>
                    <p className='text-sm text-muted-foreground uppercase tracking-wide'>
                      Sin métricas disponibles
                    </p>
                    <p className='text-2xl font-bold text-muted-foreground'>
                      —
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
      </section>

      <section
        className={`${styles.card('p-4 sm:p-6')} space-y-4`}
        data-testid='product-adjustments-data'
      >
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h2 className={`${styles.header('h2')} text-lg`}>
              Historial de ajustes
            </h2>
            <p className='text-sm text-muted-foreground'>
              Listado de ajustes manuales y sincronizados del inventario.
            </p>
          </div>
          <Button
            onClick={() => loadAdjustments({ page: 1 })}
            variant='outline'
            size='sm'
            className='gap-2'
          >
            <RefreshCcw className='w-4 h-4' />
            Recargar datos
          </Button>
        </div>

        <div>{renderContent()}</div>
      </section>
    </div>
  )
}

export default ProductAdjustmentsPage
