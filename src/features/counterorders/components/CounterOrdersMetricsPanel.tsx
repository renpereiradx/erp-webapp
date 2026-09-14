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
import SegmentedControl from '@/components/ui/SegmentedControl'
import { counterOrderService } from '@/services/counterOrderService'
import type { CounterOrderMetrics } from '../types'

const RANGES = [7, 30, 90]

/** Tarjeta numérica; value string ya viene formateado por el llamador. */
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
    <Card data-testid={testId}>
      <CardContent className="flex items-center gap-3 p-4">
        <Icon size={20} className="text-primary shrink-0" aria-hidden="true" />
        <div className="min-w-0">
          <p className="text-label-caps uppercase text-on-surface-deep truncate">{label}</p>
          <p className="text-title-md font-semibold text-foreground" data-testid={`${testId}-value`}>
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function CounterOrdersMetricsPanel() {
  const { t } = useI18n()
  const [days, setDays] = useState(30)

  const { data, isLoading } = useQuery({
    queryKey: ['counter-orders', 'metrics', days],
    queryFn: () => counterOrderService.metrics(days),
    staleTime: 60_000,
  })

  const metrics: CounterOrderMetrics | undefined = data

  const cards = metrics
    ? [
        {
          icon: ClipboardList,
          label: t('counterorders.metrics.created', 'Creados ({days}d)', { days }),
          value: String(metrics.created),
          testId: 'counterorder-metrics-created',
        },
        {
          icon: CheckCircle2,
          label: t('counterorders.metrics.converted', 'Convertidos'),
          value: String(metrics.converted),
          testId: 'counterorder-metrics-converted',
        },
        {
          icon: Activity,
          label: t('counterorders.metrics.conversion_rate', 'Tasa de conversión'),
          value: t('counterorders.metrics.percent', '{value}%', { value: metrics.conversion_rate }),
          testId: 'counterorder-metrics-rate',
        },
        {
          icon: Clock,
          label: t('counterorders.metrics.avg_time', 'Tiempo medio a caja'),
          value: t('counterorders.metrics.minutes', '{value} min', {
            value: metrics.avg_minutes_to_convert,
          }),
          testId: 'counterorder-metrics-avg-time',
        },
        {
          icon: Archive,
          label: t('counterorders.metrics.active', 'Activos ahora'),
          value: String(metrics.active),
          testId: 'counterorder-metrics-active',
        },
        {
          icon: XCircle,
          label: t('counterorders.metrics.lost', 'Cancelados / Vencidos'),
          value: `${metrics.cancelled} / ${metrics.expired}`,
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
        <p className="text-body-md text-on-surface-deep animate-pulse" data-testid="counterorder-metrics-loading">
          {t('counterorders.metrics.loading', 'Calculando métricas…')}
        </p>
      )}
      {!isLoading && metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-sm">
          {cards.map(card => (
            <MetricCard key={card.testId} {...card} />
          ))}
        </div>
      )}
    </section>
  )
}
