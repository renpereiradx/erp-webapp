import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { useForecastRefresh } from '../hooks/useForecastQueries'

/** Refetch de todas las queries del grupo (acción real, sin botón muerto). */
export const ForecastRefreshButton = () => {
  const { t } = useI18n()
  const refresh = useForecastRefresh()
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
      data-testid="forecast-refresh"
    >
      <RefreshCw size={16} className="mr-sm" aria-hidden="true" />
      {t('forecast.common.refresh', 'Actualizar')}
    </Button>
  )
}

export default ForecastRefreshButton
