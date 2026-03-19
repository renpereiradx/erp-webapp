import {
  MOCK_DASHBOARD_PRONOSTICOS,
  MOCK_SALUD_INVENTARIO,
  MOCK_PRONOSTICO_VENTAS,
  MOCK_PRONOSTICO_DEMANDA,
  MOCK_PRONOSTICO_INGRESOS,
} from './mocks/biForecastingMock'
import { DEMO_CONFIG } from '@/config/demoAuth'
import { apiClient } from '@/services/api'

const toNumber = value => Number(value ?? 0)

const mapTrendState = value => {
  if (value > 0) return 'UP'
  if (value < 0) return 'DOWN'
  return 'STABLE'
}

const mapDemandTrend = trend => {
  if (trend === 'INCREASING') return 'up'
  if (trend === 'DECREASING') return 'down'
  return 'flat'
}

const mapRiskLevel = risk => {
  if (risk === 'HIGH') return 'ALTO'
  if (risk === 'MEDIUM') return 'MEDIO'
  return 'BAJO'
}

const mapInsightIcon = category => {
  if (category === 'SALES') return 'monitoring'
  if (category === 'INVENTORY') return 'inventory_2'
  if (category === 'REVENUE') return 'paid'
  return 'insights'
}

const normalizeDashboard = payload => {
  if (payload?.kpis && payload?.insights && payload?.recomendaciones) {
    return payload
  }

  const salesGrowth = toNumber(payload?.sales_forecast?.summary?.growth_rate)
  const revenueGrowth = toNumber(
    payload?.revenue_forecast?.summary?.growth_rate,
  )
  const riskCount = toNumber(
    payload?.inventory_forecast?.summary?.high_risk_products,
  )
  const demandTotal = (payload?.demand_forecast?.categories || []).reduce(
    (sum, category) => sum + toNumber(category?.forecast_units),
    0,
  )

  const insights = (payload?.key_insights || []).map((item, index) => {
    const impact = item?.impact === 'HIGH' ? 'Alto Impacto' : 'Impacto Medio'
    const numericValue = toNumber(item?.value)

    return {
      id: index + 1,
      tipo: item?.impact === 'HIGH' ? 'ALTO_IMPACTO' : 'MEDIO_IMPACTO',
      impacto: impact,
      variacion: `${numericValue >= 0 ? '+' : ''}${numericValue}%`,
      titulo: item?.title || 'Insight',
      descripcion: item?.description || 'Sin descripción disponible.',
      icono: mapInsightIcon(item?.category),
    }
  })

  const recomendaciones = (payload?.recommendations || []).map(
    (item, index) => ({
      id: index + 1,
      prioridad:
        item?.priority === 'HIGH'
          ? 'Alta'
          : item?.priority === 'MEDIUM'
            ? 'Media'
            : 'Baja',
      titulo: item?.title || 'Recomendación',
      accion: item?.action || 'Sin acción definida',
      impacto_potencial: item?.potential_impact || 'Sin impacto definido',
      color:
        item?.priority === 'HIGH'
          ? 'red'
          : item?.priority === 'MEDIUM'
            ? 'primary'
            : 'emerald',
    }),
  )

  return {
    kpis: {
      ventas_proyectadas: {
        valor:
          toNumber(payload?.sales_forecast?.summary?.total_forecast) ||
          toNumber(payload?.sales_forecast?.summary?.average_forecast),
        variacion: salesGrowth,
        estado: mapTrendState(salesGrowth),
      },
      ingresos_anuales: {
        valor:
          toNumber(payload?.revenue_forecast?.summary?.annual_projection) ||
          toNumber(payload?.revenue_forecast?.summary?.forecast_revenue),
        variacion: revenueGrowth,
        estado: mapTrendState(revenueGrowth),
      },
      riesgo_inventario: {
        valor: riskCount,
        variacion: 0,
        estado: mapTrendState(-riskCount),
      },
      demanda_total: {
        valor: demandTotal,
        variacion: 0,
        estado: 'UP',
      },
    },
    insights,
    recomendaciones,
  }
}

const normalizeInventory = payload => {
  if (payload?.kpis && payload?.productos) {
    return payload
  }

  const products = payload?.products || []
  const summary = payload?.summary || {}
  const alerts = payload?.alerts || []

  return {
    kpis: {
      stock_total: {
        valor: toNumber(summary?.total_current_stock),
        variacion: 0,
      },
      cobertura: {
        valor: toNumber(summary?.overall_coverage),
        variacion: 0,
      },
      productos_riesgo: {
        valor: toNumber(summary?.high_risk_products),
      },
    },
    notificaciones:
      alerts.length > 0
        ? alerts
            .map(alert => alert?.message)
            .filter(Boolean)
            .join(' | ')
        : 'Sin alertas críticas por el momento.',
    productos: products.map(item => ({
      id: item?.product_id || item?.sku || 'N/A',
      nombre: item?.product_name || 'Producto',
      stock: toNumber(item?.current_stock),
      venta_promedio: toNumber(item?.average_daily_sales),
      pronostico: toNumber(item?.projected_demand),
      dias_restantes: toNumber(item?.days_until_stockout),
      reorden:
        toNumber(item?.suggested_reorder) || toNumber(item?.reorder_point),
      riesgo: mapRiskLevel(item?.stockout_risk),
    })),
    paginacion: {
      total: toNumber(summary?.total_products) || products.length,
      mostrando: products.length,
    },
  }
}

const normalizeSales = payload => {
  if (payload?.kpis && payload?.historial && payload?.proyeccion) {
    return payload
  }

  const historicalData = payload?.historical_data || []
  const forecastData = payload?.forecast_data || []
  const confidence = payload?.confidence || {}
  const summary = payload?.summary || {}
  const seasonality = payload?.seasonality || {}

  const historial = historicalData.map((item, index) => {
    const previous = historicalData[index - 1]
    const currentValue = toNumber(item?.value)
    const previousValue = toNumber(previous?.value)
    const variation =
      previousValue > 0
        ? (((currentValue - previousValue) / previousValue) * 100).toFixed(1)
        : null

    return {
      periodo: item?.label || item?.date || `Periodo ${index + 1}`,
      valor: currentValue,
      variacion:
        variation === null
          ? '--'
          : `${Number(variation) > 0 ? '+' : ''}${variation}%`,
      positivo: variation === null ? null : Number(variation) >= 0,
    }
  })

  const proyeccion = forecastData.map((item, index) => ({
    periodo: item?.label || item?.date || `Pronóstico ${index + 1}`,
    valor: toNumber(item?.value),
    destacado: index === 0,
  }))

  const picos = (seasonality?.peak_periods || []).map(period => ({
    mes: String(period).slice(0, 3).toUpperCase(),
    descripcion: String(period),
  }))

  const valles = (seasonality?.low_periods || []).map(period => ({
    mes: String(period).slice(0, 3).toUpperCase(),
    descripcion: String(period),
  }))

  const factores = (seasonality?.seasonal_factors || []).map(item => ({
    mes: String(item?.label || item?.period || '')
      .slice(0, 3)
      .toUpperCase(),
    factor: toNumber(item?.factor),
    tipo:
      toNumber(item?.factor) >= 1.2
        ? 'alto'
        : toNumber(item?.factor) <= 0.9
          ? 'bajo'
          : 'normal',
  }))

  return {
    kpis: {
      crecimiento: {
        valor: toNumber(summary?.growth_rate),
        periodo_anterior: 0,
      },
      confianza: {
        valor: toNumber(summary?.confidence_level || confidence?.level),
      },
      mae: {
        valor: toNumber(confidence?.mae),
        porcentaje: -toNumber(confidence?.mape),
      },
      r_cuadrado: {
        valor: toNumber(confidence?.r2),
      },
    },
    historial,
    proyeccion,
    estacionalidad: {
      picos,
      valles,
      factores,
    },
  }
}

const normalizeDemand = payload => {
  if (payload?.kpis && payload?.categorias && payload?.productos_top) {
    return payload
  }

  const categories = payload?.categories || []
  const topProducts = payload?.top_products || []

  const highestCategory = [...categories].sort(
    (a, b) => toNumber(b?.growth_rate) - toNumber(a?.growth_rate),
  )[0]

  const topDemandProduct = [...topProducts].sort(
    (a, b) => toNumber(b?.forecast_units) - toNumber(a?.forecast_units),
  )[0]

  return {
    kpis: {
      categoria_crecimiento: {
        nombre: highestCategory?.category_name || 'N/A',
        variacion: toNumber(highestCategory?.growth_rate),
      },
      producto_demanda: {
        nombre: topDemandProduct?.product_name || 'N/A',
        unidades: toNumber(topDemandProduct?.forecast_units),
      },
    },
    categorias: categories.map(item => {
      const growth = toNumber(item?.growth_rate)
      return {
        nombre: item?.category_name || 'Categoría',
        historico: toNumber(item?.historical_units),
        proyectado: toNumber(item?.forecast_units),
        crecimiento: `${growth >= 0 ? '+' : ''}${growth}%`,
        tendencia: mapDemandTrend(item?.trend),
        confianza: toNumber(item?.confidence),
      }
    }),
    productos_top: topProducts.map(item => ({
      producto: item?.product_name || 'Producto',
      categoria: item?.category_name || 'Categoría',
      unidades: toNumber(item?.forecast_units),
      valor: 0,
      confianza: toNumber(item?.confidence) >= 85 ? 'Alta' : 'Media',
    })),
  }
}

const normalizeRevenue = payload => {
  if (payload?.escenarios && payload?.proyeccion_mensual) {
    return payload
  }

  const scenarioMap = (payload?.scenarios || []).reduce((acc, item) => {
    acc[item?.name] = item
    return acc
  }, {})

  const pessimistic = scenarioMap.PESSIMISTIC || {}
  const baseline = scenarioMap.BASELINE || {}
  const optimistic = scenarioMap.OPTIMISTIC || {}
  const byMonth = payload?.by_month || []
  const byCategory = payload?.by_category || []
  const summary = payload?.summary || {}

  const proyeccion_mensual = byMonth.map((item, index) => ({
    mes: item?.label || item?.month || `Mes ${index + 1}`,
    base: toNumber(item?.forecast || item?.actual),
    inf: toNumber(item?.lower_bound),
    sup: toNumber(item?.upper_bound),
    estado: toNumber(item?.forecast) > 0 ? 'Crecimiento' : '-',
    destacado: index === byMonth.length - 1,
  }))

  const palette = ['primary', 'indigo', 'slate']
  const categorias = byCategory.map((item, index) => {
    const growth = toNumber(item?.growth_rate)
    return {
      nombre: item?.category_name || 'Categoría',
      valor: toNumber(item?.forecast),
      porcentaje: `${toNumber(item?.percentage)}%`,
      crecimiento: `${growth >= 0 ? '+' : ''}${growth}%`,
      color: palette[index % palette.length],
    }
  })

  return {
    escenarios: {
      pesimista: {
        probabilidad: toNumber(pessimistic?.probability),
        valor: toNumber(pessimistic?.forecast_amount),
        variacion: `${toNumber(pessimistic?.growth_rate) >= 0 ? '+' : ''}${toNumber(pessimistic?.growth_rate)}%`,
        descripcion: pessimistic?.description || 'Escenario conservador.',
      },
      base: {
        probabilidad: toNumber(baseline?.probability),
        valor: toNumber(baseline?.forecast_amount),
        variacion: `${toNumber(baseline?.growth_rate) >= 0 ? '+' : ''}${toNumber(baseline?.growth_rate)}%`,
        descripcion: baseline?.description || 'Escenario esperado.',
      },
      optimista: {
        probabilidad: toNumber(optimistic?.probability),
        valor: toNumber(optimistic?.forecast_amount),
        variacion: `${toNumber(optimistic?.growth_rate) >= 0 ? '+' : ''}${toNumber(optimistic?.growth_rate)}%`,
        descripcion: optimistic?.description || 'Escenario favorable.',
      },
    },
    proyeccion_mensual,
    categorias,
    total: {
      valor:
        toNumber(summary?.forecast_revenue) ||
        toNumber(summary?.annual_projection),
      porcentaje: '100%',
      crecimiento: `${toNumber(summary?.growth_rate) >= 0 ? '+' : ''}${toNumber(summary?.growth_rate)}%`,
    },
  }
}

const get = async (endpoint, mockData, normalizer, params = {}) => {
  if (DEMO_CONFIG.enabled) return Promise.resolve(mockData)
  const response = await apiClient.makeRequest(endpoint, {
    method: 'GET',
    params,
  })

  const payload = response?.data ?? response
  const normalizedData = normalizer(payload)

  return {
    success: true,
    data: normalizedData,
  }
}

/**
 * Servicio para el sistema de Pronósticos BI.
 * Utiliza los mocks proporcionados en entorno de demostración.
 */
const biForecastingService = {
  /**
   * Obtiene los datos para el Dashboard principal de Pronósticos
   */
  getDashboard: () => {
    return get(
      '/forecast/dashboard',
      MOCK_DASHBOARD_PRONOSTICOS,
      normalizeDashboard,
    )
  },

  /**
   * Obtiene los datos para Salud de Inventario y Pronósticos
   */
  getSaludInventario: () => {
    return get('/forecast/inventory', MOCK_SALUD_INVENTARIO, normalizeInventory)
  },

  /**
   * Obtiene los datos para Pronóstico de Ventas
   */
  getPronosticoVentas: () => {
    return get('/forecast/sales', MOCK_PRONOSTICO_VENTAS, normalizeSales)
  },

  /**
   * Obtiene los datos para Pronóstico de Demanda
   */
  getPronosticoDemanda: () => {
    return get('/forecast/demand', MOCK_PRONOSTICO_DEMANDA, normalizeDemand)
  },

  /**
   * Obtiene los datos para Pronóstico de Ingresos y Escenarios
   */
  getPronosticoIngresos: () => {
    return get('/forecast/revenue', MOCK_PRONOSTICO_INGRESOS, normalizeRevenue)
  },
}

export default biForecastingService
