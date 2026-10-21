/**
 * Namespace `forecast` (F11 — Forecasting), English.
 *
 * Key-for-key parity with `es/forecast.ts` is enforced by
 * `forecast.locale.test.ts`. The copy explains the REAL backend conventions:
 * confidence = R²×100 capped at 95, ±15 % bands (or absolute ±2σ for moving
 * average), SEASONAL needs ≥ 12 points, base ±15 % scenarios weighted
 * 20/60/20, coverage in days and the 999 sentinel = no sales velocity.
 */
export const forecast = {
  forecast: {
    common: {
      refresh: 'Refresh',
      errorTitle: 'The forecasts could not be loaded',
      scrollHint: 'Scroll the table to see all columns.',
      period: 'Period',
      type: 'Type',
      value: 'Value',
      lower: 'Lower bound',
      upper: 'Upper bound',
      history: 'Actual',
      projection: 'Forecast',
      generatedAt: 'Generated: {date}',
      months: '{count} months',
      days: '{count} days',
      pageScope: 'Page {page} of {totalPages} · {total} records',
    },
    method: {
      linear: 'Linear regression',
      movingAvg: 'Moving average',
      exponential: 'Exponential smoothing',
      seasonal: 'Seasonal decomposition',
    },
    methodShort: {
      linear: 'Linear',
      movingAvg: 'Moving average',
      exponential: 'Exponential',
    },
    granularity: {
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
    },
    trend: {
      increasing: 'Increasing',
      decreasing: 'Decreasing',
      stable: 'Stable',
    },
    risk: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
      none: 'No risk',
    },
    impact: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
    priority: {
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    },
    scenario: {
      pessimistic: 'Pessimistic',
      baseline: 'Baseline',
      optimistic: 'Optimistic',
    },
    dashboard: {
      title: 'Forecasting',
      subtitle:
        'Statistical projections the backend computes from historical sales. The method in use is shown on each screen.',
      horizonLabel: 'Forecast horizon',
      kpisTitle: 'Horizon indicators',
      kpisDescription:
        'Figures the backend calculates for the selected horizon.',
      kpi: {
        salesForecast: 'Projected sales',
        annualRevenue: 'Annual revenue',
        riskProducts: 'Products at risk',
        demandUnits: 'Projected demand',
        coverage: 'Inventory coverage',
      },
      kpiHints: {
        salesForecast: 'Horizon total',
        annualRevenue: 'Backend annual extrapolation',
        riskProducts: 'High stockout risk',
        demandUnits: 'Sum of categories',
        coverage: 'Days of demand covered',
      },
      insightsTitle: 'Model findings',
      insightsDescription:
        'The backend generates them from the forecasts; each one links to its screen.',
      insightsEmpty: 'The backend returned no findings',
      insightsEmptyHint:
        'They are computed from the period forecasts; without enough data there is no finding.',
      insights: {
        salesTrend: {
          title: 'Sales trend',
          description: 'Projected vs. historical average: {value}.',
        },
        seasonality: {
          title: 'Seasonal pattern detected',
          description: 'Peak months detected: {value}.',
        },
        inventoryRisk: {
          title: 'Products at risk of stockout',
          description: '{value} products at high risk of running out of stock.',
        },
        inventoryCoverage: {
          title: 'Inventory coverage',
          description:
            'Current inventory covers {value} days of projected demand.',
        },
        revenueProjection: {
          title: 'Annual revenue projection',
          description: 'Projected annual revenue is {value}.',
        },
      },
      recommendationsTitle: 'Recommendations',
      recommendationsDescription:
        'Derived from the same backend conditions and thresholds: coverage below 14 days, products at risk, decreasing trend, seasonality and revenue confidence below 70.',
      recommendationsEmpty: 'No recommendations',
      recommendationsEmptyHint:
        'The backend conditions (coverage, risk, trend and confidence) do not trigger any action.',
      recommendations: {
        inventoryHighRisk: {
          title: 'Restock products at risk',
          description: 'There are {count} products at high risk of stockout.',
        },
        inventoryCoverage: {
          title: 'Increase inventory levels',
          description:
            'Coverage is {days} days; the backend threshold is {threshold}.',
        },
        salesDecline: {
          title: 'Reverse the sales trend',
          description: 'Sales show a decreasing trend of {growth}.',
        },
        salesSeasonality: {
          title: 'Prepare for peak season',
          description: 'Sales peaks detected in: {peaks}.',
        },
        revenueLowConfidence: {
          title: 'Improve forecast accuracy',
          description:
            'Revenue confidence is {confidence}, below {threshold}.',
        },
      },
      openScreen: 'Open screen',
      groupsTitle: 'Group screens',
      groupsDescription:
        'Each entry opens the screen with its own horizon and history.',
      groups: {
        sales: {
          title: 'Sales forecast',
          hint: 'Change vs. history',
        },
        revenue: {
          title: 'Revenue forecast',
          hint: 'Annual projection',
        },
        inventory: {
          title: 'Inventory health',
          hint: 'Products at high risk',
        },
        demand: {
          title: 'Demand forecast',
          hint: 'Categories analyzed',
        },
        salesMetric: 'Projected sales',
        revenueMetric: 'Projected revenue',
        inventoryMetric: 'Coverage (days)',
        demandMetric: 'Projected units',
      },
      composeNote:
        'The dashboard composes sales with 6 months of history, revenue with 12, inventory with months × 30 days and demand with 6. A screen with a different history may show different figures.',
    },
    sales: {
      title: 'Sales forecast',
      subtitle:
        'Projection over monthly historical sales. The fit metrics are the ones the backend calculates.',
      historyLabel: 'History',
      granularityLabel: 'Granularity',
      methodLabel: 'Method',
      horizonLabel: 'Horizon',
      historyRange: 'History: {range}',
      historyPoints: 'History points: {count}',
      kpisTitle: 'Forecast indicators',
      kpisDescription:
        'Sums and averages of the history and the horizon, as returned by the backend.',
      kpi: {
        historicalTotal: 'Historical sales',
        projectedTotal: 'Projected sales',
        projectedAverage: 'Projected monthly average',
        growth: 'Projected change',
        confidence: 'Model confidence',
      },
      kpiHints: {
        historicalTotal: 'History total',
        projectedTotal: 'Horizon total',
        projectedAverage: 'Per projected month',
        growth: 'Projected vs. historical average',
        confidence: 'Backend 0-95 level',
      },
      modelTitle: 'Model and fit',
      modelDescription:
        'Goodness-of-fit metrics the backend calculates over the history. An R² close to 0 means the model explains little of the variation.',
      metric: {
        confidence: 'Confidence',
        r2: 'R²',
        mae: 'MAE',
        mape: 'MAPE',
        rmse: 'RMSE',
      },
      metricHints: {
        confidence: 'R² × 100 capped at 95 (or 75/80 − CV × 100)',
        r2: 'Share of the variation explained',
        mae: 'Mean absolute error',
        mape: 'Mean absolute percentage error',
        rmse: 'Root mean squared error',
      },
      bandMultiplier:
        'Model band: ±15 % on every projected point (multipliers {lower} and {upper}).',
      bandAbsolute:
        'Model band: absolute mean ± 2σ ({lower} to {upper}).',
      historyTitle: 'History',
      historyDescription:
        'Monthly buckets of actual sales in the history period.',
      projectionTitle: 'Forecast',
      projectionDescription:
        'Points projected by the model with their band. Each point advances one calendar month from the last historical period.',
      seasonalityTitle: 'Seasonality',
      seasonalityDescription:
        'Per-calendar-month factors detected by the backend (minimum 12 history points).',
      peaks: 'Peak months',
      lows: 'Low months',
      factor: 'Factor',
      modelNote:
        'Each bucket label is re-derived from its date; the backend emits it in English.',
      emptyTitle: 'Not enough history',
      emptyHint:
        'The endpoint needs at least 2 history points to forecast. Widen the history or record sales for the period.',
      noSeasonality:
        'The backend did not detect a seasonal pattern with the current history.',
    },
    inventory: {
      title: 'Inventory health',
      subtitle:
        '90-day sales velocity projected over the horizon. Risk and replenishment are calculated by the backend.',
      horizonLabel: 'Horizon',
      kpisTitle: 'Inventory indicators',
      kpisDescription:
        'Coverage and counts over the full set analyzed by the backend (maximum 100 products).',
      kpi: {
        coverage: 'Coverage',
        currentStock: 'Current stock',
        projectedDemand: 'Projected demand',
        highRisk: 'High risk',
        mediumRisk: 'Medium risk',
        totalProducts: 'Products analyzed',
      },
      kpiHints: {
        coverage: 'Days of demand covered',
        currentStock: 'Units in stock',
        projectedDemand: 'Horizon units',
        highRisk: 'Stockout in 3 days or less',
        mediumRisk: 'Stockout in 7 days or less',
        totalProducts: 'Full set (max. 100)',
      },
      riskTitle: 'Risk distribution',
      riskDescription:
        'Counts over the full set. Each product falls into a single state based on its days to stockout.',
      alertsTitle: 'Stockout alerts',
      alertsDescription:
        'The backend generates them for high risk (imminent stockout) and medium risk (low stock). The first ones are listed; the real total is in the summary.',
      alerts: {
        empty: 'No stockout alerts',
        emptyHint: 'No product in the analyzed set is at high or medium risk.',
        summary: 'Alerts: {total} · High: {high} · Medium: {medium}',
        daysLabel: 'Days to act: {days}',
        more: '+{count} more alerts',
        type: {
          stockoutImminent: 'Imminent stockout',
          lowStock: 'Low stock',
        },
      },
      tableTitle: 'Products',
      tableDescription:
        'Daily velocity is calculated over the days with sales in the last 90 days, not over 90.',
      columns: {
        product: 'Product',
        stock: 'Stock',
        dailySales: 'Daily sales',
        projectedDemand: 'Projected demand',
        daysToStockout: 'Days left',
        reorderPoint: 'Reorder point',
        suggestedReorder: 'Suggested reorder',
        risk: 'Risk',
        trend: 'Trend',
      },
      notesTitle: 'How to read these figures',
      noVelocity: 'No sales in 90 days',
      reorderBefore: 'Reorder before {date}',
      notes: {
        dailySales:
          'Daily sales are the total sold in 90 days divided by the days with sales.',
        sentinel:
          '999 means "no sales velocity": it is shown as "No sales in 90 days", not as 999 days.',
        reorder:
          'Suggested reorder = projected demand + safety stock − current stock.',
        riskThresholds:
          'Risk by days to stockout: high ≤ 3, medium ≤ 7, low ≤ 14.',
      },
      emptyTitle: 'No products to analyze',
      emptyHint:
        'The endpoint returned no active products for the requested horizon.',
      pageScopeNote:
        'Coverage and counts use the full set; the table only shows the current page.',
    },
    demand: {
      title: 'Demand forecast',
      subtitle:
        'Historical units by category and product, projected with the growth of the last 30 days vs. the previous 30.',
      horizonLabel: 'Horizon',
      kpisTitle: 'Demand indicators',
      kpisDescription:
        'Category sums and real extremes from the top products.',
      kpi: {
        categories: 'Categories',
        historicalUnits: 'Historical units',
        forecastUnits: 'Projected units',
        topCategoryGrowth: 'Highest growth',
        topProductUnits: 'Top product (units)',
        confidence: 'Model confidence',
      },
      kpiHints: {
        categories: 'With sales in the history',
        historicalUnits: 'Sum of categories',
        forecastUnits: 'Sum of categories',
        topCategoryGrowth: 'Category: {name}',
        topProductUnits: 'Product: {name}',
        confidence: 'Model constant',
      },
      categoriesTitle: 'Demand by category',
      categoriesDescription:
        'Growth = last 30 days vs. previous 30; without a previous base the backend returns 0.',
      productsTitle: 'Top products',
      productsDescription:
        'Ordered by historical units; the page is defined by the backend.',
      columns: {
        category: 'Category',
        product: 'Product',
        categoryColumn: 'Category',
        historical: 'Historical',
        forecast: 'Projected',
        growth: 'Growth',
        trend: 'Trend',
      },
      confidenceNote:
        'Per-row confidence is a model constant (75 for categories, 70 for products): it is shown once.',
      notesTitle: 'How to read these figures',
      formulaNote:
        'Projection = historical monthly average × horizon months × (1 + growth).',
      pageScopeNote:
        'Product-table totals belong to the page; categories come complete.',
      emptyTitle: 'No demand to project',
      emptyHint:
        'The history period has no sales to calculate demand from.',
    },
    revenue: {
      title: 'Revenue forecast',
      subtitle:
        'Linear regression over monthly revenue. Scenarios and the annual projection are calculated by the backend.',
      horizonLabel: 'Horizon',
      kpisTitle: 'Revenue indicators',
      kpisDescription:
        'History and horizon sums, plus the backend annual extrapolation.',
      kpi: {
        historicalRevenue: 'Historical revenue',
        forecastRevenue: 'Projected revenue',
        annualProjection: 'Annual projection',
        growth: 'Projected change',
        confidence: 'Model confidence',
      },
      kpiHints: {
        historicalRevenue: 'History total (12 months)',
        forecastRevenue: 'Horizon total',
        annualProjection: 'Projected revenue × 12 / months',
        growth: 'Projected vs. historical average',
        confidence: 'Backend 0-95 level',
      },
      scenariosTitle: 'Scenarios',
      scenariosDescription:
        'Backend model: baseline ±15 % weighted 20/60/20. It is not a statistical probability.',
      scenariosEmpty: 'The backend returned no scenarios',
      scenariosEmptyHint:
        'The endpoint only generates them with include_scenarios=true.',
      scenario: {
        amount: 'Projected revenue',
        weight: 'Scenario weight',
        growth: 'Estimated growth',
        baselineTag: 'Baseline',
      },
      monthlyTitle: 'Monthly projection',
      monthlyDescription:
        'History + projected months with their absolute band. The projection advances month by month from the last historical period.',
      categoriesTitle: 'Revenue by category',
      categoriesDescription:
        'Share of the period history. The backend applies the overall growth to every category, so no per-category projection is shown.',
      columns: {
        category: 'Category',
        share: 'Share',
      },
      notesTitle: 'How to read these figures',
      notes: {
        annualProjection:
          'The annual projection extrapolates the horizon to 12 months.',
        linearMethod:
          'The backend projects with linear regression; confidence is R² × 100 capped at 95.',
        categoriesTotal:
          'Shares are calculated over the historical total of the listed categories.',
        scenarios:
          'Backend scenarios: pessimistic/baseline/optimistic = baseline −15 % / baseline / baseline +15 %.',
      },
      emptyTitle: 'No revenue to project',
      emptyHint:
        'The 12-month history does not have enough sales to fit the model.',
    },
  },
}
