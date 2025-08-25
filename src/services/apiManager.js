import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';

// API Configuration Types
const API_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
const CACHE_STRATEGIES = ['memory', 'localStorage', 'sessionStorage', 'redis'];
const RETRY_STRATEGIES = ['linear', 'exponential', 'fixed'];

// Rate Limiting Implementation
class RateLimiter {
  constructor() {
    this.buckets = new Map();
    this.rules = new Map();
  }

  addRule(clientId, requests, windowMs) {
    this.rules.set(clientId, { requests, windowMs, reset: Date.now() + windowMs });
  }

  checkLimit(clientId) {
    const rule = this.rules.get(clientId) || this.rules.get('default');
    if (!rule) return { allowed: true, remaining: Infinity };

    const now = Date.now();
    if (now > rule.reset) {
      rule.count = 0;
      rule.reset = now + rule.windowMs;
    }

    const bucket = this.buckets.get(clientId) || { count: 0, reset: rule.reset };
    
    if (bucket.count >= rule.requests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: bucket.reset
      };
    }

    bucket.count++;
    this.buckets.set(clientId, bucket);

    return {
      allowed: true,
      remaining: rule.requests - bucket.count,
      resetTime: bucket.reset
    };
  }
}

// Request/Response Transformer
class DataTransformer {
  constructor() {
    this.transformers = new Map();
  }

  registerTransformer(key, requestTransform, responseTransform) {
    this.transformers.set(key, {
      request: requestTransform,
      response: responseTransform
    });
  }

  transformRequest(key, data) {
    const transformer = this.transformers.get(key);
    return transformer?.request ? transformer.request(data) : data;
  }

  transformResponse(key, data) {
    const transformer = this.transformers.get(key);
    return transformer?.response ? transformer.response(data) : data;
  }
}

// Circuit Breaker for External Services
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.recoveryTimeout = options.recoveryTimeout || 60000;
    this.monitoringPeriod = options.monitoringPeriod || 10000;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = Date.now();
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.recoveryTimeout;
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.nextAttempt
    };
  }
}

// Advanced Cache Manager
class CacheManager {
  constructor() {
    this.stores = {
      memory: new Map(),
      localStorage: typeof window !== 'undefined' ? window.localStorage : null,
      sessionStorage: typeof window !== 'undefined' ? window.sessionStorage : null
    };
    this.ttlTimers = new Map();
  }

  set(key, value, ttl = 0, strategy = 'memory') {
    const timestamp = Date.now();
    const cacheItem = {
      value,
      timestamp,
      ttl,
      hits: 0
    };

    switch (strategy) {
      case 'memory':
        this.stores.memory.set(key, cacheItem);
        break;
      case 'localStorage':
        if (this.stores.localStorage) {
          this.stores.localStorage.setItem(key, JSON.stringify(cacheItem));
        }
        break;
      case 'sessionStorage':
        if (this.stores.sessionStorage) {
          this.stores.sessionStorage.setItem(key, JSON.stringify(cacheItem));
        }
        break;
    }

    if (ttl > 0) {
      this.ttlTimers.set(key, setTimeout(() => {
        this.delete(key, strategy);
      }, ttl));
    }
  }

  get(key, strategy = 'memory') {
    let cacheItem;

    switch (strategy) {
      case 'memory':
        cacheItem = this.stores.memory.get(key);
        break;
      case 'localStorage':
        if (this.stores.localStorage) {
          const stored = this.stores.localStorage.getItem(key);
          cacheItem = stored ? JSON.parse(stored) : null;
        }
        break;
      case 'sessionStorage':
        if (this.stores.sessionStorage) {
          const stored = this.stores.sessionStorage.getItem(key);
          cacheItem = stored ? JSON.parse(stored) : null;
        }
        break;
    }

    if (!cacheItem) return null;

    const now = Date.now();
    if (cacheItem.ttl > 0 && now - cacheItem.timestamp > cacheItem.ttl) {
      this.delete(key, strategy);
      return null;
    }

    cacheItem.hits++;
    this.set(key, cacheItem.value, cacheItem.ttl, strategy);

    return cacheItem.value;
  }

  delete(key, strategy = 'memory') {
    switch (strategy) {
      case 'memory':
        this.stores.memory.delete(key);
        break;
      case 'localStorage':
        if (this.stores.localStorage) {
          this.stores.localStorage.removeItem(key);
        }
        break;
      case 'sessionStorage':
        if (this.stores.sessionStorage) {
          this.stores.sessionStorage.removeItem(key);
        }
        break;
    }

    if (this.ttlTimers.has(key)) {
      clearTimeout(this.ttlTimers.get(key));
      this.ttlTimers.delete(key);
    }
  }

  clear(strategy = 'memory') {
    switch (strategy) {
      case 'memory':
        this.stores.memory.clear();
        break;
      case 'localStorage':
        if (this.stores.localStorage) {
          this.stores.localStorage.clear();
        }
        break;
      case 'sessionStorage':
        if (this.stores.sessionStorage) {
          this.stores.sessionStorage.clear();
        }
        break;
    }

    this.ttlTimers.forEach(timer => clearTimeout(timer));
    this.ttlTimers.clear();
  }

  getStats() {
    const memoryStats = {
      size: this.stores.memory.size,
      items: Array.from(this.stores.memory.entries()).map(([key, item]) => ({
        key,
        hits: item.hits,
        age: Date.now() - item.timestamp,
        ttl: item.ttl
      }))
    };

    return { memory: memoryStats };
  }
}

// Main API Manager Class
class ApiManager {
  constructor() {
    this.services = new Map();
    this.interceptors = {
      request: [],
      response: []
    };
    this.rateLimiter = new RateLimiter();
    this.transformer = new DataTransformer();
    this.cache = new CacheManager();
    this.circuitBreakers = new Map();
    this.metrics = new Map();
    
    // Default configuration
    this.config = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      cacheEnabled: true,
      metricsEnabled: true
    };

    // Set up default rate limiting
    this.rateLimiter.addRule('default', 100, 60000); // 100 requests per minute
  }

  // Service Registration
  registerService(name, config) {
    const serviceConfig = {
      name,
      baseUrl: config.baseUrl,
      version: config.version || 'v1',
      timeout: config.timeout || this.config.timeout,
      retries: config.retries || this.config.retries,
      authentication: config.authentication || null,
      headers: config.headers || {},
      rateLimiting: config.rateLimiting || { requests: 100, windowMs: 60000 },
      caching: config.caching || { enabled: true, ttl: 300000 },
      circuitBreaker: config.circuitBreaker || { enabled: true },
      healthEndpoint: config.healthEndpoint || '/health',
      ...config
    };

    this.services.set(name, serviceConfig);

    // Set up rate limiting for this service
    if (serviceConfig.rateLimiting) {
      this.rateLimiter.addRule(
        name, 
        serviceConfig.rateLimiting.requests, 
        serviceConfig.rateLimiting.windowMs
      );
    }

    // Set up circuit breaker
    if (serviceConfig.circuitBreaker?.enabled) {
      this.circuitBreakers.set(name, new CircuitBreaker(serviceConfig.circuitBreaker));
    }

    console.log(`✅ Service registered: ${name}`);
    return serviceConfig;
  }

  // Request Interceptors
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  // Main API Request Method
  async request(serviceName, endpoint, options = {}) {
    const startTime = performance.now();
    const service = this.services.get(serviceName);
    
    if (!service) {
      throw new Error(`Service '${serviceName}' not registered`);
    }

    // Check rate limiting
    const rateLimitCheck = this.rateLimiter.checkLimit(serviceName);
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded for service '${serviceName}'. Reset at: ${new Date(rateLimitCheck.resetTime)}`);
    }

    // Build request configuration
    const requestConfig = this.buildRequestConfig(service, endpoint, options);
    
    // Check cache first
    if (options.method === 'GET' && service.caching?.enabled) {
      const cacheKey = this.generateCacheKey(serviceName, endpoint, options.params);
      const cachedResponse = this.cache.get(cacheKey);
      
      if (cachedResponse) {
        this.recordMetrics(serviceName, endpoint, 'cache-hit', performance.now() - startTime);
        return cachedResponse;
      }
    }

    // Execute request with circuit breaker
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    
    try {
      const response = circuitBreaker 
        ? await circuitBreaker.execute(() => this.executeRequest(requestConfig))
        : await this.executeRequest(requestConfig);

      // Cache successful GET responses
      if (options.method === 'GET' && service.caching?.enabled && response.ok) {
        const cacheKey = this.generateCacheKey(serviceName, endpoint, options.params);
        const responseData = await response.clone().json();
        this.cache.set(cacheKey, responseData, service.caching.ttl);
      }

      const endTime = performance.now();
      this.recordMetrics(serviceName, endpoint, 'success', endTime - startTime);

      return response;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetrics(serviceName, endpoint, 'error', endTime - startTime);
      throw error;
    }
  }

  // Build Request Configuration
  buildRequestConfig(service, endpoint, options) {
    const url = `${service.baseUrl}${endpoint}`;
    const method = options.method || 'GET';
    
    let headers = {
      'Content-Type': 'application/json',
      ...service.headers,
      ...options.headers
    };

    // Add authentication headers
    if (service.authentication) {
      headers = this.addAuthenticationHeaders(headers, service.authentication);
    }

    // Transform request data
    let body = options.data;
    if (body) {
      body = this.transformer.transformRequest(`${service.name}.${endpoint}`, body);
      body = JSON.stringify(body);
    }

    return {
      url,
      method,
      headers,
      body,
      timeout: options.timeout || service.timeout,
      signal: options.signal
    };
  }

  // Execute HTTP Request
  async executeRequest(config) {
    // Apply request interceptors
    for (const interceptor of this.interceptors.request) {
      config = await interceptor(config);
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.timeout);

    try {
      const response = await fetch(config.url, {
        method: config.method,
        headers: config.headers,
        body: config.body,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Apply response interceptors
      let processedResponse = response;
      for (const interceptor of this.interceptors.response) {
        processedResponse = await interceptor(processedResponse);
      }

      return processedResponse;
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // Authentication Headers
  addAuthenticationHeaders(headers, authConfig) {
    switch (authConfig.type) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${authConfig.token}`;
        break;
      case 'basic':
        const credentials = btoa(`${authConfig.username}:${authConfig.password}`);
        headers['Authorization'] = `Basic ${credentials}`;
        break;
      case 'apikey':
        headers[authConfig.header || 'X-API-Key'] = authConfig.key;
        break;
      default:
        break;
    }
    return headers;
  }

  // Cache Key Generation
  generateCacheKey(serviceName, endpoint, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${serviceName}:${endpoint}:${paramString}`;
  }

  // Metrics Recording
  recordMetrics(serviceName, endpoint, status, duration) {
    if (!this.config.metricsEnabled) return;

    const key = `${serviceName}:${endpoint}`;
    const metric = this.metrics.get(key) || {
      total: 0,
      success: 0,
      error: 0,
      cacheHit: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0
    };

    metric.total++;
    metric[status === 'cache-hit' ? 'cacheHit' : status]++;
    
    if (status !== 'cache-hit') {
      metric.avgDuration = ((metric.avgDuration * (metric.total - 1)) + duration) / metric.total;
      metric.minDuration = Math.min(metric.minDuration, duration);
      metric.maxDuration = Math.max(metric.maxDuration, duration);
    }

    this.metrics.set(key, metric);
  }

  // Health Check
  async healthCheck(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) return { status: 'unknown', service: serviceName };

    try {
      const response = await this.request(serviceName, service.healthEndpoint, {
        method: 'GET',
        timeout: 5000
      });

      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        service: serviceName,
        responseTime: performance.now(),
        statusCode: response.status
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        service: serviceName,
        error: error.message
      };
    }
  }

  // Utility Methods
  getServiceConfig(serviceName) {
    return this.services.get(serviceName);
  }

  getMetrics(serviceName = null) {
    if (serviceName) {
      return Array.from(this.metrics.entries())
        .filter(([key]) => key.startsWith(serviceName))
        .reduce((acc, [key, value]) => {
          acc[key] = value;
          return acc;
        }, {});
    }
    return Object.fromEntries(this.metrics);
  }

  getCircuitBreakerStatus(serviceName) {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    return circuitBreaker ? circuitBreaker.getState() : null;
  }

  getCacheStats() {
    return this.cache.getStats();
  }

  clearCache(strategy = 'memory') {
    this.cache.clear(strategy);
  }

  // Data Transformation Registration
  registerTransformer(serviceName, endpoint, requestTransform, responseTransform) {
    const key = `${serviceName}.${endpoint}`;
    this.transformer.registerTransformer(key, requestTransform, responseTransform);
  }
}

// Global API Manager Instance
const apiManager = new ApiManager();

// Zustand Store for API Management
export const useApiStore = create(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // State
        apiManager,
        services: {},
        activeRequests: new Map(),
        metrics: {},
        errors: [],
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        
        // Actions
        registerService: (name, config) => {
          const serviceConfig = apiManager.registerService(name, config);
          set(state => ({
            services: {
              ...state.services,
              [name]: serviceConfig
            }
          }));
          return serviceConfig;
        },

        request: async (serviceName, endpoint, options = {}) => {
          const requestId = `${serviceName}:${endpoint}:${Date.now()}`;
          
          // Track active request
          set(state => ({
            activeRequests: new Map(state.activeRequests).set(requestId, {
              serviceName,
              endpoint,
              startTime: Date.now(),
              status: 'pending'
            })
          }));

          try {
            const response = await apiManager.request(serviceName, endpoint, options);
            
            // Update active request status
            set(state => {
              const newActiveRequests = new Map(state.activeRequests);
              const request = newActiveRequests.get(requestId);
              if (request) {
                request.status = 'completed';
                request.endTime = Date.now();
                newActiveRequests.set(requestId, request);
              }
              return { activeRequests: newActiveRequests };
            });

            // Update metrics
            get().updateMetrics();
            
            return response;
          } catch (error) {
            // Update active request status
            set(state => {
              const newActiveRequests = new Map(state.activeRequests);
              const request = newActiveRequests.get(requestId);
              if (request) {
                request.status = 'error';
                request.error = error.message;
                request.endTime = Date.now();
                newActiveRequests.set(requestId, request);
              }
              return { activeRequests: newActiveRequests };
            });

            // Log error
            get().logError(error, { serviceName, endpoint });
            
            throw error;
          }
        },

        updateMetrics: () => {
          const metrics = apiManager.getMetrics();
          set({ metrics });
        },

        logError: (error, context = {}) => {
          set(state => ({
            errors: [
              ...state.errors.slice(-99), // Keep last 100 errors
              {
                id: Date.now(),
                message: error.message,
                stack: error.stack,
                context,
                timestamp: Date.now()
              }
            ]
          }));
        },

        clearErrors: () => {
          set({ errors: [] });
        },

        healthCheckAll: async () => {
          const { services } = get();
          const healthChecks = await Promise.allSettled(
            Object.keys(services).map(serviceName => 
              apiManager.healthCheck(serviceName)
            )
          );

          return healthChecks.map((result, index) => ({
            service: Object.keys(services)[index],
            ...result.value
          }));
        },

        setOnlineStatus: (isOnline) => {
          set({ isOnline });
        },

        // Configuration
        updateServiceConfig: (serviceName, updates) => {
          const service = apiManager.getServiceConfig(serviceName);
          if (service) {
            const updatedConfig = { ...service, ...updates };
            apiManager.registerService(serviceName, updatedConfig);
            
            set(state => ({
              services: {
                ...state.services,
                [serviceName]: updatedConfig
              }
            }));
          }
        },

        // Cleanup completed requests periodically
        cleanupRequests: () => {
          set(state => {
            const cutoff = Date.now() - 300000; // 5 minutes ago
            const filteredRequests = new Map();
            
            state.activeRequests.forEach((request, id) => {
              if (request.endTime && request.endTime < cutoff) {
                return; // Remove old completed requests
              }
              filteredRequests.set(id, request);
            });

            return { activeRequests: filteredRequests };
          });
        }
      }),
      {
        name: 'api-store',
        partialize: (state) => ({
          services: state.services,
          isOnline: state.isOnline
        })
      }
    )
  )
);

// Network status monitoring
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useApiStore.getState().setOnlineStatus(true);
  });

  window.addEventListener('offline', () => {
    useApiStore.getState().setOnlineStatus(false);
  });

  // Cleanup requests periodically
  setInterval(() => {
    useApiStore.getState().cleanupRequests();
  }, 60000); // Every minute
}

export { apiManager };
