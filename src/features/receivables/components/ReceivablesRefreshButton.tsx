import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'
import { receivablesQueryKeys } from '../hooks/useReceivablesQueries'

/** Refetch de todas las queries del grupo (acción real, sin botón decorativo). */
export const ReceivablesRefreshButton = () => {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: receivablesQueryKeys.all })
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
      data-testid="receivables-refresh"
    >
      <RefreshCw size={16} className="mr-sm" aria-hidden="true" />
      {t('receivables.actions.refresh', 'Actualizar')}
    </Button>
  )
}

export default ReceivablesRefreshButton
