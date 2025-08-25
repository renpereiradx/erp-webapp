import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Conflict Resolution Strategies
const CONFLICT_RESOLUTION_STRATEGIES = {
  LAST_WRITE_WINS: 'last_write_wins',
  FIRST_WRITE_WINS: 'first_write_wins',
  MANUAL_RESOLUTION: 'manual_resolution',
  MERGE_FIELDS: 'merge_fields',
  VERSION_BASED: 'version_based'
};

// Synchronization Modes
const SYNC_MODES = {
  REAL_TIME: 'real_time',
  BATCH: 'batch',
  DELTA: 'delta',
  FULL: 'full'
};

// Data Transformation Pipeline
class DataTransformationPipeline {
  constructor() {
    this.transformers = new Map();
    this.validators = new Map();
    this.formatters = new Map();
  }

  addTransformer(name, transformer) {
    this.transformers.set(name, transformer);
  }

  addValidator(name, validator) {
    this.validators.set(name, validator);
  }

  addFormatter(name, formatter) {
    this.formatters.set(name, formatter);
  }

  async process(data, pipelineConfig) {
    let processedData = { ...data };

    // Apply transformations
    if (pipelineConfig.transformers) {
      for (const transformerName of pipelineConfig.transformers) {
        const transformer = this.transformers.get(transformerName);
        if (transformer) {
          processedData = await transformer(processedData);
        }
      }
    }

    // Apply validations
    if (pipelineConfig.validators) {
      for (const validatorName of pipelineConfig.validators) {
        const validator = this.validators.get(validatorName);
        if (validator) {
          const isValid = await validator(processedData);
          if (!isValid) {
            throw new Error(`Validation failed: ${validatorName}`);
          }
        }
      }
    }

    // Apply formatting
    if (pipelineConfig.formatters) {
      for (const formatterName of pipelineConfig.formatters) {
        const formatter = this.formatters.get(formatterName);
        if (formatter) {
          processedData = await formatter(processedData);
        }
      }
    }

    return processedData;
  }
}

// Change Tracking System
class ChangeTracker {
  constructor() {
    this.changes = new Map();
    this.snapshots = new Map();
    this.changeLog = [];
  }

  createSnapshot(entityType, entityId, data) {
    const snapshotKey = `${entityType}:${entityId}`;
    const snapshot = {
      id: `${snapshotKey}:${Date.now()}`,
      entityType,
      entityId,
      data: JSON.parse(JSON.stringify(data)),
      timestamp: Date.now(),
      checksum: this.generateChecksum(data)
    };

    this.snapshots.set(snapshotKey, snapshot);
    return snapshot;
  }

  trackChange(entityType, entityId, field, oldValue, newValue, metadata = {}) {
    const changeKey = `${entityType}:${entityId}`;
    const change = {
      id: `${changeKey}:${Date.now()}`,
      entityType,
      entityId,
      field,
      oldValue,
      newValue,
      timestamp: Date.now(),
      metadata
    };

    if (!this.changes.has(changeKey)) {
      this.changes.set(changeKey, []);
    }

    this.changes.get(changeKey).push(change);
    this.changeLog.push(change);

    return change;
  }

  getChanges(entityType, entityId) {
    const changeKey = `${entityType}:${entityId}`;
    return this.changes.get(changeKey) || [];
  }

  getChangesSince(timestamp) {
    return this.changeLog.filter(change => change.timestamp > timestamp);
  }

  generateDelta(entityType, entityId, currentData) {
    const snapshotKey = `${entityType}:${entityId}`;
    const snapshot = this.snapshots.get(snapshotKey);
    
    if (!snapshot) {
      return { type: 'create', data: currentData };
    }

    const delta = this.computeDifferences(snapshot.data, currentData);
    
    if (Object.keys(delta).length === 0) {
      return { type: 'no_change' };
    }

    return {
      type: 'update',
      delta,
      baseVersion: snapshot.id
    };
  }

  computeDifferences(oldData, newData) {
    const differences = {};

    // Check for changes and additions
    for (const [key, newValue] of Object.entries(newData)) {
      const oldValue = oldData[key];
      
      if (typeof newValue === 'object' && newValue !== null && !Array.isArray(newValue)) {
        const nestedDiff = this.computeDifferences(oldValue || {}, newValue);
        if (Object.keys(nestedDiff).length > 0) {
          differences[key] = nestedDiff;
        }
      } else if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        differences[key] = {
          old: oldValue,
          new: newValue
        };
      }
    }

    // Check for deletions
    for (const key of Object.keys(oldData)) {
      if (!(key in newData)) {
        differences[key] = {
          old: oldData[key],
          new: undefined,
          deleted: true
        };
      }
    }

    return differences;
  }

  generateChecksum(data) {
    const str = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }
}

// Conflict Resolution Engine
class ConflictResolver {
  constructor() {
    this.resolvers = new Map();
    this.setupDefaultResolvers();
  }

  setupDefaultResolvers() {
    this.resolvers.set(CONFLICT_RESOLUTION_STRATEGIES.LAST_WRITE_WINS, this.lastWriteWins.bind(this));
    this.resolvers.set(CONFLICT_RESOLUTION_STRATEGIES.FIRST_WRITE_WINS, this.firstWriteWins.bind(this));
    this.resolvers.set(CONFLICT_RESOLUTION_STRATEGIES.MERGE_FIELDS, this.mergeFields.bind(this));
    this.resolvers.set(CONFLICT_RESOLUTION_STRATEGIES.VERSION_BASED, this.versionBased.bind(this));
  }

  async resolveConflict(local, remote, strategy, metadata = {}) {
    const resolver = this.resolvers.get(strategy);
    if (!resolver) {
      throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }

    return await resolver(local, remote, metadata);
  }

  lastWriteWins(local, remote, metadata) {
    const localTimestamp = local.lastModified || local.timestamp || 0;
    const remoteTimestamp = remote.lastModified || remote.timestamp || 0;

    return remoteTimestamp > localTimestamp ? remote : local;
  }

  firstWriteWins(local, remote, metadata) {
    const localTimestamp = local.lastModified || local.timestamp || 0;
    const remoteTimestamp = remote.lastModified || remote.timestamp || 0;

    return localTimestamp < remoteTimestamp ? local : remote;
  }

  mergeFields(local, remote, metadata) {
    const merged = { ...local };

    for (const [key, remoteValue] of Object.entries(remote)) {
      if (key === 'id' || key === 'version') continue;

      const localValue = local[key];
      
      if (localValue === undefined) {
        merged[key] = remoteValue;
      } else if (typeof localValue === 'object' && typeof remoteValue === 'object') {
        merged[key] = this.mergeFields(localValue, remoteValue, metadata);
      } else {
        // Field-level conflict - use timestamp or metadata to decide
        const localFieldTimestamp = local[`${key}_timestamp`] || local.timestamp || 0;
        const remoteFieldTimestamp = remote[`${key}_timestamp`] || remote.timestamp || 0;
        
        merged[key] = remoteFieldTimestamp > localFieldTimestamp ? remoteValue : localValue;
      }
    }

    return merged;
  }

  versionBased(local, remote, metadata) {
    const localVersion = parseInt(local.version || '0');
    const remoteVersion = parseInt(remote.version || '0');

    if (remoteVersion > localVersion) {
      return remote;
    } else if (localVersion > remoteVersion) {
      return local;
    } else {
      // Same version - check timestamps
      return this.lastWriteWins(local, remote, metadata);
    }
  }

  addCustomResolver(strategy, resolver) {
    this.resolvers.set(strategy, resolver);
  }
}

// Synchronization Queue Manager
class SyncQueueManager {
  constructor() {
    this.queues = new Map();
    this.processors = new Map();
    this.isProcessing = new Map();
  }

  createQueue(queueName, config = {}) {
    const queueConfig = {
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      batchSize: config.batchSize || 10,
      concurrency: config.concurrency || 1,
      priority: config.priority || 0,
      ...config
    };

    this.queues.set(queueName, {
      config: queueConfig,
      items: [],
      processing: [],
      failed: [],
      completed: []
    });

    return queueConfig;
  }

  addToQueue(queueName, item, priority = 0) {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`Queue not found: ${queueName}`);
    }

    const queueItem = {
      id: `${queueName}-${Date.now()}-${Math.random()}`,
      data: item,
      priority,
      retries: 0,
      createdAt: Date.now(),
      status: 'pending'
    };

    queue.items.push(queueItem);
    queue.items.sort((a, b) => b.priority - a.priority);

    console.log(`📋 Added item to queue ${queueName}:`, queueItem.id);
    this.processQueue(queueName);

    return queueItem.id;
  }

  setProcessor(queueName, processor) {
    this.processors.set(queueName, processor);
  }

  async processQueue(queueName) {
    if (this.isProcessing.get(queueName)) return;

    const queue = this.queues.get(queueName);
    const processor = this.processors.get(queueName);

    if (!queue || !processor || queue.items.length === 0) return;

    this.isProcessing.set(queueName, true);

    try {
      while (queue.items.length > 0) {
        const batch = queue.items.splice(0, queue.config.batchSize);
        const processingPromises = batch.map(item => this.processItem(queueName, item, processor));

        await Promise.allSettled(processingPromises);
      }
    } finally {
      this.isProcessing.set(queueName, false);
    }
  }

  async processItem(queueName, item, processor) {
    const queue = this.queues.get(queueName);
    
    try {
      item.status = 'processing';
      queue.processing.push(item);

      const result = await processor(item.data);
      
      item.status = 'completed';
      item.result = result;
      item.completedAt = Date.now();
      
      queue.completed.push(item);
      queue.processing = queue.processing.filter(p => p.id !== item.id);

      console.log(`✅ Processed queue item ${item.id}`);
    } catch (error) {
      item.retries++;
      item.lastError = error.message;
      item.status = 'failed';

      queue.processing = queue.processing.filter(p => p.id !== item.id);

      if (item.retries < queue.config.maxRetries) {
        // Retry with exponential backoff
        const delay = queue.config.retryDelay * Math.pow(2, item.retries - 1);
        
        setTimeout(() => {
          item.status = 'pending';
          queue.items.unshift(item);
          this.processQueue(queueName);
        }, delay);

        console.log(`🔄 Retrying queue item ${item.id} in ${delay}ms`);
      } else {
        queue.failed.push(item);
        console.error(`❌ Queue item failed permanently: ${item.id}`, error);
      }
    }
  }

  getQueueStatus(queueName) {
    const queue = this.queues.get(queueName);
    if (!queue) return null;

    return {
      pending: queue.items.length,
      processing: queue.processing.length,
      completed: queue.completed.length,
      failed: queue.failed.length
    };
  }

  clearCompletedItems(queueName, olderThan = 3600000) { // 1 hour default
    const queue = this.queues.get(queueName);
    if (!queue) return;

    const cutoff = Date.now() - olderThan;
    queue.completed = queue.completed.filter(item => item.completedAt > cutoff);
  }
}

// Main Data Synchronization Engine
class DataSynchronizationEngine {
  constructor() {
    this.pipeline = new DataTransformationPipeline();
    this.changeTracker = new ChangeTracker();
    this.conflictResolver = new ConflictResolver();
    this.queueManager = new SyncQueueManager();
    
    this.syncConfigs = new Map();
    this.activeSyncs = new Map();
    
    this.setupDefaultQueues();
    this.setupDefaultTransformers();
  }

  setupDefaultQueues() {
    // Real-time sync queue
    this.queueManager.createQueue('realtime', {
      maxRetries: 2,
      retryDelay: 500,
      batchSize: 1,
      concurrency: 5
    });

    // Batch sync queue
    this.queueManager.createQueue('batch', {
      maxRetries: 3,
      retryDelay: 2000,
      batchSize: 50,
      concurrency: 2
    });

    // Delta sync queue
    this.queueManager.createQueue('delta', {
      maxRetries: 3,
      retryDelay: 1000,
      batchSize: 20,
      concurrency: 3
    });

    // Set up processors
    this.queueManager.setProcessor('realtime', this.processRealTimeSync.bind(this));
    this.queueManager.setProcessor('batch', this.processBatchSync.bind(this));
    this.queueManager.setProcessor('delta', this.processDeltaSync.bind(this));
  }

  setupDefaultTransformers() {
    // Timestamp normalization
    this.pipeline.addTransformer('normalize_timestamps', (data) => {
      if (data.createdAt && typeof data.createdAt === 'string') {
        data.createdAt = new Date(data.createdAt).getTime();
      }
      if (data.updatedAt && typeof data.updatedAt === 'string') {
        data.updatedAt = new Date(data.updatedAt).getTime();
      }
      return data;
    });

    // ID normalization
    this.pipeline.addTransformer('normalize_ids', (data) => {
      if (data.id && typeof data.id === 'number') {
        data.id = data.id.toString();
      }
      return data;
    });

    // Data validation
    this.pipeline.addValidator('required_fields', (data) => {
      const requiredFields = ['id'];
      return requiredFields.every(field => data[field] !== undefined);
    });

    // JSON formatting
    this.pipeline.addFormatter('json_format', (data) => {
      return JSON.parse(JSON.stringify(data));
    });
  }

  configureSyncEndpoint(name, config) {
    const syncConfig = {
      name,
      endpoint: config.endpoint,
      method: config.method || 'POST',
      mode: config.mode || SYNC_MODES.REAL_TIME,
      conflictResolution: config.conflictResolution || CONFLICT_RESOLUTION_STRATEGIES.LAST_WRITE_WINS,
      transformationPipeline: config.transformationPipeline || ['normalize_timestamps', 'normalize_ids'],
      authConfig: config.authConfig || null,
      retryConfig: config.retryConfig || { maxRetries: 3, delay: 1000 },
      batchConfig: config.batchConfig || { size: 10, interval: 5000 },
      ...config
    };

    this.syncConfigs.set(name, syncConfig);
    console.log(`🔧 Sync endpoint configured: ${name}`);
    
    return syncConfig;
  }

  async syncData(endpointName, data, options = {}) {
    const config = this.syncConfigs.get(endpointName);
    if (!config) {
      throw new Error(`Sync endpoint not configured: ${endpointName}`);
    }

    // Process data through transformation pipeline
    const processedData = await this.pipeline.process(data, {
      transformers: config.transformationPipeline,
      validators: ['required_fields'],
      formatters: ['json_format']
    });

    // Create sync operation
    const syncOperation = {
      id: `sync-${endpointName}-${Date.now()}`,
      endpointName,
      config,
      data: processedData,
      originalData: data,
      timestamp: Date.now(),
      options
    };

    // Route to appropriate queue based on sync mode
    switch (config.mode) {
      case SYNC_MODES.REAL_TIME:
        return this.queueManager.addToQueue('realtime', syncOperation, options.priority);
        
      case SYNC_MODES.BATCH:
        return this.queueManager.addToQueue('batch', syncOperation, options.priority);
        
      case SYNC_MODES.DELTA:
        // Generate delta and track changes
        const entityType = options.entityType || 'unknown';
        const entityId = data.id || 'unknown';
        const delta = this.changeTracker.generateDelta(entityType, entityId, data);
        
        if (delta.type === 'no_change') {
          console.log(`⏭️ No changes detected for ${entityType}:${entityId}`);
          return null;
        }
        
        syncOperation.delta = delta;
        return this.queueManager.addToQueue('delta', syncOperation, options.priority);
        
      default:
        throw new Error(`Unknown sync mode: ${config.mode}`);
    }
  }

  async processRealTimeSync(syncOperation) {
    const { config, data } = syncOperation;
    
    try {
      const response = await fetch(config.endpoint, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(config.authConfig)
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`🚀 Real-time sync completed: ${syncOperation.id}`);
      
      return result;
    } catch (error) {
      console.error(`🚨 Real-time sync failed: ${syncOperation.id}`, error);
      throw error;
    }
  }

  async processBatchSync(syncOperation) {
    const { config, data } = syncOperation;
    
    try {
      // For batch sync, we might accumulate multiple items
      const batchData = Array.isArray(data) ? data : [data];
      
      const response = await fetch(config.endpoint, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(config.authConfig)
        },
        body: JSON.stringify({ items: batchData })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`📦 Batch sync completed: ${syncOperation.id}`);
      
      return result;
    } catch (error) {
      console.error(`🚨 Batch sync failed: ${syncOperation.id}`, error);
      throw error;
    }
  }

  async processDeltaSync(syncOperation) {
    const { config, delta } = syncOperation;
    
    try {
      const response = await fetch(config.endpoint, {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders(config.authConfig)
        },
        body: JSON.stringify({ delta })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`🔄 Delta sync completed: ${syncOperation.id}`);
      
      return result;
    } catch (error) {
      console.error(`🚨 Delta sync failed: ${syncOperation.id}`, error);
      throw error;
    }
  }

  getAuthHeaders(authConfig) {
    if (!authConfig) return {};

    switch (authConfig.type) {
      case 'bearer':
        return { 'Authorization': `Bearer ${authConfig.token}` };
      case 'apikey':
        return { [authConfig.header || 'X-API-Key']: authConfig.key };
      default:
        return {};
    }
  }

  // Handle incoming data from remote systems
  async handleIncomingSync(endpointName, remoteData, metadata = {}) {
    const config = this.syncConfigs.get(endpointName);
    if (!config) {
      throw new Error(`Sync endpoint not configured: ${endpointName}`);
    }

    // Check if we have local data for conflict resolution
    const localData = metadata.localData;
    
    if (localData) {
      // Resolve conflicts
      const resolvedData = await this.conflictResolver.resolveConflict(
        localData,
        remoteData,
        config.conflictResolution,
        metadata
      );

      console.log(`🔀 Conflict resolved for ${endpointName}:`, resolvedData.id);
      return resolvedData;
    }

    // No conflict, process incoming data
    return await this.pipeline.process(remoteData, {
      transformers: config.transformationPipeline,
      validators: ['required_fields'],
      formatters: ['json_format']
    });
  }

  // Get synchronization statistics
  getSyncStats() {
    const stats = {};
    
    ['realtime', 'batch', 'delta'].forEach(queueName => {
      stats[queueName] = this.queueManager.getQueueStatus(queueName);
    });

    return {
      queues: stats,
      configurations: this.syncConfigs.size,
      changeLog: this.changeTracker.changeLog.length
    };
  }

  // Clean up old data
  cleanup(options = {}) {
    const maxAge = options.maxAge || 86400000; // 24 hours
    
    // Clean completed queue items
    ['realtime', 'batch', 'delta'].forEach(queueName => {
      this.queueManager.clearCompletedItems(queueName, maxAge);
    });

    // Clean old change log entries
    const cutoff = Date.now() - maxAge;
    this.changeTracker.changeLog = this.changeTracker.changeLog.filter(
      change => change.timestamp > cutoff
    );
  }
}

// Global synchronization engine
const dataSyncEngine = new DataSynchronizationEngine();

// Zustand Store for Data Synchronization
export const useDataSyncStore = create(
  persist(
    (set, get) => ({
      // State
      dataSyncEngine,
      syncConfigurations: {},
      syncOperations: {},
      conflictLog: [],
      syncMetrics: {
        totalSyncs: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        conflictsResolved: 0
      },

      // Actions
      configureSyncEndpoint: (name, config) => {
        const syncConfig = dataSyncEngine.configureSyncEndpoint(name, config);
        
        set(state => ({
          syncConfigurations: {
            ...state.syncConfigurations,
            [name]: syncConfig
          }
        }));

        return syncConfig;
      },

      syncData: async (endpointName, data, options = {}) => {
        try {
          const syncId = await dataSyncEngine.syncData(endpointName, data, options);
          
          set(state => ({
            syncMetrics: {
              ...state.syncMetrics,
              totalSyncs: state.syncMetrics.totalSyncs + 1
            }
          }));

          return syncId;
        } catch (error) {
          set(state => ({
            syncMetrics: {
              ...state.syncMetrics,
              totalSyncs: state.syncMetrics.totalSyncs + 1,
              failedSyncs: state.syncMetrics.failedSyncs + 1
            }
          }));
          throw error;
        }
      },

      handleIncomingSync: async (endpointName, remoteData, metadata = {}) => {
        try {
          const resolvedData = await dataSyncEngine.handleIncomingSync(endpointName, remoteData, metadata);
          
          if (metadata.localData) {
            set(state => ({
              conflictLog: [
                ...state.conflictLog.slice(-99), // Keep last 100 conflicts
                {
                  id: Date.now(),
                  endpointName,
                  timestamp: Date.now(),
                  localData: metadata.localData,
                  remoteData,
                  resolvedData
                }
              ],
              syncMetrics: {
                ...state.syncMetrics,
                conflictsResolved: state.syncMetrics.conflictsResolved + 1
              }
            }));
          }

          return resolvedData;
        } catch (error) {
          console.error('Incoming sync handling failed:', error);
          throw error;
        }
      },

      getSyncStats: () => {
        return dataSyncEngine.getSyncStats();
      },

      cleanup: (options = {}) => {
        dataSyncEngine.cleanup(options);
        
        // Clean up conflict log
        const maxAge = options.maxAge || 86400000;
        const cutoff = Date.now() - maxAge;
        
        set(state => ({
          conflictLog: state.conflictLog.filter(conflict => conflict.timestamp > cutoff)
        }));
      },

      // Conflict resolution
      resolveConflictManually: async (conflictId, resolution) => {
        // This would be called from UI when manual resolution is needed
        set(state => ({
          conflictLog: state.conflictLog.map(conflict => 
            conflict.id === conflictId 
              ? { ...conflict, manualResolution: resolution, resolvedAt: Date.now() }
              : conflict
          )
        }));
      },

      // Configuration management
      updateSyncConfig: (endpointName, updates) => {
        const currentConfig = get().syncConfigurations[endpointName];
        if (currentConfig) {
          const updatedConfig = { ...currentConfig, ...updates };
          return get().configureSyncEndpoint(endpointName, updatedConfig);
        }
      }
    }),
    {
      name: 'data-sync-store',
      partialize: (state) => ({
        syncConfigurations: state.syncConfigurations,
        syncMetrics: state.syncMetrics
      })
    }
  )
);

// Periodic cleanup
if (typeof window !== 'undefined') {
  setInterval(() => {
    useDataSyncStore.getState().cleanup();
  }, 3600000); // Every hour
}

export { 
  dataSyncEngine, 
  CONFLICT_RESOLUTION_STRATEGIES, 
  SYNC_MODES 
};
