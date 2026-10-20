import { useI18n } from '@/lib/i18n'
import type { KpiGroupView } from '@/domain/dashboard/kpis'
import { DashboardSection } from './DashboardSection'
import { KpiValue } from './KpiValue'

const GROUP_LABELS: Record<string, string> = {
  sales: 'Ventas',
  inventory: 'Inventario',
  financial: 'Finanzas',
  customer: 'Clientes',
  budget: 'Presupuestos',
}

const ITEM_LABELS: Record<string, string> = {
  average_ticket: 'Ticket promedio',
  sales_per_day: 'Ventas por día',
  conversion_rate: 'Conversión de presupuestos',
  repeat_customer_rate: 'Clientes recurrentes',
  turnover_rate: 'Rotación de inventario',
  days_of_inventory: 'Días de inventario',
  stockout_rate: 'Tasa de quiebre de stock',
  gross_margin: 'Margen bruto',
  net_margin: 'Margen neto',
  operating_expense_ratio: 'Gastos operativos sobre ventas',
  new_customers: 'Clientes nuevos',
  active_customers: 'Clientes activos',
  total_customers: 'Clientes totales',
  average_purchase_frequency: 'Frecuencia de compra',
  budget_to_sale_conversion: 'Conversión de presupuestos',
  average_budget_value: 'Valor promedio de presupuesto',
  expired_budgets: 'Presupuestos vencidos',
}

/** Los 5 grupos de KPIs, cada uno como card con sus indicadores y unidad. */
export const KpiGroupsPanel = ({ groups }: { groups: KpiGroupView[] }) => {
  const { t } = useI18n()

  return (
    <div className="grid gap-lg lg:grid-cols-2" data-testid="dashboard-kpi-groups">
      {groups.map((group) => (
        <DashboardSection
          key={group.key}
          title={t(`dashboard.kpis.groups.${group.key}`, GROUP_LABELS[group.key] ?? group.key)}
          testId={`dashboard-kpi-group-${group.key}`}
        >
          <dl className="divide-y divide-divider">
            {group.items.map((item) => (
              <div key={item.id} className="flex items-baseline justify-between gap-md py-sm first:pt-0 last:pb-0">
                <dt className="text-body-md text-on-surface-deep">
                  {t(`dashboard.kpis.items.${item.id}`, ITEM_LABELS[item.id] ?? item.id)}
                </dt>
                <dd className="text-right font-data-mono text-data-mono text-foreground">
                  <KpiValue value={item.value} kind={item.kind} />
                </dd>
              </div>
            ))}
          </dl>
        </DashboardSection>
      ))}
    </div>
  )
}
