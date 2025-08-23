/**
 * Componente para mostrar lista de sesiones activas del usuario
 * Enfoque: MVP Guide - funcionalidad básica navegable
 */

import React, { useEffect, useState } from 'react';
import useSessionStore from '@/store/useSessionStore';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';

const SessionsList = () => {
  const {
    activeSessions,
    isLoadingActiveSessions,
    activeSessionsError,
    loadActiveSessions,
    revokeSession,
    revokeAllOtherSessions,
    isRevokingSession,
    revokeError,
    clearErrors
  } = useSessionStore();

  const [selectedSessionId, setSelectedSessionId] = useState(null);

  useEffect(() => {
    loadActiveSessions();
  }, []);

  const handleRevokeSession = async (sessionId) => {
    if (!confirm('¿Estás seguro de que quieres cerrar esta sesión?')) {
      return;
    }

    try {
      setSelectedSessionId(sessionId);
      await revokeSession(sessionId);
      alert('Sesión cerrada exitosamente');
    } catch (error) {
      alert(`Error al cerrar sesión: ${error.message}`);
    } finally {
      setSelectedSessionId(null);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!confirm('¿Estás seguro de que quieres cerrar todas las otras sesiones? Solo mantendrás la sesión actual.')) {
      return;
    }

    try {
      const response = await revokeAllOtherSessions();
      alert(`Se cerraron ${response.revoked_count || 0} sesiones exitosamente`);
    } catch (error) {
      alert(`Error al cerrar sesiones: ${error.message}`);
    }
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'desktop': return '🖥️';
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      default: return '💻';
    }
  };

  const getCurrentSession = () => {
    const currentToken = localStorage.getItem('authToken');
    if (!currentToken) return null;
    
    // Intentar encontrar la sesión actual (normalmente la más reciente)
    return activeSessions.find(session => 
      session.is_active && 
      new Date(session.last_activity) > new Date(Date.now() - 5 * 60 * 1000) // Actividad en los últimos 5 minutos
    );
  };

  const currentSession = getCurrentSession();

  if (isLoadingActiveSessions) {
    return (
      <div className="sessions-list loading">
        <div className="loading-spinner">⏳</div>
        <p>Cargando sesiones activas...</p>
      </div>
    );
  }

  if (activeSessionsError) {
    return (
      <div className="sessions-list error">
        <div className="error-message">
          <h3>Error al cargar sesiones</h3>
          <p>{activeSessionsError}</p>
          <button 
            onClick={() => {
              clearErrors();
              loadActiveSessions();
            }}
            className="btn btn-secondary"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="sessions-list">
      <div className="sessions-header">
        <h2>Sesiones Activas ({activeSessions.length})</h2>
        
        {activeSessions.length > 1 && (
          <button
            onClick={handleRevokeAllOthers}
            disabled={isRevokingSession}
            className="btn btn-danger btn-sm"
          >
            {isRevokingSession ? 'Cerrando...' : 'Cerrar todas las otras sesiones'}
          </button>
        )}
      </div>

      {revokeError && (
        <div className="alert alert-error">
          <p>{revokeError}</p>
          <button onClick={clearErrors} className="btn btn-sm">✕</button>
        </div>
      )}

      {activeSessions.length === 0 ? (
        <div className="empty-sessions">
          <p>No hay sesiones activas encontradas.</p>
          <button 
            onClick={loadActiveSessions}
            className="btn btn-secondary"
          >
            Actualizar
          </button>
        </div>
      ) : (
        <div className="sessions-grid">
          {activeSessions.map((session) => {
            const isCurrentSession = currentSession?.id === session.id;
            const isRevoking = isRevokingSession && selectedSessionId === session.id;
            
            return (
              <div 
                key={session.id} 
                className={`session-card ${isCurrentSession ? 'current-session' : ''}`}
              >
                <div className="session-header">
                  <div className="device-info">
                    <span className="device-icon">
                      {getDeviceIcon(session.device_type)}
                    </span>
                    <div className="device-details">
                      <strong>{session.device_type || 'Desconocido'}</strong>
                      {isCurrentSession && <span className="current-badge">Sesión actual</span>}
                    </div>
                  </div>
                  
                  {!isCurrentSession && (
                    <button
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={isRevoking}
                      className="btn btn-danger btn-sm"
                      title="Cerrar esta sesión"
                    >
                      {isRevoking ? '⏳' : '✕'}
                    </button>
                  )}
                </div>

                <div className="session-details">
                  <div className="detail-row">
                    <span className="label">IP:</span>
                    <span className="value">{session.ip_address || 'No disponible'}</span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Última actividad:</span>
                    <span className="value" title={format(new Date(session.last_activity), 'PPpp', { locale: es })}>
                      {formatDistanceToNow(new Date(session.last_activity), { addSuffix: true, locale: es })}
                    </span>
                  </div>
                  
                  <div className="detail-row">
                    <span className="label">Expira:</span>
                    <span className="value" title={format(new Date(session.expires_at), 'PPpp', { locale: es })}>
                      {formatDistanceToNow(new Date(session.expires_at), { addSuffix: true, locale: es })}
                    </span>
                  </div>

                  {session.user_agent && (
                    <div className="detail-row">
                      <span className="label">Navegador:</span>
                      <span className="value user-agent" title={session.user_agent}>
                        {session.user_agent.slice(0, 50)}...
                      </span>
                    </div>
                  )}

                  <div className="detail-row">
                    <span className="label">Iniciada:</span>
                    <span className="value">
                      {format(new Date(session.created_at), 'PPp', { locale: es })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="sessions-actions">
        <button 
          onClick={loadActiveSessions}
          disabled={isLoadingActiveSessions}
          className="btn btn-secondary"
        >
          {isLoadingActiveSessions ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <style jsx>{`
        .sessions-list {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
        }

        .sessions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }

        .sessions-header h2 {
          margin: 0;
          color: #333;
        }

        .sessions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 20px;
          margin-bottom: 20px;
        }

        .session-card {
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 16px;
          background: white;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          transition: box-shadow 0.2s;
        }

        .session-card:hover {
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }

        .current-session {
          border-color: #007bff;
          background: #f8f9ff;
        }

        .session-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }

        .device-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .device-icon {
          font-size: 24px;
        }

        .device-details strong {
          display: block;
          text-transform: capitalize;
          color: #333;
        }

        .current-badge {
          display: inline-block;
          background: #007bff;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: normal;
          margin-top: 2px;
        }

        .session-details {
          font-size: 14px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
          gap: 10px;
        }

        .detail-row .label {
          font-weight: 500;
          color: #666;
          flex-shrink: 0;
        }

        .detail-row .value {
          text-align: right;
          color: #333;
          word-break: break-word;
        }

        .user-agent {
          font-family: monospace;
          font-size: 11px;
          color: #666;
        }

        .sessions-actions {
          text-align: center;
          padding-top: 20px;
          border-top: 1px solid #e0e0e0;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-secondary:hover:not(:disabled) {
          background: #5a6268;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover:not(:disabled) {
          background: #c82333;
        }

        .btn-sm {
          padding: 4px 8px;
          font-size: 12px;
        }

        .alert {
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .alert-error {
          background: #f8d7da;
          border: 1px solid #f5c6cb;
          color: #721c24;
        }

        .loading, .error-message, .empty-sessions {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .loading-spinner {
          font-size: 24px;
          margin-bottom: 10px;
        }

        .error-message h3 {
          color: #dc3545;
          margin-bottom: 10px;
        }
      `}</style>
    </div>
  );
};

export default SessionsList;
