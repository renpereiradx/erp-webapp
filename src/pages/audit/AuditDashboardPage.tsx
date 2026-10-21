import {
  Activity,
  AlertOctagon,
  CheckCircle2,
  Clock,
  LineChart,
  ListChecks,
  Monitor,
  ShieldAlert,
  Tags,
  Users,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton } from '@/components/ui/DataSkeletons'
import {
  AuditBreakdownTable,
  AuditErrorSummaryTable,
  AuditKpiLedger,
  AuditPageLayout,
  AuditPeriodSelector,
  AuditRecentActionsTable,
  AuditRefreshButton,
  AuditSecurityAlertsPanel,
  AuditTopUsersTable,
  AuditTrendChart,
  useAuditDashboard,
  useAuditPeriod,
  type AuditBreakdownRow,
  type AuditKpiItem,
  type AuditKpiTone,
} from '@/features/audit'
import {
  auditCategoryFallback,
  auditCategoryLabelKey,
  auditActionFallback,
  auditActionLabelKey,
} from '@/domain/audit/labels'
import {
  auditDashboardKpis,
  formatAuditKpiValue,
  type AuditKpiValue,
} from '@/domain/audit/kpis'
import {
  auditGranularityForPeriod,
  buildAuditTrendData,
} from '@/domain/audit/trends'
import { formatAuditPeriodRange, formatCount, formatDecimal } from '@/domain/audit/format'
import type { AuditDashboard } from '@/types/bi'

interface KpiMeta {
  icon: LucideIcon
  tone: AuditKpiTone
  labelKey: string
  label: string
}

const KPI_ORDER = [
  'totalActions',
  'successRate',
  'failedActions',
  'uniqueUsers',
  'uniqueSessions',
  'criticalErrors',
  'securityIncidents',
  'peakHour',
] as const

const KPI_META: Record<(typeof KPI_ORDER)[number], KpiMeta> = {
  totalActions: {
    icon: Activity,
    tone: 'primary',
    labelKey: 'audit.dashboard.kpis.totalActions',
    label: 'Acciones totales',
  },
  successRate: {
    icon: CheckCircle2,
    tone: 'success',
    labelKey: 'audit.dashboard.kpis.successRate',
    label: 'Tasa de éxito',
  },
  failedActions: {
    icon: XCircle,
    tone: 'warning',
    labelKey: 'audit.dashboard.kpis.failedActions',
    label: 'Fallos',
  },
  uniqueUsers: {
    icon: Users,
    tone: 'secondary',
    labelKey: 'audit.dashboard.kpis.uniqueUsers',
    label: 'Usuarios únicos',
  },
  uniqueSessions: {
    icon: Monitor,
    tone: 'secondary',
    labelKey: 'audit.dashboard.kpis.uniqueSessions',
    label: 'Sesiones únicas',
  },
  criticalErrors: {
    icon: AlertOctagon,
    tone: 'error',
    labelKey: 'audit.dashboard.kpis.criticalErrors',
    label: 'Errores críticos',
  },
  securityIncidents: {
    icon: ShieldAlert,
    tone: 'error',
    labelKey: 'audit.dashboard.kpis.securityIncidents',
    label: 'Incidentes de seguridad',
  },
  peakHour: {
    icon: Clock,
    tone: 'neutral',
    labelKey: 'audit.dashboard.kpis.peakHour',
    label: 'Hora pico',
  },
}

const DashboardSkeleton = () => (
  <div className="space-y-xl" aria-busy="true">
    <div className="rounded-md bg-surface p-lg shadow-whisper">
      <PanelSkeleton rows={8} />
    </div>
    <div className="grid gap-lg xl:grid-cols-2">
      <div className="rounded-md bg-surface p-lg shadow-whisper">
        <PanelSkeleton rows={5} />
      </div>
      <div className="rounded-md bg-surface p-lg shadow-whisper">
        <PanelSkeleton rows={5} />
      </div>
    </div>
  </div>
)

const toBreakdownRows = (
  rows: AuditDashboard['actions_by_category'] | undefined,
  label: (code: string) => string,
): AuditBreakdownRow[] =>
  (rows ?? []).map((row) => ({
    id: row.category,
    label: label(row.category),
    count: row.count,
    successRate: row.success_rate,
    percentage: row.percentage,
  }))

/**
 * F10 — Dashboard de Auditoría. Una sola query alimenta KPIs, tendencias,
 * categorías, acciones, top de usuarios, alertas de seguridad, errores y
 * últimos eventos. Sin curva fabricada, sin growth literal y sin "Óptimo":
 * sin acciones la tasa es `n/d` y un panel vacío lo dice explícitamente.
 */
const AuditDashboardPage = () => {
  const { t, lang } = useI18n()
  const { period, setPeriod } = useAuditPeriod()
  const query = useAuditDashboard(period)

  const data = query.data
  const errorTitle = t('audit.errors.title', 'No se pudieron cargar los datos')
  const range = formatAuditPeriodRange(data?.period, lang)

  const values: Record<string, AuditKpiValue> = Object.fromEntries(
    auditDashboardKpis(data?.kpis).map((row) => [row.id, row]),
  )
  const valueOf = (id: (typeof KPI_ORDER)[number]): string =>
    formatAuditKpiValue(values[id] ?? { id, kind: 'count', value: null })

  const kpis = data?.kpis
  const totalActions = kpis?.total_actions ?? 0
  const peakActions = kpis?.peak_hour_actions ?? 0

  const hints: Record<(typeof KPI_ORDER)[number], string> = {
    totalActions: t(
      'audit.dashboard.kpiHints.totalActions',
      'Eventos registrados en el período',
    ),
    successRate:
      totalActions > 0
        ? t('audit.dashboard.kpiHints.successRate', 'Éxitos: {ok} de {total}', {
            ok: formatCount(kpis?.successful_actions),
            total: formatCount(totalActions),
          })
        : t('audit.dashboard.kpiHints.noActions', 'Sin acciones en el período'),
    failedActions: t(
      'audit.dashboard.kpiHints.failedActions',
      'Eventos con resultado fallido',
    ),
    uniqueUsers: t('audit.dashboard.kpiHints.uniqueUsers', 'Promedio: {value} por usuario', {
      value: formatDecimal(kpis?.avg_actions_per_user, 2),
    }),
    uniqueSessions: t(
      'audit.dashboard.kpiHints.uniqueSessions',
      'Promedio: {value} por sesión',
      { value: formatDecimal(kpis?.avg_actions_per_session, 2) },
    ),
    criticalErrors: t(
      'audit.dashboard.kpiHints.criticalErrors',
      'Eventos de nivel CRITICAL',
    ),
    securityIncidents: t(
      'audit.dashboard.kpiHints.securityIncidents',
      'Logins fallidos en el período',
    ),
    peakHour:
      peakActions > 0
        ? t('audit.dashboard.kpiHints.peakHour', '{count} acciones en esa hora', {
            count: formatCount(peakActions),
          })
        : t('audit.dashboard.kpiHints.noActions', 'Sin acciones en el período'),
  }

  const kpiItems: AuditKpiItem[] = KPI_ORDER.map((id) => {
    const meta = KPI_META[id]
    return {
      id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.label),
      hint: hints[id],
      value: valueOf(id),
    }
  })

  const granularity = auditGranularityForPeriod(data?.period)
  const trendData = buildAuditTrendData(data?.trends, granularity, lang)

  const categoryLabel = (code: string) =>
    t(auditCategoryLabelKey(code), auditCategoryFallback(code))
  const actionLabel = (code: string) =>
    t(auditActionLabelKey(code), auditActionFallback(code))

  const categoryRows = toBreakdownRows(data?.actions_by_category, categoryLabel)
  const actionRows = (data?.actions_by_type ?? []).map((row) => ({
    id: row.action,
    label: actionLabel(row.action),
    count: row.count,
    successRate: row.success_rate,
    percentage: row.percentage,
  }))

  return (
    <AuditPageLayout
      title={t('audit.dashboard.title', 'Auditoría')}
      subtitle={t(
        'audit.dashboard.subtitle',
        'Trazabilidad de eventos y seguridad del sistema. Los datos provienen del registro de auditoría.',
      )}
      range={range}
      actions={
        <div className="flex max-w-full flex-wrap items-center justify-end gap-sm">
          <AuditPeriodSelector value={period} onChange={setPeriod} />
          <AuditRefreshButton />
        </div>
      }
    >
      <QueryBoundary
        isLoading={query.isLoading}
        error={query.error}
        errorTitle={errorTitle}
        onRetry={() => void query.refetch()}
        skeleton={<DashboardSkeleton />}
      >
        {data ? (
          <>
            <SectionCard
              title={t('audit.dashboard.kpisTitle', 'Indicadores del período')}
              description={t(
                'audit.dashboard.kpisDescription',
                'Conteos y tasas calculados por el backend sobre el registro de auditoría.',
              )}
              testId="audit-dashboard-kpis-card"
            >
              <AuditKpiLedger items={kpiItems} testId="audit-dashboard-kpis" />
            </SectionCard>

            <div className="grid gap-lg xl:grid-cols-3">
              <SectionCard
                title={t('audit.dashboard.trendsTitle', 'Actividad en el tiempo')}
                description={t(
                  'audit.dashboard.trendsDescription',
                  'Buckets con actividad real; la granularidad (horaria, diaria o semanal) la define el backend según el período.',
                )}
                className="xl:col-span-2"
                testId="audit-dashboard-trends"
              >
                <AuditTrendChart
                  data={trendData}
                  ariaLabel={t('audit.dashboard.trendsAria', 'Acciones por bucket')}
                  testId="audit-trend-chart"
                  empty={{
                    icon: LineChart,
                    title: t('audit.dashboard.trendsEmpty', 'Sin actividad en el período'),
                    description: t(
                      'audit.dashboard.trendsEmptyHint',
                      'No hay eventos registrados en la ventana seleccionada.',
                    ),
                  }}
                />
              </SectionCard>

              <SectionCard
                title={t('audit.dashboard.alertsTitle', 'Alertas de seguridad')}
                description={t(
                  'audit.dashboard.alertsDescription',
                  'Reglas del backend: 3 o más logins fallidos por usuario/IP y 100 o más acciones en una hora.',
                )}
                testId="audit-dashboard-alerts"
              >
                <AuditSecurityAlertsPanel
                  alerts={data.security_alerts ?? []}
                  testId="audit-security-alerts"
                />
              </SectionCard>
            </div>

            <div className="grid gap-lg xl:grid-cols-2">
              <TableCard
                title={t('audit.dashboard.categoriesTitle', 'Acciones por categoría')}
                description={t(
                  'audit.dashboard.categoriesDescription',
                  'Conteo, tasa de éxito y participación de cada categoría en el período.',
                )}
                testId="audit-dashboard-categories"
              >
                <AuditBreakdownTable
                  rows={categoryRows}
                  labelHeader={t('audit.table.category', 'Categoría')}
                  testId="audit-category-table"
                  caption={t(
                    'audit.dashboard.categoriesCaption',
                    'Acciones agrupadas por categoría',
                  )}
                  empty={{
                    icon: Tags,
                    title: t('audit.dashboard.categoriesEmpty', 'Sin categorías'),
                    description: t(
                      'audit.dashboard.categoriesEmptyHint',
                      'El período no registra acciones clasificadas.',
                    ),
                  }}
                />
              </TableCard>

              <TableCard
                title={t('audit.dashboard.actionsTitle', 'Acciones por tipo')}
                description={t(
                  'audit.dashboard.actionsDescription',
                  'Conteo, tasa de éxito y participación por tipo de acción.',
                )}
                testId="audit-dashboard-actions"
              >
                <AuditBreakdownTable
                  rows={actionRows}
                  labelHeader={t('audit.table.action', 'Acción')}
                  testId="audit-action-table"
                  caption={t(
                    'audit.dashboard.actionsCaption',
                    'Acciones agrupadas por tipo',
                  )}
                  empty={{
                    icon: ListChecks,
                    title: t('audit.dashboard.actionsEmpty', 'Sin acciones'),
                    description: t(
                      'audit.dashboard.actionsEmptyHint',
                      'El período no registra eventos.',
                    ),
                  }}
                />
              </TableCard>
            </div>

            <TableCard
              title={t('audit.dashboard.topUsersTitle', 'Usuarios más activos')}
              description={t(
                'audit.dashboard.topUsersDescription',
                'Top 5 por cantidad de acciones; cada fila abre la ficha de actividad.',
              )}
              testId="audit-dashboard-top-users"
            >
              <AuditTopUsersTable
                users={data.top_users ?? []}
                testId="audit-top-users-table"
                caption={t(
                  'audit.dashboard.topUsersCaption',
                  'Usuarios con más acciones en el período',
                )}
              />
            </TableCard>

            <TableCard
              title={t('audit.dashboard.errorsTitle', 'Errores agrupados')}
              description={t(
                'audit.dashboard.errorsDescription',
                'Acciones fallidas agrupadas por categoría, acción y mensaje.',
              )}
              testId="audit-dashboard-errors"
            >
              <AuditErrorSummaryTable
                errors={data.error_summary ?? []}
                testId="audit-error-table"
                caption={t(
                  'audit.dashboard.errorsCaption',
                  'Errores agrupados del período',
                )}
              />
            </TableCard>

            <TableCard
              title={t('audit.dashboard.recentTitle', 'Últimos eventos')}
              description={t(
                'audit.dashboard.recentDescription',
                'Los 10 eventos más recientes del período.',
              )}
              action={
                <Link
                  to="/auditoria/logs"
                  className="text-body-sm-bold text-primary hover:underline"
                >
                  {t('audit.dashboard.openLogs', 'Ver registro completo')}
                </Link>
              }
              testId="audit-dashboard-recent"
            >
              <AuditRecentActionsTable
                logs={data.recent_activity ?? []}
                testId="audit-recent-table"
                caption={t('audit.dashboard.recentCaption', 'Últimos eventos de auditoría')}
              />
            </TableCard>
          </>
        ) : null}
      </QueryBoundary>
    </AuditPageLayout>
  )
}

export default AuditDashboardPage
