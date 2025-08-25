import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// API Gateway Types
const GATEWAY_TYPES = {
  REST: 'rest',
  GRAPHQL: 'graphql',
  WEBSOCKET: 'websocket',
  GRPC: 'grpc'
};

const LOAD_BALANCER_STRATEGIES = {
  ROUND_ROBIN: 'round_robin',
  LEAST_CONNECTIONS: 'least_connections',
  WEIGHTED: 'weighted',
  IP_HASH: 'ip_hash',
  HEALTH_BASED: 'health_based'
};

// Route Configuration Manager
class RouteConfigManager {
  constructor() {
    this.routes = new Map();
    this.middlewares = new Map();
    this.routeGroups = new Map();
  }

  addRoute(config) {
    const route = {
      id: config.id || this.generateRouteId(),
      path: config.path,
      method: config.method || 'GET',
      target: config.target,
      type: config.type || GATEWAY_TYPES.REST,
      enabled: config.enabled !== false,
      middleware: config.middleware || [],
      rateLimiting: config.rateLimiting || {},
      caching: config.caching || {},
      authentication: config.authentication || {},
      transformation: config.transformation || {},
      metadata: config.metadata || {},
      createdAt: Date.now()
    };

    this.routes.set(route.id, route);
    console.log(`🛣️ Route added: ${route.method} ${route.path} -> ${route.target}`);
    
    return route;
  }

  removeRoute(routeId) {
    const route = this.routes.get(routeId);
    if (route) {
      this.routes.delete(routeId);
      console.log(`🗑️ Route removed: ${route.method} ${route.path}`);
      return true;
    }
    return false;
  }

  updateRoute(routeId, updates) {
    const route = this.routes.get(routeId);
    if (route) {
      Object.assign(route, updates, { updatedAt: Date.now() });
      console.log(`📝 Route updated: ${route.id}`);
      return route;
    }
    throw new Error(`Route not found: ${routeId}`);
  }

  findRoute(method, path) {
    for (const route of this.routes.values()) {
      if (route.enabled && this.matchRoute(route, method, path)) {
        return route;
      }
    }
    return null;
  }

  matchRoute(route, method, path) {
    if (route.method !== method && route.method !== 'ALL') {
      return false;
    }

    // Convert route path to regex pattern
    const routePattern = route.path
      .replace(/\{([^}]+)\}/g, '(?<$1>[^/]+)') // Named parameters
      .replace(/\*/g, '.*'); // Wildcard

    const regex = new RegExp(`^${routePattern}$`);
    return regex.test(path);
  }

  getRoutes(filter = {}) {
    const routes = Array.from(this.routes.values());
    
    if (filter.enabled !== undefined) {
      return routes.filter(route => route.enabled === filter.enabled);
    }
    
    if (filter.type) {
      return routes.filter(route => route.type === filter.type);
    }
    
    return routes;
  }

  addMiddleware(name, handler) {
    this.middlewares.set(name, {
      name,
      handler,
      createdAt: Date.now()
    });
    
    console.log(`🔧 Middleware added: ${name}`);
  }

  generateRouteId() {
    return `route_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Request/Response Transformer
class RequestTransformer {
  constructor() {
    this.transformers = new Map();
  }

  addTransformer(name, config) {
    this.transformers.set(name, {
      name,
      requestTransform: config.requestTransform,
      responseTransform: config.responseTransform,
      createdAt: Date.now()
    });
    
    console.log(`🔄 Transformer added: ${name}`);
  }

  async transformRequest(transformerName, request) {
    const transformer = this.transformers.get(transformerName);
    if (!transformer || !transformer.requestTransform) {
      return request;
    }

    try {
      return await transformer.requestTransform(request);
    } catch (error) {
      console.error(`Request transformation failed for ${transformerName}:`, error);
      throw error;
    }
  }

  async transformResponse(transformerName, response) {
    const transformer = this.transformers.get(transformerName);
    if (!transformer || !transformer.responseTransform) {
      return response;
    }

    try {
      return await transformer.responseTransform(response);
    } catch (error) {
      console.error(`Response transformation failed for ${transformerName}:`, error);
      throw error;
    }
  }

  getTransformers() {
    return Array.from(this.transformers.values());
  }
}

// Load Balancer
class LoadBalancer {
  constructor() {
    this.strategies = new Map();
    this.setupStrategies();
  }

  setupStrategies() {
    // Round Robin Strategy
    this.strategies.set(LOAD_BALANCER_STRATEGIES.ROUND_ROBIN, {
      name: 'Round Robin',
      select: (targets, context) => {
        if (!context.roundRobinIndex) context.roundRobinIndex = 0;
        const target = targets[context.roundRobinIndex % targets.length];
        context.roundRobinIndex++;
        return target;
      }
    });

    // Least Connections Strategy
    this.strategies.set(LOAD_BALANCER_STRATEGIES.LEAST_CONNECTIONS, {
      name: 'Least Connections',
      select: (targets) => {
        return targets.reduce((least, current) => 
          (current.connections || 0) < (least.connections || 0) ? current : least
        );
      }
    });

    // Weighted Strategy
    this.strategies.set(LOAD_BALANCER_STRATEGIES.WEIGHTED, {
      name: 'Weighted',
      select: (targets) => {
        const totalWeight = targets.reduce((sum, target) => sum + (target.weight || 1), 0);
        const random = Math.random() * totalWeight;
        
        let currentWeight = 0;
        for (const target of targets) {
          currentWeight += target.weight || 1;
          if (random <= currentWeight) {
            return target;
          }
        }
        
        return targets[0];
      }
    });

    // IP Hash Strategy
    this.strategies.set(LOAD_BALANCER_STRATEGIES.IP_HASH, {
      name: 'IP Hash',
      select: (targets, context) => {
        const ip = context.request?.ip || context.ip || '127.0.0.1';
        const hash = this.hashString(ip);
        return targets[hash % targets.length];
      }
    });

    // Health Based Strategy
    this.strategies.set(LOAD_BALANCER_STRATEGIES.HEALTH_BASED, {
      name: 'Health Based',
      select: (targets) => {
        const healthyTargets = targets.filter(target => target.health?.status === 'healthy');
        if (healthyTargets.length === 0) {
          console.warn('No healthy targets available, using all targets');
          return targets[0];
        }
        
        // Use round robin on healthy targets
        return healthyTargets[Math.floor(Math.random() * healthyTargets.length)];
      }
    });
  }

  selectTarget(targets, strategy = LOAD_BALANCER_STRATEGIES.ROUND_ROBIN, context = {}) {
    const strategyHandler = this.strategies.get(strategy);
    if (!strategyHandler) {
      throw new Error(`Load balancer strategy not found: ${strategy}`);
    }

    const availableTargets = targets.filter(target => target.enabled !== false);
    if (availableTargets.length === 0) {
      throw new Error('No available targets for load balancing');
    }

    return strategyHandler.select(availableTargets, context);
  }

  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  getStrategies() {
    return Array.from(this.strategies.keys());
  }
}

// Health Check Manager
class HealthCheckManager {
  constructor() {
    this.healthChecks = new Map();
    this.healthStatus = new Map();
    this.checkInterval = 30000; // 30 seconds
    this.isRunning = false;
  }

  addHealthCheck(targetId, config) {
    const healthCheck = {
      targetId,
      url: config.url,
      method: config.method || 'GET',
      timeout: config.timeout || 5000,
      interval: config.interval || this.checkInterval,
      expectedStatus: config.expectedStatus || [200, 201, 204],
      headers: config.headers || {},
      enabled: config.enabled !== false,
      createdAt: Date.now()
    };

    this.healthChecks.set(targetId, healthCheck);
    
    // Initialize health status
    this.healthStatus.set(targetId, {
      status: 'unknown',
      lastCheck: null,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      uptime: 0,
      responseTime: null
    });

    console.log(`🏥 Health check added for target: ${targetId}`);
  }

  removeHealthCheck(targetId) {
    this.healthChecks.delete(targetId);
    this.healthStatus.delete(targetId);
    console.log(`🗑️ Health check removed for target: ${targetId}`);
  }

  async performHealthCheck(targetId) {
    const healthCheck = this.healthChecks.get(targetId);
    if (!healthCheck || !healthCheck.enabled) {
      return null;
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(healthCheck.url, {
        method: healthCheck.method,
        headers: healthCheck.headers,
        signal: AbortSignal.timeout(healthCheck.timeout)
      });

      const responseTime = Date.now() - startTime;
      const isHealthy = healthCheck.expectedStatus.includes(response.status);
      
      this.updateHealthStatus(targetId, {
        status: isHealthy ? 'healthy' : 'unhealthy',
        lastCheck: Date.now(),
        responseTime,
        error: isHealthy ? null : `Unexpected status: ${response.status}`
      });

      return {
        healthy: isHealthy,
        responseTime,
        status: response.status
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.updateHealthStatus(targetId, {
        status: 'unhealthy',
        lastCheck: Date.now(),
        responseTime,
        error: error.message
      });

      return {
        healthy: false,
        responseTime,
        error: error.message
      };
    }
  }

  updateHealthStatus(targetId, update) {
    const currentStatus = this.healthStatus.get(targetId);
    if (!currentStatus) return;

    const newStatus = { ...currentStatus, ...update };

    // Update consecutive counters
    if (update.status === 'healthy') {
      newStatus.consecutiveSuccesses = (currentStatus.consecutiveSuccesses || 0) + 1;
      newStatus.consecutiveFailures = 0;
    } else if (update.status === 'unhealthy') {
      newStatus.consecutiveFailures = (currentStatus.consecutiveFailures || 0) + 1;
      newStatus.consecutiveSuccesses = 0;
    }

    this.healthStatus.set(targetId, newStatus);
  }

  async performAllHealthChecks() {
    const checks = Array.from(this.healthChecks.keys());
    const results = await Promise.allSettled(
      checks.map(targetId => this.performHealthCheck(targetId))
    );

    return checks.reduce((acc, targetId, index) => {
      acc[targetId] = results[index].status === 'fulfilled' 
        ? results[index].value 
        : { healthy: false, error: results[index].reason?.message };
      return acc;
    }, {});
  }

  startHealthChecks() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performAllHealthChecks();
      } catch (error) {
        console.error('Health check batch failed:', error);
      }
    }, this.checkInterval);

    console.log('🏥 Health checks started');
  }

  stopHealthChecks() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    this.isRunning = false;
    console.log('🏥 Health checks stopped');
  }

  getHealthStatus(targetId = null) {
    if (targetId) {
      return this.healthStatus.get(targetId);
    }
    return Object.fromEntries(this.healthStatus);
  }

  getHealthySummary() {
    const statuses = Array.from(this.healthStatus.values());
    const total = statuses.length;
    const healthy = statuses.filter(status => status.status === 'healthy').length;
    const unhealthy = statuses.filter(status => status.status === 'unhealthy').length;
    const unknown = statuses.filter(status => status.status === 'unknown').length;

    return {
      total,
      healthy,
      unhealthy,
      unknown,
      healthPercentage: total > 0 ? (healthy / total) * 100 : 0
    };
  }
}

// API Gateway Manager
class ApiGatewayManager {
  constructor() {
    this.routeManager = new RouteConfigManager();
    this.transformer = new RequestTransformer();
    this.loadBalancer = new LoadBalancer();
    this.healthChecker = new HealthCheckManager();
    
    this.requestLog = new Map();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      requestsPerSecond: 0
    };

    this.setupDefaultTransformers();
    this.healthChecker.startHealthChecks();
  }

  setupDefaultTransformers() {
    // JSON to XML transformer
    this.transformer.addTransformer('json-to-xml', {
      requestTransform: (request) => {
        if (request.headers['content-type']?.includes('application/json')) {
          request.body = this.jsonToXml(JSON.parse(request.body));
          request.headers['content-type'] = 'application/xml';
        }
        return request;
      },
      responseTransform: (response) => {
        if (response.headers['content-type']?.includes('application/xml')) {
          response.body = JSON.stringify(this.xmlToJson(response.body));
          response.headers['content-type'] = 'application/json';
        }
        return response;
      }
    });

    // Add API version header
    this.transformer.addTransformer('add-version', {
      requestTransform: (request) => {
        request.headers['X-API-Version'] = '2.0';
        return request;
      }
    });

    // Response formatting
    this.transformer.addTransformer('format-response', {
      responseTransform: (response) => {
        return {
          ...response,
          body: JSON.stringify({
            success: response.status >= 200 && response.status < 300,
            data: JSON.parse(response.body || '{}'),
            timestamp: new Date().toISOString(),
            version: '2.0'
          })
        };
      }
    });
  }

  async processRequest(request) {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    try {
      // Find matching route
      const route = this.routeManager.findRoute(request.method, request.path);
      if (!route) {
        throw new Error(`No route found for ${request.method} ${request.path}`);
      }

      console.log(`🌐 Processing request: ${requestId} - ${request.method} ${request.path}`);

      // Apply request transformations
      let transformedRequest = request;
      if (route.transformation?.request) {
        transformedRequest = await this.transformer.transformRequest(
          route.transformation.request,
          request
        );
      }

      // Select target using load balancer
      const targets = Array.isArray(route.target) ? route.target : [{ url: route.target }];
      const selectedTarget = this.loadBalancer.selectTarget(
        targets,
        route.loadBalancing?.strategy,
        { request: transformedRequest, requestId }
      );

      // Forward request to target
      const response = await this.forwardRequest(transformedRequest, selectedTarget, route);

      // Apply response transformations
      let transformedResponse = response;
      if (route.transformation?.response) {
        transformedResponse = await this.transformer.transformResponse(
          route.transformation.response,
          response
        );
      }

      // Log successful request
      const responseTime = Date.now() - startTime;
      this.logRequest(requestId, {
        request: transformedRequest,
        response: transformedResponse,
        route,
        target: selectedTarget,
        responseTime,
        success: true
      });

      this.updateMetrics(true, responseTime);
      
      return transformedResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Log failed request
      this.logRequest(requestId, {
        request,
        error: error.message,
        responseTime,
        success: false
      });

      this.updateMetrics(false, responseTime);
      
      console.error(`❌ Request failed: ${requestId} - ${error.message}`);
      throw error;
    }
  }

  async forwardRequest(request, target, route) {
    const targetUrl = new URL(request.path, target.url);
    
    // Add query parameters
    if (request.query) {
      Object.entries(request.query).forEach(([key, value]) => {
        targetUrl.searchParams.append(key, value);
      });
    }

    const fetchOptions = {
      method: request.method,
      headers: {
        ...request.headers,
        'X-Forwarded-For': request.ip,
        'X-Request-ID': request.requestId
      }
    };

    // Add body for non-GET requests
    if (request.method !== 'GET' && request.body) {
      fetchOptions.body = typeof request.body === 'string' 
        ? request.body 
        : JSON.stringify(request.body);
    }

    // Apply timeout
    if (route.timeout) {
      fetchOptions.signal = AbortSignal.timeout(route.timeout);
    }

    const response = await fetch(targetUrl.toString(), fetchOptions);
    
    return {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: await response.text()
    };
  }

  logRequest(requestId, logData) {
    this.requestLog.set(requestId, {
      ...logData,
      timestamp: Date.now()
    });

    // Keep only last 1000 requests in memory
    if (this.requestLog.size > 1000) {
      const oldestKey = this.requestLog.keys().next().value;
      this.requestLog.delete(oldestKey);
    }
  }

  updateMetrics(success, responseTime) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    // Update average response time
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
      this.metrics.totalRequests;
  }

  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  jsonToXml(obj, rootName = 'root') {
    const xml = Object.entries(obj)
      .map(([key, value]) => {
        if (typeof value === 'object') {
          return `<${key}>${this.jsonToXml(value)}</${key}>`;
        }
        return `<${key}>${value}</${key}>`;
      })
      .join('');
    
    return `<${rootName}>${xml}</${rootName}>`;
  }

  xmlToJson(xml) {
    // Simple XML to JSON converter (would use a proper library in production)
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    return this.xmlNodeToJson(doc.documentElement);
  }

  xmlNodeToJson(node) {
    const obj = {};
    
    if (node.children.length === 0) {
      return node.textContent;
    }
    
    for (const child of node.children) {
      if (obj[child.tagName]) {
        if (!Array.isArray(obj[child.tagName])) {
          obj[child.tagName] = [obj[child.tagName]];
        }
        obj[child.tagName].push(this.xmlNodeToJson(child));
      } else {
        obj[child.tagName] = this.xmlNodeToJson(child);
      }
    }
    
    return obj;
  }

  getRoutes() {
    return this.routeManager.getRoutes();
  }

  addRoute(config) {
    return this.routeManager.addRoute(config);
  }

  removeRoute(routeId) {
    return this.routeManager.removeRoute(routeId);
  }

  getMetrics() {
    return {
      ...this.metrics,
      healthSummary: this.healthChecker.getHealthySummary(),
      uptime: Date.now() - (this.startTime || Date.now())
    };
  }

  getRequestLogs(limit = 100) {
    const logs = Array.from(this.requestLog.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
    
    return logs;
  }

  addHealthCheck(targetId, config) {
    return this.healthChecker.addHealthCheck(targetId, config);
  }

  getHealthStatus(targetId = null) {
    return this.healthChecker.getHealthStatus(targetId);
  }
}

// Global API Gateway instance
const apiGateway = new ApiGatewayManager();

// Zustand Store for API Gateway
export const useApiGatewayStore = create(
  persist(
    (set, get) => ({
      // State
      apiGateway,
      routes: [],
      metrics: {},
      healthStatus: {},
      requestLogs: [],
      isLoading: false,
      error: null,

      // Actions
      loadRoutes: () => {
        const routes = apiGateway.getRoutes();
        set({ routes });
        return routes;
      },

      addRoute: (config) => {
        try {
          const route = apiGateway.addRoute(config);
          get().loadRoutes();
          return route;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      removeRoute: (routeId) => {
        try {
          const success = apiGateway.removeRoute(routeId);
          if (success) {
            get().loadRoutes();
          }
          return success;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      updateRoute: (routeId, updates) => {
        try {
          const route = apiGateway.routeManager.updateRoute(routeId, updates);
          get().loadRoutes();
          return route;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      processRequest: async (request) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiGateway.processRequest(request);
          set({ isLoading: false });
          return response;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      loadMetrics: () => {
        const metrics = apiGateway.getMetrics();
        set({ metrics });
        return metrics;
      },

      loadHealthStatus: () => {
        const healthStatus = apiGateway.getHealthStatus();
        set({ healthStatus });
        return healthStatus;
      },

      loadRequestLogs: (limit = 100) => {
        const requestLogs = apiGateway.getRequestLogs(limit);
        set({ requestLogs });
        return requestLogs;
      },

      addHealthCheck: (targetId, config) => {
        try {
          apiGateway.addHealthCheck(targetId, config);
          get().loadHealthStatus();
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      getLoadBalancerStrategies: () => {
        return apiGateway.loadBalancer.getStrategies();
      },

      addTransformer: (name, config) => {
        try {
          apiGateway.transformer.addTransformer(name, config);
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'api-gateway-store',
      partialize: (state) => ({
        routes: state.routes
      })
    }
  )
);

// Auto refresh metrics and health status
if (typeof window !== 'undefined') {
  setInterval(() => {
    const { loadMetrics, loadHealthStatus } = useApiGatewayStore.getState();
    loadMetrics();
    loadHealthStatus();
  }, 10000); // Every 10 seconds
}

export { 
  apiGateway, 
  GATEWAY_TYPES, 
  LOAD_BALANCER_STRATEGIES 
};
