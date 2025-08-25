/**
 * Wave 7: Security & Compliance Enterprise
 * Security Configuration
 * 
 * Configuración centralizada para todo el sistema de seguridad:
 * - Configuración de autenticación
 * - Configuración de autorización
 * - Configuración GDPR
 * - Configuración CSP
 * - Configuración de auditoría
 * - Configuración de monitoreo
 * 
 * @since Wave 7 - Security & Compliance Enterprise
 * @author Sistema ERP
 */

// ====================================
// AUTHENTICATION CONFIGURATION
// ====================================

export const AUTH_CONFIG = {
  // JWT Configuration
  JWT: {
    ACCESS_TOKEN_EXPIRY: 15 * 60 * 1000, // 15 minutos
    REFRESH_TOKEN_EXPIRY: 7 * 24 * 60 * 60 * 1000, // 7 días
    ALGORITHM: 'HS256',
    ISSUER: 'erp-webapp',
    AUDIENCE: 'erp-users',
    
    // Token storage
    STORAGE: {
      ACCESS_TOKEN_KEY: 'erp_access_token',
      REFRESH_TOKEN_KEY: 'erp_refresh_token',
      USER_DATA_KEY: 'erp_user_data',
      DEVICE_ID_KEY: 'erp_device_id',
      ENCRYPTION_KEY: 'erp_security_key_v1'
    }
  },
  
  // Session Configuration
  SESSION: {
    MAX_CONCURRENT_SESSIONS: 3,
    INACTIVITY_TIMEOUT: 30 * 60 * 1000, // 30 minutos
    ABSOLUTE_TIMEOUT: 8 * 60 * 60 * 1000, // 8 horas
    REMEMBER_ME_DURATION: 30 * 24 * 60 * 60 * 1000, // 30 días
    
    // Device tracking
    TRACK_DEVICES: true,
    MAX_DEVICES_PER_USER: 5
  },
  
  // Password Policy
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true,
    SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
    
    // History and reuse
    HISTORY_SIZE: 5, // No reutilizar últimas 5 contraseñas
    MIN_AGE: 24 * 60 * 60 * 1000, // Mínimo 1 día antes de cambiar
    MAX_AGE: 90 * 24 * 60 * 60 * 1000, // Máximo 90 días
    
    // Attempts and lockout
    MAX_FAILED_ATTEMPTS: 5,
    LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutos
    PROGRESSIVE_LOCKOUT: true
  },
  
  // MFA Configuration
  MFA: {
    ENABLED: true,
    REQUIRED_FOR_ADMIN: true,
    REQUIRED_FOR_SENSITIVE_ACTIONS: true,
    
    // TOTP
    TOTP: {
      ISSUER: 'ERP WebApp',
      ALGORITHM: 'SHA1',
      DIGITS: 6,
      WINDOW: 1,
      STEP: 30
    },
    
    // Backup codes
    BACKUP_CODES: {
      COUNT: 10,
      LENGTH: 8
    }
  }
};

// ====================================
// AUTHORIZATION CONFIGURATION
// ====================================

export const RBAC_CONFIG = {
  // Roles predefinidos
  ROLES: {
    SUPER_ADMIN: {
      name: 'Super Administrator',
      description: 'Full system access',
      permissions: ['*']
    },
    ADMIN: {
      name: 'Administrator',
      description: 'Administrative access',
      permissions: [
        'users:*',
        'roles:*',
        'system:read',
        'reports:*',
        'audit:read'
      ]
    },
    MANAGER: {
      name: 'Manager',
      description: 'Management access',
      permissions: [
        'products:*',
        'suppliers:*',
        'clients:*',
        'orders:*',
        'reports:read',
        'dashboard:read'
      ]
    },
    SALES: {
      name: 'Sales Representative',
      description: 'Sales access',
      permissions: [
        'products:read',
        'clients:*',
        'orders:create',
        'orders:read',
        'orders:update',
        'dashboard:read'
      ]
    },
    INVENTORY: {
      name: 'Inventory Manager',
      description: 'Inventory management',
      permissions: [
        'products:*',
        'suppliers:*',
        'inventory:*',
        'purchase:*',
        'reports:read'
      ]
    },
    ACCOUNTANT: {
      name: 'Accountant',
      description: 'Financial access',
      permissions: [
        'finance:*',
        'reports:read',
        'orders:read',
        'clients:read',
        'suppliers:read'
      ]
    },
    VIEWER: {
      name: 'Viewer',
      description: 'Read-only access',
      permissions: [
        'products:read',
        'clients:read',
        'orders:read',
        'dashboard:read'
      ]
    },
    AUDITOR: {
      name: 'Auditor',
      description: 'Audit access',
      permissions: [
        'audit:read',
        'reports:read',
        'users:read',
        'logs:read'
      ]
    },
    GUEST: {
      name: 'Guest',
      description: 'Limited access',
      permissions: [
        'dashboard:read'
      ]
    }
  },
  
  // Permisos granulares
  PERMISSIONS: {
    // Usuarios
    'users:create': 'Create users',
    'users:read': 'View users',
    'users:update': 'Update users',
    'users:delete': 'Delete users',
    'users:manage_roles': 'Manage user roles',
    
    // Roles
    'roles:create': 'Create roles',
    'roles:read': 'View roles',
    'roles:update': 'Update roles',
    'roles:delete': 'Delete roles',
    'roles:assign': 'Assign roles',
    
    // Productos
    'products:create': 'Create products',
    'products:read': 'View products',
    'products:update': 'Update products',
    'products:delete': 'Delete products',
    'products:manage_categories': 'Manage product categories',
    
    // Clientes
    'clients:create': 'Create clients',
    'clients:read': 'View clients',
    'clients:update': 'Update clients',
    'clients:delete': 'Delete clients',
    'clients:export': 'Export client data',
    
    // Proveedores
    'suppliers:create': 'Create suppliers',
    'suppliers:read': 'View suppliers',
    'suppliers:update': 'Update suppliers',
    'suppliers:delete': 'Delete suppliers',
    
    // Órdenes
    'orders:create': 'Create orders',
    'orders:read': 'View orders',
    'orders:update': 'Update orders',
    'orders:delete': 'Delete orders',
    'orders:approve': 'Approve orders',
    'orders:cancel': 'Cancel orders',
    
    // Inventario
    'inventory:read': 'View inventory',
    'inventory:update': 'Update inventory',
    'inventory:transfer': 'Transfer inventory',
    'inventory:audit': 'Audit inventory',
    
    // Compras
    'purchase:create': 'Create purchases',
    'purchase:read': 'View purchases',
    'purchase:update': 'Update purchases',
    'purchase:approve': 'Approve purchases',
    
    // Finanzas
    'finance:read': 'View financial data',
    'finance:update': 'Update financial data',
    'finance:reports': 'Generate financial reports',
    'finance:payments': 'Manage payments',
    
    // Reportes
    'reports:read': 'View reports',
    'reports:create': 'Create reports',
    'reports:export': 'Export reports',
    
    // Sistema
    'system:read': 'View system settings',
    'system:update': 'Update system settings',
    'system:backup': 'Create backups',
    'system:restore': 'Restore backups',
    
    // Auditoría
    'audit:read': 'View audit logs',
    'audit:export': 'Export audit logs',
    
    // Dashboard
    'dashboard:read': 'View dashboard',
    'dashboard:customize': 'Customize dashboard',
    
    // Logs
    'logs:read': 'View system logs',
    'logs:export': 'Export logs'
  },
  
  // Configuración de verificación
  VERIFICATION: {
    CACHE_PERMISSIONS: true,
    CACHE_TTL: 5 * 60 * 1000, // 5 minutos
    STRICT_MODE: true, // Denegar por defecto
    LOG_ACCESS_ATTEMPTS: true
  }
};

// ====================================
// GDPR CONFIGURATION
// ====================================

export const GDPR_CONFIG = {
  // Configuración general
  GENERAL: {
    DATA_CONTROLLER: 'ERP WebApp',
    CONTACT_EMAIL: 'privacy@erp-webapp.com',
    DPO_EMAIL: 'dpo@erp-webapp.com',
    PRIVACY_POLICY_URL: '/privacy-policy',
    COOKIE_POLICY_URL: '/cookie-policy'
  },
  
  // Tipos de consentimiento
  CONSENT_TYPES: {
    ESSENTIAL: {
      name: 'Essential Cookies',
      description: 'Required for basic functionality',
      required: true,
      duration: null // Permanente
    },
    ANALYTICS: {
      name: 'Analytics',
      description: 'Help us improve the application',
      required: false,
      duration: 365 * 24 * 60 * 60 * 1000 // 1 año
    },
    MARKETING: {
      name: 'Marketing',
      description: 'Personalized content and advertisements',
      required: false,
      duration: 365 * 24 * 60 * 60 * 1000 // 1 año
    },
    DATA_PROCESSING: {
      name: 'Data Processing',
      description: 'Process personal data for business purposes',
      required: true,
      duration: 2 * 365 * 24 * 60 * 60 * 1000 // 2 años
    }
  },
  
  // Categorías de datos
  DATA_CATEGORIES: {
    PERSONAL_DATA: [
      'name',
      'email',
      'phone',
      'address',
      'identification'
    ],
    SENSITIVE_DATA: [
      'financial_data',
      'health_data',
      'biometric_data'
    ],
    TECHNICAL_DATA: [
      'ip_address',
      'browser_info',
      'device_info',
      'usage_data'
    ]
  },
  
  // Políticas de retención
  RETENTION: {
    USER_DATA: 7 * 365 * 24 * 60 * 60 * 1000, // 7 años
    AUDIT_LOGS: 10 * 365 * 24 * 60 * 60 * 1000, // 10 años
    SESSION_DATA: 30 * 24 * 60 * 60 * 1000, // 30 días
    CONSENT_RECORDS: 3 * 365 * 24 * 60 * 60 * 1000, // 3 años
    
    // Configuración de limpieza automática
    AUTO_CLEANUP: true,
    CLEANUP_INTERVAL: 24 * 60 * 60 * 1000, // Diario
    NOTIFICATION_BEFORE_DELETION: 30 * 24 * 60 * 60 * 1000 // 30 días
  },
  
  // Derechos del usuario
  USER_RIGHTS: {
    ACCESS: true, // Derecho de acceso
    RECTIFICATION: true, // Derecho de rectificación
    ERASURE: true, // Derecho al olvido
    PORTABILITY: true, // Portabilidad de datos
    RESTRICTION: true, // Limitación del tratamiento
    OBJECTION: true, // Derecho de oposición
    
    // Configuración de procesamiento
    PROCESSING_TIME: 30 * 24 * 60 * 60 * 1000, // 30 días máximo
    NOTIFICATION_TIME: 72 * 60 * 60 * 1000, // 72 horas para violaciones
    EXPORT_FORMAT: 'JSON', // Formato de exportación
    INCLUDE_METADATA: true
  }
};

// ====================================
// CSP CONFIGURATION
// ====================================

export const CSP_CONFIG = {
  // Políticas base
  POLICIES: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Temporal, mejorar con nonces
      'https://cdn.jsdelivr.net',
      'https://unpkg.com'
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      'https://fonts.googleapis.com',
      'https://cdn.jsdelivr.net'
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:'
    ],
    'connect-src': [
      "'self'",
      'https://api.erp-webapp.com',
      'wss://api.erp-webapp.com'
    ],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': ["'none'"],
    'worker-src': ["'self'", 'blob:'],
    'manifest-src': ["'self'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  },
  
  // Configuración de reportes
  REPORTING: {
    ENABLED: true,
    REPORT_URI: '/api/security/csp-report',
    REPORT_TO: 'csp-endpoint',
    MAX_AGE: 10886400, // 126 días
    INCLUDE_SUBDOMAINS: true
  },
  
  // Configuración de nonces
  NONCE: {
    ENABLED: true,
    ALGORITHM: 'base64',
    LENGTH: 16,
    REFRESH_INTERVAL: 5 * 60 * 1000 // 5 minutos
  },
  
  // Configuración de desarrollo
  DEVELOPMENT: {
    ALLOW_UNSAFE_EVAL: false,
    ALLOW_UNSAFE_INLINE: false,
    REPORT_ONLY: true // Solo reportar en desarrollo
  }
};

// ====================================
// AUDIT CONFIGURATION
// ====================================

export const AUDIT_CONFIG = {
  // Configuración general
  GENERAL: {
    ENABLED: true,
    INTEGRITY_VERIFICATION: true,
    ENCRYPTION_ENABLED: true,
    COMPRESSION_ENABLED: true,
    
    // Configuración de almacenamiento
    STORAGE: {
      MAX_SIZE: 100 * 1024 * 1024, // 100MB
      MAX_ENTRIES: 100000,
      COMPRESSION_THRESHOLD: 1024, // 1KB
      CLEANUP_THRESHOLD: 0.9 // 90% de capacidad
    }
  },
  
  // Niveles de log
  LOG_LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
  },
  
  // Categorías de eventos
  EVENT_CATEGORIES: {
    AUTHENTICATION: 'auth',
    AUTHORIZATION: 'authz',
    DATA_ACCESS: 'data',
    SYSTEM: 'system',
    SECURITY: 'security',
    ADMIN: 'admin',
    USER: 'user',
    API: 'api'
  },
  
  // Eventos de seguridad críticos
  SECURITY_EVENTS: {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    LOGOUT: 'LOGOUT',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCESS_DENIED: 'ACCESS_DENIED',
    PRIVILEGE_ESCALATION: 'PRIVILEGE_ESCALATION',
    DATA_BREACH: 'DATA_BREACH',
    SECURITY_VIOLATION: 'SECURITY_VIOLATION',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
  },
  
  // Configuración de retención
  RETENTION: {
    SECURITY_LOGS: 10 * 365 * 24 * 60 * 60 * 1000, // 10 años
    ADMIN_LOGS: 7 * 365 * 24 * 60 * 60 * 1000, // 7 años
    USER_LOGS: 2 * 365 * 24 * 60 * 60 * 1000, // 2 años
    DEBUG_LOGS: 30 * 24 * 60 * 60 * 1000, // 30 días
    
    AUTO_ARCHIVE: true,
    ARCHIVE_AFTER: 365 * 24 * 60 * 60 * 1000, // 1 año
    DELETE_AFTER: 10 * 365 * 24 * 60 * 60 * 1000 // 10 años
  },
  
  // Alertas automáticas
  ALERTS: {
    ENABLED: true,
    THRESHOLDS: {
      FAILED_LOGINS: 5, // Por hora
      SECURITY_EVENTS: 10, // Por hora
      ACCESS_DENIED: 20, // Por hora
      SUSPICIOUS_ACTIVITY: 3 // Por hora
    },
    NOTIFICATION_METHODS: ['email', 'webhook'],
    ESCALATION_TIME: 60 * 60 * 1000 // 1 hora
  },
  
  // Configuración de integridad
  INTEGRITY: {
    HASH_ALGORITHM: 'SHA-256',
    CHAIN_VERIFICATION: true,
    TAMPER_DETECTION: true,
    BACKUP_VERIFICATION: true
  }
};

// ====================================
// MONITORING CONFIGURATION
// ====================================

export const MONITORING_CONFIG = {
  // Configuración general
  GENERAL: {
    ENABLED: true,
    REAL_TIME: true,
    COLLECTION_INTERVAL: 30 * 1000, // 30 segundos
    RETENTION_PERIOD: 30 * 24 * 60 * 60 * 1000 // 30 días
  },
  
  // Métricas a monitorear
  METRICS: {
    AUTHENTICATION: {
      login_attempts: true,
      login_failures: true,
      session_duration: true,
      concurrent_sessions: true
    },
    AUTHORIZATION: {
      permission_checks: true,
      access_denials: true,
      role_changes: true
    },
    SECURITY: {
      security_events: true,
      csp_violations: true,
      suspicious_activities: true,
      failed_requests: true
    },
    PERFORMANCE: {
      response_times: true,
      error_rates: true,
      resource_usage: true
    }
  },
  
  // Umbrales de alerta
  THRESHOLDS: {
    HIGH_LOGIN_FAILURES: 10, // Por minuto
    HIGH_ACCESS_DENIALS: 20, // Por minuto
    HIGH_CSP_VIOLATIONS: 5, // Por minuto
    HIGH_ERROR_RATE: 0.1, // 10%
    SLOW_RESPONSE: 5000 // 5 segundos
  },
  
  // Configuración de reportes
  REPORTING: {
    DAILY_REPORT: true,
    WEEKLY_SUMMARY: true,
    MONTHLY_ANALYSIS: true,
    INCIDENT_REPORTS: true,
    
    // Destinatarios
    RECIPIENTS: {
      SECURITY_TEAM: ['security@erp-webapp.com'],
      ADMIN_TEAM: ['admin@erp-webapp.com'],
      MANAGEMENT: ['management@erp-webapp.com']
    }
  }
};

// ====================================
// ENVIRONMENT CONFIGURATION
// ====================================

export const ENV_CONFIG = {
  DEVELOPMENT: {
    DEBUG_MODE: true,
    VERBOSE_LOGGING: true,
    MOCK_EXTERNAL_SERVICES: true,
    DISABLE_CSRF: false, // Mantener CSRF incluso en desarrollo
    ALLOW_HTTP: true
  },
  
  STAGING: {
    DEBUG_MODE: false,
    VERBOSE_LOGGING: true,
    MOCK_EXTERNAL_SERVICES: false,
    DISABLE_CSRF: false,
    ALLOW_HTTP: false
  },
  
  PRODUCTION: {
    DEBUG_MODE: false,
    VERBOSE_LOGGING: false,
    MOCK_EXTERNAL_SERVICES: false,
    DISABLE_CSRF: false,
    ALLOW_HTTP: false,
    
    // Configuración adicional de producción
    ENFORCE_HTTPS: true,
    HSTS_ENABLED: true,
    SECURE_COOKIES: true,
    SAME_SITE_STRICT: true
  }
};

// ====================================
// UTILITY FUNCTIONS
// ====================================

/**
 * Obtiene la configuración actual basada en el entorno
 */
export const getCurrentConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  
  return {
    AUTH: AUTH_CONFIG,
    RBAC: RBAC_CONFIG,
    GDPR: GDPR_CONFIG,
    CSP: CSP_CONFIG,
    AUDIT: AUDIT_CONFIG,
    MONITORING: MONITORING_CONFIG,
    ENV: ENV_CONFIG[env.toUpperCase()] || ENV_CONFIG.DEVELOPMENT
  };
};

/**
 * Valida la configuración de seguridad
 */
export const validateSecurityConfig = () => {
  const config = getCurrentConfig();
  const issues = [];
  
  // Validar configuración de auth
  if (config.AUTH.JWT.ACCESS_TOKEN_EXPIRY < 5 * 60 * 1000) {
    issues.push('Access token expiry too short (minimum 5 minutes)');
  }
  
  // Validar política de contraseñas
  if (config.AUTH.PASSWORD.MIN_LENGTH < 8) {
    issues.push('Password minimum length too short (minimum 8 characters)');
  }
  
  // Validar CSP
  if (!config.CSP.POLICIES['default-src'].includes("'self'")) {
    issues.push("CSP default-src should include 'self'");
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
};

// ====================================
// EXPORTS
// ====================================

export default {
  AUTH_CONFIG,
  RBAC_CONFIG,
  GDPR_CONFIG,
  CSP_CONFIG,
  AUDIT_CONFIG,
  MONITORING_CONFIG,
  ENV_CONFIG,
  getCurrentConfig,
  validateSecurityConfig
};
