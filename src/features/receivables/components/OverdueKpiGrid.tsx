import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'
import type { OverdueStats } from '@/domain/receivables/risk'

/**
 * Grid de KPIs para la página de cuentas vencidas.
 * Migración FASE 3: .tsx + tokens. Honestidad (criterio H7): sin fallbacks
 * mock (145200/12/68/32450) ni badges de variación inventados — se muestra
 * solo el dato real del endpoint.
 */
interface OverdueKpiGridProps {
  stats: OverdueStats
}

const OverdueKpiGrid = ({ stats }: OverdueKpiGridProps) => {
  const { t } = useI18n()

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md">
      {/* Card 1: Total Overdue */}
      <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper flex flex-col gap-xs" data-testid="kpi-total-overdue">
        <p className="text-on-surface-deep text-body-md">
          {t('receivables.overdue.kpi.total_overdue', 'Total Vencido', {})}
        </p>
        <h3 className="text-title-md font-data-mono text-data-mono text-foreground">
          {formatPYG(stats.totalOverdue)}
        </h3>
      </div>

      {/* Card 2: Accounts at Risk */}
      <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper flex flex-col gap-xs" data-testid="kpi-at-risk">
        <p className="text-on-surface-deep text-body-md">
          {t('receivables.overdue.kpi.at_risk', 'Cuentas en Riesgo (>90 Días)', {})}
        </p>
        <h3 className="text-title-md font-data-mono text-data-mono text-foreground">{stats.atRisk}</h3>
      </div>

      {/* Card 3: Collection Efficiency */}
      <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper flex flex-col gap-xs" data-testid="kpi-efficiency">
        <p className="text-on-surface-deep text-body-md">
          {t('receivables.overdue.kpi.efficiency', 'Eficiencia de Cobro', {})}
        </p>
        <div className="flex items-end gap-sm">
          <h3 className="text-title-md font-data-mono text-data-mono text-foreground">{stats.efficiency}%</h3>
          <span className="text-body-sm-bold text-on-surface-deep">
            {t('receivables.overdue.kpi.target', 'Objetivo: 75%', {})}
          </span>
        </div>
        <div className="w-full bg-surface-muted h-1.5 rounded-full mt-xs overflow-hidden">
          <div className="bg-primary h-full rounded-full" style={{ width: `${stats.efficiency}%` }} />
        </div>
      </div>

      {/* Card 4: Promises to Pay (sin dato del endpoint: se oculta hasta que exista) */}
      <div className="bg-surface p-md rounded-md border border-border-subtle shadow-whisper flex flex-col gap-xs" data-testid="kpi-total-accounts">
        <p className="text-on-surface-deep text-body-md">
          {t('receivables.overdue.kpi.total_accounts', 'Cuentas Vencidas', {})}
        </p>
        <h3 className="text-title-md font-data-mono text-data-mono text-foreground">{stats.totalAccounts}</h3>
      </div>
    </div>
  )
}

export default OverdueKpiGrid
