import { useState, useEffect, useCallback } from 'react'
import { receivablesService } from '@/services/bi/receivablesService'

/**
 * Transform API response to format expected by UI components
 */
const transformApiResponse = apiData => {
  // Handle both array and paginated object responses
  const items = apiData?.items || apiData || []

  if (!Array.isArray(items)) return []

  // Priority colors by days overdue
  const getPriority = daysOverdue => {
    if (daysOverdue > 60) return 'High'
    if (daysOverdue > 30) return 'Medium'
    return 'Low'
  }

  // Generate initials from client name
  const getInitials = name => {
    if (!name) return 'XX'
    const words = name.split(' ')
    return words.length >= 2
      ? `${words[0][0]}${words[1][0]}`.toUpperCase()
      : name.substring(0, 2).toUpperCase()
  }

  // Background colors for avatar
  const bgColors = ['#dbeafe', '#fef3c7', '#dcfce7', '#fce7f3', '#e0e7ff']

  return items.map((item, idx) => ({
    id: item.id || item.sale_order_id,
    client: item.client_name,
    clientId: item.client_id,
    clientPhone: item.client_phone,
    amount: item.pending_amount,
    originalAmount: item.original_amount,
    paidAmount: item.paid_amount,
    daysOverdue: item.days_overdue,
    priority: getPriority(item.days_overdue),
    lastContact: 'Sin contacto',
    nextAction:
      item.days_overdue > 60 ? 'Llamar urgente' : 'Enviar recordatorio',
    riskScore: Math.min(100, item.days_overdue + 20),
    code: getInitials(item.client_name),
    bgColor: bgColors[idx % bgColors.length],
    days: `${item.days_overdue} días`,
    contactVia: 'Pendiente',
    saleDate: item.sale_date,
    dueDate: item.due_date,
    status: item.status,
  }))
}

/**
 * Calculate stats from accounts data
 */
const calculateStats = accounts => {
  if (!accounts.length) {
    return {
      totalOverdue: 0,
      atRisk: 0,
      efficiency: 0,
      totalAccounts: 0,
    }
  }

  const totalOverdue = accounts.reduce((sum, acc) => sum + (acc.amount || 0), 0)
  const atRisk = accounts.filter(acc => acc.priority === 'High').length
  // Efficiency is percentage of partial payments vs total
  const totalOriginal = accounts.reduce(
    (sum, acc) => sum + (acc.originalAmount || 0),
    0,
  )
  const totalPaid = accounts.reduce(
    (sum, acc) => sum + (acc.paidAmount || 0),
    0,
  )
  const efficiency =
    totalOriginal > 0 ? Math.round((totalPaid / totalOriginal) * 100) : 0

  return {
    totalOverdue,
    atRisk,
    efficiency,
    totalAccounts: accounts.length,
  }
}

/**
 * Hook para manejar las cuentas vencidas y estadísticas de cobranza.
 * Conecta con GET /receivables/overdue
 */
export const useOverdueAccounts = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [data, setData] = useState({
    stats: {
      totalOverdue: 0,
      atRisk: 0,
      efficiency: 0,
      totalAccounts: 0,
    },
    accounts: [],
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await receivablesService.getOverdueAccounts()
      const accountsData = response.data || response || []

      // Transform API data to UI format
      const accounts = transformApiResponse(accountsData)
      const stats = calculateStats(accounts)

      setData({ stats, accounts })
    } catch (err) {
      console.error('Error loading overdue accounts:', err)
      setError('Error al cargar las cuentas vencidas.')
      setData(prev => ({
        ...prev,
        accounts: [],
      }))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    ...data,
    loading,
    error,
    refresh: loadData,
  }
}
