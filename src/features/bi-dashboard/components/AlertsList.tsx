import type { DashboardAlert } from '@/types/bi'
import { AlertCard } from './AlertCard'

/** Lista de alertas ya filtradas/ordenadas por la página. */
export const AlertsList = ({ alerts }: { alerts: DashboardAlert[] }) => (
  <div className="space-y-sm" data-testid="dashboard-alerts-list">
    {alerts.map((alert) => (
      <AlertCard key={alert.id} alert={alert} />
    ))}
  </div>
)
