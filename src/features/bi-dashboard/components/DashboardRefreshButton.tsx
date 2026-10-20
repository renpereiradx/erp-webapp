import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { dashboardQueryKeys } from '../hooks/useDashboardQueries'

/**
 * Refetch de todas las queries del dashboard (invalidación del namespace
 * `['bi','dashboard']`). Acción real: no hay botón decorativo.
 */
export const DashboardRefreshButton = () => {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all })
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      size="md"
      loading={refreshing}
      onClick={handleRefresh}
      data-testid="dashboard-refresh"
    >
      <RefreshCw size={16} className="mr-sm" aria-hidden="true" />
      {t('dashboard.actions.refresh', 'Actualizar')}
    </Button>
  )
}
