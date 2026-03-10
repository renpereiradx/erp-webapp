import { useState, useEffect } from 'react'
import profitabilityService from '../services/profitabilityService'

/**
 * Hook para gestionar datos de rentabilidad.
 * @param {string} method - Método del servicio a llamar.
 * @param {object} params - Parámetros para la llamada.
 */
export const useProfitability = (method, params = {}) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Usamos un stringify simple de params para la dependencia del useEffect
  const paramsKey = JSON.stringify(params)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        if (typeof profitabilityService[method] !== 'function') {
          throw new Error(
            `Método no soportado en profitabilityService: ${method}`,
          )
        }
        const response = await profitabilityService[method](params)
        const hasExplicitSuccess = typeof response?.success === 'boolean'
        const isSuccess = hasExplicitSuccess ? response.success : true
        if (isSuccess) {
          setData(response?.data ?? response)
        } else {
          throw new Error(response.message || 'Error al cargar datos')
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [method, paramsKey])

  return { data, loading, error }
}
