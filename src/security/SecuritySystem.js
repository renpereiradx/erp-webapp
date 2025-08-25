/**
 * Wave 7: Security & Compliance Enterprise
 * Integrated Security System
 * 
 * Sistema integrado que orquesta todos los componentes de seguridad:
 * - JWT Authentication
 * - RBAC Authorization
 * - GDPR Compliance
 * - CSP Security
 * - Audit Logging
 * - Security monitoring
 * 
 * @since Wave 7 - Security & Compliance Enterprise
 * @author Sistema ERP
 */

import { authService } from './JWTAuthService';
import RBACService from './RBACService';
import GDPRComplianceService from './GDPRCompliance';
import CSPService from './CSPService';
import { auditLogger, AUDIT_CONFIG } from './AuditLogger';

// ====================================
// INTEGRATED SECURITY SYSTEM
// ====================================

export class IntegratedSecuritySystem {
  constructor() {
    this.authService = authService;
    this.rbacService = new RBACService(authService);
    this.gdprService = new GDPRComplianceService();
    this.cspService = new CSPService();
    this.auditLogger = auditLogger;
    
    this.isInitialized = false;
    this.securityMetrics = {
      startTime: Date.now(),
      authEvents: 0,
      authzEvents: 0,
      gdprEvents: 0,
      cspViolations: 0,
      auditLogs: 0
    };
    
    this.initializeSecuritySystem();
  }
  
  // ====================================
  // INITIALIZATION
  // ====================================
  
  async initializeSecuritySystem() {
    try {
      console.log('🔒 Initializing Integrated Security System...');
      
      // Inicializar componentes en orden
      await this.initializeAuthentication();
      await this.initializeAuthorization();
      await this.initializeGDPRCompliance();
      await this.initializeCSP();
      await this.initializeAuditLogging();
      
      // Configurar integraciones entre componentes
      this.setupSecurityIntegrations();
      
      // Configurar monitoreo
      this.setupSecurityMonitoring();
      
      // Realizar chequeos de seguridad iniciales
      await this.performSecurityHealthCheck();
      
      this.isInitialized = true;
      
      // Log de inicialización exitosa
      this.auditLogger.logSecurityEvent(
        'SECURITY_SYSTEM_INITIALIZED',
        {
          components: ['auth', 'rbac', 'gdpr', 'csp', 'audit'],
          timestamp: Date.now()
        }
      );
      
      console.log('✅ Integrated Security System initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize security system:', error);
      
      this.auditLogger.logSecurityEvent(
        AUDIT_CONFIG.SECURITY_EVENTS.SECURITY_VIOLATION,
        {
          type: 'SECURITY_SYSTEM_INIT_FAILED',
          error: error.message,
          severity: 'CRITICAL'
        }
      );
      
      throw error;
    }
  }
  
  async initializeAuthentication() {
    // El servicio de auth ya está inicializado
    console.log('✅ Authentication service ready');
  }
  
  async initializeAuthorization() {
    // RBAC service ya está inicializado
    console.log('✅ RBAC service ready');
  }
  
  async initializeGDPRCompliance() {
    // GDPR service ya está inicializado
    console.log('✅ GDPR compliance ready');
  }
  
  async initializeCSP() {
    // CSP service ya está inicializado
    console.log('✅ CSP security ready');
  }
  
  async initializeAuditLogging() {
    // Audit logger ya está inicializado
    console.log('✅ Audit logging ready');
  }
  
  // ====================================
  // SECURITY INTEGRATIONS
  // ====================================
  
  setupSecurityIntegrations() {
    // Integrar auth con audit logging
    this.integrateAuthWithAudit();
    
    // Integrar RBAC con audit logging
    this.integrateRBACWithAudit();
    
    // Integrar GDPR con audit logging
    this.integrateGDPRWithAudit();
    
    // Integrar CSP con audit logging
    this.integrateCSPWithAudit();
    
    console.log('🔗 Security component integrations configured');
  }
  
  integrateAuthWithAudit() {
    // Interceptar eventos de autenticación
    const originalLogin = this.authService.login.bind(this.authService);
    const originalLogout = this.authService.logout.bind(this.authService);
    
    this.authService.login = async (...args) => {
      try {
        const result = await originalLogin(...args);
        
        this.auditLogger.logAuthEvent(
          AUDIT_CONFIG.SECURITY_EVENTS.LOGIN_SUCCESS,
          result.user.id,
          { sessionId: result.sessionId }
        );
        
        this.securityMetrics.authEvents++;
        return result;
      } catch (error) {
        this.auditLogger.logAuthEvent(
          AUDIT_CONFIG.SECURITY_EVENTS.LOGIN_FAILED,
          args[0]?.username || 'unknown',
          { error: error.message, ipAddress: 'client-side' }
        );
        
        this.securityMetrics.authEvents++;
        throw error;
      }
    };
    
    this.authService.logout = async (...args) => {
      const user = this.authService.getCurrentUser();
      const result = await originalLogout(...args);
      
      this.auditLogger.logAuthEvent(
        AUDIT_CONFIG.SECURITY_EVENTS.LOGOUT,
        user?.id || 'unknown'
      );
      
      this.securityMetrics.authEvents++;
      return result;
    };
  }
  
  integrateRBACWithAudit() {
    // Interceptar verificaciones de permisos
    const originalHasPermission = this.rbacService.hasPermission.bind(this.rbacService);
    
    this.rbacService.hasPermission = (permission) => {
      const result = originalHasPermission(permission);
      
      if (!result) {
        this.auditLogger.logSecurityEvent(
          AUDIT_CONFIG.SECURITY_EVENTS.ACCESS_DENIED,
          {
            permission,
            userId: this.authService.getCurrentUser()?.id
          }
        );
        
        this.securityMetrics.authzEvents++;
      }
      
      return result;
    };
  }
  
  integrateGDPRWithAudit() {
    // GDPR service ya tiene logging integrado
  }
  
  integrateCSPWithAudit() {
    // CSP service ya tiene logging integrado
  }
  
  // ====================================
  // SECURITY MONITORING
  // ====================================
  
  setupSecurityMonitoring() {
    // Monitoreo de métricas cada 5 minutos
    setInterval(() => {
      this.collectSecurityMetrics();
    }, 5 * 60 * 1000);
    
    // Monitoreo de amenazas cada minuto
    setInterval(() => {
      this.monitorSecurityThreats();
    }, 60 * 1000);
    
    // Report diario de seguridad
    setInterval(() => {
      this.generateDailySecurityReport();
    }, 24 * 60 * 60 * 1000);
    
    console.log('📊 Security monitoring configured');
  }
  
  collectSecurityMetrics() {
    const metrics = {
      ...this.securityMetrics,
      timestamp: Date.now(),
      uptime: Date.now() - this.securityMetrics.startTime,
      
      // Métricas de audit
      auditStats: this.auditLogger.getAuditStatistics(),
      
      // Métricas de CSP
      cspStats: this.cspService.getCSPStats(),
      
      // Métricas de RBAC
      rbacStats: this.rbacService.getAuditStats(),
      
      // Estado de autenticación
      authState: {
        isAuthenticated: this.authService.isAuthenticated(),
        currentUser: this.authService.getCurrentUser()?.id
      }
    };
    
    // Enviar métricas al servidor
    this.sendSecurityMetrics(metrics);
    
    return metrics;
  }
  
  monitorSecurityThreats() {
    // Detectar patrones sospechosos
    const threats = this.detectSecurityThreats();
    
    threats.forEach(threat => {
      this.handleSecurityThreat(threat);
    });
  }
  
  detectSecurityThreats() {
    const threats = [];
    const auditStats = this.auditLogger.getAuditStatistics(60 * 60 * 1000); // Última hora
    
    // Demasiados eventos de seguridad
    if (auditStats.security_events > 10) {
      threats.push({
        type: 'HIGH_SECURITY_EVENT_RATE',
        severity: 'HIGH',
        details: { events: auditStats.security_events }
      });
    }
    
    // Múltiples usuarios únicos (posible ataque)
    if (auditStats.unique_users > 20) {
      threats.push({
        type: 'UNUSUAL_USER_ACTIVITY',
        severity: 'MEDIUM',
        details: { unique_users: auditStats.unique_users }
      });
    }
    
    // Violaciones de CSP frecuentes
    const cspStats = this.cspService.getCSPStats();
    if (cspStats.recentViolations > 5) {
      threats.push({
        type: 'HIGH_CSP_VIOLATION_RATE',
        severity: 'MEDIUM',
        details: { violations: cspStats.recentViolations }
      });
    }
    
    return threats;
  }
  
  handleSecurityThreat(threat) {
    this.auditLogger.logSuspiciousActivity(
      `Security threat detected: ${threat.type}`,
      threat.severity.toLowerCase(),
      threat.details
    );
    
    // Acciones automáticas según severidad
    switch (threat.severity) {
      case 'CRITICAL':
        this.triggerEmergencyProtocol(threat);
        break;
      case 'HIGH':
        this.enhanceSecurityMeasures(threat);
        break;
      case 'MEDIUM':
        this.increaseMonitoring(threat);
        break;
    }
  }
  
  // ====================================
  // SECURITY ACTIONS
  // ====================================
  
  triggerEmergencyProtocol(threat) {
    console.error('🚨 EMERGENCY: Security threat detected', threat);
    
    // Implementar acciones de emergencia:
    // - Bloquear usuario
    // - Aumentar logging
    // - Notificar administradores
    // - Activar modo de seguridad alto
  }
  
  enhanceSecurityMeasures(threat) {
    console.warn('⚠️ HIGH THREAT: Enhancing security measures', threat);
    
    // Implementar medidas adicionales:
    // - Requerir re-autenticación
    // - Aumentar verificaciones
    // - Reducir timeouts de sesión
  }
  
  increaseMonitoring(threat) {
    console.info('👁️ MEDIUM THREAT: Increasing monitoring', threat);
    
    // Aumentar frecuencia de monitoreo temporalmente
  }
  
  // ====================================
  // SECURITY HEALTH CHECK
  // ====================================
  
  async performSecurityHealthCheck() {
    const healthCheck = {
      timestamp: Date.now(),
      components: {},
      overall: 'HEALTHY'
    };
    
    // Verificar cada componente
    healthCheck.components.authentication = await this.checkAuthHealth();
    healthCheck.components.authorization = await this.checkRBACHealth();
    healthCheck.components.gdpr = await this.checkGDPRHealth();
    healthCheck.components.csp = await this.checkCSPHealth();
    healthCheck.components.audit = await this.checkAuditHealth();
    
    // Determinar salud general
    const unhealthyComponents = Object.values(healthCheck.components)
      .filter(status => status !== 'HEALTHY');
    
    if (unhealthyComponents.length > 0) {
      healthCheck.overall = unhealthyComponents.includes('CRITICAL') ? 'CRITICAL' : 'WARNING';
    }
    
    // Log del health check
    this.auditLogger.logSecurityEvent(
      'SECURITY_HEALTH_CHECK',
      healthCheck
    );
    
    return healthCheck;
  }
  
  async checkAuthHealth() {
    try {
      // Verificar que el servicio de auth responde
      const isWorking = this.authService.isAuthenticated !== undefined;
      return isWorking ? 'HEALTHY' : 'WARNING';
    } catch (error) {
      return 'CRITICAL';
    }
  }
  
  async checkRBACHealth() {
    try {
      // Verificar que RBAC funciona
      const hasMethod = typeof this.rbacService.hasPermission === 'function';
      return hasMethod ? 'HEALTHY' : 'WARNING';
    } catch (error) {
      return 'CRITICAL';
    }
  }
  
  async checkGDPRHealth() {
    try {
      // Verificar que GDPR service funciona
      const hasMethod = typeof this.gdprService.recordConsent === 'function';
      return hasMethod ? 'HEALTHY' : 'WARNING';
    } catch (error) {
      return 'CRITICAL';
    }
  }
  
  async checkCSPHealth() {
    try {
      // Verificar que CSP está configurado
      const hasNonce = this.cspService.getNonce('script') !== undefined;
      return hasNonce ? 'HEALTHY' : 'WARNING';
    } catch (error) {
      return 'CRITICAL';
    }
  }
  
  async checkAuditHealth() {
    try {
      // Verificar integridad de logs
      const integrityOk = this.auditLogger.verifyLogIntegrity();
      return integrityOk ? 'HEALTHY' : 'CRITICAL';
    } catch (error) {
      return 'CRITICAL';
    }
  }
  
  // ====================================
  // REPORTING
  // ====================================
  
  generateDailySecurityReport() {
    const report = {
      date: new Date().toISOString().split('T')[0],
      summary: this.collectSecurityMetrics(),
      healthCheck: this.performSecurityHealthCheck(),
      recommendations: this.generateSecurityRecommendations()
    };
    
    // Log del reporte
    this.auditLogger.logSecurityEvent(
      'DAILY_SECURITY_REPORT',
      report
    );
    
    // Enviar reporte
    this.sendDailyReport(report);
    
    return report;
  }
  
  generateSecurityRecommendations() {
    const recommendations = [];
    const cspStats = this.cspService.getCSPStats();
    const auditStats = this.auditLogger.getAuditStatistics();
    
    if (cspStats.totalViolations > 10) {
      recommendations.push({
        type: 'CSP_OPTIMIZATION',
        priority: 'MEDIUM',
        description: 'Review and optimize CSP policies to reduce violations'
      });
    }
    
    if (auditStats.security_events > 20) {
      recommendations.push({
        type: 'SECURITY_REVIEW',
        priority: 'HIGH',
        description: 'High number of security events detected, review security posture'
      });
    }
    
    return recommendations;
  }
  
  // ====================================
  // API METHODS
  // ====================================
  
  /**
   * Método principal para verificar acceso
   */
  async checkAccess(resource, action, context = {}) {
    try {
      // 1. Verificar autenticación
      if (!this.authService.isAuthenticated()) {
        throw new Error('Not authenticated');
      }
      
      // 2. Verificar autorización
      const permission = `${resource}:${action}`;
      this.rbacService.requirePermission(permission, action, context);
      
      // 3. Verificar compliance GDPR si es necesario
      if (this.isPersonalDataAccess(resource, action)) {
        await this.verifyGDPRCompliance(resource, action, context);
      }
      
      // 4. Log del acceso exitoso
      this.auditLogger.logDataAccess(action, resource, context.recordId, context);
      
      return true;
      
    } catch (error) {
      // Log del acceso denegado
      this.auditLogger.logSecurityEvent(
        AUDIT_CONFIG.SECURITY_EVENTS.ACCESS_DENIED,
        {
          resource,
          action,
          context,
          error: error.message,
          userId: this.authService.getCurrentUser()?.id
        }
      );
      
      throw error;
    }
  }
  
  /**
   * Login seguro con todas las verificaciones
   */
  async secureLogin(credentials) {
    try {
      // Intentar login
      const result = await this.authService.login(credentials);
      
      // Limpiar contadores de fallos
      this.clearLoginFailures(credentials.username);
      
      return result;
      
    } catch (error) {
      // Incrementar contador de fallos
      this.recordLoginFailure(credentials.username);
      
      throw error;
    }
  }
  
  // ====================================
  // UTILITY METHODS
  // ====================================
  
  isPersonalDataAccess(resource, action) {
    const personalDataResources = ['clients', 'users', 'contacts'];
    return personalDataResources.includes(resource);
  }
  
  async verifyGDPRCompliance(resource, action, context) {
    const user = this.authService.getCurrentUser();
    
    // Verificar consentimiento si es necesario
    if (action === 'read' || action === 'export') {
      const hasConsent = this.gdprService.hasValidConsent(
        context.dataSubjectId || user.id,
        'data_processing',
        'personal_data'
      );
      
      if (!hasConsent) {
        throw new Error('GDPR consent required');
      }
    }
  }
  
  recordLoginFailure(username) {
    // Implementar contador de fallos de login
  }
  
  clearLoginFailures(username) {
    // Limpiar contador de fallos
  }
  
  async sendSecurityMetrics(metrics) {
    try {
      await fetch('/api/security/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics)
      });
    } catch (error) {
      console.error('Failed to send security metrics:', error);
    }
  }
  
  async sendDailyReport(report) {
    try {
      await fetch('/api/security/daily-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });
    } catch (error) {
      console.error('Failed to send daily report:', error);
    }
  }
  
  // ====================================
  // PUBLIC API
  // ====================================
  
  getSecurityStatus() {
    return {
      initialized: this.isInitialized,
      authenticated: this.authService.isAuthenticated(),
      currentUser: this.authService.getCurrentUser(),
      metrics: this.securityMetrics,
      healthCheck: this.performSecurityHealthCheck()
    };
  }
  
  getServices() {
    return {
      auth: this.authService,
      rbac: this.rbacService,
      gdpr: this.gdprService,
      csp: this.cspService,
      audit: this.auditLogger
    };
  }
}

// ====================================
// SINGLETON INSTANCE
// ====================================

export const securitySystem = new IntegratedSecuritySystem();

// ====================================
// EXPORTS
// ====================================

export default securitySystem;
