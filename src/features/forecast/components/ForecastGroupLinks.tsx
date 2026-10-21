import { Link } from 'react-router-dom'
import { ArrowRight, Boxes, Coins, LineChart, PackageSearch } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import type { DashboardGroupSummary } from '@/domain/forecast/dashboard'

const GROUP_META: Record<
  string,
  { titleKey: string; titleFallback: string; metricFallback: string; hintKey: string; hintFallback: string; icon: LucideIcon }
> = {
  sales: {
    titleKey: 'forecast.dashboard.groups.sales.title',
    titleFallback: 'Pronóstico de ventas',
    metricFallback: 'Ventas proyectadas',
    hintKey: 'forecast.dashboard.groups.sales.hint',
    hintFallback: 'Variación vs. histórico',
    icon: LineChart,
  },
  revenue: {
    titleKey: 'forecast.dashboard.groups.revenue.title',
    titleFallback: 'Pronóstico de ingresos',
    metricFallback: 'Ingresos proyectados',
    hintKey: 'forecast.dashboard.groups.revenue.hint',
    hintFallback: 'Proyección anual',
    icon: Coins,
  },
  inventory: {
    titleKey: 'forecast.dashboard.groups.inventory.title',
    titleFallback: 'Salud de inventario',
    metricFallback: 'Cobertura (días)',
    hintKey: 'forecast.dashboard.groups.inventory.hint',
    hintFallback: 'Productos en riesgo alto',
    icon: PackageSearch,
  },
  demand: {
    titleKey: 'forecast.dashboard.groups.demand.title',
    titleFallback: 'Pronóstico de demanda',
    metricFallback: 'Unidades proyectadas',
    hintKey: 'forecast.dashboard.groups.demand.hint',
    hintFallback: 'Categorías analizadas',
    icon: Boxes,
  },
}

interface ForecastGroupLinksProps {
  groups: DashboardGroupSummary[]
  testId?: string
}

/** Accesos a las 4 pantallas del grupo con la cifra real embebida en el payload. */
export const ForecastGroupLinks = ({ groups, testId }: ForecastGroupLinksProps) => {
  const { t } = useI18n()

  return (
    <div className="grid gap-md sm:grid-cols-2" data-testid={testId}>
      {groups.map((group) => {
        const meta = GROUP_META[group.id]
        if (!meta) return null
        const Icon = meta.icon
        return (
          <Link
            key={group.id}
            to={group.href}
            className="group flex min-w-0 flex-col gap-sm rounded-md border border-border-subtle bg-surface p-md transition-colors hover:border-primary"
            data-testid={`forecast-group-${group.id}`}
          >
            <div className="flex items-center gap-sm">
              <span
                className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary"
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>
              <h3 className="min-w-0 text-body-md-bold text-foreground">
                {t(meta.titleKey, meta.titleFallback)}
              </h3>
              <ArrowRight
                size={16}
                className="ml-auto shrink-0 text-on-surface-deep group-hover:text-primary"
                aria-hidden="true"
              />
            </div>
            <div className="min-w-0">
              <p className="text-label-caps uppercase text-on-surface-deep">
                {t(group.metricLabelKey, meta.metricFallback)}
              </p>
              <p className="whitespace-nowrap font-data-mono text-title-md text-foreground">
                {group.valueLabel}
              </p>
              <p className="text-body-sm text-on-surface-deep">
                {t(meta.hintKey, meta.hintFallback)}: {group.hintLabel}
              </p>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

export default ForecastGroupLinks
