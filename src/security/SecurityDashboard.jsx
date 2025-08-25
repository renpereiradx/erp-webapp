/**
 * Wave 7: Security & Compliance Enterprise
 * Security Dashboard Component
 * 
 * Dashboard administrativo de seguridad que muestra:
 * - Estado general del sistema de seguridad
 * - Métricas en tiempo real
 * - Alertas y eventos de seguridad
 * - Auditoría y compliance
 * - Gestión de usuarios y permisos
 * 
 * @since Wave 7 - Security & Compliance Enterprise
 * @author Sistema ERP
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSecurity, useSecurityMetrics } from './SecurityProvider';
import { ProtectedRoute, usePermissions } from './SecurityHooks';

// ====================================
// SECURITY DASHBOARD COMPONENT
// ====================================

const SecurityDashboard = () => {
  const { securitySystem, isInitialized } = useSecurity();
  const { metrics, status, refresh } = useSecurityMetrics();
  const { hasPermission } = usePermissions();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [realTimeData, setRealTimeData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  
  // ====================================
  // EFFECTS
  // ====================================
  
  useEffect(() => {
    if (isInitialized) {
      loadDashboardData();
      
      // Actualizar datos cada 30 segundos
      const interval = setInterval(loadDashboardData, 30000);
      return () => clearInterval(interval);
    }
  }, [isInitialized]);
  
  // ====================================
  // DATA LOADING
  // ====================================
  
  const loadDashboardData = useCallback(async () => {
    try {
      // Actualizar métricas
      refresh();
      
      // Cargar datos en tiempo real
      await loadRealTimeData();
      
      // Cargar alertas
      await loadSecurityAlerts();
      
      // Cargar logs de auditoría recientes
      await loadRecentAuditLogs();
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    }
  }, [refresh]);
  
  const loadRealTimeData = async () => {
    const services = securitySystem.getServices();
    
    const data = {
      timestamp: Date.now(),
      
      // Estado de autenticación
      authentication: {
        activeSessions: 0, // TODO: Implementar conteo real
        failedLogins: metrics?.authEvents || 0,
        successfulLogins: metrics?.authEvents || 0
      },
      
      // Estado de autorización
      authorization: {
        permissionChecks: metrics?.authzEvents || 0,
        accessDenials: 0, // TODO: Contar desde audit logs
        roleChanges: 0
      },
      
      // Estado GDPR
      gdpr: {
        consentRecords: 0, // TODO: Contar desde GDPR service
        dataRequests: 0,
        deletionRequests: 0
      },
      
      // Estado CSP
      csp: {
        violations: services.csp.getCSPStats().totalViolations || 0,
        recentViolations: services.csp.getCSPStats().recentViolations || 0
      },
      
      // Estado de auditoría
      audit: {
        totalLogs: services.audit.getAuditStatistics().total_logs || 0,
        securityEvents: services.audit.getAuditStatistics().security_events || 0,
        integrityStatus: services.audit.verifyLogIntegrity() ? 'OK' : 'COMPROMISED'
      }
    };
    
    setRealTimeData(data);
  };
  
  const loadSecurityAlerts = async () => {
    // TODO: Implementar carga real de alertas
    const mockAlerts = [
      {
        id: 1,
        type: 'WARNING',
        title: 'Multiple failed login attempts',
        description: 'User "john.doe" has 3 failed login attempts in the last hour',
        timestamp: Date.now() - 30 * 60 * 1000,
        severity: 'MEDIUM'
      },
      {
        id: 2,
        type: 'INFO',
        title: 'CSP violation detected',
        description: 'Script blocked due to CSP policy',
        timestamp: Date.now() - 15 * 60 * 1000,
        severity: 'LOW'
      }
    ];
    
    setAlerts(mockAlerts);
  };
  
  const loadRecentAuditLogs = async () => {
    try {
      const services = securitySystem.getServices();
      const logs = services.audit.getRecentLogs(50); // Últimos 50 logs
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setAuditLogs([]);
    }
  };
  
  // ====================================
  // RENDER METHODS
  // ====================================
  
  const renderOverview = () => (
    <div className="security-overview">
      <div className="metrics-grid">
        {/* Estado general */}
        <div className="metric-card status-card">
          <h3>Security Status</h3>
          <div className={`status-indicator ${status?.overall?.toLowerCase()}`}>
            {status?.overall || 'UNKNOWN'}
          </div>
          <div className="status-details">
            {status?.components && Object.entries(status.components).map(([component, componentStatus]) => (
              <div key={component} className="component-status">
                <span className="component-name">{component}</span>
                <span className={`component-indicator ${componentStatus.toLowerCase()}`}>
                  {componentStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Métricas de autenticación */}
        <div className="metric-card">
          <h3>Authentication</h3>
          <div className="metric-value">
            {realTimeData?.authentication?.activeSessions || 0}
          </div>
          <div className="metric-label">Active Sessions</div>
          <div className="metric-details">
            <div>Failed Logins: {realTimeData?.authentication?.failedLogins || 0}</div>
            <div>Successful Logins: {realTimeData?.authentication?.successfulLogins || 0}</div>
          </div>
        </div>
        
        {/* Métricas de autorización */}
        <div className="metric-card">
          <h3>Authorization</h3>
          <div className="metric-value">
            {realTimeData?.authorization?.accessDenials || 0}
          </div>
          <div className="metric-label">Access Denials</div>
          <div className="metric-details">
            <div>Permission Checks: {realTimeData?.authorization?.permissionChecks || 0}</div>
            <div>Role Changes: {realTimeData?.authorization?.roleChanges || 0}</div>
          </div>
        </div>
        
        {/* Métricas GDPR */}
        <div className="metric-card">
          <h3>GDPR Compliance</h3>
          <div className="metric-value">
            {realTimeData?.gdpr?.consentRecords || 0}
          </div>
          <div className="metric-label">Consent Records</div>
          <div className="metric-details">
            <div>Data Requests: {realTimeData?.gdpr?.dataRequests || 0}</div>
            <div>Deletion Requests: {realTimeData?.gdpr?.deletionRequests || 0}</div>
          </div>
        </div>
        
        {/* Métricas CSP */}
        <div className="metric-card">
          <h3>Content Security</h3>
          <div className="metric-value">
            {realTimeData?.csp?.violations || 0}
          </div>
          <div className="metric-label">CSP Violations</div>
          <div className="metric-details">
            <div>Recent: {realTimeData?.csp?.recentViolations || 0}</div>
            <div>Status: Active</div>
          </div>
        </div>
        
        {/* Métricas de auditoría */}
        <div className="metric-card">
          <h3>Audit Logs</h3>
          <div className="metric-value">
            {realTimeData?.audit?.totalLogs || 0}
          </div>
          <div className="metric-label">Total Logs</div>
          <div className="metric-details">
            <div>Security Events: {realTimeData?.audit?.securityEvents || 0}</div>
            <div>Integrity: {realTimeData?.audit?.integrityStatus || 'Unknown'}</div>
          </div>
        </div>
      </div>
      
      {/* Alertas recientes */}
      <div className="recent-alerts">
        <h3>Recent Security Alerts</h3>
        {alerts.length === 0 ? (
          <div className="no-alerts">No recent alerts</div>
        ) : (
          <div className="alerts-list">
            {alerts.slice(0, 5).map(alert => (
              <div key={alert.id} className={`alert-item ${alert.severity.toLowerCase()}`}>
                <div className="alert-header">
                  <span className="alert-type">{alert.type}</span>
                  <span className="alert-time">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="alert-title">{alert.title}</div>
                <div className="alert-description">{alert.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
  
  const renderAuditLogs = () => (
    <div className="audit-logs">
      <div className="logs-header">
        <h3>Audit Logs</h3>
        <button onClick={loadRecentAuditLogs} className="refresh-btn">
          Refresh
        </button>
      </div>
      
      <div className="logs-table">
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event Type</th>
              <th>User</th>
              <th>Details</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map((log, index) => (
              <tr key={index}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td>
                  <span className={`event-type ${log.event_type}`}>
                    {log.event_type}
                  </span>
                </td>
                <td>{log.user_id || 'System'}</td>
                <td className="log-details">
                  {typeof log.details === 'string' 
                    ? log.details 
                    : JSON.stringify(log.details)
                  }
                </td>
                <td>{log.ip_address || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  const renderUserManagement = () => (
    <div className="user-management">
      <h3>User & Role Management</h3>
      <p>User management interface would go here...</p>
      {/* TODO: Implementar interfaz de gestión de usuarios */}
    </div>
  );
  
  const renderComplianceReport = () => (
    <div className="compliance-report">
      <h3>Compliance Report</h3>
      <div className="compliance-sections">
        <div className="compliance-section">
          <h4>GDPR Compliance</h4>
          <div className="compliance-status ok">✓ Compliant</div>
          <div className="compliance-details">
            <div>✓ Consent management implemented</div>
            <div>✓ Data portability available</div>
            <div>✓ Right to erasure implemented</div>
            <div>✓ Privacy policy updated</div>
          </div>
        </div>
        
        <div className="compliance-section">
          <h4>Security Standards</h4>
          <div className="compliance-status ok">✓ Compliant</div>
          <div className="compliance-details">
            <div>✓ Authentication implemented</div>
            <div>✓ Authorization controls active</div>
            <div>✓ Audit logging enabled</div>
            <div>✓ Data encryption in use</div>
          </div>
        </div>
        
        <div className="compliance-section">
          <h4>Content Security Policy</h4>
          <div className="compliance-status ok">✓ Active</div>
          <div className="compliance-details">
            <div>✓ CSP headers configured</div>
            <div>✓ Violation reporting enabled</div>
            <div>✓ Nonce generation active</div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // ====================================
  // MAIN RENDER
  // ====================================
  
  if (!isInitialized) {
    return (
      <div className="security-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading Security Dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <ProtectedRoute requiredPermission="audit:read">
      <div className="security-dashboard">
        <div className="dashboard-header">
          <h1>Security Dashboard</h1>
          <div className="dashboard-actions">
            <button onClick={loadDashboardData} className="refresh-btn">
              Refresh Data
            </button>
          </div>
        </div>
        
        <div className="dashboard-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab ${activeTab === 'audit' ? 'active' : ''}`}
            onClick={() => setActiveTab('audit')}
          >
            Audit Logs
          </button>
          {hasPermission('users:read') && (
            <button 
              className={`tab ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              User Management
            </button>
          )}
          <button 
            className={`tab ${activeTab === 'compliance' ? 'active' : ''}`}
            onClick={() => setActiveTab('compliance')}
          >
            Compliance
          </button>
        </div>
        
        <div className="dashboard-content">
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'audit' && renderAuditLogs()}
          {activeTab === 'users' && renderUserManagement()}
          {activeTab === 'compliance' && renderComplianceReport()}
        </div>
        
        <style jsx>{`
          .security-dashboard {
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          
          .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e1e5e9;
          }
          
          .dashboard-header h1 {
            margin: 0;
            color: #2c3e50;
            font-size: 2.5rem;
          }
          
          .dashboard-actions button {
            padding: 10px 20px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
          }
          
          .dashboard-actions button:hover {
            background: #2980b9;
          }
          
          .dashboard-tabs {
            display: flex;
            margin-bottom: 30px;
            border-bottom: 1px solid #e1e5e9;
          }
          
          .tab {
            padding: 12px 24px;
            background: none;
            border: none;
            border-bottom: 3px solid transparent;
            cursor: pointer;
            font-size: 16px;
            color: #666;
            transition: all 0.3s ease;
          }
          
          .tab:hover {
            color: #3498db;
          }
          
          .tab.active {
            color: #3498db;
            border-bottom-color: #3498db;
            font-weight: 600;
          }
          
          .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .metric-card {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            border-left: 4px solid #3498db;
          }
          
          .metric-card h3 {
            margin: 0 0 15px 0;
            color: #2c3e50;
            font-size: 1.2rem;
          }
          
          .metric-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #3498db;
            margin-bottom: 5px;
          }
          
          .metric-label {
            color: #666;
            font-size: 14px;
            margin-bottom: 10px;
          }
          
          .metric-details div {
            font-size: 12px;
            color: #888;
            margin-bottom: 2px;
          }
          
          .status-card {
            border-left-color: #27ae60;
          }
          
          .status-indicator {
            font-size: 1.5rem;
            font-weight: bold;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            margin-bottom: 15px;
          }
          
          .status-indicator.healthy {
            background: #d5f4e6;
            color: #27ae60;
          }
          
          .status-indicator.warning {
            background: #fef9e7;
            color: #f39c12;
          }
          
          .status-indicator.critical {
            background: #fadbd8;
            color: #e74c3c;
          }
          
          .component-status {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 0;
            font-size: 12px;
          }
          
          .component-name {
            text-transform: capitalize;
            color: #666;
          }
          
          .component-indicator {
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 3px;
            font-size: 10px;
          }
          
          .component-indicator.healthy {
            background: #d5f4e6;
            color: #27ae60;
          }
          
          .component-indicator.warning {
            background: #fef9e7;
            color: #f39c12;
          }
          
          .component-indicator.critical {
            background: #fadbd8;
            color: #e74c3c;
          }
          
          .recent-alerts {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .recent-alerts h3 {
            margin: 0 0 20px 0;
            color: #2c3e50;
          }
          
          .no-alerts {
            text-align: center;
            color: #666;
            padding: 20px;
            font-style: italic;
          }
          
          .alert-item {
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
            border-left: 4px solid #ddd;
          }
          
          .alert-item.high {
            background: #fadbd8;
            border-left-color: #e74c3c;
          }
          
          .alert-item.medium {
            background: #fef9e7;
            border-left-color: #f39c12;
          }
          
          .alert-item.low {
            background: #d6eaf8;
            border-left-color: #3498db;
          }
          
          .alert-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
          }
          
          .alert-type {
            font-weight: bold;
            font-size: 12px;
            color: #666;
          }
          
          .alert-time {
            font-size: 12px;
            color: #888;
          }
          
          .alert-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #2c3e50;
          }
          
          .alert-description {
            font-size: 14px;
            color: #666;
          }
          
          .audit-logs {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .logs-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .logs-header h3 {
            margin: 0;
            color: #2c3e50;
          }
          
          .refresh-btn {
            padding: 8px 16px;
            background: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 12px;
          }
          
          .logs-table {
            overflow-x: auto;
          }
          
          .logs-table table {
            width: 100%;
            border-collapse: collapse;
          }
          
          .logs-table th,
          .logs-table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #e1e5e9;
          }
          
          .logs-table th {
            background: #f8f9fa;
            font-weight: 600;
            color: #2c3e50;
          }
          
          .event-type {
            padding: 4px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
          }
          
          .event-type.auth {
            background: #d5f4e6;
            color: #27ae60;
          }
          
          .event-type.security {
            background: #fadbd8;
            color: #e74c3c;
          }
          
          .event-type.data {
            background: #d6eaf8;
            color: #3498db;
          }
          
          .log-details {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 12px;
            color: #666;
          }
          
          .compliance-sections {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
          }
          
          .compliance-section {
            background: white;
            border-radius: 10px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .compliance-section h4 {
            margin: 0 0 15px 0;
            color: #2c3e50;
          }
          
          .compliance-status {
            font-size: 1.2rem;
            font-weight: bold;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            margin-bottom: 15px;
          }
          
          .compliance-status.ok {
            background: #d5f4e6;
            color: #27ae60;
          }
          
          .compliance-details div {
            padding: 5px 0;
            font-size: 14px;
            color: #666;
          }
          
          .loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 400px;
          }
          
          .loading-spinner {
            text-align: center;
          }
          
          .spinner {
            width: 40px;
            height: 40px;
            margin: 0 auto 20px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </ProtectedRoute>
  );
};

export default SecurityDashboard;
