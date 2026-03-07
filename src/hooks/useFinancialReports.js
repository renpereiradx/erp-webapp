import { useState, useCallback } from 'react'
import { financialReportsService } from '../services/financialReportsService'
import { useToast } from './useToast'

export const useFinancialReports = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { toast } = useToast()

  const [incomeStatement, setIncomeStatement] = useState(null)
  const [cashFlow, setCashFlow] = useState(null)
  const [vatReport, setVatReport] = useState(null)
  const [taxSummary, setTaxSummary] = useState(null)
  const [salesLedger, setSalesLedger] = useState(null)
  const [purchaseLedger, setPurchaseLedger] = useState(null)
  const [profitMargins, setProfitMargins] = useState(null)

  const fetchIncomeStatement = useCallback(
    async (period = 'month', compare = true) => {
      setLoading(true)
      setError(null)
      try {
        const response = await financialReportsService.getIncomeStatement(
          period,
          compare,
        )
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
    },
    [toast],
  )

  const fetchProfitMargins = useCallback(
    async (period = 'month', limit = 20) => {
      setLoading(true)
      setError(null)
      try {
        const response = await financialReportsService.getProfitMargins(
          period,
          limit,
        )
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
    },
    [toast],
  )

  const fetchCashFlow = useCallback(
    async (period = 'month') => {
      setLoading(true)
      setError(null)
      try {
        const response = await financialReportsService.getCashFlow(period)
        const hasExplicitSuccess = typeof response?.success === 'boolean'
        const isSuccess = hasExplicitSuccess ? response.success : true

        if (isSuccess) {
          setCashFlow(response?.data ?? response)
        }
        return response
      } catch (err) {
        setError(err.message)
        toast({
          title: 'Error',
          description: 'No se pudo cargar el flujo de efectivo.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const fetchVatReport = useCallback(
    async (period = 'month') => {
      setLoading(true)
      setError(null)
      try {
        const response = await financialReportsService.getVat(period)
        const hasExplicitSuccess = typeof response?.success === 'boolean'
        const isSuccess = hasExplicitSuccess ? response.success : true

        if (isSuccess) {
          setVatReport(response?.data ?? response)
        }
        return response
      } catch (err) {
        setError(err.message)
        toast({
          title: 'Error',
          description: 'No se pudo cargar el reporte de IVA.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const fetchTaxSummary = useCallback(
    async (period = 'month') => {
      setLoading(true)
      setError(null)
      try {
        const response = await financialReportsService.getTaxSummary(period)
        const hasExplicitSuccess = typeof response?.success === 'boolean'
        const isSuccess = hasExplicitSuccess ? response.success : true

        if (isSuccess) {
          setTaxSummary(response?.data ?? response)
        }
        return response
      } catch (err) {
        setError(err.message)
        toast({
          title: 'Error',
          description: 'No se pudo cargar el resumen fiscal.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const fetchSalesLedger = useCallback(
    async (period = 'month', page = 1, pageSize = 50) => {
      setLoading(true)
      setError(null)
      try {
        const response = await financialReportsService.getSalesLedger(
          period,
          page,
          pageSize,
        )
        const hasExplicitSuccess = typeof response?.success === 'boolean'
        const isSuccess = hasExplicitSuccess ? response.success : true

        if (isSuccess) {
          setSalesLedger(response?.data ?? response)
        }
        return response
      } catch (err) {
        setError(err.message)
        toast({
          title: 'Error',
          description: 'No se pudo cargar el libro de ventas.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const fetchSalesLedgerDateRange = useCallback(
    async (startDate, endDate, page = 1, pageSize = 50) => {
      setLoading(true)
      setError(null)
      try {
        const response = await financialReportsService.getSalesLedgerDateRange(
          startDate,
          endDate,
          page,
          pageSize,
        )
        const hasExplicitSuccess = typeof response?.success === 'boolean'
        const isSuccess = hasExplicitSuccess ? response.success : true

        if (isSuccess) {
          setSalesLedger(response?.data ?? response)
        }
        return response
      } catch (err) {
        setError(err.message)
        toast({
          title: 'Error',
          description: 'No se pudo cargar el libro de ventas por rango.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const fetchPurchaseLedger = useCallback(
    async (period = 'month', page = 1, pageSize = 50) => {
      setLoading(true)
      setError(null)
      try {
        const response = await financialReportsService.getPurchaseLedger(
          period,
          page,
          pageSize,
        )
        const hasExplicitSuccess = typeof response?.success === 'boolean'
        const isSuccess = hasExplicitSuccess ? response.success : true

        if (isSuccess) {
          setPurchaseLedger(response?.data ?? response)
        }
        return response
      } catch (err) {
        setError(err.message)
        toast({
          title: 'Error',
          description: 'No se pudo cargar el libro de compras.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  const fetchPurchaseLedgerDateRange = useCallback(
    async (startDate, endDate, page = 1, pageSize = 50) => {
      setLoading(true)
      setError(null)
      try {
        const response =
          await financialReportsService.getPurchaseLedgerDateRange(
            startDate,
            endDate,
            page,
            pageSize,
          )
        const hasExplicitSuccess = typeof response?.success === 'boolean'
        const isSuccess = hasExplicitSuccess ? response.success : true

        if (isSuccess) {
          setPurchaseLedger(response?.data ?? response)
        }
        return response
      } catch (err) {
        setError(err.message)
        toast({
          title: 'Error',
          description: 'No se pudo cargar el libro de compras por rango.',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
      }
    },
    [toast],
  )

  return {
    loading,
    error,
    incomeStatement,
    cashFlow,
    vatReport,
    taxSummary,
    salesLedger,
    purchaseLedger,
    profitMargins,
    fetchIncomeStatement,
    fetchCashFlow,
    fetchVatReport,
    fetchTaxSummary,
    fetchSalesLedger,
    fetchSalesLedgerDateRange,
    fetchPurchaseLedger,
    fetchPurchaseLedgerDateRange,
    fetchProfitMargins,
  }
}
