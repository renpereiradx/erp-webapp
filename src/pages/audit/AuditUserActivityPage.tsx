import {
  Activity,
  CalendarClock,
  CheckCircle2,
  Clock,
  Gauge,
  Monitor,
  Tags,
  UserX,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton } from '@/components/ui/DataSkeletons'
import { useParams } from 'react-router-dom'
import {
  AuditBreakdownTable,
  AuditKpiLedger,
  AuditPageLayout,
  AuditPeriodSelector,
  AuditRecentActionsTable,
  AuditRefreshButton,
  AuditTrendChart,
  useAuditPeriod,
  useAuditUserActivity,
  type AuditBreakdownRow,
  type AuditKpiItem,
  type AuditKpiTone,
} from '@/features/audit'
import { auditCategoryFallback, auditCategoryLabelKey } from '@/domain/audit/labels'
import {
  auditUserKpis,
  formatAuditKpiValue,
  type AuditKpiValue,
} from '@/domain/audit/kpis'
import { buildAuditDailyData } from '@/domain/audit/trends'
import { formatAuditPeriodRange } from '@/domain/audit/format'

interface KpiMeta {
  icon: LucideIcon
  tone: AuditKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const KPI_ORDER = [
  'totalActions',
  'successfulActions',
  'failedActions',
  'successRate',
  'uniqueCategories',
  'uniqueSessions',
  'avgPerDay',
  'lastActivity',
] as const

const KPI_META: Record<(typeof KPI_ORDER)[number], KpiMeta> = {
  totalActions: {
    icon: Activity,
    tone: 'primary',
    labelKey: 'audit.user.kpis.totalActions',
    label: 'Acciones totales',
    hintKey: 'audit.user.kpiHints.totalActions',
    hint: 'Eventos del período',
  },
  successfulActions: {
    icon: CheckCircle2,
    tone: 'success',
    labelKey: 'audit.user.kpis.successfulActions',
    label: 'Exitosas',
    hintKey: 'audit.user.kpiHints.successfulActions',
    hint: 'Eventos con resultado exitoso',
  },
  failedActions: {
    icon: XCircle,
    tone: 'warning',
    labelKey: 'audit.user.kpis.failedActions',
    label: 'Fallidas',
    hintKey: 'audit.user.kpiHints.failedActions',
    hint: 'Eventos con resultado fallido',
  },
  successRate: {
    icon: Gauge,
    tone: 'success',
    labelKey: 'audit.user.kpis.successRate',
    label: 'Tasa de éxito',
    hintKey: 'audit.user.kpiHints.successRate',
    hint: 'Exitosas sobre el total',
  },
  uniqueCategories: {
    icon: Tags,
    tone: 'secondary',
    labelKey: 'audit.user.kpis.uniqueCategories',
    label: 'Categorías',
    hintKey: 'audit.user.kpiHints.uniqueCategories',
    hint: 'Categorías distintas tocadas',
  },
  uniqueSessions: {
    icon: Monitor,
    tone: 'secondary',
    labelKey: 'audit.user.kpis.uniqueSessions',
    label: 'Sesiones',
    hintKey: 'audit.user.kpiHints.uniqueSessions',
    hint: 'Sesiones distintas',
  },
  avgPerDay: {
    icon: CalendarClock,
    tone: 'neutral',
    labelKey: 'audit.user.kpis.avgPerDay',
    label: 'Promedio diario',
    hintKey: 'audit.user.kpiHints.avgPerDay',
    hint: 'Total de acciones dividido los días del período',
  },
  lastActivity: {
    icon: Clock,
    tone: 'neutral',
    labelKey: 'audit.user.kpis.lastActivity',
    label: 'Última actividad',
    hintKey: 'audit.user.kpiHints.lastActivity',
    hint: 'Evento más reciente del usuario',
  },
}

/**
 * F10 — Ficha de actividad de un usuario. Resume el período elegido
 * (resumen, categorías, días y últimos 20 eventos). `summary.avg_actions_per_day`
 * es total / días del período, no un promedio de días activos. Las colecciones
 * `sessions`/`security_events` del contrato nunca se completan: no se
 * renderizan.
 */
const AuditUserActivityPage = () => {
  const { t, lang } = useI18n()
  const { id } = useParams<{ id: string }>()
  const userId = id ?? ''
  const { period, setPeriod } = useAuditPeriod()
  const query = useAuditUserActivity(userId, period)

  const data = query.data
  const errorTitle = t('audit.errors.title', 'No se pudieron cargar los datos')
  const range = formatAuditPeriodRange(data?.period, lang)
  const hasActivity = (data?.summary.total_actions ?? 0) > 0

  const values: Record<string, AuditKpiValue> = Object.fromEntries(
    auditUserKpis(data?.summary, lang).map((row) => [row.id, row]),
  )
  const kpiItems: AuditKpiItem[] = KPI_ORDER.map((kpiId) => {
    const meta = KPI_META[kpiId]
    return {
      id: kpiId,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.label),
      hint: t(meta.hintKey, meta.hint),
      value: formatAuditKpiValue(
        values[kpiId] ?? { id: kpiId, kind: 'count', value: null },
      ),
    }
  })

  const categoryRows: AuditBreakdownRow[] = (data?.actions_by_category ?? []).map(
    (row) => ({
      id: row.category,
      label: t(auditCategoryLabelKey(row.category), auditCategoryFallback(row.category)),
      count: row.count,
      successRate: row.success_rate,
      percentage: row.percentage,
    }),
  )
  const dayData = buildAuditDailyData(data?.actions_by_day, lang)

  return (
    <AuditPageLayout
      title={data?.username || userId || t('audit.user.title', 'Actividad de usuario')}
      subtitle={t('audit.user.subtitle', 'ID de usuario: {id}', { id: userId || '—' })}
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
        skeleton={<PanelSkeleton rows={8} testId="audit-user-skeleton" />}
      >
        {data ? (
          hasActivity ? (
            <>
              <SectionCard
                title={t('audit.user.kpisTitle', 'Resumen del período')}
                description={t(
                  'audit.user.kpisDescription',
                  'Conteos calculados por el backend para este usuario.',
                )}
                testId="audit-user-kpis-card"
              >
                <AuditKpiLedger items={kpiItems} testId="audit-user-kpis" />
              </SectionCard>

              <div className="grid gap-lg xl:grid-cols-2">
                <TableCard
                  title={t('audit.user.categoriesTitle', 'Acciones por categoría')}
                  description={t(
                    'audit.user.categoriesDescription',
                    'Distribución del usuario en el período.',
                  )}
                  testId="audit-user-categories"
                >
                  <AuditBreakdownTable
                    rows={categoryRows}
                    labelHeader={t('audit.table.category', 'Categoría')}
                    testId="audit-user-category-table"
                    caption={t(
                      'audit.user.categoriesCaption',
                      'Acciones del usuario por categoría',
                    )}
                    empty={{
                      icon: Tags,
                      title: t('audit.user.categoriesEmpty', 'Sin categorías'),
                      description: t(
                        'audit.user.categoriesEmptyHint',
                        'El período no registra acciones clasificadas.',
                      ),
                    }}
                  />
                </TableCard>

                <SectionCard
                  title={t('audit.user.daysTitle', 'Actividad por día')}
                  description={t(
                    'audit.user.daysDescription',
                    'Días con eventos; los días sin actividad no se rellenan con ceros.',
                  )}
                  testId="audit-user-days"
                >
                  <AuditTrendChart
                    data={dayData}
                    ariaLabel={t('audit.user.daysAria', 'Acciones del usuario por día')}
                    testId="audit-user-days-chart"
                    empty={{
                      icon: CalendarClock,
                      title: t('audit.user.daysEmpty', 'Sin actividad diaria'),
                      description: t(
                        'audit.user.daysEmptyHint',
                        'No hay eventos del usuario en el período.',
                      ),
                    }}
                  />
                </SectionCard>
              </div>

              <TableCard
                title={t('audit.user.actionsTitle', 'Últimos eventos')}
                description={t(
                  'audit.user.actionsDescription',
                  'Los 20 eventos más recientes del usuario en el período.',
                )}
                testId="audit-user-recent"
              >
                <AuditRecentActionsTable
                  logs={data.recent_actions ?? []}
                  testId="audit-user-recent-table"
                  showUser={false}
                  caption={t(
                    'audit.user.actionsCaption',
                    'Últimos eventos del usuario',
                  )}
                />
              </TableCard>
            </>
          ) : (
            <SectionCard
              title={t('audit.user.emptyCard', 'Actividad del usuario')}
              testId="audit-user-empty"
            >
              <TableEmptyState
                icon={UserX}
                title={t('audit.user.empty', 'Sin actividad registrada')}
                description={t(
                  'audit.user.emptyHint',
                  'El usuario no registra eventos en el período seleccionado. Probá con otro período.',
                )}
              />
            </SectionCard>
          )
        ) : null}
      </QueryBoundary>
    </AuditPageLayout>
  )
}

export default AuditUserActivityPage
