/**
 * Wave 7: Security & Compliance Enterprise
 * Content Security Policy (CSP) System
 * 
 * Sistema de políticas de seguridad de contenido:
 * - CSP headers dinámicos
 * - Nonce generation para scripts inline
 * - Report URI para violaciones
 * - Security headers enterprise
 * - XSS protection avanzada
 * 
 * @since Wave 7 - Security & Compliance Enterprise
 * @author Sistema ERP
 */

// ====================================
// CSP CONFIGURATION
// ====================================

export const CSP_CONFIG = {
  // Directivas CSP
  DIRECTIVES: {
    DEFAULT_SRC: ["'self'"],
    SCRIPT_SRC: [
      "'self'",
      "'unsafe-inline'", // Solo para desarrollo - remover en producción
      "https://cdn.jsdelivr.net",
      "https://unpkg.com"
    ],
    STYLE_SRC: [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com"
    ],
    IMG_SRC: [
      "'self'",
      "data:",
      "blob:",
      "https:"
    ],
    FONT_SRC: [
      "'self'",
      "https://fonts.gstatic.com"
    ],
    CONNECT_SRC: [
      "'self'",
      "https://api.example.com",
      "wss://websocket.example.com"
    ],
    MEDIA_SRC: ["'self'"],
    OBJECT_SRC: ["'none'"],
    BASE_URI: ["'self'"],
    FORM_ACTION: ["'self'"],
    FRAME_ANCESTORS: ["'none'"],
    UPGRADE_INSECURE_REQUESTS: true,
    BLOCK_ALL_MIXED_CONTENT: true
  },
  
  // Configuración por entorno
  ENVIRONMENTS: {
    development: {
      REPORT_ONLY: true,
      REPORT_URI: '/api/security/csp-report',
      UNSAFE_INLINE: true
    },
    production: {
      REPORT_ONLY: false,
      REPORT_URI: '/api/security/csp-report',
      UNSAFE_INLINE: false
    }
  }
};

// ====================================
// SECURITY HEADERS CONFIGURATION
// ====================================

export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': '',
  
  // Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // X-Frame-Options
  'X-Frame-Options': 'DENY',
  
  // X-Content-Type-Options
  'X-Content-Type-Options': 'nosniff',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  
  // X-XSS-Protection
  'X-XSS-Protection': '1; mode=block',
  
  // Cross-Origin Embedder Policy
  'Cross-Origin-Embedder-Policy': 'require-corp',
  
  // Cross-Origin Opener Policy
  'Cross-Origin-Opener-Policy': 'same-origin',
  
  // Cross-Origin Resource Policy
  'Cross-Origin-Resource-Policy': 'same-origin'
};

// ====================================
// CSP SERVICE CLASS
// ====================================

export class CSPService {
  constructor() {
    this.nonces = new Map();
    this.violations = [];
    this.environment = process.env.NODE_ENV || 'development';
    this.config = CSP_CONFIG.ENVIRONMENTS[this.environment];
    
    this.initializeCSP();
  }
  
  // ====================================
  // INITIALIZATION
  // ====================================
  
  initializeCSP() {
    this.generateCSPHeader();
    this.setupViolationReporting();
    this.setSecurityHeaders();
    
    console.log('🛡️ CSP Security System initialized');
  }
  
  // ====================================
  // CSP HEADER GENERATION
  // ====================================
  
  /**
   * Generar header CSP dinámico
   */
  generateCSPHeader() {
    const directives = { ...CSP_CONFIG.DIRECTIVES };
    
    // Generar nonce para scripts
    const scriptNonce = this.generateNonce();
    this.setCurrentNonce('script', scriptNonce);
    
    // Modificar directivas según entorno
    if (this.environment === 'production') {
      // Remover unsafe-inline en producción
      directives.SCRIPT_SRC = directives.SCRIPT_SRC.filter(src => src !== "'unsafe-inline'");
      directives.SCRIPT_SRC.push(`'nonce-${scriptNonce}'`);
    }
    
    // Construir policy string
    const policyParts = [];
    
    Object.entries(directives).forEach(([directive, values]) => {
      if (directive === 'UPGRADE_INSECURE_REQUESTS' && values) {
        policyParts.push('upgrade-insecure-requests');
      } else if (directive === 'BLOCK_ALL_MIXED_CONTENT' && values) {
        policyParts.push('block-all-mixed-content');
      } else if (Array.isArray(values) && values.length > 0) {
        const directiveName = directive.toLowerCase().replace(/_/g, '-');
        policyParts.push(`${directiveName} ${values.join(' ')}`);
      }
    });
    
    // Agregar report-uri
    if (this.config.REPORT_URI) {
      policyParts.push(`report-uri ${this.config.REPORT_URI}`);
    }
    
    const cspHeader = policyParts.join('; ');
    
    // Aplicar header
    const headerName = this.config.REPORT_ONLY 
      ? 'Content-Security-Policy-Report-Only'
      : 'Content-Security-Policy';
    
    this.setMetaTag(headerName, cspHeader);
    
    return cspHeader;
  }
  
  /**
   * Generar nonce único
   */
  generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Establecer nonce actual
   */
  setCurrentNonce(type, nonce) {
    this.nonces.set(type, nonce);
    
    // Almacenar en variable global para uso en templates
    window.CSP_NONCE = {
      ...window.CSP_NONCE,
      [type]: nonce
    };
  }
  
  /**
   * Obtener nonce actual
   */
  getNonce(type = 'script') {
    return this.nonces.get(type);
  }
  
  // ====================================
  // SECURITY HEADERS
  // ====================================
  
  /**
   * Establecer headers de seguridad
   */
  setSecurityHeaders() {
    Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
      if (header === 'Content-Security-Policy') return; // Manejado por separado
      
      this.setMetaTag(header, value);
    });
  }
  
  /**
   * Establecer meta tag para header
   */
  setMetaTag(name, content) {
    // Remover meta tag existente
    const existing = document.querySelector(`meta[http-equiv="${name}"]`);
    if (existing) {
      existing.remove();
    }
    
    // Crear nuevo meta tag
    const meta = document.createElement('meta');
    meta.setAttribute('http-equiv', name);
    meta.setAttribute('content', content);
    
    document.head.appendChild(meta);
  }
  
  // ====================================
  // VIOLATION REPORTING
  // ====================================
  
  /**
   * Configurar reporte de violaciones
   */
  setupViolationReporting() {
    document.addEventListener('securitypolicyviolation', (event) => {
      this.handleCSPViolation(event);
    });
    
    // Endpoint para reportes de CSP
    this.setupReportEndpoint();
  }
  
  /**
   * Manejar violación de CSP
   */
  handleCSPViolation(event) {
    const violation = {
      id: this.generateViolationId(),
      timestamp: Date.now(),
      directive: event.violatedDirective,
      effectiveDirective: event.effectiveDirective,
      originalPolicy: event.originalPolicy,
      blockedURI: event.blockedURI,
      lineNumber: event.lineNumber,
      columnNumber: event.columnNumber,
      sourceFile: event.sourceFile,
      statusCode: event.statusCode,
      userAgent: navigator.userAgent,
      url: window.location.href,
      disposition: event.disposition // 'enforce' or 'report'
    };
    
    this.violations.push(violation);
    
    // Log para desarrollo
    console.warn('🚨 CSP Violation:', violation);
    
    // Enviar al servidor
    this.reportViolation(violation);
    
    // Analizar patrón de violaciones
    this.analyzeViolationPattern(violation);
  }
  
  /**
   * Reportar violación al servidor
   */
  async reportViolation(violation) {
    try {
      await fetch('/api/security/csp-violation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(violation)
      });
    } catch (error) {
      console.error('Failed to report CSP violation:', error);
    }
  }
  
  /**
   * Analizar patrones de violaciones
   */
  analyzeViolationPattern(violation) {
    // Detectar ataques potenciales
    const recentViolations = this.violations.filter(
      v => Date.now() - v.timestamp < 60000 // Último minuto
    );
    
    if (recentViolations.length > 5) {
      this.triggerSecurityAlert('POTENTIAL_CSP_ATTACK', {
        violationCount: recentViolations.length,
        timeWindow: '1 minute',
        mostViolatedDirective: this.getMostViolatedDirective(recentViolations)
      });
    }
    
    // Detectar problemas de configuración
    if (violation.directive === 'script-src' && violation.blockedURI.includes('inline')) {
      this.suggestCSPImprovement('UNSAFE_INLINE_SCRIPT', violation);
    }
  }
  
  /**
   * Configurar endpoint de reportes
   */
  setupReportEndpoint() {
    // En aplicaciones reales esto sería manejado por el servidor
    // Aquí simulamos el endpoint para desarrollo
    if (this.environment === 'development') {
      const mockServer = {
        '/api/security/csp-report': (data) => {
          console.log('📊 CSP Report received:', data);
        }
      };
      
      window.mockCSPServer = mockServer;
    }
  }
  
  // ====================================
  // DYNAMIC CSP MANAGEMENT
  // ====================================
  
  /**
   * Agregar fuente permitida dinámicamente
   */
  addAllowedSource(directive, source) {
    const currentDirectives = { ...CSP_CONFIG.DIRECTIVES };
    
    if (!currentDirectives[directive.toUpperCase()]) {
      currentDirectives[directive.toUpperCase()] = [];
    }
    
    currentDirectives[directive.toUpperCase()].push(source);
    
    // Regenerar CSP
    this.generateCSPHeader();
    
    this.logSecurityEvent('CSP_SOURCE_ADDED', {
      directive,
      source
    });
  }
  
  /**
   * Remover fuente permitida
   */
  removeAllowedSource(directive, source) {
    const currentDirectives = { ...CSP_CONFIG.DIRECTIVES };
    
    if (currentDirectives[directive.toUpperCase()]) {
      currentDirectives[directive.toUpperCase()] = 
        currentDirectives[directive.toUpperCase()].filter(s => s !== source);
    }
    
    // Regenerar CSP
    this.generateCSPHeader();
    
    this.logSecurityEvent('CSP_SOURCE_REMOVED', {
      directive,
      source
    });
  }
  
  // ====================================
  // NONCE MANAGEMENT FOR REACT
  // ====================================
  
  /**
   * Hook para obtener nonce en componentes React
   */
  useCSPNonce(type = 'script') {
    return this.getNonce(type);
  }
  
  /**
   * Componente Script con nonce automático
   */
  createSecureScript(content, type = 'text/javascript') {
    const script = document.createElement('script');
    script.type = type;
    script.nonce = this.getNonce('script');
    script.textContent = content;
    
    return script;
  }
  
  /**
   * Inyectar script de forma segura
   */
  injectSecureScript(content, target = document.head) {
    const script = this.createSecureScript(content);
    target.appendChild(script);
    
    return script;
  }
  
  // ====================================
  // UTILITIES
  // ====================================
  
  generateViolationId() {
    return `viol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getMostViolatedDirective(violations) {
    const counts = {};
    violations.forEach(v => {
      counts[v.directive] = (counts[v.directive] || 0) + 1;
    });
    
    return Object.keys(counts).reduce((a, b) => 
      counts[a] > counts[b] ? a : b
    );
  }
  
  triggerSecurityAlert(type, data) {
    const alert = {
      type,
      data,
      timestamp: Date.now(),
      severity: 'HIGH'
    };
    
    console.error('🚨 Security Alert:', alert);
    
    // Enviar alerta al sistema de seguridad
    fetch('/api/security/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alert)
    }).catch(err => console.error('Failed to send security alert:', err));
  }
  
  suggestCSPImprovement(type, violation) {
    const suggestions = {
      UNSAFE_INLINE_SCRIPT: 'Consider using nonces or hashes instead of unsafe-inline for scripts',
      UNSAFE_INLINE_STYLE: 'Consider using nonces or hashes instead of unsafe-inline for styles',
      MISSING_HTTPS: 'Consider enforcing HTTPS for all external resources'
    };
    
    console.warn(`💡 CSP Improvement Suggestion (${type}):`, suggestions[type]);
  }
  
  logSecurityEvent(event, data) {
    const logEntry = {
      event,
      data,
      timestamp: Date.now(),
      component: 'CSP'
    };
    
    console.log('🔒 Security Event:', logEntry);
  }
  
  /**
   * Obtener estadísticas de CSP
   */
  getCSPStats() {
    return {
      totalViolations: this.violations.length,
      violationsByDirective: this.violations.reduce((acc, v) => {
        acc[v.directive] = (acc[v.directive] || 0) + 1;
        return acc;
      }, {}),
      recentViolations: this.violations.filter(
        v => Date.now() - v.timestamp < 3600000 // Última hora
      ).length,
      currentNonces: Object.fromEntries(this.nonces)
    };
  }
}

// ====================================
// REACT HOOKS
// ====================================

export const useCSP = () => {
  const [cspService] = useState(() => new CSPService());
  
  return {
    getNonce: (type) => cspService.getNonce(type),
    addAllowedSource: (directive, source) => cspService.addAllowedSource(directive, source),
    removeAllowedSource: (directive, source) => cspService.removeAllowedSource(directive, source),
    injectSecureScript: (content) => cspService.injectSecureScript(content),
    getStats: () => cspService.getCSPStats()
  };
};

// ====================================
// REACT COMPONENTS
// ====================================

/**
 * Componente Script seguro con nonce automático
 */
export const SecureScript = ({ children, type = 'text/javascript', ...props }) => {
  const { getNonce } = useCSP();
  
  useEffect(() => {
    const script = document.createElement('script');
    script.type = type;
    script.nonce = getNonce('script');
    script.textContent = children;
    
    Object.entries(props).forEach(([key, value]) => {
      script.setAttribute(key, value);
    });
    
    document.head.appendChild(script);
    
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [children, type, props, getNonce]);
  
  return null;
};

/**
 * Componente para mostrar estadísticas de CSP (solo desarrollo)
 */
export const CSPStats = () => {
  const { getStats } = useCSP();
  const [stats, setStats] = useState(getStats());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(getStats());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [getStats]);
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  return (
    <div className="fixed top-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm">
      <h4 className="font-bold mb-2">🛡️ CSP Stats</h4>
      <div>Total Violations: {stats.totalViolations}</div>
      <div>Recent: {stats.recentViolations}</div>
      <div>Current Nonce: {stats.currentNonces.script?.slice(0, 8)}...</div>
    </div>
  );
};

// ====================================
// EXPORTS
// ====================================

export default CSPService;
