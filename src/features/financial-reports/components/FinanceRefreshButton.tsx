import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useFinanceRefresh } from '../hooks/useFinancialReportsQueries'

/** Refetch de todas las queries del grupo (acción real, sin botón muerto). */
export const FinanceRefreshButton = () => {
  const { t } = useI18n()
  const refresh = useFinanceRefresh()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await refresh()
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
      data-testid="finance-refresh"
    >
      <RefreshCw size={16} className="mr-sm" aria-hidden="true" />
      {t('finance.actions.refresh', 'Actualizar')}
    </Button>
  )
}

export default FinanceRefreshButton
