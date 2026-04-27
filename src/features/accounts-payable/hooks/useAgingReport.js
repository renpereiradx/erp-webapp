import { useState, useEffect, useMemo, useCallback } from 'react'
import { receivablesService } from '@/services/bi/receivablesService'
import { agingData as mockData } from '../data/agingMockData'

/**
 * Transform API response to the format expected by UI components
 */
const transformApiData = apiData => {
  const { summary, by_client, total_amount, generated_at } = apiData

  // Format date
  const date = new Date(generated_at)
  const formattedDate = date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  // Calculate risk level based on aging buckets
  const getRiskLevel = client => {
    const overduePercentage =
      ((client.days_30_60 + client.days_60_90 + client.over_90_days) /
        client.total) *
      100
    if (client.over_90_days > 0) return 'Crítico'
    if (overduePercentage > 30) return 'Moderado'
    return 'Mínimo'
  }

  // Transform summary to distribution format
  const distribution = [
    {
      label: 'Corriente (0-30 d)',
      amount: summary.current.amount,
      percentage: summary.current.percentage,
      color: 'bg-green-500',
    },
    {
      label: 'Vencido (31-60 d)',
      amount: summary.days_30_60.amount,
      percentage: summary.days_30_60.percentage,
      color: 'bg-amber-400',
    },
    {
      label: 'Vencido (61-90 d)',
      amount: summary.days_60_90.amount,
      percentage: summary.days_60_90.percentage,
      color: 'bg-orange-500',
    },
    {
      label: 'Crítico (+90 d)',
      amount: summary.over_90_days.amount,
      percentage: summary.over_90_days.percentage,
      color: 'bg-red-500',
    },
  ]

  // Transform API clients to UI format
  const clients = by_client.map(client => ({
    name: client.client_name,
    clientId: client.client_id,
    corriente: client.current,
    v31_60: client.days_30_60,
    v61_90: client.days_60_90,
    v91plus: client.over_90_days,
    total: client.total,
    risk: getRiskLevel(client),
  }))

  // Calculate KPIs
  const overdueTotal =
    summary.days_30_60.amount +
    summary.days_60_90.amount +
    summary.over_90_days.amount
  const overduePercentage = (overdueTotal / total_amount) * 100
  const criticalCount = clients.filter(c => c.risk === 'Crítico').length

  return {
    summary: {
      totalDebt: total_amount,
      lastUpdate: formattedDate,
      distribution,
    },
    kpis: {
      dpo: { value: 42, trend: 2.4, previous: 41 }, // DSO would come from statistics endpoint
      overduePercentage: {
        value: overduePercentage.toFixed(1),
        trend: 1.2,
        target: 10,
      },
      criticalRisk: {
        value: summary.over_90_days.amount,
        trend: 0,
        clientsCount: criticalCount,
      },
    },
    clients,
  }
}

/**
 * Custom hook to manage aging report logic and calculations.
 * Connects to /receivables/aging/report endpoint.
 */
export const useAgingReport = () => {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchAgingReport = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await receivablesService.getDetailedAging()
      const transformedData = transformApiData(response.data)
      setData(transformedData)
    } catch (err) {
      console.error('Error fetching aging report:', err)
      setError(err.message)
      // Fallback to mock data on error
      setData(mockData)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAgingReport()
  }, [fetchAgingReport])

  // Filtered clients list based on search term
  const filteredClients = useMemo(() => {
    if (!data) return []
    if (!searchTerm.trim()) return data.clients

    const term = searchTerm.toLowerCase()
    return data.clients.filter(
      c =>
        c.name.toLowerCase().includes(term) ||
        c.risk.toLowerCase().includes(term),
    )
  }, [data, searchTerm])

  // Totals for the footer
  const totals = useMemo(() => {
    if (!filteredClients.length)
      return {
        corriente: 0,
        v31_60: 0,
        v61_90: 0,
        v91plus: 0,
        total: 0,
      }

    return filteredClients.reduce(
      (acc, curr) => ({
        corriente: acc.corriente + curr.corriente,
        v31_60: acc.v31_60 + curr.v31_60,
        v61_90: acc.v61_90 + curr.v61_90,
        v91plus: acc.v91plus + curr.v91plus,
        total: acc.total + curr.total,
      }),
      { corriente: 0, v31_60: 0, v61_90: 0, v91plus: 0, total: 0 },
    )
  }, [filteredClients])

  return {
    loading,
    error,
    summary: data?.summary,
    kpis: data?.kpis,
    clients: filteredClients,
    totals,
    searchTerm,
    setSearchTerm,
    refetch: fetchAgingReport,
  }
}
