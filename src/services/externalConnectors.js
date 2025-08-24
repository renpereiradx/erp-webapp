import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Connector Types
const CONNECTOR_TYPES = {
  REST: 'rest',
  GRAPHQL: 'graphql',
  WEBSOCKET: 'websocket',
  DATABASE: 'database',
  FILE_SYSTEM: 'file_system',
  MESSAGE_QUEUE: 'message_queue',
  THIRD_PARTY: 'third_party',
  SOAP: 'soap',
  FTP: 'ftp',
  EMAIL: 'email'
};

const CONNECTION_STATUS = {
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  CONNECTING: 'connecting',
  ERROR: 'error',
  TIMEOUT: 'timeout'
};

// Base Connector Class
class BaseConnector {
  constructor(config) {
    this.id = config.id || this.generateId();
    this.name = config.name;
    this.type = config.type;
    this.config = config;
    this.status = CONNECTION_STATUS.DISCONNECTED;
    this.lastError = null;
    this.connectionAttempts = 0;
    this.maxRetries = config.maxRetries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.createdAt = Date.now();
    this.lastConnected = null;
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0
    };
  }

  generateId() {
    return `connector_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async connect() {
    throw new Error('connect method must be implemented by subclass');
  }

  async disconnect() {
    throw new Error('disconnect method must be implemented by subclass');
  }

  async testConnection() {
    throw new Error('testConnection method must be implemented by subclass');
  }

  async execute(operation, params = {}) {
    throw new Error('execute method must be implemented by subclass');
  }

  updateMetrics(success, responseTime) {
    this.metrics.totalRequests++;
    
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }

    if (responseTime) {
      this.metrics.averageResponseTime = 
        (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) / 
        this.metrics.totalRequests;
    }
  }

  setStatus(status, error = null) {
    this.status = status;
    if (error) {
      this.lastError = error;
    }
    if (status === CONNECTION_STATUS.CONNECTED) {
      this.lastConnected = Date.now();
      this.connectionAttempts = 0;
    }
  }

  getInfo() {
    return {
      id: this.id,
      name: this.name,
      type: this.type,
      status: this.status,
      lastError: this.lastError,
      lastConnected: this.lastConnected,
      metrics: this.metrics,
      uptime: this.lastConnected ? Date.now() - this.lastConnected : 0
    };
  }
}

// REST API Connector
class RestConnector extends BaseConnector {
  constructor(config) {
    super({ ...config, type: CONNECTOR_TYPES.REST });
    this.baseUrl = config.baseUrl;
    this.headers = config.headers || {};
    this.authentication = config.authentication || {};
  }

  async connect() {
    try {
      this.setStatus(CONNECTION_STATUS.CONNECTING);
      
      // Test connection with a simple request
      const testResult = await this.testConnection();
      if (testResult.success) {
        this.setStatus(CONNECTION_STATUS.CONNECTED);
        console.log(`🔗 REST connector connected: ${this.name}`);
        return true;
      } else {
        throw new Error(testResult.error);
      }
    } catch (error) {
      this.setStatus(CONNECTION_STATUS.ERROR, error.message);
      console.error(`❌ REST connector failed: ${this.name}`, error);
      return false;
    }
  }

  async disconnect() {
    this.setStatus(CONNECTION_STATUS.DISCONNECTED);
    console.log(`🔌 REST connector disconnected: ${this.name}`);
  }

  async testConnection() {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'HEAD',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000)
      });

      return {
        success: response.ok,
        error: response.ok ? null : `HTTP ${response.status}: ${response.statusText}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async execute(operation, params = {}) {
    const startTime = Date.now();
    
    try {
      const { method = 'GET', path = '', body, query } = params;
      const url = new URL(path, this.baseUrl);
      
      // Add query parameters
      if (query) {
        Object.entries(query).forEach(([key, value]) => {
          url.searchParams.append(key, value);
        });
      }

      const options = {
        method,
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      };

      if (body && method !== 'GET') {
        options.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url.toString(), options);
      const responseTime = Date.now() - startTime;
      
      const result = {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: await response.text(),
        responseTime
      };

      // Try to parse JSON
      try {
        result.data = JSON.parse(result.data);
      } catch {
        // Keep as text if not valid JSON
      }

      this.updateMetrics(response.ok, responseTime);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime);
      throw error;
    }
  }

  getHeaders() {
    const headers = { ...this.headers };
    
    // Add authentication headers
    if (this.authentication.type === 'bearer') {
      headers.Authorization = `Bearer ${this.authentication.token}`;
    } else if (this.authentication.type === 'basic') {
      const credentials = btoa(`${this.authentication.username}:${this.authentication.password}`);
      headers.Authorization = `Basic ${credentials}`;
    } else if (this.authentication.type === 'api_key') {
      headers[this.authentication.headerName] = this.authentication.apiKey;
    }

    return headers;
  }
}

// GraphQL Connector
class GraphqlConnector extends BaseConnector {
  constructor(config) {
    super({ ...config, type: CONNECTOR_TYPES.GRAPHQL });
    this.endpoint = config.endpoint;
    this.headers = config.headers || {};
    this.authentication = config.authentication || {};
  }

  async connect() {
    try {
      this.setStatus(CONNECTION_STATUS.CONNECTING);
      
      const testResult = await this.testConnection();
      if (testResult.success) {
        this.setStatus(CONNECTION_STATUS.CONNECTED);
        console.log(`🔗 GraphQL connector connected: ${this.name}`);
        return true;
      } else {
        throw new Error(testResult.error);
      }
    } catch (error) {
      this.setStatus(CONNECTION_STATUS.ERROR, error.message);
      console.error(`❌ GraphQL connector failed: ${this.name}`, error);
      return false;
    }
  }

  async disconnect() {
    this.setStatus(CONNECTION_STATUS.DISCONNECTED);
    console.log(`🔌 GraphQL connector disconnected: ${this.name}`);
  }

  async testConnection() {
    try {
      const introspectionQuery = `
        query IntrospectionQuery {
          __schema {
            queryType { name }
          }
        }
      `;

      const result = await this.execute('query', { query: introspectionQuery });
      return {
        success: result.success && !result.data.errors,
        error: result.data.errors ? result.data.errors[0].message : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async execute(operation, params = {}) {
    const startTime = Date.now();
    
    try {
      const { query, variables = {}, operationName } = params;
      
      const body = {
        query,
        variables,
        operationName
      };

      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getHeaders()
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(this.config.timeout || 30000)
      });

      const responseTime = Date.now() - startTime;
      const data = await response.json();
      
      const result = {
        success: response.ok && !data.errors,
        status: response.status,
        data,
        responseTime
      };

      this.updateMetrics(result.success, responseTime);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime);
      throw error;
    }
  }

  getHeaders() {
    const headers = { ...this.headers };
    
    if (this.authentication.type === 'bearer') {
      headers.Authorization = `Bearer ${this.authentication.token}`;
    } else if (this.authentication.type === 'api_key') {
      headers[this.authentication.headerName] = this.authentication.apiKey;
    }

    return headers;
  }
}

// WebSocket Connector
class WebSocketConnector extends BaseConnector {
  constructor(config) {
    super({ ...config, type: CONNECTOR_TYPES.WEBSOCKET });
    this.url = config.url;
    this.protocols = config.protocols;
    this.ws = null;
    this.messageHandlers = new Map();
    this.reconnectInterval = config.reconnectInterval || 5000;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 10;
    this.reconnectAttempts = 0;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.setStatus(CONNECTION_STATUS.CONNECTING);
        
        this.ws = new WebSocket(this.url, this.protocols);
        
        this.ws.onopen = () => {
          this.setStatus(CONNECTION_STATUS.CONNECTED);
          this.reconnectAttempts = 0;
          console.log(`🔗 WebSocket connector connected: ${this.name}`);
          resolve(true);
        };

        this.ws.onclose = (event) => {
          this.setStatus(CONNECTION_STATUS.DISCONNECTED);
          console.log(`🔌 WebSocket connector disconnected: ${this.name}`, event.reason);
          
          // Auto-reconnect if not manually closed
          if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
            setTimeout(() => {
              this.reconnectAttempts++;
              this.connect();
            }, this.reconnectInterval);
          }
        };

        this.ws.onerror = (error) => {
          this.setStatus(CONNECTION_STATUS.ERROR, error.message);
          console.error(`❌ WebSocket connector error: ${this.name}`, error);
          reject(error);
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        // Connection timeout
        setTimeout(() => {
          if (this.status === CONNECTION_STATUS.CONNECTING) {
            this.ws.close();
            reject(new Error('WebSocket connection timeout'));
          }
        }, this.config.timeout || 10000);

      } catch (error) {
        this.setStatus(CONNECTION_STATUS.ERROR, error.message);
        reject(error);
      }
    });
  }

  async disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'Manual disconnect');
      this.ws = null;
    }
    this.setStatus(CONNECTION_STATUS.DISCONNECTED);
  }

  async testConnection() {
    if (this.status === CONNECTION_STATUS.CONNECTED) {
      return { success: true };
    }
    
    try {
      await this.connect();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async execute(operation, params = {}) {
    const startTime = Date.now();
    
    try {
      if (this.status !== CONNECTION_STATUS.CONNECTED) {
        throw new Error('WebSocket not connected');
      }

      const { message, waitForResponse = false, timeout = 5000 } = params;
      
      // Send message
      this.ws.send(typeof message === 'string' ? message : JSON.stringify(message));
      
      const responseTime = Date.now() - startTime;
      
      if (waitForResponse) {
        // Wait for response (implement response correlation if needed)
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('WebSocket response timeout'));
          }, timeout);

          const responseHandler = (data) => {
            clearTimeout(timeoutId);
            resolve({
              success: true,
              data,
              responseTime: Date.now() - startTime
            });
          };

          // Add temporary handler (simplified implementation)
          this.messageHandlers.set('temp_response', responseHandler);
        });
      }

      this.updateMetrics(true, responseTime);
      return {
        success: true,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime);
      throw error;
    }
  }

  handleMessage(data) {
    try {
      const message = typeof data === 'string' ? JSON.parse(data) : data;
      
      // Emit to registered handlers
      this.messageHandlers.forEach((handler, type) => {
        try {
          handler(message);
        } catch (error) {
          console.error(`WebSocket message handler error for ${type}:`, error);
        }
      });
    } catch (error) {
      console.error('Failed to handle WebSocket message:', error);
    }
  }

  onMessage(type, handler) {
    this.messageHandlers.set(type, handler);
  }

  offMessage(type) {
    this.messageHandlers.delete(type);
  }
}

// Database Connector (mock implementation for demonstration)
class DatabaseConnector extends BaseConnector {
  constructor(config) {
    super({ ...config, type: CONNECTOR_TYPES.DATABASE });
    this.connectionString = config.connectionString;
    this.databaseType = config.databaseType; // mysql, postgresql, mongodb, etc.
    this.pool = null;
  }

  async connect() {
    try {
      this.setStatus(CONNECTION_STATUS.CONNECTING);
      
      // Mock connection logic (would use actual database drivers)
      console.log(`🔗 Database connector connecting: ${this.name} (${this.databaseType})`);
      
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.setStatus(CONNECTION_STATUS.CONNECTED);
      console.log(`🔗 Database connector connected: ${this.name}`);
      return true;
    } catch (error) {
      this.setStatus(CONNECTION_STATUS.ERROR, error.message);
      console.error(`❌ Database connector failed: ${this.name}`, error);
      return false;
    }
  }

  async disconnect() {
    if (this.pool) {
      // Close connection pool
      this.pool = null;
    }
    this.setStatus(CONNECTION_STATUS.DISCONNECTED);
    console.log(`🔌 Database connector disconnected: ${this.name}`);
  }

  async testConnection() {
    try {
      // Mock test query
      console.log(`🧪 Testing database connection: ${this.name}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async execute(operation, params = {}) {
    const startTime = Date.now();
    
    try {
      const { query, parameters = [] } = params;
      
      // Mock query execution
      console.log(`📊 Executing query on ${this.name}:`, query);
      
      // Simulate query delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const responseTime = Date.now() - startTime;
      
      const result = {
        success: true,
        data: { message: 'Mock query result', affectedRows: 1 },
        responseTime
      };

      this.updateMetrics(true, responseTime);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime);
      throw error;
    }
  }
}

// File System Connector
class FileSystemConnector extends BaseConnector {
  constructor(config) {
    super({ ...config, type: CONNECTOR_TYPES.FILE_SYSTEM });
    this.basePath = config.basePath;
    this.permissions = config.permissions || ['read', 'write'];
  }

  async connect() {
    try {
      this.setStatus(CONNECTION_STATUS.CONNECTING);
      
      // Test file system access
      const testResult = await this.testConnection();
      if (testResult.success) {
        this.setStatus(CONNECTION_STATUS.CONNECTED);
        console.log(`🔗 File system connector connected: ${this.name}`);
        return true;
      } else {
        throw new Error(testResult.error);
      }
    } catch (error) {
      this.setStatus(CONNECTION_STATUS.ERROR, error.message);
      console.error(`❌ File system connector failed: ${this.name}`, error);
      return false;
    }
  }

  async disconnect() {
    this.setStatus(CONNECTION_STATUS.DISCONNECTED);
    console.log(`🔌 File system connector disconnected: ${this.name}`);
  }

  async testConnection() {
    try {
      // Mock file system test
      console.log(`🧪 Testing file system access: ${this.basePath}`);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async execute(operation, params = {}) {
    const startTime = Date.now();
    
    try {
      const { action, path, data, options = {} } = params;
      
      // Mock file operations
      console.log(`📁 File system operation: ${action} on ${path}`);
      
      let result;
      switch (action) {
        case 'read':
          result = { data: 'Mock file content' };
          break;
        case 'write':
          result = { success: true, bytesWritten: data?.length || 0 };
          break;
        case 'list':
          result = { files: ['file1.txt', 'file2.txt'] };
          break;
        case 'delete':
          result = { success: true };
          break;
        default:
          throw new Error(`Unsupported file operation: ${action}`);
      }
      
      const responseTime = Date.now() - startTime;
      this.updateMetrics(true, responseTime);
      
      return {
        success: true,
        ...result,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(false, responseTime);
      throw error;
    }
  }
}

// Connector Factory
class ConnectorFactory {
  static createConnector(config) {
    switch (config.type) {
      case CONNECTOR_TYPES.REST:
        return new RestConnector(config);
      case CONNECTOR_TYPES.GRAPHQL:
        return new GraphqlConnector(config);
      case CONNECTOR_TYPES.WEBSOCKET:
        return new WebSocketConnector(config);
      case CONNECTOR_TYPES.DATABASE:
        return new DatabaseConnector(config);
      case CONNECTOR_TYPES.FILE_SYSTEM:
        return new FileSystemConnector(config);
      default:
        throw new Error(`Unsupported connector type: ${config.type}`);
    }
  }

  static getSupportedTypes() {
    return Object.values(CONNECTOR_TYPES);
  }
}

// External Connectors Manager
class ExternalConnectorsManager {
  constructor() {
    this.connectors = new Map();
    this.connections = new Map();
    this.connectionPools = new Map();
    this.healthChecks = new Map();
  }

  createConnector(config) {
    try {
      const connector = ConnectorFactory.createConnector(config);
      this.connectors.set(connector.id, connector);
      
      console.log(`🔧 Connector created: ${connector.name} (${connector.type})`);
      return connector;
    } catch (error) {
      console.error('Failed to create connector:', error);
      throw error;
    }
  }

  async connectAll() {
    const connectors = Array.from(this.connectors.values());
    const results = await Promise.allSettled(
      connectors.map(connector => this.connect(connector.id))
    );

    const summary = {
      total: connectors.length,
      connected: 0,
      failed: 0,
      errors: []
    };

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        summary.connected++;
      } else {
        summary.failed++;
        summary.errors.push({
          connector: connectors[index].name,
          error: result.reason?.message || 'Unknown error'
        });
      }
    });

    console.log(`🌐 Bulk connection results: ${summary.connected}/${summary.total} connected`);
    return summary;
  }

  async connect(connectorId) {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    try {
      const success = await connector.connect();
      if (success) {
        this.connections.set(connectorId, {
          connector,
          connectedAt: Date.now(),
          lastActivity: Date.now()
        });
      }
      return success;
    } catch (error) {
      console.error(`Failed to connect ${connector.name}:`, error);
      throw error;
    }
  }

  async disconnect(connectorId) {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    try {
      await connector.disconnect();
      this.connections.delete(connectorId);
      return true;
    } catch (error) {
      console.error(`Failed to disconnect ${connector.name}:`, error);
      throw error;
    }
  }

  async execute(connectorId, operation, params = {}) {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }

    if (connector.status !== CONNECTION_STATUS.CONNECTED) {
      // Try to reconnect
      await this.connect(connectorId);
    }

    try {
      const result = await connector.execute(operation, params);
      
      // Update last activity
      const connection = this.connections.get(connectorId);
      if (connection) {
        connection.lastActivity = Date.now();
      }

      return result;
    } catch (error) {
      console.error(`Execution failed for ${connector.name}:`, error);
      throw error;
    }
  }

  removeConnector(connectorId) {
    const connector = this.connectors.get(connectorId);
    if (connector) {
      // Disconnect if connected
      if (connector.status === CONNECTION_STATUS.CONNECTED) {
        this.disconnect(connectorId);
      }
      
      this.connectors.delete(connectorId);
      this.connections.delete(connectorId);
      
      console.log(`🗑️ Connector removed: ${connector.name}`);
      return true;
    }
    return false;
  }

  getConnector(connectorId) {
    return this.connectors.get(connectorId);
  }

  getAllConnectors() {
    return Array.from(this.connectors.values());
  }

  getConnectedConnectors() {
    return Array.from(this.connectors.values())
      .filter(connector => connector.status === CONNECTION_STATUS.CONNECTED);
  }

  getConnectionStatus() {
    const total = this.connectors.size;
    const connected = this.getConnectedConnectors().length;
    const disconnected = total - connected;

    return {
      total,
      connected,
      disconnected,
      connectionRate: total > 0 ? (connected / total) * 100 : 0
    };
  }

  getConnectorMetrics(connectorId = null) {
    if (connectorId) {
      const connector = this.connectors.get(connectorId);
      return connector ? connector.metrics : null;
    }

    // Aggregate metrics from all connectors
    const allConnectors = Array.from(this.connectors.values());
    return allConnectors.reduce((aggregate, connector) => {
      aggregate.totalRequests += connector.metrics.totalRequests;
      aggregate.successfulRequests += connector.metrics.successfulRequests;
      aggregate.failedRequests += connector.metrics.failedRequests;
      return aggregate;
    }, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0
    });
  }

  async testAllConnections() {
    const connectors = Array.from(this.connectors.values());
    const results = await Promise.allSettled(
      connectors.map(async connector => {
        const result = await connector.testConnection();
        return {
          connectorId: connector.id,
          name: connector.name,
          type: connector.type,
          ...result
        };
      })
    );

    return results.map((result, index) => ({
      connector: connectors[index].name,
      success: result.status === 'fulfilled' ? result.value.success : false,
      error: result.status === 'rejected' ? result.reason?.message : result.value?.error
    }));
  }
}

// Global connectors manager
const connectorsManager = new ExternalConnectorsManager();

// Zustand Store for External Connectors
export const useConnectorsStore = create(
  persist(
    (set, get) => ({
      // State
      connectorsManager,
      connectors: [],
      connectionStatus: {},
      metrics: {},
      isLoading: false,
      error: null,

      // Actions
      createConnector: (config) => {
        try {
          const connector = connectorsManager.createConnector(config);
          get().loadConnectors();
          return connector;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      connect: async (connectorId) => {
        set({ isLoading: true, error: null });
        
        try {
          const success = await connectorsManager.connect(connectorId);
          get().loadConnectionStatus();
          set({ isLoading: false });
          return success;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      disconnect: async (connectorId) => {
        set({ isLoading: true, error: null });
        
        try {
          const success = await connectorsManager.disconnect(connectorId);
          get().loadConnectionStatus();
          set({ isLoading: false });
          return success;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      connectAll: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const summary = await connectorsManager.connectAll();
          get().loadConnectionStatus();
          set({ isLoading: false });
          return summary;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      execute: async (connectorId, operation, params = {}) => {
        try {
          const result = await connectorsManager.execute(connectorId, operation, params);
          get().loadMetrics();
          return result;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      removeConnector: (connectorId) => {
        try {
          const success = connectorsManager.removeConnector(connectorId);
          if (success) {
            get().loadConnectors();
            get().loadConnectionStatus();
          }
          return success;
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      loadConnectors: () => {
        const connectors = connectorsManager.getAllConnectors();
        set({ connectors });
        return connectors;
      },

      loadConnectionStatus: () => {
        const connectionStatus = connectorsManager.getConnectionStatus();
        set({ connectionStatus });
        return connectionStatus;
      },

      loadMetrics: () => {
        const metrics = connectorsManager.getConnectorMetrics();
        set({ metrics });
        return metrics;
      },

      testConnection: async (connectorId) => {
        try {
          const connector = connectorsManager.getConnector(connectorId);
          if (!connector) {
            throw new Error(`Connector not found: ${connectorId}`);
          }
          
          return await connector.testConnection();
        } catch (error) {
          set({ error: error.message });
          throw error;
        }
      },

      testAllConnections: async () => {
        set({ isLoading: true, error: null });
        
        try {
          const results = await connectorsManager.testAllConnections();
          set({ isLoading: false });
          return results;
        } catch (error) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      getConnectorsByType: (type) => {
        return get().connectors.filter(connector => connector.type === type);
      },

      getConnectedConnectors: () => {
        return connectorsManager.getConnectedConnectors();
      },

      getSupportedTypes: () => {
        return ConnectorFactory.getSupportedTypes();
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'connectors-store',
      partialize: (state) => ({
        // Don't persist actual connector instances, just configuration
        connectors: state.connectors.map(connector => ({
          id: connector.id,
          name: connector.name,
          type: connector.type,
          config: connector.config
        }))
      })
    }
  )
);

// Auto-refresh connection status and metrics
if (typeof window !== 'undefined') {
  setInterval(() => {
    const { loadConnectionStatus, loadMetrics } = useConnectorsStore.getState();
    loadConnectionStatus();
    loadMetrics();
  }, 15000); // Every 15 seconds
}

export { 
  connectorsManager, 
  ConnectorFactory,
  CONNECTOR_TYPES, 
  CONNECTION_STATUS 
};
