// ===========================================================================
// CounterOrdersMetricsPanel (FASE 5 — PLAN_PEDIDOS_FASE5_TICKET_METRICAS_STOCK)
// Lectura operativa de la bandeja: creados/convertidos/tiempo medio
// mostrador→caja. Se renderiza solo con reports:read (analítica de gestión,
// misma audiencia que el reporte de descuentos) — el gate vive en la página,
// así el query no se dispara sin permiso.
// ===========================================================================

import { useState } from 'react'
import { CheckCircle2, ClipboardList, Clock, XCircle, Archive, Activity } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { useI18n } from '@/lib/i18n'
import { Card, CardContent } from '@/components/ui/card'
import ErrorState from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { counterOrderService } from '@/services/counterOrderService'
import {
  formatConversionRate,
  formatMetricCount,
  resolveAvgConversionTime,
} from '@/domain/counterorders/metrics'
import type { CounterOrderMetrics } from '../types'

const RANGES = [7, 30, 90]
const SKELETON_CARDS = 6

/**
 * Tarjeta numérica. El label puede ocupar 2 líneas (line-clamp-2, sin
 * truncate: "Tasa de conversión" no se corta) y el valor baja con mt-auto
 * para que todas las cards alineen los números en la misma línea.
 */
function MetricCard({
  icon: Icon,
  label,
  value,
  testId,
}: {
  icon: typeof ClipboardList
  label: string
  value: string
  testId: string
}) {
  return (
    <Card data-testid={testId} className="h-full">
      <CardContent className="flex h-full flex-col gap-xs p-md">
        <div className="flex items-start gap-xs text-on-surface-deep">
          <Icon size={14} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-label-caps uppercase line-clamp-2 leading-snug">{label}</p>
        </div>
        <p
          className="font-data-mono text-title-md font-semibold text-foreground mt-auto"
          data-testid={`${testId}-value`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  )
}

export function CounterOrdersMetricsPanel() {
  const { t } = useI18n()
  const [days, setDays] = useState(30)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['counter-orders', 'metrics', days],
    queryFn: () => counterOrderService.metrics(days),
    staleTime: 60_000,
  })

  const metrics: CounterOrderMetrics | undefined = data

  const avgTime = metrics ? resolveAvgConversionTime(metrics.avg_minutes_to_convert) : null

  const cards = metrics
    ? [
        {
          icon: ClipboardList,
          label: t('counterorders.metrics.created', 'Creados ({days}d)', { days }),
          value: formatMetricCount(metrics.created),
          testId: 'counterorder-metrics-created',
        },
        {
          icon: CheckCircle2,
          label: t('counterorders.metrics.converted', 'Convertidos'),
          value: formatMetricCount(metrics.converted),
          testId: 'counterorder-metrics-converted',
        },
        {
          icon: Activity,
          label: t('counterorders.metrics.conversion_rate', 'Tasa de conversión'),
          value: t('counterorders.metrics.percent', '{value}%', {
            value: formatConversionRate(metrics.conversion_rate),
          }),
          testId: 'counterorder-metrics-rate',
        },
        {
          icon: Clock,
          label: t('counterorders.metrics.avg_time', 'Tiempo medio a caja'),
          value: t(
            avgTime?.unit === 'h'
              ? 'counterorders.metrics.hours'
              : 'counterorders.metrics.minutes',
            '{value} {unit}',
            { value: avgTime?.value ?? '0', unit: avgTime?.unit ?? 'min' },
          ),
          testId: 'counterorder-metrics-avg-time',
        },
        {
          icon: Archive,
          label: t('counterorders.metrics.active', 'Activos ahora'),
          value: formatMetricCount(metrics.active),
          testId: 'counterorder-metrics-active',
        },
        {
          icon: XCircle,
          label: t('counterorders.metrics.lost', 'Cancelados / Vencidos'),
          value: `${formatMetricCount(metrics.cancelled)} / ${formatMetricCount(metrics.expired)}`,
          testId: 'counterorder-metrics-lost',
        },
      ]
    : []

  return (
    <section className="space-y-sm" aria-label={t('counterorders.metrics.title', 'Métricas de pedidos')}>
      <div className="flex items-center justify-between gap-sm flex-wrap">
        <h2 className="text-title-sm font-semibold text-foreground">
          {t('counterorders.metrics.title', 'Métricas de pedidos')}
        </h2>
        <SegmentedControl
          options={RANGES.map(d => ({ value: String(d), label: t('counterorders.metrics.range_days', '{n} d', { n: d }) }))}
          value={String(days)}
          onChange={value => setDays(Number(value))}
        />
      </div>
      {isLoading && (
        <div
          className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-sm"
          data-testid="counterorder-metrics-loading"
        >
          {Array.from({ length: SKELETON_CARDS }).map((_, i) => (
            <Skeleton key={i} className="h-[84px] rounded-md" />
          ))}
        </div>
      )}
      {isError && (
        <ErrorState
          title={t('counterorders.metrics.error_title', 'No se pudieron cargar las métricas')}
          message={t('counterorders.metrics.error_message', 'Revisá la conexión e intentá de nuevo.')}
          onRetry={() => refetch()}
        />
      )}
      {!isLoading && !isError && metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-sm items-stretch">
          {cards.map(card => (
            <MetricCard key={card.testId} {...card} />
          ))}
        </div>
      )}
    </section>
  )
}
