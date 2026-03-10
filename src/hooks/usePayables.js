import { useState, useCallback } from 'react'
import { payablesService } from '../services/payablesService'
import { useToast } from './useToast'

/**
 * Hook for managing Accounts Payable data and state
 */
export const usePayables = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const [overview, setOverview] = useState(null)
  const [payables, setPayables] = useState([])
  const [topSuppliers, setTopSuppliers] = useState([])
  const [schedule, setSchedule] = useState([])
  const [agingSummary, setAgingSummary] = useState(null)
  const [agingReport, setAgingReport] = useState(null)
  const [statistics, setStatistics] = useState(null)

  const fetchOverview = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await payablesService.getOverview()
      if (response.success) {
        setOverview(response.data)
      }
      return response
    } catch (err) {
      setError(err.message)
      toast({
        title: 'Error',
        description: 'No se pudo cargar el resumen de cuentas por pagar.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchPayables = useCallback(async (filters = {}, pagination = {}) => {
    setLoading(true)
    setError(null)
    try {
      const response = await payablesService.getPayables(filters, pagination)
      if (response.success) {
        // Validación de seguridad: asegurar que sea un array
        const data = Array.isArray(response.data) 
          ? response.data 
          : (response.data?.payables || [])
        setPayables(data)
      }
      return response
    } catch (err) {
      setError(err.message)
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las facturas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchTopSuppliers = useCallback(async (limit = 10) => {
    setLoading(true)
    try {
      const response = await payablesService.getTopSuppliers(limit)
      if (response.success) {
        setTopSuppliers(response.data)
      }
      return response
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los principales proveedores.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchSchedule = useCallback(async (days = 30) => {
    setLoading(true)
    try {
      const response = await payablesService.getSchedule(days)
      if (response.success) {
        setSchedule(response.data.schedule || [])
      }
      return response
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el calendario de pagos.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchAgingSummary = useCallback(async () => {
    setLoading(true)
    try {
      const response = await payablesService.getAgingSummary()
      if (response.success) {
        setAgingSummary(response.data)
      }
      return response
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el resumen de antigüedad.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchAgingReport = useCallback(async () => {
    setLoading(true)
    try {
      const response = await payablesService.getAgingReport()
      if (response.success) {
        setAgingReport(response.data)
      }
      return response
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudo cargar el reporte de antigüedad.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchStatistics = useCallback(async (period = 'month') => {
    setLoading(true)
    try {
      const response = await payablesService.getStatistics(period)
      if (response.success) {
        setStatistics(response.data)
      }
      return response
    } catch (err) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las estadísticas.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  return {
    loading,
    error,
    overview,
    payables,
    topSuppliers,
    schedule,
    agingSummary,
    agingReport,
    statistics,
    fetchOverview,
    fetchPayables,
    fetchTopSuppliers,
    fetchSchedule,
    fetchAgingSummary,
    fetchAgingReport,
    fetchStatistics
  }
}
