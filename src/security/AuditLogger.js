/**
 * Wave 7: Security & Compliance Enterprise
 * Security Audit Logging System
 * 
 * Sistema completo de auditoría de seguridad:
 * - Logging de eventos críticos de seguridad
 * - Tampering detection en logs
 * - Retention policies para auditoría
 * - Export compliance (GDPR, SOX, etc.)
 * - Real-time monitoring de eventos sospechosos
 * 
 * @since Wave 7 - Security & Compliance Enterprise
 * @author Sistema ERP
 */

import CryptoJS from 'crypto-js';

// ====================================
// AUDIT CONFIGURATION
// ====================================

export const AUDIT_CONFIG = {
  // Niveles de log
  LOG_LEVELS: {
    INFO: 'info',
    WARNING: 'warning',
    ERROR: 'error',
    CRITICAL: 'critical',
    SECURITY: 'security'
  },
  
  // Categorías de eventos de seguridad
  SECURITY_EVENTS: {
    // Autenticación
    LOGIN_SUCCESS: 'auth.login.success',
    LOGIN_FAILED: 'auth.login.failed',
    LOGIN_BLOCKED: 'auth.login.blocked',
    LOGOUT: 'auth.logout',
    SESSION_EXPIRED: 'auth.session.expired',
    TOKEN_REFRESH: 'auth.token.refresh',
    
    // Autorización
    ACCESS_GRANTED: 'authz.access.granted',
    ACCESS_DENIED: 'authz.access.denied',
    PERMISSION_ESCALATION: 'authz.permission.escalation',
    ROLE_CHANGED: 'authz.role.changed',
    
    // Datos sensibles
    DATA_ACCESS: 'data.access',
    DATA_EXPORT: 'data.export',
    DATA_MODIFICATION: 'data.modification',
    DATA_DELETION: 'data.deletion',
    PII_ACCESS: 'data.pii.access',
    
    // Sistema
    CONFIG_CHANGE: 'system.config.change',
    USER_CREATED: 'system.user.created',
    USER_DELETED: 'system.user.deleted',
    BACKUP_CREATED: 'system.backup.created',
    
    // Seguridad
    SECURITY_VIOLATION: 'security.violation',
    SUSPICIOUS_ACTIVITY: 'security.suspicious',
    MALWARE_DETECTED: 'security.malware',
    INTRUSION_ATTEMPT: 'security.intrusion',
    
    // GDPR
    CONSENT_GRANTED: 'gdpr.consent.granted',
    CONSENT_WITHDRAWN: 'gdpr.consent.withdrawn',
    DATA_PORTABILITY: 'gdpr.data.portability',
    RIGHT_TO_ERASURE: 'gdpr.right.erasure'
  },
  
  // Configuración de retención
  RETENTION: {
    SECURITY_LOGS: 2555, // 7 años en días
    AUDIT_LOGS: 2555,    // 7 años en días
    GDPR_LOGS: 2555,     // 7 años en días
    SYSTEM_LOGS: 365     // 1 año en días
  },
  
  // Configuración de alertas
  ALERT_THRESHOLDS: {
    FAILED_LOGINS: 5,           // en 15 minutos
    PERMISSION_DENIALS: 10,     // en 5 minutos
    SUSPICIOUS_ACTIVITY: 3,     // en 1 hora
    DATA_EXPORTS: 5             // en 1 día
  }
};

// ====================================
// AUDIT LOGGING SERVICE
// ====================================

export class SecurityAuditLogger {
  constructor() {
    this.logs = new Map();
    this.alertCounters = new Map();
    this.hashChain = [];
    this.secretKey = 'AUDIT_LOG_INTEGRITY_KEY_2025'; // En producción desde ENV
    
    this.initializeAuditSystem();
  }
  
  // ====================================
  // INITIALIZATION
  // ====================================
  
  initializeAuditSystem() {
    this.setupIntegrityChain();
    this.setupPeriodicFlush();
    this.setupAlertMonitoring();
    this.loadPersistedLogs();
    
    console.log('📋 Security Audit Logger initialized');
  }
  
  // ====================================
  // CORE LOGGING METHODS
  // ====================================
  
  /**
   * Log evento de seguridad
   */
  logSecurityEvent(event, details = {}, level = AUDIT_CONFIG.LOG_LEVELS.SECURITY) {
    const logEntry = this.createLogEntry(event, details, level);
    
    // Validar y procesar entrada
    this.validateLogEntry(logEntry);
    this.addToIntegrityChain(logEntry);
    
    // Almacenar localmente
    this.storeLogEntry(logEntry);
    
    // Enviar al servidor inmediatamente para eventos críticos
    if (level === AUDIT_CONFIG.LOG_LEVELS.CRITICAL || level === AUDIT_CONFIG.LOG_LEVELS.SECURITY) {
      this.sendLogToServer(logEntry);
    }
    
    // Verificar umbrales de alerta
    this.checkAlertThresholds(event, logEntry);
    
    // Log para desarrollo
    this.consoleLog(logEntry);
    
    return logEntry;
  }
  
  /**
   * Log acceso a datos sensibles
   */
  logDataAccess(action, dataType, recordId, details = {}) {
    return this.logSecurityEvent(AUDIT_CONFIG.SECURITY_EVENTS.DATA_ACCESS, {
      action,
      dataType,
      recordId,
      ...details
    });
  }
  
  /**
   * Log eventos de autenticación
   */
  logAuthEvent(event, userId, details = {}) {
    const level = event.includes('failed') || event.includes('blocked') 
      ? AUDIT_CONFIG.LOG_LEVELS.WARNING 
      : AUDIT_CONFIG.LOG_LEVELS.INFO;
    
    return this.logSecurityEvent(event, {
      userId,
      ...details
    }, level);
  }
  
  /**
   * Log eventos GDPR
   */
  logGDPREvent(event, dataSubjectId, details = {}) {
    return this.logSecurityEvent(event, {
      dataSubjectId,
      gdprCompliance: true,
      ...details
    }, AUDIT_CONFIG.LOG_LEVELS.SECURITY);
  }
  
  /**
   * Log actividad sospechosa
   */
  logSuspiciousActivity(description, riskLevel = 'medium', details = {}) {
    return this.logSecurityEvent(AUDIT_CONFIG.SECURITY_EVENTS.SUSPICIOUS_ACTIVITY, {
      description,
      riskLevel,
      ...details
    }, AUDIT_CONFIG.LOG_LEVELS.CRITICAL);
  }
  
  // ====================================
  // LOG ENTRY CREATION
  // ====================================
  
  /**
   * Crear entrada de log completa
   */
  createLogEntry(event, details, level) {
    const timestamp = Date.now();
    const sessionInfo = this.getSessionInfo();
    const contextInfo = this.getContextInfo();
    
    const entry = {
      // Identificación única
      id: this.generateLogId(),
      timestamp,
      iso_timestamp: new Date(timestamp).toISOString(),
      
      // Evento
      event,
      level,
      category: this.getCategoryFromEvent(event),
      
      // Usuario y sesión
      user_id: sessionInfo.userId,
      session_id: sessionInfo.sessionId,
      ip_address: contextInfo.ipAddress,
      user_agent: contextInfo.userAgent,
      
      // Contexto técnico
      url: window.location.href,
      referrer: document.referrer,
      screen_resolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      
      // Detalles del evento
      details: {
        ...details,
        browser_fingerprint: this.getBrowserFingerprint()
      },
      
      // Integridad
      hash: null, // Se calculará después
      previous_hash: this.getLastLogHash(),
      sequence_number: this.getNextSequenceNumber()
    };
    
    // Calcular hash de integridad
    entry.hash = this.calculateLogHash(entry);
    
    return entry;
  }
  
  /**
   * Validar entrada de log
   */
  validateLogEntry(entry) {
    const required = ['id', 'timestamp', 'event', 'level'];
    
    for (const field of required) {
      if (!entry[field]) {
        throw new Error(`Missing required field in log entry: ${field}`);
      }
    }
    
    if (entry.timestamp > Date.now() + 60000) { // 1 minuto futuro
      throw new Error('Invalid timestamp: future date');
    }
    
    return true;
  }
  
  // ====================================
  // INTEGRITY MANAGEMENT
  // ====================================
  
  /**
   * Configurar cadena de integridad
   */
  setupIntegrityChain() {
    // Verificar integridad de logs existentes al iniciar
    this.verifyLogIntegrity();
    
    // Crear genesis hash si no existe
    if (this.hashChain.length === 0) {
      const genesisHash = this.calculateHash('GENESIS_BLOCK_' + Date.now());
      this.hashChain.push(genesisHash);
    }
  }
  
  /**
   * Agregar a cadena de integridad
   */
  addToIntegrityChain(logEntry) {
    this.hashChain.push(logEntry.hash);
    
    // Mantener solo los últimos 1000 hashes en memoria
    if (this.hashChain.length > 1000) {
      this.hashChain = this.hashChain.slice(-1000);
    }
  }
  
  /**
   * Calcular hash de log
   */
  calculateLogHash(entry) {
    // Crear string determinístico para hash
    const dataString = JSON.stringify({
      id: entry.id,
      timestamp: entry.timestamp,
      event: entry.event,
      user_id: entry.user_id,
      details: entry.details,
      previous_hash: entry.previous_hash,
      sequence_number: entry.sequence_number
    });
    
    return CryptoJS.HmacSHA256(dataString, this.secretKey).toString();
  }
  
  /**
   * Verificar integridad de logs
   */
  verifyLogIntegrity() {
    const storedLogs = this.getStoredLogs();
    let isValid = true;
    
    for (let i = 1; i < storedLogs.length; i++) {
      const currentLog = storedLogs[i];
      const previousLog = storedLogs[i - 1];
      
      // Verificar hash del log actual
      const calculatedHash = this.calculateLogHash(currentLog);
      if (calculatedHash !== currentLog.hash) {
        console.error(`🚨 Log integrity violation: ${currentLog.id}`);
        isValid = false;
      }
      
      // Verificar enlace con log anterior
      if (currentLog.previous_hash !== previousLog.hash) {
        console.error(`🚨 Log chain integrity violation: ${currentLog.id}`);
        isValid = false;
      }
    }
    
    if (!isValid) {
      this.logSecurityEvent(AUDIT_CONFIG.SECURITY_EVENTS.SECURITY_VIOLATION, {
        type: 'LOG_INTEGRITY_VIOLATION',
        severity: 'CRITICAL'
      });
    }
    
    return isValid;
  }
  
  // ====================================
  // STORAGE & PERSISTENCE
  // ====================================
  
  /**
   * Almacenar entrada de log
   */
  storeLogEntry(entry) {
    this.logs.set(entry.id, entry);
    
    // Persistir en localStorage (cifrado)
    this.persistLogEntry(entry);
    
    // Limpiar logs antiguos según política de retención
    this.enforceRetentionPolicy();
  }
  
  /**
   * Persistir log cifrado
   */
  persistLogEntry(entry) {
    try {
      const encrypted = CryptoJS.AES.encrypt(
        JSON.stringify(entry), 
        this.secretKey
      ).toString();
      
      localStorage.setItem(`audit_log_${entry.id}`, encrypted);
    } catch (error) {
      console.error('Failed to persist log entry:', error);
    }
  }
  
  /**
   * Cargar logs persistidos
   */
  loadPersistedLogs() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('audit_log_'));
      
      keys.forEach(key => {
        try {
          const encrypted = localStorage.getItem(key);
          const decrypted = CryptoJS.AES.decrypt(encrypted, this.secretKey).toString(CryptoJS.enc.Utf8);
          const entry = JSON.parse(decrypted);
          
          this.logs.set(entry.id, entry);
        } catch (error) {
          console.error(`Failed to load log entry ${key}:`, error);
        }
      });
      
      console.log(`📋 Loaded ${this.logs.size} persisted log entries`);
    } catch (error) {
      console.error('Failed to load persisted logs:', error);
    }
  }
  
  /**
   * Aplicar política de retención
   */
  enforceRetentionPolicy() {
    const now = Date.now();
    const logsToDelete = [];
    
    this.logs.forEach((entry, id) => {
      const category = this.getCategoryFromEvent(entry.event);
      const retentionPeriod = this.getRetentionPeriod(category);
      const ageInDays = (now - entry.timestamp) / (24 * 60 * 60 * 1000);
      
      if (ageInDays > retentionPeriod) {
        logsToDelete.push(id);
      }
    });
    
    // Eliminar logs expirados
    logsToDelete.forEach(id => {
      this.logs.delete(id);
      localStorage.removeItem(`audit_log_${id}`);
    });
    
    if (logsToDelete.length > 0) {
      console.log(`📋 Cleaned up ${logsToDelete.length} expired log entries`);
    }
  }
  
  // ====================================
  // ALERT MONITORING
  // ====================================
  
  /**
   * Configurar monitoreo de alertas
   */
  setupAlertMonitoring() {
    // Limpiar contadores cada hora
    setInterval(() => {
      this.resetAlertCounters();
    }, 60 * 60 * 1000);
  }
  
  /**
   * Verificar umbrales de alerta
   */
  checkAlertThresholds(event, logEntry) {
    const eventType = this.getEventType(event);
    if (!eventType) return;
    
    // Incrementar contador
    const counter = this.alertCounters.get(eventType) || { count: 0, firstSeen: Date.now() };
    counter.count++;
    
    this.alertCounters.set(eventType, counter);
    
    // Verificar umbral
    const threshold = AUDIT_CONFIG.ALERT_THRESHOLDS[eventType];
    if (threshold && counter.count >= threshold) {
      this.triggerSecurityAlert(eventType, counter, logEntry);
    }
  }
  
  /**
   * Disparar alerta de seguridad
   */
  triggerSecurityAlert(eventType, counter, triggerLog) {
    const alert = {
      id: this.generateAlertId(),
      type: 'SECURITY_THRESHOLD_EXCEEDED',
      event_type: eventType,
      threshold: AUDIT_CONFIG.ALERT_THRESHOLDS[eventType],
      actual_count: counter.count,
      time_window: Date.now() - counter.firstSeen,
      trigger_log: triggerLog.id,
      timestamp: Date.now(),
      severity: 'HIGH'
    };
    
    // Log de la alerta
    this.logSecurityEvent(AUDIT_CONFIG.SECURITY_EVENTS.SECURITY_VIOLATION, alert);
    
    // Enviar alerta inmediata
    this.sendAlert(alert);
    
    console.error('🚨 Security Alert Triggered:', alert);
  }
  
  /**
   * Enviar alerta al sistema de seguridad
   */
  async sendAlert(alert) {
    try {
      await fetch('/api/security/alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }
  
  // ====================================
  // EXPORT & COMPLIANCE
  // ====================================
  
  /**
   * Exportar logs para compliance
   */
  exportLogsForCompliance(startDate, endDate, format = 'json') {
    const logs = Array.from(this.logs.values()).filter(log => 
      log.timestamp >= startDate && log.timestamp <= endDate
    );
    
    const export_data = {
      metadata: {
        export_date: new Date().toISOString(),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        total_entries: logs.length,
        integrity_verified: this.verifyLogIntegrity()
      },
      logs: logs.sort((a, b) => a.timestamp - b.timestamp)
    };
    
    this.logSecurityEvent(AUDIT_CONFIG.SECURITY_EVENTS.DATA_EXPORT, {
      export_type: 'compliance_logs',
      format,
      entry_count: logs.length
    });
    
    switch (format) {
      case 'json':
        return JSON.stringify(export_data, null, 2);
      case 'csv':
        return this.convertLogsToCSV(logs);
      case 'xml':
        return this.convertLogsToXML(export_data);
      default:
        throw new Error('Unsupported export format');
    }
  }
  
  /**
   * Obtener estadísticas de auditoría
   */
  getAuditStatistics(timeWindow = 24 * 60 * 60 * 1000) { // 24 horas por defecto
    const cutoff = Date.now() - timeWindow;
    const recentLogs = Array.from(this.logs.values()).filter(log => log.timestamp > cutoff);
    
    const stats = {
      total_logs: this.logs.size,
      recent_logs: recentLogs.length,
      events_by_category: {},
      events_by_level: {},
      unique_users: new Set(),
      security_events: 0,
      integrity_status: this.verifyLogIntegrity()
    };
    
    recentLogs.forEach(log => {
      // Por categoría
      const category = log.category || 'unknown';
      stats.events_by_category[category] = (stats.events_by_category[category] || 0) + 1;
      
      // Por nivel
      stats.events_by_level[log.level] = (stats.events_by_level[log.level] || 0) + 1;
      
      // Usuarios únicos
      if (log.user_id) {
        stats.unique_users.add(log.user_id);
      }
      
      // Eventos de seguridad
      if (log.level === AUDIT_CONFIG.LOG_LEVELS.SECURITY) {
        stats.security_events++;
      }
    });
    
    stats.unique_users = stats.unique_users.size;
    
    return stats;
  }
  
  // ====================================
  // UTILITY METHODS
  // ====================================
  
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getSessionInfo() {
    return {
      userId: this.getCurrentUserId(),
      sessionId: sessionStorage.getItem('session_id') || 'no-session'
    };
  }
  
  getContextInfo() {
    return {
      ipAddress: 'client-side', // Se obtendría del servidor
      userAgent: navigator.userAgent
    };
  }
  
  getCurrentUserId() {
    // Integrar con sistema de auth
    return 'current_user'; // Placeholder
  }
  
  getBrowserFingerprint() {
    return CryptoJS.SHA256(
      navigator.userAgent + 
      screen.width + 
      screen.height + 
      navigator.language
    ).toString().substr(0, 16);
  }
  
  getCategoryFromEvent(event) {
    if (event.startsWith('auth.')) return 'authentication';
    if (event.startsWith('authz.')) return 'authorization';
    if (event.startsWith('data.')) return 'data_access';
    if (event.startsWith('system.')) return 'system';
    if (event.startsWith('security.')) return 'security';
    if (event.startsWith('gdpr.')) return 'gdpr';
    return 'general';
  }
  
  getEventType(event) {
    if (event.includes('login') && event.includes('failed')) return 'FAILED_LOGINS';
    if (event.includes('access') && event.includes('denied')) return 'PERMISSION_DENIALS';
    if (event.includes('suspicious')) return 'SUSPICIOUS_ACTIVITY';
    if (event.includes('export')) return 'DATA_EXPORTS';
    return null;
  }
  
  getRetentionPeriod(category) {
    switch (category) {
      case 'security':
      case 'gdpr':
        return AUDIT_CONFIG.RETENTION.SECURITY_LOGS;
      case 'authentication':
      case 'authorization':
        return AUDIT_CONFIG.RETENTION.AUDIT_LOGS;
      default:
        return AUDIT_CONFIG.RETENTION.SYSTEM_LOGS;
    }
  }
  
  calculateHash(data) {
    return CryptoJS.SHA256(data).toString();
  }
  
  getLastLogHash() {
    return this.hashChain.length > 0 ? this.hashChain[this.hashChain.length - 1] : '0';
  }
  
  getNextSequenceNumber() {
    return this.logs.size + 1;
  }
  
  getStoredLogs() {
    return Array.from(this.logs.values()).sort((a, b) => a.sequence_number - b.sequence_number);
  }
  
  resetAlertCounters() {
    this.alertCounters.clear();
  }
  
  consoleLog(entry) {
    const emoji = this.getLevelEmoji(entry.level);
    console.log(`${emoji} [${entry.level.toUpperCase()}] ${entry.event}:`, entry.details);
  }
  
  getLevelEmoji(level) {
    switch (level) {
      case AUDIT_CONFIG.LOG_LEVELS.INFO: return 'ℹ️';
      case AUDIT_CONFIG.LOG_LEVELS.WARNING: return '⚠️';
      case AUDIT_CONFIG.LOG_LEVELS.ERROR: return '❌';
      case AUDIT_CONFIG.LOG_LEVELS.CRITICAL: return '🚨';
      case AUDIT_CONFIG.LOG_LEVELS.SECURITY: return '🔒';
      default: return '📋';
    }
  }
  
  // ====================================
  // PERIODIC OPERATIONS
  // ====================================
  
  setupPeriodicFlush() {
    // Enviar logs al servidor cada 5 minutos
    setInterval(() => {
      this.flushLogsToServer();
    }, 5 * 60 * 1000);
  }
  
  async flushLogsToServer() {
    const unsentLogs = Array.from(this.logs.values()).filter(log => !log.sent);
    
    if (unsentLogs.length === 0) return;
    
    try {
      await fetch('/api/security/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(unsentLogs)
      });
      
      // Marcar como enviados
      unsentLogs.forEach(log => {
        log.sent = true;
        this.logs.set(log.id, log);
      });
      
      console.log(`📋 Flushed ${unsentLogs.length} logs to server`);
    } catch (error) {
      console.error('Failed to flush logs to server:', error);
    }
  }
  
  async sendLogToServer(logEntry) {
    try {
      await fetch('/api/security/audit-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
      
      logEntry.sent = true;
    } catch (error) {
      console.error('Failed to send log to server:', error);
    }
  }
  
  // Placeholder methods for format conversion
  convertLogsToCSV(logs) {
    const headers = ['timestamp', 'event', 'level', 'user_id', 'details'];
    const rows = logs.map(log => [
      log.iso_timestamp,
      log.event,
      log.level,
      log.user_id || '',
      JSON.stringify(log.details)
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
  
  convertLogsToXML(data) {
    // Implementar conversión a XML
    return `<?xml version="1.0"?><audit_logs>${JSON.stringify(data)}</audit_logs>`;
  }
}

// ====================================
// SINGLETON INSTANCE
// ====================================

export const auditLogger = new SecurityAuditLogger();

// ====================================
// EXPORTS
// ====================================

export { AUDIT_CONFIG };
export default auditLogger;
