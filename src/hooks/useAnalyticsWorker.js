/**
 * useAnalyticsWorker - Wave 3 Web Worker Integration Hook
 * Hook para procesamiento de analytics en background thread
 * 
 * FEATURES WAVE 3:
 * - Analytics calculations sin bloquear UI
 * - Large dataset processing (1000+ purchases)
 * - Export/import en background
 * - Progress tracking en tiempo real
 * - Task queue management
 * 
 * @since Wave 3 - Performance & Cache Avanzado
 * @author Sistema ERP
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useTelemetry } from './useTelemetry';
import { usePerformanceOptimizations } from './usePerformanceOptimizations';

/**
 * Hook para manejo completo del Analytics Web Worker
 * 
 * @param {Object} options - Configuración del worker
 * @returns {Object} Estado y controles del worker
 */
export const useAnalyticsWorker = (options = {}) => {
  const {
    enableBackground = true,
    workerPath = '/analytics-worker.js',
    maxConcurrentTasks = 1,
    taskTimeout = 300000 // 5 minutos
  } = options;

  const { trackEvent, trackMetric, trackTiming } = useTelemetry();
  const {
    optimizedCallback,
    createCleanupRegistry
  } = usePerformanceOptimizations({
    componentName: 'useAnalyticsWorker',
    enableMemoization: true
  });

  const registerCleanup = createCleanupRegistry();

  // Estado del worker
  const [workerState, setWorkerState] = useState({
    isSupported: typeof Worker !== 'undefined',
    isReady: false,
    isProcessing: false,
    error: null,
    version: null,
    capabilities: [],
    currentTask: null,
    taskQueue: [],
    progress: {
      current: 0,
      total: 0,
      percentage: 0,
      message: ''
    }
  });

  const worker = useRef(null);
  const taskCallbacks = useRef(new Map());
  const taskTimeouts = useRef(new Map());
  const taskIdCounter = useRef(0);

  /**
   * Inicializar Web Worker
   */
  const initializeWorker = optimizedCallback(() => {
    if (!workerState.isSupported || worker.current) return;

    try {
      trackEvent('worker.initialization.start');
      
      worker.current = new Worker(workerPath);
      
      // Setup message handler
      worker.current.onmessage = handleWorkerMessage;
      
      // Setup error handler
      worker.current.onerror = (error) => {
        console.error('Worker error:', error);
        setWorkerState(prev => ({
          ...prev,
          error: error.message,
          isReady: false
        }));
        
        trackEvent('worker.error', {
          error: error.message
        });
      };

      // Cleanup
      registerCleanup(() => {
        if (worker.current) {
          worker.current.terminate();
          worker.current = null;
        }
        
        // Clear timeouts
        taskTimeouts.current.forEach(timeout => clearTimeout(timeout));
        taskTimeouts.current.clear();
      });

      trackEvent('worker.initialization.success');
    } catch (error) {
      console.error('Worker initialization failed:', error);
      setWorkerState(prev => ({
        ...prev,
        error: error.message
      }));
      
      trackEvent('worker.initialization.error', {
        error: error.message
      });
    }
  }, [workerPath, trackEvent, registerCleanup], 'initializeWorker');

  /**
   * Manejo de mensajes del worker
   */
  const handleWorkerMessage = optimizedCallback((event) => {
    const { type, data, taskId } = event.data;

    switch (type) {
      case 'WORKER_READY':
        setWorkerState(prev => ({
          ...prev,
          isReady: true,
          version: data.version,
          capabilities: data.capabilities
        }));
        trackEvent('worker.ready', {
          version: data.version,
          capabilities: data.capabilities.length
        });
        break;

      case 'TASK_STARTED':
        setWorkerState(prev => ({
          ...prev,
          isProcessing: true,
          currentTask: taskId
        }));
        trackEvent('worker.task.started', {
          task_type: data.taskType,
          task_id: taskId
        });
        break;

      case 'PROGRESS':
        setWorkerState(prev => ({
          ...prev,
          progress: {
            current: data.processed || 0,
            total: data.total || 0,
            percentage: data.progress || 0,
            message: data.message || ''
          }
        }));
        
        // Track progress metrics
        trackMetric('worker.progress', data.progress, {
          task_id: taskId
        });
        break;

      case 'ANALYTICS_COMPLETE':
      case 'LARGE_DATASET_COMPLETE':
      case 'EXPORT_COMPLETE':
      case 'IMPORT_COMPLETE':
      case 'STATISTICAL_ANALYSIS_COMPLETE':
        handleTaskComplete(taskId, type, data);
        break;

      case 'TASK_CANCELLED':
        handleTaskCancelled(taskId);
        break;

      case 'ERROR':
        handleTaskError(taskId, data.error);
        break;

      default:
        console.warn('Unknown worker message type:', type);
    }
  }, [trackEvent, trackMetric], 'handleWorkerMessage');

  /**
   * Completar tarea
   */
  const handleTaskComplete = optimizedCallback((taskId, type, data) => {
    const callback = taskCallbacks.current.get(taskId);
    
    if (callback) {
      callback.resolve(data);
      taskCallbacks.current.delete(taskId);
    }

    // Clear timeout
    const timeout = taskTimeouts.current.get(taskId);
    if (timeout) {
      clearTimeout(timeout);
      taskTimeouts.current.delete(taskId);
    }

    setWorkerState(prev => ({
      ...prev,
      isProcessing: false,
      currentTask: null,
      progress: {
        current: 0,
        total: 0,
        percentage: 0,
        message: ''
      }
    }));

    trackEvent('worker.task.completed', {
      task_type: type,
      task_id: taskId,
      data_size: Array.isArray(data) ? data.length : Object.keys(data || {}).length
    });
  }, [trackEvent], 'handleTaskComplete');

  /**
   * Manejar tarea cancelada
   */
  const handleTaskCancelled = optimizedCallback((taskId) => {
    const callback = taskCallbacks.current.get(taskId);
    
    if (callback) {
      callback.reject(new Error('Task cancelled'));
      taskCallbacks.current.delete(taskId);
    }

    setWorkerState(prev => ({
      ...prev,
      isProcessing: false,
      currentTask: null
    }));

    trackEvent('worker.task.cancelled', {
      task_id: taskId
    });
  }, [trackEvent], 'handleTaskCancelled');

  /**
   * Manejar error de tarea
   */
  const handleTaskError = optimizedCallback((taskId, error) => {
    const callback = taskCallbacks.current.get(taskId);
    
    if (callback) {
      callback.reject(new Error(error));
      taskCallbacks.current.delete(taskId);
    }

    setWorkerState(prev => ({
      ...prev,
      isProcessing: false,
      currentTask: null,
      error
    }));

    trackEvent('worker.task.error', {
      task_id: taskId,
      error
    });
  }, [trackEvent], 'handleTaskError');

  /**
   * Ejecutar tarea en el worker
   */
  const executeTask = optimizedCallback(async (type, data, options = {}) => {
    if (!worker.current || !workerState.isReady) {
      throw new Error('Worker not ready');
    }

    if (workerState.isProcessing && maxConcurrentTasks === 1) {
      throw new Error('Worker is busy. Only one task allowed at a time.');
    }

    const taskId = `task_${++taskIdCounter.current}_${Date.now()}`;
    
    trackTiming('worker.task.start', taskId);

    return new Promise((resolve, reject) => {
      // Store callback
      taskCallbacks.current.set(taskId, { resolve, reject });

      // Setup timeout
      const timeout = setTimeout(() => {
        taskCallbacks.current.delete(taskId);
        reject(new Error(`Task timeout after ${taskTimeout}ms`));
        
        trackEvent('worker.task.timeout', {
          task_id: taskId,
          task_type: type
        });
      }, taskTimeout);
      
      taskTimeouts.current.set(taskId, timeout);

      // Send task to worker
      worker.current.postMessage({
        type,
        data,
        taskId,
        options
      });

      trackEvent('worker.task.queued', {
        task_type: type,
        task_id: taskId
      });
    });
  }, [workerState.isReady, workerState.isProcessing, maxConcurrentTasks, taskTimeout, trackEvent, trackTiming], 'executeTask');

  /**
   * Calcular analytics completos
   */
  const calculateAnalytics = optimizedCallback(async (purchases) => {
    return await executeTask('CALCULATE_ANALYTICS', purchases);
  }, [executeTask], 'calculateAnalytics');

  /**
   * Procesar dataset grande
   */
  const processLargeDataset = optimizedCallback(async (purchases, operation, options = {}) => {
    return await executeTask('PROCESS_LARGE_DATASET', {
      purchases,
      operation,
      options
    });
  }, [executeTask], 'processLargeDataset');

  /**
   * Exportar purchases
   */
  const exportPurchases = optimizedCallback(async (purchases, format, options = {}) => {
    return await executeTask('EXPORT_PURCHASES', {
      purchases,
      format,
      options
    });
  }, [executeTask], 'exportPurchases');

  /**
   * Importar purchases
   */
  const importPurchases = optimizedCallback(async (fileData, format, options = {}) => {
    return await executeTask('IMPORT_PURCHASES', {
      fileData,
      format,
      options
    });
  }, [executeTask], 'importPurchases');

  /**
   * Análisis estadístico
   */
  const statisticalAnalysis = optimizedCallback(async (purchases) => {
    return await executeTask('STATISTICAL_ANALYSIS', purchases);
  }, [executeTask], 'statisticalAnalysis');

  /**
   * Cancelar tarea actual
   */
  const cancelCurrentTask = optimizedCallback(() => {
    if (worker.current && workerState.isProcessing) {
      worker.current.postMessage({
        type: 'CANCEL_TASK'
      });
    }
  }, [workerState.isProcessing], 'cancelCurrentTask');

  /**
   * Obtener estadísticas del worker
   */
  const getWorkerStats = optimizedCallback(() => {
    return {
      isSupported: workerState.isSupported,
      isReady: workerState.isReady,
      isProcessing: workerState.isProcessing,
      version: workerState.version,
      capabilities: workerState.capabilities,
      activeTasks: taskCallbacks.current.size,
      queueSize: workerState.taskQueue.length
    };
  }, [workerState], 'getWorkerStats');

  // Inicialización automática
  useEffect(() => {
    if (workerState.isSupported && enableBackground) {
      initializeWorker();
    }
  }, [workerState.isSupported, enableBackground, initializeWorker]);

  return {
    // Estado
    ...workerState,
    
    // Métodos principales
    calculateAnalytics,
    processLargeDataset,
    exportPurchases,
    importPurchases,
    statisticalAnalysis,
    
    // Control
    cancelCurrentTask,
    
    // Información
    getWorkerStats,
    
    // Flags útiles
    canProcess: workerState.isReady && !workerState.isProcessing,
    hasCapability: (capability) => workerState.capabilities.includes(capability)
  };
};

export default useAnalyticsWorker;
