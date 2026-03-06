import { useState, useCallback } from 'react'
import { financialReportsService } from '../services/financialReportsService'
import { useToast } from './useToast'

export const useFinancialReports = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const [incomeStatement, setIncomeStatement] = useState(null)
  const [profitMargins, setProfitMargins] = useState(null)

  const fetchIncomeStatement = useCallback(async (period = 'month', compare = true) => {
    setLoading(true)
    setError(null)
    try {
      const response = await financialReportsService.getIncomeStatement(period, compare)
      if (response.success) {
        setIncomeStatement(response.data)
      }
      return response
    } catch (err) {
      setError(err.message)
      toast({
        title: 'Error',
        description: 'No se pudo cargar el estado de resultados.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchProfitMargins = useCallback(async (period = 'month', limit = 20) => {
    setLoading(true)
    setError(null)
    try {
      const response = await financialReportsService.getProfitMargins(period, limit)
      if (response.success) {
        setProfitMargins(response.data)
      }
      return response
    } catch (err) {
      setError(err.message)
      toast({
        title: 'Error',
        description: 'No se pudo cargar el análisis de rentabilidad.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    loading,
    error,
    incomeStatement,
    profitMargins,
    fetchIncomeStatement,
    fetchProfitMargins
  }
}
