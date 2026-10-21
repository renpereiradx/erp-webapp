/**
 * Namespace `forecast` (F11 — Pronósticos).
 *
 * Todas las claves usadas por `features/forecast`, `pages/forecast` y
 * `domain/forecast` viven acá, con paridad es/en verificada por
 * `forecast.locale.test.ts`. Los textos explican las convenciones REALES del
 * backend: confianza = R²×100 topado en 95, bandas ±15 % (o ±2σ absolutos en
 * media móvil), SEASONAL exige ≥ 12 puntos, escenarios base ±15 % con pesos
 * 20/60/20, cobertura en días y centinela 999 = sin velocidad de venta.
 *
 * Los códigos de método/tendencia/riesgo/insight que no estén en el
 * vocabulario se muestran crudos (fallback de `t()`), nunca con un nombre
 * inventado.
 */
export const forecast = {
  forecast: {
    common: {
      refresh: 'Actualizar',
      errorTitle: 'No se pudieron cargar los pronósticos',
      scrollHint: 'Deslizá la tabla para ver todas las columnas.',
      period: 'Período',
      type: 'Tipo',
      value: 'Valor',
      lower: 'Límite inferior',
      upper: 'Límite superior',
      history: 'Histórico',
      projection: 'Proyección',
      generatedAt: 'Generado: {date}',
      months: '{count} meses',
      days: '{count} días',
      pageScope: 'Página {page} de {totalPages} · {total} registros',
    },
    method: {
      linear: 'Regresión lineal',
      movingAvg: 'Media móvil',
      exponential: 'Suavizado exponencial',
      seasonal: 'Descomposición estacional',
    },
    methodShort: {
      linear: 'Lineal',
      movingAvg: 'Media móvil',
      exponential: 'Exponencial',
    },
    granularity: {
      daily: 'Diaria',
      weekly: 'Semanal',
      monthly: 'Mensual',
    },
    trend: {
      increasing: 'En alza',
      decreasing: 'En baja',
      stable: 'Estable',
    },
    risk: {
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo',
      none: 'Sin riesgo',
    },
    impact: {
      high: 'Alto',
      medium: 'Medio',
      low: 'Bajo',
    },
    priority: {
      high: 'Alta',
      medium: 'Media',
      low: 'Baja',
    },
    scenario: {
      pessimistic: 'Pesimista',
      baseline: 'Base',
      optimistic: 'Optimista',
    },
    dashboard: {
      title: 'Pronósticos',
      subtitle:
        'Proyecciones estadísticas del backend sobre las ventas históricas. El método usado se muestra en cada pantalla.',
      horizonLabel: 'Horizonte de proyección',
      kpisTitle: 'Indicadores del horizonte',
      kpisDescription:
        'Cifras calculadas por el backend para el horizonte seleccionado.',
      kpi: {
        salesForecast: 'Ventas proyectadas',
        annualRevenue: 'Ingresos anuales',
        riskProducts: 'Productos en riesgo',
        demandUnits: 'Demanda proyectada',
        coverage: 'Cobertura de inventario',
      },
      kpiHints: {
        salesForecast: 'Total del horizonte',
        annualRevenue: 'Extrapolación anual del backend',
        riskProducts: 'Riesgo alto de quiebre',
        demandUnits: 'Suma de las categorías',
        coverage: 'Días de demanda cubiertos',
      },
      insightsTitle: 'Hallazgos del modelo',
      insightsDescription:
        'Los genera el backend a partir de los pronósticos; cada uno enlaza a su pantalla.',
      insightsEmpty: 'El backend no generó hallazgos',
      insightsEmptyHint:
        'Se calculan sobre los pronósticos del período; sin datos suficientes no hay hallazgo.',
      insights: {
        salesTrend: {
          title: 'Tendencia de ventas',
          description: 'Promedio proyectado vs. histórico: {value}.',
        },
        seasonality: {
          title: 'Patrón estacional detectado',
          description: 'Meses pico detectados: {value}.',
        },
        inventoryRisk: {
          title: 'Productos en riesgo de agotamiento',
          description: '{value} productos con riesgo alto de quedarse sin stock.',
        },
        inventoryCoverage: {
          title: 'Cobertura de inventario',
          description:
            'El inventario cubre {value} días de demanda proyectada.',
        },
        revenueProjection: {
          title: 'Proyección de ingresos anual',
          description: 'Se proyectan {value} de ingresos anuales.',
        },
      },
      recommendationsTitle: 'Recomendaciones',
      recommendationsDescription:
        'Se derivan de las mismas condiciones y umbrales del backend: cobertura menor a 14 días, productos en riesgo, tendencia decreciente, estacionalidad y confianza de ingresos menor a 70.',
      recommendationsEmpty: 'Sin recomendaciones',
      recommendationsEmptyHint:
        'Las condiciones del backend (cobertura, riesgo, tendencia y confianza) no disparan ninguna acción.',
      recommendations: {
        inventoryHighRisk: {
          title: 'Reabastecer productos en riesgo',
          description: 'Hay {count} productos con riesgo alto de agotamiento.',
        },
        inventoryCoverage: {
          title: 'Aumentar niveles de inventario',
          description:
            'La cobertura es de {days} días; el umbral del backend es {threshold}.',
        },
        salesDecline: {
          title: 'Revertir tendencia de ventas',
          description:
            'Las ventas muestran una tendencia decreciente de {growth}.',
        },
        salesSeasonality: {
          title: 'Prepararse para temporada alta',
          description: 'Picos de ventas detectados en: {peaks}.',
        },
        revenueLowConfidence: {
          title: 'Mejorar precisión de pronósticos',
          description:
            'La confianza de ingresos es {confidence}, por debajo de {threshold}.',
        },
      },
      openScreen: 'Ver pantalla',
      groupsTitle: 'Pantallas del grupo',
      groupsDescription:
        'Cada acceso abre la pantalla con su propio horizonte e historial.',
      groups: {
        sales: {
          title: 'Pronóstico de ventas',
          hint: 'Variación vs. histórico',
        },
        revenue: {
          title: 'Pronóstico de ingresos',
          hint: 'Proyección anual',
        },
        inventory: {
          title: 'Salud de inventario',
          hint: 'Productos en riesgo alto',
        },
        demand: {
          title: 'Pronóstico de demanda',
          hint: 'Categorías analizadas',
        },
        salesMetric: 'Ventas proyectadas',
        revenueMetric: 'Ingresos proyectados',
        inventoryMetric: 'Cobertura (días)',
        demandMetric: 'Unidades proyectadas',
      },
      composeNote:
        'El dashboard compone ventas con 6 meses de historia, ingresos con 12, inventario con meses × 30 días y demanda con 6. Una pantalla con otro historial puede mostrar cifras distintas.',
    },
    sales: {
      title: 'Pronóstico de ventas',
      subtitle:
        'Proyección sobre las ventas mensuales históricas. Las métricas de ajuste son las que calcula el backend.',
      historyLabel: 'Historial',
      granularityLabel: 'Granularidad',
      methodLabel: 'Método',
      horizonLabel: 'Horizonte',
      historyRange: 'Historial: {range}',
      historyPoints: 'Puntos de historial: {count}',
      kpisTitle: 'Indicadores del pronóstico',
      kpisDescription:
        'Sumas y promedios del historial y del horizonte, tal como los devuelve el backend.',
      kpi: {
        historicalTotal: 'Ventas históricas',
        projectedTotal: 'Ventas proyectadas',
        projectedAverage: 'Promedio mensual proyectado',
        growth: 'Variación proyectada',
        confidence: 'Confianza del modelo',
      },
      kpiHints: {
        historicalTotal: 'Suma del historial',
        projectedTotal: 'Suma del horizonte',
        projectedAverage: 'Por mes proyectado',
        growth: 'Promedio proyectado vs. histórico',
        confidence: 'Nivel 0-95 del backend',
      },
      modelTitle: 'Modelo y ajuste',
      modelDescription:
        'Métricas de bondad de ajuste calculadas por el backend sobre el historial. Un R² cercano a 0 indica que el modelo explica poco de la variación.',
      metric: {
        confidence: 'Confianza',
        r2: 'R²',
        mae: 'MAE',
        mape: 'MAPE',
        rmse: 'RMSE',
      },
      metricHints: {
        confidence: 'R² × 100 topado en 95 (o 75/80 − CV × 100)',
        r2: 'Proporción de la variación explicada',
        mae: 'Error absoluto medio',
        mape: 'Error porcentual absoluto medio',
        rmse: 'Raíz del error cuadrático medio',
      },
      bandMultiplier:
        'Banda del modelo: ±15 % sobre cada punto proyectado (multiplicadores {lower} y {upper}).',
      bandAbsolute:
        'Banda del modelo: media ± 2σ absolutos ({lower} a {upper}).',
      historyTitle: 'Historial',
      historyDescription:
        'Buckets mensuales de ventas reales del período de historia.',
      projectionTitle: 'Proyección',
      projectionDescription:
        'Puntos proyectados por el modelo con su banda. Cada punto avanza un mes calendario desde el último período histórico.',
      seasonalityTitle: 'Estacionalidad',
      seasonalityDescription:
        'Factores por mes calendario detectados por el backend (mínimo 12 puntos de historia).',
      peaks: 'Meses pico',
      lows: 'Meses bajos',
      factor: 'Factor',
      modelNote:
        'La etiqueta de cada bucket se re-deriva de su fecha; el backend la emite en inglés.',
      emptyTitle: 'Sin historial suficiente',
      emptyHint:
        'El endpoint necesita al menos 2 puntos de historia para proyectar. Ampliá el historial o cargá ventas del período.',
      noSeasonality:
        'El backend no detectó un patrón estacional con la historia actual.',
    },
    inventory: {
      title: 'Salud de inventario',
      subtitle:
        'Velocidad de venta de los últimos 90 días proyectada sobre el horizonte. El riesgo y la reposición los calcula el backend.',
      horizonLabel: 'Horizonte',
      kpisTitle: 'Indicadores del inventario',
      kpisDescription:
        'Cobertura y conteos sobre el set completo analizado por el backend (máximo 100 productos).',
      kpi: {
        coverage: 'Cobertura',
        currentStock: 'Stock actual',
        projectedDemand: 'Demanda proyectada',
        highRisk: 'Riesgo alto',
        mediumRisk: 'Riesgo medio',
        totalProducts: 'Productos analizados',
      },
      kpiHints: {
        coverage: 'Días de demanda cubiertos',
        currentStock: 'Unidades en stock',
        projectedDemand: 'Unidades del horizonte',
        highRisk: 'Quiebre en 3 días o menos',
        mediumRisk: 'Quiebre en 7 días o menos',
        totalProducts: 'Set completo (máx. 100)',
      },
      riskTitle: 'Distribución de riesgo',
      riskDescription:
        'Conteos del set completo. Cada producto cae en un solo estado según sus días hasta el quiebre.',
      alertsTitle: 'Alertas de quiebre',
      alertsDescription:
        'Las genera el backend para riesgo alto (quiebre inminente) y medio (stock bajo). Se muestran las primeras; el total real va en el resumen.',
      alerts: {
        empty: 'Sin alertas de quiebre',
        emptyHint:
          'Ningún producto del set analizado está en riesgo alto o medio.',
        summary: 'Alertas: {total} · Altas: {high} · Medias: {medium}',
        daysLabel: 'Días para actuar: {days}',
        more: '+{count} alertas más',
        type: {
          stockoutImminent: 'Quiebre inminente',
          lowStock: 'Stock bajo',
        },
      },
      tableTitle: 'Productos',
      tableDescription:
        'La velocidad diaria se calcula sobre los días con ventas de los últimos 90 días, no sobre los 90.',
      columns: {
        product: 'Producto',
        stock: 'Stock',
        dailySales: 'Venta diaria',
        projectedDemand: 'Demanda proyectada',
        daysToStockout: 'Días restantes',
        reorderPoint: 'Punto de reorden',
        suggestedReorder: 'Reposición sugerida',
        risk: 'Riesgo',
        trend: 'Tendencia',
      },
      notesTitle: 'Cómo leer estas cifras',
      noVelocity: 'Sin ventas en 90 días',
      reorderBefore: 'Reponer antes del {date}',
      notes: {
        dailySales:
          'La venta diaria es el total vendido en 90 días dividido por los días con ventas.',
        sentinel:
          '999 significa "sin velocidad de venta": se muestra como "Sin ventas en 90 días", no como 999 días.',
        reorder:
          'Reposición sugerida = demanda proyectada + stock de seguridad − stock actual.',
        riskThresholds:
          'Riesgo por días hasta el quiebre: alto ≤ 3, medio ≤ 7, bajo ≤ 14.',
      },
      emptyTitle: 'Sin productos para analizar',
      emptyHint:
        'El endpoint no devolvió productos activos con el horizonte pedido.',
      pageScopeNote:
        'La cobertura y los conteos usan el set completo; la tabla muestra solo la página actual.',
    },
    demand: {
      title: 'Pronóstico de demanda',
      subtitle:
        'Unidades históricas por categoría y producto, proyectadas con el crecimiento de los últimos 30 días contra los 30 anteriores.',
      horizonLabel: 'Horizonte',
      kpisTitle: 'Indicadores de demanda',
      kpisDescription:
        'Sumas de las categorías y extremos reales del top de productos.',
      kpi: {
        categories: 'Categorías',
        historicalUnits: 'Unidades históricas',
        forecastUnits: 'Unidades proyectadas',
        topCategoryGrowth: 'Mayor crecimiento',
        topProductUnits: 'Producto top (unidades)',
        confidence: 'Confianza del modelo',
      },
      kpiHints: {
        categories: 'Con ventas en el historial',
        historicalUnits: 'Suma de categorías',
        forecastUnits: 'Suma de categorías',
        topCategoryGrowth: 'Categoría: {name}',
        topProductUnits: 'Producto: {name}',
        confidence: 'Constante del modelo',
      },
      categoriesTitle: 'Demanda por categoría',
      categoriesDescription:
        'Crecimiento = últimos 30 días vs. 30 anteriores; sin base previa el backend devuelve 0.',
      productsTitle: 'Top de productos',
      productsDescription:
        'Ordenado por unidades históricas; la página la define el backend.',
      columns: {
        category: 'Categoría',
        product: 'Producto',
        categoryColumn: 'Categoría',
        historical: 'Histórico',
        forecast: 'Proyectado',
        growth: 'Crecimiento',
        trend: 'Tendencia',
      },
      confidenceNote:
        'La confianza por fila es una constante del modelo (75 en categorías, 70 en productos): se muestra una sola vez.',
      notesTitle: 'Cómo leer estas cifras',
      formulaNote:
        'Proyección = promedio mensual histórico × meses del horizonte × (1 + crecimiento).',
      pageScopeNote:
        'Los totales de la tabla de productos corresponden a la página; las categorías vienen completas.',
      emptyTitle: 'Sin demanda para proyectar',
      emptyHint:
        'El período de historia no tiene ventas que permitan calcular la demanda.',
    },
    revenue: {
      title: 'Pronóstico de ingresos',
      subtitle:
        'Regresión lineal sobre los ingresos mensuales. Los escenarios y la proyección anual los calcula el backend.',
      horizonLabel: 'Horizonte',
      kpisTitle: 'Indicadores de ingresos',
      kpisDescription:
        'Sumas del historial y del horizonte, más la extrapolación anual del backend.',
      kpi: {
        historicalRevenue: 'Ingresos históricos',
        forecastRevenue: 'Ingresos proyectados',
        annualProjection: 'Proyección anual',
        growth: 'Variación proyectada',
        confidence: 'Confianza del modelo',
      },
      kpiHints: {
        historicalRevenue: 'Suma del historial (12 meses)',
        forecastRevenue: 'Suma del horizonte',
        annualProjection: 'Ingresos proyectados × 12 / meses',
        growth: 'Promedio proyectado vs. histórico',
        confidence: 'Nivel 0-95 del backend',
      },
      scenariosTitle: 'Escenarios',
      scenariosDescription:
        'Modelo del backend: base ±15 % con pesos 20/60/20. No es una probabilidad estadística.',
      scenariosEmpty: 'El backend no devolvió escenarios',
      scenariosEmptyHint:
        'El endpoint los genera solo con include_scenarios=true.',
      scenario: {
        amount: 'Ingreso proyectado',
        weight: 'Peso del escenario',
        growth: 'Crecimiento estimado',
        baselineTag: 'Base',
      },
      monthlyTitle: 'Proyección mensual',
      monthlyDescription:
        'Histórico + meses proyectados con su banda absoluta. La proyección avanza mes a mes desde el último período histórico.',
      categoriesTitle: 'Ingresos por categoría',
      categoriesDescription:
        'Participación sobre el histórico del período. El backend aplica el crecimiento general a todas las categorías, así que no se muestra una proyección por categoría.',
      columns: {
        category: 'Categoría',
        share: 'Participación',
      },
      notesTitle: 'Cómo leer estas cifras',
      notes: {
        annualProjection:
          'La proyección anual extrapola el horizonte a 12 meses.',
        linearMethod:
          'El backend proyecta con regresión lineal; la confianza es R² × 100 topado en 95.',
        categoriesTotal:
          'La participación se calcula sobre el total histórico de las categorías listadas.',
        scenarios:
          'Escenarios definidos por el backend: pesimista/base/optimista = base −15 % / base / base +15 %.',
      },
      emptyTitle: 'Sin ingresos para proyectar',
      emptyHint:
        'El historial de 12 meses no tiene ventas suficientes para ajustar el modelo.',
    },
  },
}
