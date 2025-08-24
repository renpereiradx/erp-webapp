import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Service Discovery and Registry
class ServiceRegistry {
  constructor() {
    this.services = new Map();
    this.healthStatus = new Map();
    this.loadBalancers = new Map();
    this.serviceGroups = new Map();
  }

  register(serviceName, instances, config = {}) {
    const serviceConfig = {
      name: serviceName,
      instances: instances.map(instance => ({
        id: instance.id || `${serviceName}-${Date.now()}`,
        url: instance.url,
        weight: instance.weight || 1,
        status: 'healthy',
        lastHealthCheck: Date.now(),
        metadata: instance.metadata || {},
        ...instance
      })),
      strategy: config.strategy || 'round-robin',
      healthCheck: config.healthCheck || { interval: 30000, timeout: 5000 },
      circuitBreaker: config.circuitBreaker || { enabled: true },
      retryPolicy: config.retryPolicy || { attempts: 3, delay: 1000 },
      ...config
    };

    this.services.set(serviceName, serviceConfig);
    this.setupLoadBalancer(serviceName, serviceConfig);
    this.startHealthChecking(serviceName);
    
    console.log(`🔗 Service registered: ${serviceName} with ${instances.length} instances`);
    return serviceConfig;
  }

  setupLoadBalancer(serviceName, config) {
    const balancer = new LoadBalancer(config.strategy, config.instances);
    this.loadBalancers.set(serviceName, balancer);
  }

  async startHealthChecking(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return;

    const checkHealth = async () => {
      const healthPromises = service.instances.map(async (instance) => {
        try {
          const response = await fetch(`${instance.url}/health`, {
            method: 'GET',
            timeout: service.healthCheck.timeout
          });
          
          const isHealthy = response.ok;
          instance.status = isHealthy ? 'healthy' : 'unhealthy';
          instance.lastHealthCheck = Date.now();
          
          this.healthStatus.set(`${serviceName}:${instance.id}`, {
            status: instance.status,
            responseTime: Date.now() - instance.lastHealthCheck,
            timestamp: instance.lastHealthCheck
          });

        } catch (error) {
          instance.status = 'unhealthy';
          instance.lastHealthCheck = Date.now();
          
          this.healthStatus.set(`${serviceName}:${instance.id}`, {
            status: 'unhealthy',
            error: error.message,
            timestamp: instance.lastHealthCheck
          });
        }
      });

      await Promise.allSettled(healthPromises);
      
      // Update load balancer with healthy instances
      const healthyInstances = service.instances.filter(i => i.status === 'healthy');
      const balancer = this.loadBalancers.get(serviceName);
      if (balancer) {
        balancer.updateInstances(healthyInstances);
      }
    };

    // Initial health check
    await checkHealth();
    
    // Schedule periodic health checks
    setInterval(checkHealth, service.healthCheck.interval);
  }

  getService(serviceName) {
    return this.services.get(serviceName);
  }

  getHealthyInstance(serviceName) {
    const balancer = this.loadBalancers.get(serviceName);
    return balancer ? balancer.getNext() : null;
  }

  getAllServices() {
    return Array.from(this.services.values());
  }

  getServiceHealth(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return null;

    return service.instances.map(instance => ({
      id: instance.id,
      url: instance.url,
      ...this.healthStatus.get(`${serviceName}:${instance.id}`)
    }));
  }
}

// Load Balancing Strategies
class LoadBalancer {
  constructor(strategy, instances = []) {
    this.strategy = strategy;
    this.instances = instances.filter(i => i.status === 'healthy');
    this.currentIndex = 0;
    this.connections = new Map();
  }

  updateInstances(instances) {
    this.instances = instances.filter(i => i.status === 'healthy');
    if (this.currentIndex >= this.instances.length) {
      this.currentIndex = 0;
    }
  }

  getNext() {
    if (this.instances.length === 0) return null;

    switch (this.strategy) {
      case 'round-robin':
        return this.roundRobin();
      case 'weighted-round-robin':
        return this.weightedRoundRobin();
      case 'least-connections':
        return this.leastConnections();
      case 'random':
        return this.random();
      case 'ip-hash':
        return this.ipHash();
      default:
        return this.roundRobin();
    }
  }

  roundRobin() {
    const instance = this.instances[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.instances.length;
    return instance;
  }

  weightedRoundRobin() {
    const totalWeight = this.instances.reduce((sum, instance) => sum + instance.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    
    for (const instance of this.instances) {
      randomWeight -= instance.weight;
      if (randomWeight <= 0) {
        return instance;
      }
    }
    
    return this.instances[0];
  }

  leastConnections() {
    let selectedInstance = this.instances[0];
    let minConnections = this.connections.get(selectedInstance.id) || 0;

    for (const instance of this.instances) {
      const connectionCount = this.connections.get(instance.id) || 0;
      if (connectionCount < minConnections) {
        selectedInstance = instance;
        minConnections = connectionCount;
      }
    }

    return selectedInstance;
  }

  random() {
    const randomIndex = Math.floor(Math.random() * this.instances.length);
    return this.instances[randomIndex];
  }

  ipHash() {
    // Simple hash based on current time for demo
    const hash = Date.now() % this.instances.length;
    return this.instances[hash];
  }

  incrementConnections(instanceId) {
    const current = this.connections.get(instanceId) || 0;
    this.connections.set(instanceId, current + 1);
  }

  decrementConnections(instanceId) {
    const current = this.connections.get(instanceId) || 0;
    this.connections.set(instanceId, Math.max(0, current - 1));
  }
}

// Service Integration Patterns
class IntegrationPatterns {
  constructor(serviceRegistry) {
    this.registry = serviceRegistry;
    this.eventEmitter = new EventTarget();
    this.subscriptions = new Map();
    this.streamConnections = new Map();
  }

  // Request/Response Pattern
  async requestResponse(serviceName, endpoint, data, options = {}) {
    const instance = this.registry.getHealthyInstance(serviceName);
    if (!instance) {
      throw new Error(`No healthy instances available for service: ${serviceName}`);
    }

    const url = `${instance.url}${endpoint}`;
    const config = {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`Request failed for ${serviceName}:`, error);
      throw error;
    }
  }

  // Event-Driven Pattern
  publishEvent(eventType, payload, options = {}) {
    const event = new CustomEvent(eventType, {
      detail: {
        payload,
        timestamp: Date.now(),
        source: options.source || 'unknown',
        metadata: options.metadata || {}
      }
    });

    this.eventEmitter.dispatchEvent(event);
    console.log(`📡 Event published: ${eventType}`, payload);
  }

  subscribeToEvent(eventType, handler, options = {}) {
    const wrappedHandler = (event) => {
      try {
        handler(event.detail);
      } catch (error) {
        console.error(`Event handler error for ${eventType}:`, error);
      }
    };

    this.eventEmitter.addEventListener(eventType, wrappedHandler);
    
    const subscriptionId = `${eventType}-${Date.now()}`;
    this.subscriptions.set(subscriptionId, {
      eventType,
      handler: wrappedHandler,
      originalHandler: handler,
      options
    });

    console.log(`📨 Subscribed to event: ${eventType}`);
    return subscriptionId;
  }

  unsubscribeFromEvent(subscriptionId) {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.eventEmitter.removeEventListener(subscription.eventType, subscription.handler);
      this.subscriptions.delete(subscriptionId);
      console.log(`📤 Unsubscribed from event: ${subscription.eventType}`);
    }
  }

  // Streaming Pattern
  createStream(serviceName, endpoint, options = {}) {
    const instance = this.registry.getHealthyInstance(serviceName);
    if (!instance) {
      throw new Error(`No healthy instances available for service: ${serviceName}`);
    }

    const streamId = `${serviceName}-${endpoint}-${Date.now()}`;
    const url = `${instance.url}${endpoint}`;

    // WebSocket connection for real-time streaming
    if (options.protocol === 'websocket') {
      const ws = new WebSocket(url.replace('http', 'ws'));
      
      ws.onopen = () => {
        console.log(`🌊 WebSocket stream opened: ${streamId}`);
        if (options.onOpen) options.onOpen();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (options.onData) options.onData(data);
        } catch (error) {
          console.error('Stream data parsing error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(`🚨 WebSocket stream error: ${streamId}`, error);
        if (options.onError) options.onError(error);
      };

      ws.onclose = () => {
        console.log(`🔌 WebSocket stream closed: ${streamId}`);
        this.streamConnections.delete(streamId);
        if (options.onClose) options.onClose();
      };

      this.streamConnections.set(streamId, ws);
      return streamId;
    }

    // Server-Sent Events for server-to-client streaming
    if (options.protocol === 'sse') {
      const eventSource = new EventSource(url);
      
      eventSource.onopen = () => {
        console.log(`📡 SSE stream opened: ${streamId}`);
        if (options.onOpen) options.onOpen();
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (options.onData) options.onData(data);
        } catch (error) {
          console.error('SSE data parsing error:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error(`🚨 SSE stream error: ${streamId}`, error);
        if (options.onError) options.onError(error);
      };

      this.streamConnections.set(streamId, eventSource);
      return streamId;
    }

    throw new Error(`Unsupported streaming protocol: ${options.protocol}`);
  }

  closeStream(streamId) {
    const connection = this.streamConnections.get(streamId);
    if (connection) {
      if (connection instanceof WebSocket) {
        connection.close();
      } else if (connection instanceof EventSource) {
        connection.close();
      }
      this.streamConnections.delete(streamId);
      console.log(`🔌 Stream closed: ${streamId}`);
    }
  }

  // Batch Processing Pattern
  async batchProcess(serviceName, jobs, options = {}) {
    const instance = this.registry.getHealthyInstance(serviceName);
    if (!instance) {
      throw new Error(`No healthy instances available for service: ${serviceName}`);
    }

    const batchSize = options.batchSize || 10;
    const maxConcurrency = options.maxConcurrency || 3;
    const results = [];
    const errors = [];

    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const batchPromises = [];

      for (let j = 0; j < batch.length && j < maxConcurrency; j++) {
        const job = batch[j];
        const promise = this.requestResponse(serviceName, job.endpoint, job.data, job.options)
          .then(result => ({ success: true, result, job }))
          .catch(error => ({ success: false, error, job }));
        
        batchPromises.push(promise);
      }

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach(result => {
        if (result.status === 'fulfilled') {
          if (result.value.success) {
            results.push(result.value.result);
          } else {
            errors.push(result.value.error);
          }
        } else {
          errors.push(result.reason);
        }
      });

      // Optional delay between batches
      if (options.delayBetweenBatches && i + batchSize < jobs.length) {
        await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
      }
    }

    return {
      results,
      errors,
      totalJobs: jobs.length,
      successCount: results.length,
      errorCount: errors.length
    };
  }

  // Circuit Breaker Pattern (integrated with service registry)
  async callWithCircuitBreaker(serviceName, operation, options = {}) {
    const service = this.registry.getService(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    const circuitBreaker = service.circuitBreaker;
    if (!circuitBreaker.enabled) {
      return await operation();
    }

    // Check circuit breaker state
    if (circuitBreaker.state === 'OPEN') {
      const now = Date.now();
      if (now < circuitBreaker.nextAttempt) {
        throw new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
      }
      circuitBreaker.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      
      // Success - reset circuit breaker
      circuitBreaker.failureCount = 0;
      circuitBreaker.state = 'CLOSED';
      
      return result;
    } catch (error) {
      // Failure - update circuit breaker
      circuitBreaker.failureCount++;
      circuitBreaker.lastFailureTime = Date.now();

      if (circuitBreaker.failureCount >= (circuitBreaker.threshold || 5)) {
        circuitBreaker.state = 'OPEN';
        circuitBreaker.nextAttempt = Date.now() + (circuitBreaker.timeout || 60000);
      }

      throw error;
    }
  }

  // Service Mesh Integration
  configureMesh(meshConfig) {
    this.meshConfig = {
      encryption: meshConfig.encryption || true,
      loadBalancing: meshConfig.loadBalancing || true,
      retries: meshConfig.retries || 3,
      timeout: meshConfig.timeout || 30000,
      monitoring: meshConfig.monitoring || true,
      tracing: meshConfig.tracing || false,
      ...meshConfig
    };

    console.log('🕸️ Service mesh configured:', this.meshConfig);
  }

  // Get integration statistics
  getIntegrationStats() {
    return {
      services: this.registry.getAllServices().length,
      subscriptions: this.subscriptions.size,
      activeStreams: this.streamConnections.size,
      healthyServices: this.registry.getAllServices().filter(service => 
        service.instances.some(instance => instance.status === 'healthy')
      ).length
    };
  }
}

// Global Service Registry and Integration
const serviceRegistry = new ServiceRegistry();
const integrationPatterns = new IntegrationPatterns(serviceRegistry);

// Zustand Store for Service Integration
export const useServiceIntegrationStore = create(
  persist(
    (set, get) => ({
      // State
      serviceRegistry,
      integrationPatterns,
      registeredServices: {},
      activeConnections: {},
      integrationMetrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0
      },
      
      // Actions
      registerService: (serviceName, instances, config = {}) => {
        const serviceConfig = serviceRegistry.register(serviceName, instances, config);
        
        set(state => ({
          registeredServices: {
            ...state.registeredServices,
            [serviceName]: serviceConfig
          }
        }));

        return serviceConfig;
      },

      getService: (serviceName) => {
        return serviceRegistry.getService(serviceName);
      },

      getHealthyInstance: (serviceName) => {
        return serviceRegistry.getHealthyInstance(serviceName);
      },

      // Request/Response Pattern
      requestResponse: async (serviceName, endpoint, data, options = {}) => {
        const startTime = Date.now();
        
        try {
          const result = await integrationPatterns.requestResponse(serviceName, endpoint, data, options);
          
          // Update metrics
          const endTime = Date.now();
          const responseTime = endTime - startTime;
          
          set(state => ({
            integrationMetrics: {
              ...state.integrationMetrics,
              totalRequests: state.integrationMetrics.totalRequests + 1,
              successfulRequests: state.integrationMetrics.successfulRequests + 1,
              averageResponseTime: (
                (state.integrationMetrics.averageResponseTime * state.integrationMetrics.successfulRequests + responseTime) /
                (state.integrationMetrics.successfulRequests + 1)
              )
            }
          }));

          return result;
        } catch (error) {
          set(state => ({
            integrationMetrics: {
              ...state.integrationMetrics,
              totalRequests: state.integrationMetrics.totalRequests + 1,
              failedRequests: state.integrationMetrics.failedRequests + 1
            }
          }));
          throw error;
        }
      },

      // Event-Driven Pattern
      publishEvent: (eventType, payload, options = {}) => {
        integrationPatterns.publishEvent(eventType, payload, options);
      },

      subscribeToEvent: (eventType, handler, options = {}) => {
        return integrationPatterns.subscribeToEvent(eventType, handler, options);
      },

      unsubscribeFromEvent: (subscriptionId) => {
        integrationPatterns.unsubscribeFromEvent(subscriptionId);
      },

      // Streaming Pattern
      createStream: (serviceName, endpoint, options = {}) => {
        const streamId = integrationPatterns.createStream(serviceName, endpoint, options);
        
        set(state => ({
          activeConnections: {
            ...state.activeConnections,
            [streamId]: {
              serviceName,
              endpoint,
              protocol: options.protocol,
              createdAt: Date.now()
            }
          }
        }));

        return streamId;
      },

      closeStream: (streamId) => {
        integrationPatterns.closeStream(streamId);
        
        set(state => {
          const { [streamId]: removed, ...remaining } = state.activeConnections;
          return { activeConnections: remaining };
        });
      },

      // Batch Processing
      batchProcess: async (serviceName, jobs, options = {}) => {
        return await integrationPatterns.batchProcess(serviceName, jobs, options);
      },

      // Service Health
      getServiceHealth: (serviceName) => {
        return serviceRegistry.getServiceHealth(serviceName);
      },

      getAllServicesHealth: () => {
        const services = serviceRegistry.getAllServices();
        return services.map(service => ({
          name: service.name,
          health: serviceRegistry.getServiceHealth(service.name)
        }));
      },

      // Integration Statistics
      getIntegrationStats: () => {
        return integrationPatterns.getIntegrationStats();
      },

      // Configuration
      configureMesh: (meshConfig) => {
        integrationPatterns.configureMesh(meshConfig);
      },

      // Cleanup inactive connections
      cleanupConnections: () => {
        const { activeConnections } = get();
        const cutoff = Date.now() - 300000; // 5 minutes ago
        
        const activeConnectionsFiltered = Object.entries(activeConnections)
          .filter(([_, connection]) => connection.createdAt > cutoff)
          .reduce((acc, [id, connection]) => {
            acc[id] = connection;
            return acc;
          }, {});

        set({ activeConnections: activeConnectionsFiltered });
      }
    }),
    {
      name: 'service-integration-store',
      partialize: (state) => ({
        registeredServices: state.registeredServices,
        integrationMetrics: state.integrationMetrics
      })
    }
  )
);

// Periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    useServiceIntegrationStore.getState().cleanupConnections();
  }, 60000); // Every minute
}

export { serviceRegistry, integrationPatterns };
