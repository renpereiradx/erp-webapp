/**
 * Analytics Web Worker - Wave 3 Background Processing
 * Procesamiento de analytics y cálculos pesados en background thread
 * 
 * FEATURES WAVE 3:
 * - Analytics calculations sin bloquear UI thread
 * - Large dataset processing (1000+ purchases)
 * - Export/import processing en background
 * - Statistical analysis avanzado
 * - Memory efficient data processing
 * 
 * @since Wave 3 - Performance & Cache Avanzado
 * @author Sistema ERP
 */

// Configuración del worker
const WORKER_VERSION = '3.0.0';
const BATCH_SIZE = 100; // Procesar en lotes para evitar blocking
const PROGRESS_INTERVAL = 50; // Reportar progreso cada 50 items

/**
 * Estado del worker
 */
let isProcessing = false;
let currentTask = null;
let processedCount = 0;
let totalCount = 0;

/**
 * Manejo de mensajes desde el main thread
 */
self.addEventListener('message', async (event) => {
  const { type, data, taskId } = event.data;
  
  try {
    switch (type) {
      case 'CALCULATE_ANALYTICS':
        await handleCalculateAnalytics(data, taskId);
        break;
        
      case 'PROCESS_LARGE_DATASET':
        await handleProcessLargeDataset(data, taskId);
        break;
        
      case 'EXPORT_PURCHASES':
        await handleExportPurchases(data, taskId);
        break;
        
      case 'IMPORT_PURCHASES':
        await handleImportPurchases(data, taskId);
        break;
        
      case 'STATISTICAL_ANALYSIS':
        await handleStatisticalAnalysis(data, taskId);
        break;
        
      case 'CANCEL_TASK':
        handleCancelTask();
        break;
        
      default:
        postMessage({
          type: 'ERROR',
          error: `Unknown task type: ${type}`,
          taskId
        });
    }
  } catch (error) {
    postMessage({
      type: 'ERROR',
      error: error.message,
      taskId
    });
  }
});

/**
 * Calcular analytics completos para purchases
 */
async function handleCalculateAnalytics(purchases, taskId) {
  if (isProcessing) {
    postMessage({
      type: 'ERROR',
      error: 'Worker is busy processing another task',
      taskId
    });
    return;
  }
  
  setTaskStatus(true, 'CALCULATE_ANALYTICS', taskId);
  
  try {
    postMessage({
      type: 'PROGRESS',
      progress: 0,
      message: 'Iniciando cálculo de analytics...',
      taskId
    });
    
    const analytics = {
      overview: await calculateOverviewMetrics(purchases),
      trends: await calculateTrends(purchases),
      suppliers: await calculateSupplierMetrics(purchases),
      categories: await calculateCategoryMetrics(purchases),
      timeAnalysis: await calculateTimeAnalysis(purchases),
      predictions: await calculatePredictions(purchases)
    };
    
    postMessage({
      type: 'ANALYTICS_COMPLETE',
      data: analytics,
      taskId
    });
    
  } finally {
    setTaskStatus(false);
  }
}

/**
 * Procesar datasets grandes en lotes
 */
async function handleProcessLargeDataset(data, taskId) {
  const { purchases, operation, options = {} } = data;
  
  setTaskStatus(true, 'PROCESS_LARGE_DATASET', taskId);
  totalCount = purchases.length;
  processedCount = 0;
  
  try {
    const results = [];
    
    for (let i = 0; i < purchases.length; i += BATCH_SIZE) {
      // Verificar si la tarea fue cancelada
      if (!isProcessing) break;
      
      const batch = purchases.slice(i, i + BATCH_SIZE);
      const batchResults = await processBatch(batch, operation, options);
      results.push(...batchResults);
      
      processedCount += batch.length;
      
      // Reportar progreso
      if (processedCount % PROGRESS_INTERVAL === 0 || processedCount === totalCount) {
        postMessage({
          type: 'PROGRESS',
          progress: (processedCount / totalCount) * 100,
          processed: processedCount,
          total: totalCount,
          message: `Procesando ${operation}: ${processedCount}/${totalCount}`,
          taskId
        });
      }
      
      // Yield para evitar bloquear el worker
      await sleep(1);
    }
    
    postMessage({
      type: 'LARGE_DATASET_COMPLETE',
      data: results,
      processed: processedCount,
      total: totalCount,
      taskId
    });
    
  } finally {
    setTaskStatus(false);
  }
}

/**
 * Exportar purchases a diferentes formatos
 */
async function handleExportPurchases(data, taskId) {
  const { purchases, format, options = {} } = data;
  
  setTaskStatus(true, 'EXPORT_PURCHASES', taskId);
  totalCount = purchases.length;
  
  try {
    let exportData;
    
    switch (format.toLowerCase()) {
      case 'csv':
        exportData = await exportToCSV(purchases, options);
        break;
      case 'excel':
        exportData = await exportToExcel(purchases, options);
        break;
      case 'json':
        exportData = await exportToJSON(purchases, options);
        break;
      case 'pdf':
        exportData = await exportToPDF(purchases, options);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
    
    postMessage({
      type: 'EXPORT_COMPLETE',
      data: exportData,
      format,
      filename: generateFilename(format, options),
      taskId
    });
    
  } finally {
    setTaskStatus(false);
  }
}

/**
 * Importar y validar purchases desde archivos
 */
async function handleImportPurchases(data, taskId) {
  const { fileData, format, options = {} } = data;
  
  setTaskStatus(true, 'IMPORT_PURCHASES', taskId);
  
  try {
    let parsedData;
    
    switch (format.toLowerCase()) {
      case 'csv':
        parsedData = await parseCSV(fileData, options);
        break;
      case 'excel':
        parsedData = await parseExcel(fileData, options);
        break;
      case 'json':
        parsedData = await parseJSON(fileData, options);
        break;
      default:
        throw new Error(`Unsupported import format: ${format}`);
    }
    
    // Validar datos importados
    const validationResults = await validateImportedData(parsedData);
    
    postMessage({
      type: 'IMPORT_COMPLETE',
      data: parsedData,
      validation: validationResults,
      taskId
    });
    
  } finally {
    setTaskStatus(false);
  }
}

/**
 * Análisis estadístico avanzado
 */
async function handleStatisticalAnalysis(purchases, taskId) {
  setTaskStatus(true, 'STATISTICAL_ANALYSIS', taskId);
  
  try {
    const analysis = {
      descriptiveStats: await calculateDescriptiveStats(purchases),
      correlations: await calculateCorrelations(purchases),
      seasonality: await calculateSeasonality(purchases),
      outliers: await detectOutliers(purchases),
      clustering: await performClustering(purchases),
      forecasting: await generateForecasts(purchases)
    };
    
    postMessage({
      type: 'STATISTICAL_ANALYSIS_COMPLETE',
      data: analysis,
      taskId
    });
    
  } finally {
    setTaskStatus(false);
  }
}

/**
 * Cancelar tarea actual
 */
function handleCancelTask() {
  if (isProcessing) {
    setTaskStatus(false);
    postMessage({
      type: 'TASK_CANCELLED',
      taskId: currentTask
    });
  }
}

/**
 * Establecer estado de la tarea
 */
function setTaskStatus(processing, taskType = null, taskId = null) {
  isProcessing = processing;
  currentTask = processing ? taskId : null;
  
  if (processing) {
    postMessage({
      type: 'TASK_STARTED',
      taskType,
      taskId
    });
  }
}

/**
 * Calcular métricas de overview
 */
async function calculateOverviewMetrics(purchases) {
  await sleep(10); // Simular procesamiento
  
  const totalPurchases = purchases.length;
  const totalAmount = purchases.reduce((sum, p) => sum + (p.total || 0), 0);
  const avgAmount = totalAmount / totalPurchases || 0;
  
  const statusBreakdown = purchases.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const monthlyPurchases = purchases.filter(p => {
    const date = new Date(p.created_at);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  return {
    totalPurchases,
    totalAmount,
    avgAmount,
    statusBreakdown,
    monthlyCount: monthlyPurchases.length,
    monthlyAmount: monthlyPurchases.reduce((sum, p) => sum + (p.total || 0), 0)
  };
}

/**
 * Calcular tendencias temporales
 */
async function calculateTrends(purchases) {
  await sleep(15);
  
  const monthlyTrends = {};
  const dailyTrends = {};
  
  purchases.forEach(purchase => {
    const date = new Date(purchase.created_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const dayKey = date.toISOString().split('T')[0];
    
    if (!monthlyTrends[monthKey]) {
      monthlyTrends[monthKey] = { count: 0, amount: 0 };
    }
    if (!dailyTrends[dayKey]) {
      dailyTrends[dayKey] = { count: 0, amount: 0 };
    }
    
    monthlyTrends[monthKey].count++;
    monthlyTrends[monthKey].amount += purchase.total || 0;
    
    dailyTrends[dayKey].count++;
    dailyTrends[dayKey].amount += purchase.total || 0;
  });
  
  return {
    monthly: monthlyTrends,
    daily: dailyTrends,
    growthRate: calculateGrowthRate(monthlyTrends)
  };
}

/**
 * Procesar lote de datos
 */
async function processBatch(batch, operation, options) {
  const results = [];
  
  for (const item of batch) {
    let result;
    
    switch (operation) {
      case 'enrich':
        result = await enrichPurchaseData(item, options);
        break;
      case 'validate':
        result = await validatePurchase(item, options);
        break;
      case 'transform':
        result = await transformPurchase(item, options);
        break;
      default:
        result = item;
    }
    
    results.push(result);
  }
  
  return results;
}

/**
 * Exportar a CSV
 */
async function exportToCSV(purchases, options) {
  const headers = options.columns || [
    'id', 'supplier_name', 'total', 'status', 'created_at'
  ];
  
  let csv = headers.join(',') + '\n';
  
  for (let i = 0; i < purchases.length; i++) {
    const purchase = purchases[i];
    const row = headers.map(header => {
      let value = purchase[header] || '';
      
      // Escape commas and quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        value = `"${value.replace(/"/g, '""')}"`;
      }
      
      return value;
    });
    
    csv += row.join(',') + '\n';
    
    // Reportar progreso cada 100 items
    if (i % 100 === 0) {
      processedCount = i;
      postMessage({
        type: 'PROGRESS',
        progress: (i / purchases.length) * 100,
        message: `Exportando a CSV: ${i}/${purchases.length}`
      });
      await sleep(1);
    }
  }
  
  return csv;
}

/**
 * Generar filename para export
 */
function generateFilename(format, options) {
  const timestamp = new Date().toISOString().split('T')[0];
  const prefix = options.prefix || 'purchases';
  return `${prefix}_${timestamp}.${format}`;
}

/**
 * Utility: Sleep para yield del thread
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calcular rate de crecimiento
 */
function calculateGrowthRate(monthlyData) {
  const months = Object.keys(monthlyData).sort();
  if (months.length < 2) return 0;
  
  const latest = monthlyData[months[months.length - 1]];
  const previous = monthlyData[months[months.length - 2]];
  
  if (previous.amount === 0) return 0;
  
  return ((latest.amount - previous.amount) / previous.amount) * 100;
}

/**
 * Enriquecer datos de purchase
 */
async function enrichPurchaseData(purchase, options) {
  // Simular enriquecimiento de datos
  return {
    ...purchase,
    enriched_at: new Date().toISOString(),
    calculated_tax: (purchase.total || 0) * 0.19,
    category: options.categoryMapping?.[purchase.supplier_id] || 'Other',
    risk_score: Math.random() * 100
  };
}

/**
 * Validar purchase
 */
async function validatePurchase(purchase, options) {
  const errors = [];
  const warnings = [];
  
  if (!purchase.id) errors.push('Missing ID');
  if (!purchase.total || purchase.total <= 0) errors.push('Invalid total amount');
  if (!purchase.supplier_id) warnings.push('Missing supplier ID');
  
  return {
    ...purchase,
    validation: {
      valid: errors.length === 0,
      errors,
      warnings
    }
  };
}

/**
 * Transformar purchase según reglas
 */
async function transformPurchase(purchase, options) {
  const transformed = { ...purchase };
  
  // Aplicar transformaciones según options
  if (options.normalizeAmounts) {
    transformed.total = Math.round((transformed.total || 0) * 100) / 100;
  }
  
  if (options.addTimestamp) {
    transformed.processed_at = new Date().toISOString();
  }
  
  return transformed;
}

// Inicialización del worker
postMessage({
  type: 'WORKER_READY',
  version: WORKER_VERSION,
  capabilities: [
    'CALCULATE_ANALYTICS',
    'PROCESS_LARGE_DATASET', 
    'EXPORT_PURCHASES',
    'IMPORT_PURCHASES',
    'STATISTICAL_ANALYSIS'
  ]
});
