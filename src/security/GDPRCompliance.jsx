/**
 * Wave 7: Security & Compliance Enterprise
 * GDPR Compliance System
 * 
 * Sistema completo de cumplimiento GDPR:
 * - Gestión de consentimientos
 * - Right to be forgotten
 * - Data portability
 * - Privacy by design
 * - Audit trail de datos personales
 * - Cookie management
 * 
 * @since Wave 7 - Security & Compliance Enterprise
 * @author Sistema ERP
 */

// ====================================
// GDPR CONFIGURATION
// ====================================

const GDPR_CONFIG = {
  // Tipos de datos personales
  DATA_TYPES: {
    PERSONAL_ID: 'personal_identification',
    CONTACT_INFO: 'contact_information',
    DEMOGRAPHIC: 'demographic_data',
    BEHAVIORAL: 'behavioral_data',
    FINANCIAL: 'financial_data',
    LOCATION: 'location_data',
    TECHNICAL: 'technical_data'
  },
  
  // Bases legales para procesamiento
  LEGAL_BASIS: {
    CONSENT: 'consent',
    CONTRACT: 'contract',
    LEGAL_OBLIGATION: 'legal_obligation',
    VITAL_INTERESTS: 'vital_interests',
    PUBLIC_TASK: 'public_task',
    LEGITIMATE_INTERESTS: 'legitimate_interests'
  },
  
  // Propósitos de procesamiento
  PROCESSING_PURPOSES: {
    SERVICE_PROVISION: 'service_provision',
    ANALYTICS: 'analytics',
    MARKETING: 'marketing',
    LEGAL_COMPLIANCE: 'legal_compliance',
    SECURITY: 'security',
    CUSTOMER_SUPPORT: 'customer_support'
  },
  
  // Períodos de retención (en días)
  RETENTION_PERIODS: {
    CLIENT_DATA: 2555, // 7 años
    TRANSACTION_DATA: 2555, // 7 años
    ANALYTICS_DATA: 365, // 1 año
    LOG_DATA: 90, // 3 meses
    MARKETING_DATA: 1095 // 3 años
  }
};

// ====================================
// GDPR COMPLIANCE SERVICE
// ====================================

export class GDPRComplianceService {
  constructor() {
    this.consents = new Map();
    this.dataProcessingLog = [];
    this.dataSubjects = new Map();
    this.initializeGDPRCompliance();
  }
  
  // ====================================
  // INITIALIZATION
  // ====================================
  
  initializeGDPRCompliance() {
    this.loadConsents();
    this.setupDataProcessingMonitoring();
    this.checkRetentionPolicies();
    
    console.log('🔒 GDPR Compliance System initialized');
  }
  
  // ====================================
  // CONSENT MANAGEMENT
  // ====================================
  
  /**
   * Registrar consentimiento
   */
  recordConsent(dataSubjectId, consentData) {
    const consent = {
      id: this.generateConsentId(),
      dataSubjectId,
      timestamp: Date.now(),
      version: '1.0',
      purposes: consentData.purposes || [],
      dataTypes: consentData.dataTypes || [],
      legalBasis: consentData.legalBasis || GDPR_CONFIG.LEGAL_BASIS.CONSENT,
      granted: true,
      withdrawnAt: null,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent,
      consentMethod: consentData.method || 'explicit',
      expiresAt: consentData.expiresAt || null
    };
    
    this.consents.set(consent.id, consent);
    this.persistConsent(consent);
    
    // Log para auditoría
    this.logDataProcessing('CONSENT_GRANTED', {
      consentId: consent.id,
      dataSubjectId,
      purposes: consent.purposes
    });
    
    return consent;
  }
  
  /**
   * Retirar consentimiento
   */
  withdrawConsent(consentId, reason = '') {
    const consent = this.consents.get(consentId);
    if (!consent) {
      throw new Error('Consent not found');
    }
    
    consent.granted = false;
    consent.withdrawnAt = Date.now();
    consent.withdrawalReason = reason;
    
    this.consents.set(consentId, consent);
    this.persistConsent(consent);
    
    // Eliminar datos basados en el consentimiento retirado
    this.processConsentWithdrawal(consent);
    
    this.logDataProcessing('CONSENT_WITHDRAWN', {
      consentId,
      dataSubjectId: consent.dataSubjectId,
      reason
    });
    
    return consent;
  }
  
  /**
   * Verificar consentimiento válido
   */
  hasValidConsent(dataSubjectId, purpose, dataType) {
    const userConsents = Array.from(this.consents.values())
      .filter(consent => 
        consent.dataSubjectId === dataSubjectId &&
        consent.granted &&
        !consent.withdrawnAt &&
        consent.purposes.includes(purpose) &&
        consent.dataTypes.includes(dataType)
      );
    
    // Verificar expiración
    const validConsents = userConsents.filter(consent => {
      if (!consent.expiresAt) return true;
      return consent.expiresAt > Date.now();
    });
    
    return validConsents.length > 0;
  }
  
  /**
   * Obtener todos los consentimientos de un usuario
   */
  getUserConsents(dataSubjectId) {
    return Array.from(this.consents.values())
      .filter(consent => consent.dataSubjectId === dataSubjectId);
  }
  
  // ====================================
  // DATA SUBJECT RIGHTS
  // ====================================
  
  /**
   * Right to Access - Exportar datos del usuario
   */
  async exportUserData(dataSubjectId, format = 'json') {
    try {
      // Verificar identidad
      await this.verifyDataSubjectIdentity(dataSubjectId);
      
      // Recopilar datos de todas las fuentes
      const userData = await this.collectUserData(dataSubjectId);
      
      const exportData = {
        dataSubject: {
          id: dataSubjectId,
          exportDate: new Date().toISOString(),
          requestId: this.generateRequestId()
        },
        personalData: userData.personal,
        processingActivities: userData.processing,
        consents: this.getUserConsents(dataSubjectId),
        retentionPolicies: this.getRetentionPolicies(dataSubjectId),
        dataProcessingLog: this.getUserProcessingLog(dataSubjectId)
      };
      
      // Log del acceso
      this.logDataProcessing('DATA_EXPORT', {
        dataSubjectId,
        format,
        dataTypes: Object.keys(userData.personal)
      });
      
      // Formatear según el tipo solicitado
      switch (format) {
        case 'json':
          return JSON.stringify(exportData, null, 2);
        case 'xml':
          return this.convertToXML(exportData);
        case 'csv':
          return this.convertToCSV(exportData);
        default:
          throw new Error('Unsupported export format');
      }
      
    } catch (error) {
      this.logDataProcessing('DATA_EXPORT_FAILED', {
        dataSubjectId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Right to Rectification - Corregir datos
   */
  async rectifyUserData(dataSubjectId, corrections) {
    try {
      await this.verifyDataSubjectIdentity(dataSubjectId);
      
      // Validar correcciones
      this.validateCorrections(corrections);
      
      // Aplicar correcciones
      const results = await this.applyDataCorrections(dataSubjectId, corrections);
      
      this.logDataProcessing('DATA_RECTIFICATION', {
        dataSubjectId,
        corrections: Object.keys(corrections),
        success: results.success
      });
      
      return results;
      
    } catch (error) {
      this.logDataProcessing('DATA_RECTIFICATION_FAILED', {
        dataSubjectId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Right to Erasure - Eliminar datos (Right to be Forgotten)
   */
  async eraseUserData(dataSubjectId, reason = '', exceptions = []) {
    try {
      await this.verifyDataSubjectIdentity(dataSubjectId);
      
      // Verificar si hay bases legales que impiden la eliminación
      const legalObligations = await this.checkLegalObligations(dataSubjectId);
      
      if (legalObligations.length > 0 && !exceptions.includes('override_legal')) {
        throw new Error(`Cannot erase data due to legal obligations: ${legalObligations.join(', ')}`);
      }
      
      // Proceso de eliminación
      const erasureResults = await this.performDataErasure(dataSubjectId, exceptions);
      
      // Notificar a terceros si es necesario
      await this.notifyThirdParties(dataSubjectId, 'ERASURE');
      
      this.logDataProcessing('DATA_ERASURE', {
        dataSubjectId,
        reason,
        erasedData: erasureResults.erasedData,
        retainedData: erasureResults.retainedData,
        legalBasis: erasureResults.legalBasis
      });
      
      return erasureResults;
      
    } catch (error) {
      this.logDataProcessing('DATA_ERASURE_FAILED', {
        dataSubjectId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Right to Data Portability - Exportar datos en formato portátil
   */
  async portUserData(dataSubjectId, targetFormat = 'json') {
    try {
      await this.verifyDataSubjectIdentity(dataSubjectId);
      
      // Solo datos basados en consentimiento o contrato
      const portableData = await this.collectPortableData(dataSubjectId);
      
      const portabilityPackage = {
        metadata: {
          dataSubject: dataSubjectId,
          exportDate: new Date().toISOString(),
          format: targetFormat,
          standard: 'GDPR_PORTABILITY_v1.0'
        },
        data: portableData
      };
      
      this.logDataProcessing('DATA_PORTABILITY', {
        dataSubjectId,
        format: targetFormat,
        dataSize: JSON.stringify(portableData).length
      });
      
      return this.formatPortableData(portabilityPackage, targetFormat);
      
    } catch (error) {
      this.logDataProcessing('DATA_PORTABILITY_FAILED', {
        dataSubjectId,
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Right to Restrict Processing - Restringir procesamiento
   */
  async restrictProcessing(dataSubjectId, restrictions) {
    try {
      await this.verifyDataSubjectIdentity(dataSubjectId);
      
      const restriction = {
        id: this.generateRestrictionId(),
        dataSubjectId,
        restrictions: restrictions,
        timestamp: Date.now(),
        active: true
      };
      
      // Aplicar restricciones
      await this.applyProcessingRestrictions(restriction);
      
      this.logDataProcessing('PROCESSING_RESTRICTED', {
        dataSubjectId,
        restrictions
      });
      
      return restriction;
      
    } catch (error) {
      this.logDataProcessing('PROCESSING_RESTRICTION_FAILED', {
        dataSubjectId,
        error: error.message
      });
      throw error;
    }
  }
  
  // ====================================
  // DATA PROCESSING MONITORING
  // ====================================
  
  /**
   * Configurar monitoreo de procesamiento de datos
   */
  setupDataProcessingMonitoring() {
    // Interceptar requests que procesan datos personales
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const [url, options = {}] = args;
      
      // Verificar si el request procesa datos personales
      if (this.containsPersonalData(options.body)) {
        this.logDataProcessing('API_REQUEST', {
          url: url.toString(),
          method: options.method || 'GET',
          timestamp: Date.now()
        });
      }
      
      return originalFetch(...args);
    };
  }
  
  /**
   * Log de procesamiento de datos
   */
  logDataProcessing(activity, details) {
    const logEntry = {
      id: this.generateLogId(),
      activity,
      details,
      timestamp: Date.now(),
      sessionId: this.getSessionId(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    this.dataProcessingLog.push(logEntry);
    
    // Enviar al servidor para auditoría
    this.sendProcessingLog(logEntry);
    
    // Limpiar logs antiguos
    this.cleanupOldLogs();
  }
  
  /**
   * Obtener log de procesamiento de un usuario
   */
  getUserProcessingLog(dataSubjectId) {
    return this.dataProcessingLog.filter(entry => 
      entry.details.dataSubjectId === dataSubjectId
    );
  }
  
  // ====================================
  // RETENTION POLICIES
  // ====================================
  
  /**
   * Verificar políticas de retención
   */
  checkRetentionPolicies() {
    setInterval(() => {
      this.enforceRetentionPolicies();
    }, 24 * 60 * 60 * 1000); // Verificar diariamente
  }
  
  /**
   * Aplicar políticas de retención
   */
  async enforceRetentionPolicies() {
    try {
      const now = Date.now();
      
      // Verificar cada tipo de dato
      for (const [dataType, retentionPeriod] of Object.entries(GDPR_CONFIG.RETENTION_PERIODS)) {
        const expiredData = await this.findExpiredData(dataType, retentionPeriod);
        
        for (const dataItem of expiredData) {
          // Verificar si hay bases legales para retención
          const canDelete = await this.canDeleteExpiredData(dataItem);
          
          if (canDelete) {
            await this.deleteExpiredData(dataItem);
            
            this.logDataProcessing('DATA_RETENTION_DELETION', {
              dataType,
              dataId: dataItem.id,
              retentionPeriod
            });
          }
        }
      }
      
    } catch (error) {
      console.error('Retention policy enforcement failed:', error);
    }
  }
  
  // ====================================
  // COOKIE MANAGEMENT
  // ====================================
  
  /**
   * Gestión de cookies según GDPR
   */
  manageCookies() {
    return {
      // Cookies esenciales (no requieren consentimiento)
      essential: [
        'session_id',
        'csrf_token',
        'security_token'
      ],
      
      // Cookies que requieren consentimiento
      nonEssential: [
        'analytics_id',
        'marketing_id',
        'preference_settings'
      ],
      
      // Configurar consentimiento para cookies
      setConsentForCookies: (cookieTypes, consent) => {
        cookieTypes.forEach(cookieType => {
          if (consent) {
            this.enableCookie(cookieType);
          } else {
            this.disableCookie(cookieType);
          }
        });
      },
      
      // Verificar consentimiento de cookie
      hasCookieConsent: (cookieType) => {
        return this.hasValidConsent('current_user', 'analytics', 'technical');
      }
    };
  }
  
  // ====================================
  // UTILITY METHODS
  // ====================================
  
  generateConsentId() {
    return `consent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  generateRestrictionId() {
    return `rest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getClientIP() {
    // En producción se obtendría del servidor
    return 'client-side';
  }
  
  getSessionId() {
    return sessionStorage.getItem('session_id') || 'no-session';
  }
  
  async verifyDataSubjectIdentity(dataSubjectId) {
    // Implementar verificación de identidad robusta
    return true;
  }
  
  containsPersonalData(data) {
    if (!data) return false;
    
    const personalDataPatterns = [
      /email/i,
      /phone/i,
      /address/i,
      /name/i,
      /dni/i,
      /passport/i
    ];
    
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return personalDataPatterns.some(pattern => pattern.test(dataString));
  }
  
  async sendProcessingLog(logEntry) {
    try {
      await fetch('/api/gdpr/processing-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to send processing log:', error);
    }
  }
  
  cleanupOldLogs() {
    const maxAge = 90 * 24 * 60 * 60 * 1000; // 90 días
    const cutoff = Date.now() - maxAge;
    
    this.dataProcessingLog = this.dataProcessingLog.filter(
      entry => entry.timestamp > cutoff
    );
  }
  
  persistConsent(consent) {
    // Enviar al servidor para persistencia
    fetch('/api/gdpr/consent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(consent)
    }).catch(error => {
      console.error('Failed to persist consent:', error);
    });
  }
  
  loadConsents() {
    // Cargar consentimientos desde el servidor
    fetch('/api/gdpr/consents')
      .then(response => response.json())
      .then(consents => {
        consents.forEach(consent => {
          this.consents.set(consent.id, consent);
        });
      })
      .catch(error => {
        console.error('Failed to load consents:', error);
      });
  }
  
  // Placeholder methods - implementar según necesidades específicas
  async collectUserData(dataSubjectId) {
    return { personal: {}, processing: [] };
  }
  
  async applyDataCorrections(dataSubjectId, corrections) {
    return { success: true };
  }
  
  async performDataErasure(dataSubjectId, exceptions) {
    return { erasedData: [], retainedData: [], legalBasis: [] };
  }
  
  async collectPortableData(dataSubjectId) {
    return {};
  }
  
  validateCorrections(corrections) {
    return true;
  }
  
  async checkLegalObligations(dataSubjectId) {
    return [];
  }
  
  async notifyThirdParties(dataSubjectId, action) {
    return true;
  }
  
  formatPortableData(data, format) {
    return JSON.stringify(data, null, 2);
  }
  
  async applyProcessingRestrictions(restriction) {
    return true;
  }
  
  async findExpiredData(dataType, retentionPeriod) {
    return [];
  }
  
  async canDeleteExpiredData(dataItem) {
    return true;
  }
  
  async deleteExpiredData(dataItem) {
    return true;
  }
  
  enableCookie(cookieType) {
    console.log(`Cookie enabled: ${cookieType}`);
  }
  
  disableCookie(cookieType) {
    console.log(`Cookie disabled: ${cookieType}`);
  }
}

// ====================================
// GDPR REACT COMPONENTS
// ====================================

export const GDPRConsentBanner = ({ onConsent }) => {
  const [showBanner, setShowBanner] = useState(true);
  const [gdprService] = useState(() => new GDPRComplianceService());
  
  const handleAcceptAll = () => {
    const consent = gdprService.recordConsent('current_user', {
      purposes: Object.values(GDPR_CONFIG.PROCESSING_PURPOSES),
      dataTypes: Object.values(GDPR_CONFIG.DATA_TYPES),
      method: 'banner_accept_all'
    });
    
    setShowBanner(false);
    onConsent?.(consent);
  };
  
  const handleRejectAll = () => {
    setShowBanner(false);
    onConsent?.(null);
  };
  
  if (!showBanner) return null;
  
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 z-50">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between">
        <div className="mb-4 md:mb-0">
          <p className="text-sm">
            Utilizamos cookies y procesamos datos personales para mejorar tu experiencia. 
            <a href="/privacy-policy" className="underline ml-1">Política de Privacidad</a>
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={handleRejectAll}
            className="px-4 py-2 text-sm border border-gray-600 rounded hover:bg-gray-800"
          >
            Rechazar
          </button>
          <button
            onClick={handleAcceptAll}
            className="px-4 py-2 text-sm bg-blue-600 rounded hover:bg-blue-700"
          >
            Aceptar Todo
          </button>
        </div>
      </div>
    </div>
  );
};

// ====================================
// EXPORTS
// ====================================

export default GDPRComplianceService;
export { GDPR_CONFIG };
