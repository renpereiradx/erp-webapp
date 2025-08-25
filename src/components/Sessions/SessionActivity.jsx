/**
 * Componente para mostrar log de actividad del usuario
 * Enfoque: MVP Guide - funcionalidad básica navegable
 */

import React, { useEffect, useState } from 'react';
import useSessionStore from '@/store/useSessionStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SessionActivity = () => {
  const {
    activityLog,
    activityPagination,
    isLoadingActivity,
    activityError,
    loadActivityLog,
    clearErrors
  } = useSessionStore();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadActivityLog(currentPage, pageSize);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const getActivityIcon = (activityType) => {
    switch (activityType) {
      case 'LOGIN': return '🔐';
      case 'LOGOUT': return '🚪';
      case 'API_CALL': return '🔗';
      case 'SESSION_REVOKED': return '❌';
      default: return '📝';
    }
  };

  const getActivityBadge = (activityType) => {
    const baseClass = 'activity-badge';
    
    switch (activityType) {
      case 'LOGIN':
        return <span className={`${baseClass} login`}>Inicio de sesión</span>;
      case 'LOGOUT':
        return <span className={`${baseClass} logout`}>Cierre de sesión</span>;
      case 'API_CALL':
        return <span className={`${baseClass} api`}>Llamada API</span>;
      case 'SESSION_REVOKED':
        return <span className={`${baseClass} revoked`}>Sesión revocada</span>;
      default:
        return <span className={`${baseClass} default`}>{activityType}</span>;
    }
  };

  const getResponseStatusBadge = (status) => {
    if (!status) return null;
    
    const isSuccess = status >= 200 && status < 300;
    const isClientError = status >= 400 && status < 500;
    const isServerError = status >= 500;
    
    let className = 'status-badge';
    if (isSuccess) className += ' success';
    else if (isClientError) className += ' client-error';
    else if (isServerError) className += ' server-error';
    
    return <span className={className}>{status}</span>;
  };

  const formatDuration = (durationMs) => {
    if (!durationMs) return '-';
    
    if (durationMs < 1000) {
      return `${durationMs}ms`;
    } else {
      return `${(durationMs / 1000).toFixed(2)}s`;
    }
  };

  const totalPages = Math.ceil(activityPagination.totalCount / pageSize);

  if (isLoadingActivity && currentPage === 1) {
    return (
      <div className="session-activity loading">
        <div className="loading-spinner">⏳</div>
        <p>Cargando log de actividad...</p>
      </div>
    );
  }

  if (activityError) {
    return (
      <div className="session-activity error">
        <div className="error-message">
          <h3>Error al cargar actividad</h3>
          <p>{activityError}</p>
          <button 
            onClick={() => {
              clearErrors();
              loadActivityLog(currentPage, pageSize);
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
    <div className="session-activity">
      <div className="activity-header">
        <h2>Log de Actividad</h2>
        <div className="activity-stats">
          <span>Total: {activityPagination.totalCount} eventos</span>
        </div>
      </div>

      {activityLog.length === 0 ? (
        <div className="empty-activity">
          <p>No hay actividad registrada disponible.</p>
          <button 
            onClick={() => loadActivityLog(1, pageSize)}
            className="btn btn-secondary"
          >
            Actualizar
          </button>
        </div>
      ) : (
        <>
          <div className="activity-table-container">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Fecha/Hora</th>
                  <th>Endpoint</th>
                  <th>Método</th>
                  <th>IP</th>
                  <th>Estado</th>
                  <th>Duración</th>
                </tr>
              </thead>
              <tbody>
                {activityLog.map((activity) => (
                  <tr key={activity.id}>
                    <td>
                      <div className="activity-type-cell">
                        <span className="activity-icon">
                          {getActivityIcon(activity.activity_type)}
                        </span>
                        {getActivityBadge(activity.activity_type)}
                      </div>
                    </td>
                    
                    <td>
                      <div className="date-cell">
                        <div className="date-primary">
                          {format(new Date(activity.created_at), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="date-secondary">
                          {format(new Date(activity.created_at), 'HH:mm:ss', { locale: es })}
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      {activity.endpoint ? (
                        <code className="endpoint">
                          {activity.endpoint}
                        </code>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    
                    <td>
                      {activity.http_method ? (
                        <span className={`method-badge ${activity.http_method.toLowerCase()}`}>
                          {activity.http_method}
                        </span>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    
                    <td>
                      <code className="ip-address">
                        {activity.ip_address || 'N/A'}
                      </code>
                    </td>
                    
                    <td>
                      {getResponseStatusBadge(activity.response_status)}
                    </td>
                    
                    <td>
                      <span className="duration">
                        {formatDuration(activity.duration_ms)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoadingActivity}
                className="btn btn-secondary btn-sm"
              >
                ← Anterior
              </button>
              
              <div className="page-info">
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <span className="total-items">
                  ({activityPagination.totalCount} total)
                </span>
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoadingActivity}
                className="btn btn-secondary btn-sm"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      <div className="activity-actions">
        <button 
          onClick={() => loadActivityLog(currentPage, pageSize)}
          disabled={isLoadingActivity}
          className="btn btn-secondary"
        >
          {isLoadingActivity ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <style jsx>{`
        .session-activity {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .activity-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }

        .activity-header h2 {
          margin: 0;
          color: #333;
        }

        .activity-stats {
          font-size: 14px;
          color: #666;
        }

        .activity-table-container {
          overflow-x: auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .activity-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 1000px;
        }

        .activity-table th {
          background: #f8f9fa;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 1px solid #dee2e6;
        }

        .activity-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #dee2e6;
          vertical-align: top;
        }

        .activity-table tr:hover {
          background: #f8f9fa;
        }

        .activity-type-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .activity-icon {
          font-size: 16px;
        }

        .activity-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .activity-badge.login {
          background: #d4edda;
          color: #155724;
        }

        .activity-badge.logout {
          background: #fff3cd;
          color: #856404;
        }

        .activity-badge.api {
          background: #d1ecf1;
          color: #0c5460;
        }

        .activity-badge.revoked {
          background: #f8d7da;
          color: #721c24;
        }

        .activity-badge.default {
          background: #e2e3e5;
          color: #383d41;
        }

        .date-cell {
          font-size: 14px;
        }

        .date-primary {
          font-weight: 500;
        }

        .date-secondary {
          font-size: 12px;
          color: #666;
        }

        .endpoint {
          font-family: monospace;
          background: #f8f9fa;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 12px;
          max-width: 200px;
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .method-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .method-badge.get {
          background: #d4edda;
          color: #155724;
        }

        .method-badge.post {
          background: #d1ecf1;
          color: #0c5460;
        }

        .method-badge.put {
          background: #fff3cd;
          color: #856404;
        }

        .method-badge.delete {
          background: #f8d7da;
          color: #721c24;
        }

        .ip-address {
          font-family: monospace;
          background: #f8f9fa;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 12px;
        }

        .status-badge {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }

        .status-badge.success {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.client-error {
          background: #fff3cd;
          color: #856404;
        }

        .status-badge.server-error {
          background: #f8d7da;
          color: #721c24;
        }

        .duration {
          font-family: monospace;
          font-size: 12px;
          color: #495057;
        }

        .text-muted {
          color: #6c757d;
          font-style: italic;
        }

        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 0 10px;
        }

        .page-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .total-items {
          font-size: 12px;
          color: #666;
        }

        .activity-actions {
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

        .btn-sm {
          padding: 6px 12px;
          font-size: 12px;
        }

        .loading, .error-message, .empty-activity {
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

        @media (max-width: 768px) {
          .activity-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .activity-table th,
          .activity-table td {
            padding: 8px 4px;
            font-size: 12px;
          }

          .pagination {
            flex-wrap: wrap;
            gap: 10px;
          }

          .endpoint {
            max-width: 120px;
          }
        }
      `}</style>
    </div>
  );
};

export default SessionActivity;
