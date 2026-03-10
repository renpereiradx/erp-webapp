import { useState, useEffect } from 'react'
import biForecastingService from '@/services/biForecastingService'

export const useBIForecasting = endpoint => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true

    const fetchData = async () => {
      try {
        setLoading(true)
        let response

        switch (endpoint) {
          case 'dashboard':
            response = await biForecastingService.getDashboard()
            break
          case 'inventario':
            response = await biForecastingService.getSaludInventario()
            break
          case 'ventas':
            response = await biForecastingService.getPronosticoVentas()
            break
          case 'demanda':
            response = await biForecastingService.getPronosticoDemanda()
            break
          case 'ingresos':
            response = await biForecastingService.getPronosticoIngresos()
            break
          default:
            throw new Error(`Endpoint no soportado: ${endpoint}`)
        }

        if (mounted) {
          const hasExplicitSuccess = typeof response?.success === 'boolean'
          const isSuccess = hasExplicitSuccess ? response.success : true
          if (isSuccess) {
            setData(response?.data ?? response)
          } else {
            throw new Error('Error al cargar los datos')
          }
        }
      } catch (err) {
        if (mounted) {
          console.error(`Error fetching BI data for ${endpoint}:`, err)
          setError(err.message || 'Error desconocido')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchData()

    return () => {
      mounted = false
    }
  }, [endpoint])

  return { data, loading, error }
}

export const formatCurrency = value => {
  if (value === undefined || value === null) return '0 ₲'
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('PYG', '₲')
}

export const formatNumber = value => {
  if (value === undefined || value === null) return '0'
  return new Intl.NumberFormat('es-PY').format(value)
}
