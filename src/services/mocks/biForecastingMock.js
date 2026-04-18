/**
 * Mocks para el sistema de Pronósticos (BI Forecasting)
 * Estructura alineada 100% con Forecast API v1.
 */

export const MOCK_DASHBOARD_PRONOSTICOS = {
  success: true,
  data: {
    generated_at: new Date().toISOString(),
    updated_text: "Actualizado hace pocos minutos",
    forecast_period: {
      start_date: "2026-04-01T00:00:00Z",
      end_date: "2026-06-30T00:00:00Z"
    },
    kpis: {
      ventas_proyectadas: { valor: 150000000, variacion: 5.2, estado: "UP", label: "vs. mes anterior" },
      ingresos_anuales: { valor: 600000000, variacion: 12.8, estado: "UP", label: "objetivo anual" },
      riesgo_inventario: { valor: 8, variacion: -2.1, estado: "DOWN", label: "stock crítico" },
      demanda_total: { valor: 1250, variacion: 8.4, estado: "UP", label: "proyectado" }
    },
    insights: [
      {
        id: 1,
        tipo: "ALTO_IMPACTO",
        impacto: "Alto Impacto",
        variacion: "+15.4%",
        titulo: "Crecimiento en Categoría Electrónica",
        descripcion: "Se observa una tendencia ascendente marcada en la demanda estacional de dispositivos móviles y accesorios para el Q2.",
        icono: "monitoring"
      },
      {
        id: 2,
        tipo: "MEDIO_IMPACTO",
        impacto: "Impacto Medio",
        variacion: "+4.2%",
        titulo: "Optimización de Margen Operativo",
        descripcion: "La reducción de costos logísticos proyectada por el nuevo proveedor nacional impactará positivamente en el margen neto.",
        icono: "account_balance_wallet"
      }
    ],
    recomendaciones: [
      {
        id: 1,
        prioridad: "Alta",
        titulo: "Reabastecimiento de Seguridad",
        accion: "Incrementar stock de SKU #2045 en 15%",
        impacto_potencial: "Evitar pérdida de ₲ 12M en ventas",
        color: "red"
      },
      {
        id: 2,
        prioridad: "Media",
        titulo: "Liquidación de Temporada",
        accion: "Promoción 2x1 en categoría Invierno",
        impacto_potencial: "Reducción 20% costo almacenamiento",
        color: "primary"
      }
    ]
  }
};

export const MOCK_SALUD_INVENTARIO = {
  success: true,
  data: {
    generated_at: new Date().toISOString(),
    updated_text: "Actualizado hace 5 minutos",
    forecast_period: {
      start_date: "2026-04-17T00:00:00Z",
      end_date: "2026-05-17T00:00:00Z"
    },
    ui_labels: {
      title: "Salud del Inventario y Pronóstico",
      export_button: "Exportar Reporte",
      alerts_title: "Notificaciones Urgentes",
      details_button: "Ver Detalles",
      unit_label: "Unidades",
      unit_short: "Unid.",
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
      stock_total: { valor: 45200, variacion: -2, label: "vs mes anterior" },
      cobertura: { valor: 85, variacion: 5, label: "de eficiencia" },
      productos_riesgo: { valor: 8, label: "Crítico: Quiebre inminente" }
    },
    notificaciones: "8 productos alcanzarán quiebre de stock en los próximos 7 días (Aceite Vegetal, Harina, Leche...).",
    productos: [
      { id: "SKU-001", nombre: "Aceite Vegetal 1L", current_stock: 120, average_daily_sales: 15, projected_demand: 450, days_until_stockout: 3, reorder_point: 200, stockout_risk: "HIGH" },
      { id: "SKU-102", nombre: "Harina de Trigo", current_stock: 45, average_daily_sales: 80, projected_demand: 2400, days_until_stockout: 0, reorder_point: 150, stockout_risk: "HIGH" },
      { id: "SKU-088", nombre: "Leche Entera", current_stock: 320, average_daily_sales: 55, projected_demand: 1650, days_until_stockout: 6, reorder_point: 100, stockout_risk: "MEDIUM" }
    ],
    summary: {
      total_products: 128,
      high_risk_products: 8,
      total_current_stock: 45200,
      overall_coverage: 85.0
    }
  }
};

export const MOCK_PRONOSTICO_VENTAS = {
  success: true,
  data: {
    method: "EXPONENTIAL",
    granularity: "MONTHLY",
    generated_at: "2026-04-17T10:30:00Z",
    forecast_period: {
      start_date: "2026-05-01T00:00:00Z",
      end_date: "2026-07-31T00:00:00Z"
    },
    ui_labels: {
      title: "Detalle de Pronóstico de Ventas",
      model_badge: "Estacional",
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
    summary: {
      growth_rate: 12.4,
      previous_growth_rate: 2.1,
      confidence_level: 85.5
    },
    confidence: {
      level: 85.5,
      mae: 5200000,
      mape: 1.5,
      r2: 0.92
    },
    historical_data: [
      { label: "Dic 2025", value: 145200000 },
      { label: "Nov 2025", value: 133800000 }
    ],
    forecast_data: [
      { label: "May 2026", value: 152000000 },
      { label: "Jun 2026", value: 148500000 }
    ],
    seasonality: {
      peak_periods: ["Diciembre", "Marzo"],
      low_periods: ["Febrero", "Agosto"],
      seasonal_factors: [
        { label: "ENE", factor: 1.12 },
        { label: "FEB", factor: 0.85 }
      ]
    }
  }
};

export const MOCK_PRONOSTICO_DEMANDA = {
  success: true,
  data: {
    generated_at: "2026-04-17T10:30:00Z",
    forecast_period: {
      start_date: "2026-05-01T00:00:00Z",
      end_date: "2026-07-31T00:00:00Z"
    },
    ui_labels: {
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
    categories: [
      { category_id: "cat1", category_name: "Electrónica", historical_units: 5000, forecast_units: 5750, growth_rate: 15.0, trend: "INCREASING", confidence: 88.5 }
    ],
    top_products: [
      { product_id: "prod1", product_name: "Laptop Pro", category_name: "Electrónica", historical_units: 500, forecast_units: 575, forecast_value: 13500000, confidence: 85.0 }
    ]
  }
};

export const MOCK_PRONOSTICO_INGRESOS = {
  success: true,
  data: {
    generated_at: "2026-04-17T10:30:00Z",
    forecast_period: {
      start_date: "2026-05-01T00:00:00Z",
      end_date: "2026-10-31T00:00:00Z"
    },
    ui_labels: {
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
    scenarios: [
      { name: "PESSIMISTIC", label: "Escenario Pesimista", probability: 20, forecast_amount: 1620000000, growth_rate: 15.7, description: "Impacto por volatilidad de precios internacionales y reducción inesperada en la demanda local." },
      { name: "BASELINE", label: "Escenario Base", probability: 60, forecast_amount: 1850000000, growth_rate: 32.1, description: "Crecimiento sostenido basado en el rendimiento histórico y estabilidad de la cartera de clientes actual.", is_recommended: true },
      { name: "OPTIMISTIC", label: "Escenario Optimista", probability: 20, forecast_amount: 2100000000, growth_rate: 50.0, description: "Potencial incremento por apertura exitosa de nuevos mercados regionales y optimización operativa." }
    ],
    by_month: [
      { month: "2026-05-01T00:00:00Z", label: "Mayo", forecast: 145000000, lower_bound: 130000000, upper_bound: 160000000 }
    ],
    by_category: [
      { category_name: "Servicios", forecast: 925000000, percentage: 50, growth_rate: 12.5 }
    ]
  }
};
