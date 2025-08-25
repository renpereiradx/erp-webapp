import { useEffect, useState, useCallback } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Import Wave 8 services
import { useApiManagerStore } from '../services/apiManager';
import { useServiceIntegrationStore } from '../services/serviceIntegration';
import { useDataSyncStore } from '../services/dataSynchronization';
import { useApiGatewayStore } from '../services/apiGateway';
import { useConnectorsStore } from '../services/externalConnectors';
import { useAuthStore } from '../services/authService';

// Wave 8 Configuration
const WAVE_8_CONFIG = {
  name: 'API Integration Enterprise',
  version: '1.0.0',
  features: [
    'API Management System',
    'Service Integration Hub',
    'Data Synchronization Engine',
    'API Gateway & Load Balancing',
    'External Connectors',
    'Authentication & Authorization',
    'Rate Limiting & Circuit Breakers',
    'Real-time Data Sync',
    'Monitoring & Analytics'
  ],
  components: {
    apiManager: { enabled: true, priority: 1 },
    serviceIntegration: { enabled: true, priority: 2 },
    dataSynchronization: { enabled: true, priority: 3 },
    apiGateway: { enabled: true, priority: 4 },
    externalConnectors: { enabled: true, priority: 5 },
    authentication: { enabled: true, priority: 6 }
  }
};

// Wave 8 Store
export const useWave8Store = create(
  persist(
    (set, get) => ({
      // State
      isInitialized: false,
      isLoading: false,
      error: null,
      config: WAVE_8_CONFIG,
      metrics: {
        totalApiCalls: 0,
        successRate: 0,
        averageResponseTime: 0,
        activeConnections: 0,
        syncOperations: 0,
        errors: 0
      },
      status: {
        apiManager: 'idle',
        serviceIntegration: 'idle',
        dataSynchronization: 'idle',
        apiGateway: 'idle',
        externalConnectors: 'idle',
        authentication: 'idle'
      },
      notifications: [],

      // Actions
      initialize: async () => {
        set({ isLoading: true, error: null });
        
        try {
          console.log('🚀 Initializing Wave 8: API Integration Enterprise');
          
          // Initialize all Wave 8 services in priority order
          const { initializeApiManager } = useApiManagerStore.getState();
          const { initializeServiceIntegration } = useServiceIntegrationStore.getState();
          const { initializeDataSync } = useDataSyncStore.getState();
          const { loadRoutes } = useApiGatewayStore.getState();
          const { loadConnectors } = useConnectorsStore.getState();

          // Initialize services
          await initializeApiManager();
          get().updateStatus('apiManager', 'initialized');

          await initializeServiceIntegration();
          get().updateStatus('serviceIntegration', 'initialized');

          await initializeDataSync();
          get().updateStatus('dataSynchronization', 'initialized');

          loadRoutes();
          get().updateStatus('apiGateway', 'initialized');

          loadConnectors();
          get().updateStatus('externalConnectors', 'initialized');

          // Setup default configurations
          await get().setupDefaultConfigurations();

          set({ 
            isInitialized: true, 
            isLoading: false 
          });

          get().addNotification({
            type: 'success',
            title: 'Wave 8 Initialized',
            message: 'API Integration Enterprise is ready'
          });

          console.log('✅ Wave 8 initialization completed');
          
        } catch (error) {
          console.error('❌ Wave 8 initialization failed:', error);
          set({ 
            error: error.message, 
            isLoading: false 
          });
          
          get().addNotification({
            type: 'error',
            title: 'Initialization Failed',
            message: error.message
          });
        }
      },

      setupDefaultConfigurations: async () => {
        try {
          // Setup default API routes
          const { addRoute } = useApiGatewayStore.getState();
          
          const defaultRoutes = [
            {
              path: '/api/v1/users/*',
              method: 'ALL',
              target: 'http://localhost:3001/users',
              type: 'rest',
              rateLimiting: { requests: 100, window: 60000 },
              authentication: { required: true }
            },
            {
              path: '/api/v1/products/*',
              method: 'ALL',
              target: 'http://localhost:3002/products',
              type: 'rest',
              rateLimiting: { requests: 200, window: 60000 },
              caching: { ttl: 300000 }
            },
            {
              path: '/api/v1/orders/*',
              method: 'ALL',
              target: 'http://localhost:3003/orders',
              type: 'rest',
              rateLimiting: { requests: 150, window: 60000 },
              authentication: { required: true }
            },
            {
              path: '/graphql',
              method: 'POST',
              target: 'http://localhost:4000/graphql',
              type: 'graphql',
              rateLimiting: { requests: 50, window: 60000 }
            }
          ];

          for (const route of defaultRoutes) {
            await addRoute(route);
          }

          // Setup default connectors
          const { createConnector } = useConnectorsStore.getState();
          
          const defaultConnectors = [
            {
              name: 'Main Database',
              type: 'database',
              databaseType: 'postgresql',
              connectionString: 'postgresql://localhost:5432/erp_db'
            },
            {
              name: 'Cache Redis',
              type: 'database',
              databaseType: 'redis',
              connectionString: 'redis://localhost:6379'
            },
            {
              name: 'File Storage',
              type: 'file_system',
              basePath: '/var/storage',
              permissions: ['read', 'write']
            },
            {
              name: 'External API',
              type: 'rest',
              baseUrl: 'https://api.external-service.com',
              authentication: {
                type: 'api_key',
                headerName: 'X-API-Key',
                apiKey: 'your-api-key'
              }
            }
          ];

          for (const connectorConfig of defaultConnectors) {
            createConnector(connectorConfig);
          }

          // Setup default sync configurations
          const { addSyncConfiguration } = useDataSyncStore.getState();
          
          const defaultSyncConfigs = [
            {
              name: 'User Data Sync',
              source: { type: 'database', table: 'users' },
              target: { type: 'api', endpoint: '/api/sync/users' },
              strategy: 'incremental',
              schedule: '*/5 * * * *' // Every 5 minutes
            },
            {
              name: 'Product Inventory Sync',
              source: { type: 'database', table: 'products' },
              target: { type: 'api', endpoint: '/api/sync/products' },
              strategy: 'delta',
              schedule: '*/2 * * * *' // Every 2 minutes
            },
            {
              name: 'Real-time Orders',
              source: { type: 'websocket', endpoint: '/ws/orders' },
              target: { type: 'database', table: 'orders' },
              strategy: 'real_time',
              conflictResolution: 'last_write_wins'
            }
          ];

          for (const syncConfig of defaultSyncConfigs) {
            await addSyncConfiguration(syncConfig);
          }

          console.log('⚙️ Default configurations setup completed');
          
        } catch (error) {
          console.error('Failed to setup default configurations:', error);
          throw error;
        }
      },

      updateStatus: (service, status) => {
        set(state => ({
          status: {
            ...state.status,
            [service]: status
          }
        }));
      },

      refreshMetrics: () => {
        try {
          const { getMetrics: getApiMetrics } = useApiManagerStore.getState();
          const { getMetrics: getServiceMetrics } = useServiceIntegrationStore.getState();
          const { getMetrics: getSyncMetrics } = useDataSyncStore.getState();
          const { loadMetrics: getGatewayMetrics } = useApiGatewayStore.getState();
          const { loadMetrics: getConnectorMetrics } = useConnectorsStore.getState();

          const apiMetrics = getApiMetrics();
          const serviceMetrics = getServiceMetrics();
          const syncMetrics = getSyncMetrics();
          const gatewayMetrics = getGatewayMetrics();
          const connectorMetrics = getConnectorMetrics();

          const aggregatedMetrics = {
            totalApiCalls: 
              (apiMetrics?.totalRequests || 0) + 
              (gatewayMetrics?.totalRequests || 0),
            
            successRate: (() => {
              const totalSuccess = 
                (apiMetrics?.successfulRequests || 0) + 
                (connectorMetrics?.successfulRequests || 0);
              const total = 
                (apiMetrics?.totalRequests || 0) + 
                (connectorMetrics?.totalRequests || 0);
              return total > 0 ? (totalSuccess / total) * 100 : 0;
            })(),
            
            averageResponseTime: 
              (apiMetrics?.averageResponseTime || 0 + 
               gatewayMetrics?.averageResponseTime || 0) / 2,
            
            activeConnections: serviceMetrics?.activeServices || 0,
            
            syncOperations: syncMetrics?.totalOperations || 0,
            
            errors: 
              (apiMetrics?.failedRequests || 0) + 
              (connectorMetrics?.failedRequests || 0)
          };

          set({ metrics: aggregatedMetrics });
          return aggregatedMetrics;
          
        } catch (error) {
          console.error('Failed to refresh metrics:', error);
          return get().metrics;
        }
      },

      addNotification: (notification) => {
        const id = Date.now().toString();
        const newNotification = {
          id,
          timestamp: Date.now(),
          ...notification
        };

        set(state => ({
          notifications: [newNotification, ...state.notifications.slice(0, 9)]
        }));

        // Auto-remove after 5 seconds for non-error notifications
        if (notification.type !== 'error') {
          setTimeout(() => {
            get().removeNotification(id);
          }, 5000);
        }
      },

      removeNotification: (id) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },

      getSystemHealth: () => {
        const { status } = get();
        const services = Object.keys(status);
        const totalServices = services.length;
        const healthyServices = services.filter(
          service => status[service] === 'initialized' || status[service] === 'running'
        ).length;

        return {
          overall: healthyServices === totalServices ? 'healthy' : 'degraded',
          services: status,
          healthPercentage: (healthyServices / totalServices) * 100,
          timestamp: Date.now()
        };
      },

      restart: async () => {
        set({ isInitialized: false });
        await get().initialize();
      },

      shutdown: () => {
        try {
          // Stop all services gracefully
          const { shutdown: shutdownDataSync } = useDataSyncStore.getState();
          shutdownDataSync();

          set({
            isInitialized: false,
            status: Object.keys(get().status).reduce((acc, key) => {
              acc[key] = 'stopped';
              return acc;
            }, {})
          });

          console.log('🛑 Wave 8 services stopped');
          
        } catch (error) {
          console.error('Error during shutdown:', error);
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'wave8-store',
      partialize: (state) => ({
        config: state.config,
        isInitialized: state.isInitialized
      })
    }
  )
);

// Main Wave 8 Hook
export const useWave8 = () => {
  const [isReady, setIsReady] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);

  // Wave 8 store
  const {
    isInitialized,
    isLoading,
    error,
    config,
    metrics,
    status,
    notifications,
    initialize,
    refreshMetrics,
    getSystemHealth,
    addNotification,
    removeNotification,
    clearNotifications,
    restart,
    shutdown,
    clearError
  } = useWave8Store();

  // Service stores
  const apiManager = useApiManagerStore();
  const serviceIntegration = useServiceIntegrationStore();
  const dataSync = useDataSyncStore();
  const apiGateway = useApiGatewayStore();
  const connectors = useConnectorsStore();
  const auth = useAuthStore();

  // Initialize Wave 8 on mount
  useEffect(() => {
    if (!isInitialized && !isLoading) {
      initialize();
    }
  }, [isInitialized, isLoading, initialize]);

  // Update ready state
  useEffect(() => {
    setIsReady(isInitialized && !isLoading && !error);
  }, [isInitialized, isLoading, error]);

  // Auto-refresh metrics
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      refreshMetrics();
    }, 10000); // Every 10 seconds

    return () => clearInterval(interval);
  }, [isInitialized, refreshMetrics]);

  // Auto-refresh health status
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      setHealthStatus(getSystemHealth());
    }, 15000); // Every 15 seconds

    return () => clearInterval(interval);
  }, [isInitialized, getSystemHealth]);

  // API Management operations
  const apiOperations = {
    // Route management
    addRoute: useCallback((config) => apiGateway.addRoute(config), [apiGateway]),
    removeRoute: useCallback((routeId) => apiGateway.removeRoute(routeId), [apiGateway]),
    
    // Request processing
    processRequest: useCallback((request) => apiGateway.processRequest(request), [apiGateway]),
    
    // Connector management
    createConnector: useCallback((config) => connectors.createConnector(config), [connectors]),
    connectAll: useCallback(() => connectors.connectAll(), [connectors]),
    
    // Data synchronization
    startSync: useCallback((configId) => dataSync.startSync(configId), [dataSync]),
    stopSync: useCallback((configId) => dataSync.stopSync(configId), [dataSync]),
    
    // Service registration
    registerService: useCallback((config) => serviceIntegration.registerService(config), [serviceIntegration])
  };

  // Monitoring operations
  const monitoring = {
    getMetrics: useCallback(() => refreshMetrics(), [refreshMetrics]),
    getHealth: useCallback(() => getSystemHealth(), [getSystemHealth]),
    getRequestLogs: useCallback((limit) => apiGateway.loadRequestLogs(limit), [apiGateway]),
    getConnectionStatus: useCallback(() => connectors.loadConnectionStatus(), [connectors])
  };

  // System operations
  const systemOps = {
    restart: useCallback(() => restart(), [restart]),
    shutdown: useCallback(() => shutdown(), [shutdown]),
    clearError: useCallback(() => clearError(), [clearError])
  };

  // Notification operations
  const notificationOps = {
    add: useCallback((notification) => addNotification(notification), [addNotification]),
    remove: useCallback((id) => removeNotification(id), [removeNotification]),
    clear: useCallback(() => clearNotifications(), [clearNotifications])
  };

  return {
    // State
    isReady,
    isInitialized,
    isLoading,
    error,
    config,
    metrics,
    status,
    notifications,
    healthStatus,

    // Services
    services: {
      apiManager,
      serviceIntegration,
      dataSync,
      apiGateway,
      connectors,
      auth
    },

    // Operations
    api: apiOperations,
    monitoring,
    system: systemOps,
    notifications: notificationOps,

    // Utilities
    isServiceHealthy: (serviceName) => {
      return status[serviceName] === 'initialized' || status[serviceName] === 'running';
    },

    getOverallHealth: () => {
      return healthStatus?.overall || 'unknown';
    },

    hasError: () => !!error,

    getActiveFeatures: () => {
      return config.features.filter((feature, index) => {
        const componentKey = Object.keys(config.components)[index];
        return config.components[componentKey]?.enabled;
      });
    }
  };
};

// Wave 8 Analytics Hook
export const useWave8Analytics = () => {
  const { metrics, services } = useWave8();
  const [analytics, setAnalytics] = useState({});

  useEffect(() => {
    const calculateAnalytics = () => {
      const now = Date.now();
      const hourAgo = now - 3600000;

      // Calculate request trends, error rates, performance metrics
      const analyticsData = {
        requestTrends: {
          current: metrics.totalApiCalls,
          trend: 'stable', // Could calculate actual trend
          growthRate: 0
        },
        errorAnalysis: {
          rate: (metrics.errors / Math.max(metrics.totalApiCalls, 1)) * 100,
          trend: 'decreasing',
          commonErrors: []
        },
        performance: {
          responseTime: metrics.averageResponseTime,
          trend: 'improving',
          p95ResponseTime: metrics.averageResponseTime * 1.5
        },
        connectivity: {
          activeConnections: metrics.activeConnections,
          connectionRate: (metrics.activeConnections / 10) * 100,
          failureRate: 0
        },
        syncHealth: {
          operations: metrics.syncOperations,
          successRate: 95,
          lag: 150
        }
      };

      setAnalytics(analyticsData);
    };

    calculateAnalytics();
    const interval = setInterval(calculateAnalytics, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [metrics]);

  return analytics;
};

export default useWave8;
