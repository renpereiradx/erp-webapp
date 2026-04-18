import {
  MOCK_DASHBOARD_PRONOSTICOS,
  MOCK_SALUD_INVENTARIO,
  MOCK_PRONOSTICO_VENTAS,
  MOCK_PRONOSTICO_DEMANDA,
  MOCK_PRONOSTICO_INGRESOS,
} from './mocks/biForecastingMock'
import { DEMO_CONFIG } from '@/config/demoAuth'
import { apiClient } from '@/services/api'

const toNumber = value => {
  const num = Number(value ?? 0);
  // Redondear a máximo 2 decimales para evitar problemas de precisión flotante (ej. 71.283...)
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

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

const formatPeriod = (period) => {
  if (!period?.start_date || !period?.end_date) return null;
  const start = new Date(period.start_date);
  const end = new Date(period.end_date);
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  const startLabel = `${months[start.getMonth()]} ${start.getFullYear()}`;
  const endLabel = `${months[end.getMonth()]} ${end.getFullYear()}`;
  
  return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`;
}

const normalizeDashboard = (payload, params) => {
  if (payload?.kpis && payload?.insights && payload?.recomendaciones) {
    return {
      ...payload,
      generated_at: payload.generated_at || new Date().toISOString(),
      updated_text: payload.updated_text || "Actualizado hoy",
      periodo_proyectado: formatPeriod(payload.forecast_period)
    }
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
    generated_at: payload?.generated_at || new Date().toISOString(),
    updated_text: payload?.updated_text || "Actualizado hoy",
    kpis: {
      ventas_proyectadas: {
        valor:
          toNumber(payload?.sales_forecast?.summary?.total_forecast) ||
          toNumber(payload?.sales_forecast?.summary?.average_forecast),
        variacion: salesGrowth,
        estado: mapTrendState(salesGrowth),
        label: payload?.sales_forecast?.summary?.label || "vs. mes anterior",
      },
      ingresos_anuales: {
        valor:
          toNumber(payload?.revenue_forecast?.summary?.annual_projection) ||
          toNumber(payload?.revenue_forecast?.summary?.forecast_revenue),
        variacion: revenueGrowth,
        estado: mapTrendState(revenueGrowth),
        label: payload?.revenue_forecast?.summary?.label || "objetivo anual",
      },
      riesgo_inventario: {
        valor: riskCount,
        variacion: 0,
        estado: mapTrendState(-riskCount),
        label: payload?.inventory_forecast?.summary?.label || "stock crítico",
      },
      demanda_total: {
        valor: demandTotal,
        variacion: 0,
        estado: 'UP',
        label: payload?.demand_forecast?.summary?.label || "proyectado",
      },
    },
    insights,
    recomendaciones,
  }
}

const normalizeInventory = (payload, params) => {
  if (payload?.kpis && payload?.productos && payload?.ui_labels) {
    return {
      ...payload,
      updated_text: payload.updated_text || "Actualizado recientemente",
      periodo_proyectado: formatPeriod(payload.forecast_period)
    }
  }

  const products = payload?.products || []
  const summary = payload?.summary || {}
  const alerts = payload?.alerts || []

  return {
    updated_text: payload?.updated_text || "Actualizado recientemente",
    periodo_proyectado: formatPeriod(payload.forecast_period),
    ui_labels: payload?.ui_labels || {
      title: "Salud del Inventario y Pronóstico",
      export_button: "Exportar Reporte",
      alerts_title: "Notificaciones Urgentes",
      details_button: "Ver Detalles",
      unit_label: "Unidades",
      global_label: "Global",
      items_label: "Items",
      table_headers: {
        producto: "Producto",
        stock_actual: "Stock Actual",
        venta_diaria: "Venta Diaria Prom.",
        pronostico: "Pronóstico Demanda",
        dias_restantes: "Días Restantes",
        pto_reorden: "Pto. Reorden",
        nivel_riesgo: "Nivel de Riesgo"
      }
    },
    kpis: {
      stock_total: {
        valor: toNumber(summary?.total_current_stock),
        variacion: toNumber(summary?.stock_variation),
        label: summary?.stock_label || "vs mes anterior"
      },
      cobertura: {
        valor: toNumber(summary?.overall_coverage),
        variacion: toNumber(summary?.coverage_efficiency),
        label: summary?.coverage_label || "de eficiencia"
      },
      productos_riesgo: {
        valor: toNumber(summary?.high_risk_products),
        label: summary?.risk_label || "Crítico: Quiebre inminente"
      },
    },
    notificaciones:
      alerts.length > 0
        ? [...new Set(alerts.map(alert => alert?.message))] // Eliminar mensajes duplicados
            .filter(Boolean)
            .slice(0, 3) // Mostrar solo las primeras 3 alertas únicas
            .join(' | ') + (alerts.length > 3 ? ' ... y otras alertas críticas.' : '.')
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

const normalizeSales = (payload, params) => {
  if (payload?.kpis && payload?.historial && payload?.proyeccion) {
    return {
      ...payload,
      periodo_proyectado: formatPeriod(payload.forecast_period)
    }
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
    ui_labels: payload?.ui_labels || {
      title: "Detalle de Pronóstico de Ventas",
      model_badge: payload?.method === 'SEASONAL' ? 'Estacional' : 'Proyectado',
      export_button: "Exportar Reporte",
      recalculate_button: "Recalcular",
      history_title: "Historial Reciente (6 meses)",
      history_badge: "Datos Reales",
      forecast_title: "Proyección (3 meses)",
      forecast_badge: "IA Model",
      seasonality_title: "Análisis de Estacionalidad",
      peaks_label: "Picos de Demanda",
      valleys_label: "Valles de Demanda",
      factors_label: "Factores Estacionales por Mes",
      footer_note: "* Las proyecciones consideran festividades nacionales y tendencias de consumo histórico.",
      table_headers: {
        periodo: "Periodo",
        venta_real: "Venta Real (₲)",
        variacion: "Variación",
        venta_proyectada: "Venta Proyectada (₲)"
      }
    },
    periodo_proyectado: formatPeriod(payload.forecast_period),
    model_info: payload?.model_info || {
      granularidad: payload?.granularity || "MENSUAL",
      modelo: payload?.method || "Exponential Smoothing",
      confianza_label: `Intervalo de confianza ${payload?.confidence?.level || 95}%`
    },
    kpis: {
      crecimiento: {
        valor: toNumber(summary?.growth_rate),
        periodo_anterior: toNumber(summary?.previous_growth_rate),
        label: summary?.growth_label || "Vs. periodo anterior"
      },
      confianza: {
        valor: toNumber(summary?.confidence_level || confidence?.level),
      },
      mae: {
        valor: toNumber(confidence?.mae),
        porcentaje: -toNumber(confidence?.mape),
        label: confidence?.label || "Promedio mensual de error"
      },
      r_cuadrado: {
        valor: toNumber(confidence?.r2),
        label: confidence?.r2_label || "Bondad de ajuste del modelo"
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

const normalizeDemand = (payload, params) => {
  // Intentar deducir el periodo si no viene explícito
  const periodo = formatPeriod(payload?.forecast_period) || payload?.periodo_proyectado || payload?.metadata?.period;

  if (payload?.kpis && (payload?.categorias || payload?.categories) && (payload?.productos_top || payload?.top_products)) {
    return {
      ...payload,
      periodo_proyectado: periodo
    }
  }

  const categories = payload?.categories || payload?.categorias || []
  const topProducts = payload?.top_products || payload?.productos_top || []

  const highestCategory = [...categories].sort(
    (a, b) => toNumber(b?.growth_rate) - toNumber(a?.growth_rate),
  )[0]

  const topDemandProduct = [...topProducts].sort(
    (a, b) => toNumber(b?.forecast_units) - toNumber(a?.forecast_units),
  )[0]

  return {
    periodo_proyectado: periodo,
    ui_labels: payload?.ui_labels || {
      title: "Pronóstico de Demanda de Unidades",
      period_label: "Periodo proyectado:",
      export_button: "Exportar Análisis Completo",
      metrics: {
        top_category: "Categoría de Mayor Crecimiento",
        top_product: "Producto con Mayor Demanda Estimada"
      },
      tables: {
        categories_title: "Desglose de Demanda por Categoría",
        products_title: "Top Productos Proyectados",
        view_all_button: "Ver todos los productos"
      },
      units_label: "unidades",
      table_headers: {
        categoria: "Categoría",
        unidades_historicas: "Unidades Históricas",
        unidades_proyectadas: "Unidades Proyectadas",
        crecimiento: "Crecimiento (%)",
        tendencia: "Tendencia",
        confianza: "Confianza (%)",
        producto: "Producto",
        valor_estimado: "Valor Estimado (₲)",
        nivel_confianza: "Nivel de Confianza"
      }
    },
    kpis: {
      categoria_crecimiento: {
        nombre: highestCategory?.category_name || 'N/A',
        variacion: toNumber(highestCategory?.growth_rate),
        label: payload?.growth_category_label || "vs. periodo anterior"
      },
      producto_demanda: {
        nombre: topDemandProduct?.product_name || 'N/A',
        unidades: toNumber(topDemandProduct?.forecast_units),
        label: payload?.demand_product_label || "Proyección trimestral"
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
      valor: toNumber(item?.forecast_value || item?.valor),
      confianza: toNumber(item?.confidence) >= 85 ? 'Alta' : 'Media',
    })),
  }
}

const normalizeRevenue = (payload, params) => {
  if (payload?.escenarios && payload?.proyeccion_mensual) {
    return {
      ...payload,
      periodo_rango: formatPeriod(payload.forecast_period)
    }
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
    periodo_rango: formatPeriod(payload.forecast_period) || payload?.periodo_rango || "Periodo no definido",
    ui_labels: payload?.ui_labels || {
      title: "Pronóstico de Ingresos y Escenarios Financieros",
      export_button: "Exportar Informe",
      scenarios_title: "Escenarios Proyectados",
      monthly_table_title: "Proyección Mensual Detallada",
      categories_table_title: "Desglose por Categoría",
      total_label: "Total Consolidado",
      recommended_badge: "Recomendado",
      probability_label: "Prob.",
      table_headers: {
        mes: "Mes",
        base: "Pronóstico Base (₲)",
        inf: "Límite Inferior (₲)",
        sup: "Límite Superior (₲)",
        estado: "Estado",
        categoria: "Categoría",
        valor: "Ingreso Proyectado (₲)",
        porcentaje: "% del Total",
        crecimiento: "Crecimiento (%)"
      }
    },
    escenarios: {
      pesimista: {
        nombre: pessimistic?.label || "Escenario Pesimista",
        probabilidad: toNumber(pessimistic?.probability),
        valor: toNumber(pessimistic?.forecast_amount),
        variacion: `${toNumber(pessimistic?.growth_rate) >= 0 ? '+' : ''}${toNumber(pessimistic?.growth_rate)}%`,
        descripcion: pessimistic?.description || 'Escenario conservador.',
      },
      base: {
        nombre: baseline?.label || "Escenario Base",
        probabilidad: toNumber(baseline?.probability),
        valor: toNumber(baseline?.forecast_amount),
        variacion: `${toNumber(baseline?.growth_rate) >= 0 ? '+' : ''}${toNumber(baseline?.growth_rate)}%`,
        descripcion: baseline?.description || 'Escenario esperado.',
        recomendado: !!baseline?.is_recommended || true,
      },
      optimista: {
        nombre: optimistic?.label || "Escenario Optimista",
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
  if (DEMO_CONFIG.enabled) {
    const payload = mockData?.data ?? mockData
    return Promise.resolve({
      success: true,
      data: normalizer(payload, params),
    })
  }

  const response = await apiClient.makeRequest(endpoint, {
    method: 'GET',
    params,
  })

  const payload = response?.data ?? response
  const normalizedData = normalizer(payload, params)

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
  getDashboard: (params = {}) => {
    return get(
      '/forecast/dashboard',
      MOCK_DASHBOARD_PRONOSTICOS,
      normalizeDashboard,
      params
    )
  },

  /**
   * Obtiene los datos para Salud de Inventario y Pronósticos
   */
  getSaludInventario: (params = {}) => {
    return get('/forecast/inventory', MOCK_SALUD_INVENTARIO, normalizeInventory, params)
  },

  /**
   * Obtiene los datos para Pronóstico de Ventas
   */
  getPronosticoVentas: (params = {}) => {
    return get('/forecast/sales', MOCK_PRONOSTICO_VENTAS, normalizeSales, params)
  },

  /**
   * Obtiene los datos para Pronóstico de Demanda
   */
  getPronosticoDemanda: (params = {}) => {
    return get('/forecast/demand', MOCK_PRONOSTICO_DEMANDA, normalizeDemand, params)
  },

  /**
   * Obtiene los datos para Pronóstico de Ingresos y Escenarios
   */
  getPronosticoIngresos: (params = {}) => {
    return get('/forecast/revenue', MOCK_PRONOSTICO_INGRESOS, normalizeRevenue, params)
  },
}

export default biForecastingService
