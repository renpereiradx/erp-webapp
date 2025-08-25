/**
 * Componente para mostrar historial de sesiones del usuario
 * Enfoque: MVP Guide - funcionalidad básica navegable
 */

import React, { useEffect, useState } from 'react';
import useSessionStore from '@/store/useSessionStore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SessionHistory = () => {
  const {
    sessionHistory,
    historyPagination,
    isLoadingHistory,
    historyError,
    loadSessionHistory,
    clearErrors
  } = useSessionStore();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadSessionHistory(currentPage, pageSize);
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const getSessionStatusBadge = (session) => {
    if (session.is_active) {
      return <span className="status-badge active">Activa</span>;
    } else if (session.revoked_at) {
      return <span className="status-badge revoked">Revocada</span>;
    } else {
      return <span className="status-badge expired">Expirada</span>;
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

  const formatDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate || Date.now());
    const durationMs = end - start;
    
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  const totalPages = Math.ceil(historyPagination.totalCount / pageSize);

  if (isLoadingHistory && currentPage === 1) {
    return (
      <div className="session-history loading">
        <div className="loading-spinner">⏳</div>
        <p>Cargando historial de sesiones...</p>
      </div>
    );
  }

  if (historyError) {
    return (
      <div className="session-history error">
        <div className="error-message">
          <h3>Error al cargar historial</h3>
          <p>{historyError}</p>
          <button 
            onClick={() => {
              clearErrors();
              loadSessionHistory(currentPage, pageSize);
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
    <div className="session-history">
      <div className="history-header">
        <h2>Historial de Sesiones</h2>
        <div className="history-stats">
          <span>Total: {historyPagination.totalCount} sesiones</span>
        </div>
      </div>

      {sessionHistory.length === 0 ? (
        <div className="empty-history">
          <p>No hay historial de sesiones disponible.</p>
          <button 
            onClick={() => loadSessionHistory(1, pageSize)}
            className="btn btn-secondary"
          >
            Actualizar
          </button>
        </div>
      ) : (
        <>
          <div className="history-table-container">
            <table className="history-table">
              <thead>
                <tr>
                  <th>Dispositivo</th>
                  <th>Estado</th>
                  <th>IP</th>
                  <th>Iniciada</th>
                  <th>Finalizada</th>
                  <th>Duración</th>
                  <th>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {sessionHistory.map((session) => (
                  <tr key={session.id} className={session.is_active ? 'active-row' : ''}>
                    <td>
                      <div className="device-cell">
                        <span className="device-icon">
                          {getDeviceIcon(session.device_type)}
                        </span>
                        <div className="device-info">
                          <div className="device-type">
                            {session.device_type || 'Desconocido'}
                          </div>
                          {session.user_agent && (
                            <div className="user-agent" title={session.user_agent}>
                              {session.user_agent.slice(0, 30)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      {getSessionStatusBadge(session)}
                    </td>
                    
                    <td>
                      <code className="ip-address">
                        {session.ip_address || 'N/A'}
                      </code>
                    </td>
                    
                    <td>
                      <div className="date-cell">
                        <div className="date-primary">
                          {format(new Date(session.created_at), 'dd/MM/yyyy', { locale: es })}
                        </div>
                        <div className="date-secondary">
                          {format(new Date(session.created_at), 'HH:mm', { locale: es })}
                        </div>
                      </div>
                    </td>
                    
                    <td>
                      {session.is_active ? (
                        <span className="text-muted">En uso</span>
                      ) : (
                        <div className="date-cell">
                          <div className="date-primary">
                            {format(new Date(session.revoked_at || session.expires_at), 'dd/MM/yyyy', { locale: es })}
                          </div>
                          <div className="date-secondary">
                            {format(new Date(session.revoked_at || session.expires_at), 'HH:mm', { locale: es })}
                          </div>
                        </div>
                      )}
                    </td>
                    
                    <td>
                      <span className="duration">
                        {formatDuration(session.created_at, session.revoked_at || session.expires_at)}
                      </span>
                    </td>
                    
                    <td>
                      {session.revoke_reason ? (
                        <span className="revoke-reason" title={session.revoke_reason}>
                          {session.revoke_reason}
                        </span>
                      ) : session.is_active ? (
                        <span className="text-muted">-</span>
                      ) : (
                        <span className="text-muted">Expirada</span>
                      )}
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
                disabled={currentPage === 1 || isLoadingHistory}
                className="btn btn-secondary btn-sm"
              >
                ← Anterior
              </button>
              
              <div className="page-info">
                <span>
                  Página {currentPage} de {totalPages}
                </span>
                <span className="total-items">
                  ({historyPagination.totalCount} total)
                </span>
              </div>
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoadingHistory}
                className="btn btn-secondary btn-sm"
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      <div className="history-actions">
        <button 
          onClick={() => loadSessionHistory(currentPage, pageSize)}
          disabled={isLoadingHistory}
          className="btn btn-secondary"
        >
          {isLoadingHistory ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      <style jsx>{`
        .session-history {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e0e0e0;
        }

        .history-header h2 {
          margin: 0;
          color: #333;
        }

        .history-stats {
          font-size: 14px;
          color: #666;
        }

        .history-table-container {
          overflow-x: auto;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }

        .history-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 800px;
        }

        .history-table th {
          background: #f8f9fa;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          color: #495057;
          border-bottom: 1px solid #dee2e6;
        }

        .history-table td {
          padding: 12px 8px;
          border-bottom: 1px solid #dee2e6;
          vertical-align: top;
        }

        .history-table tr:hover {
          background: #f8f9fa;
        }

        .active-row {
          background: #f8f9ff !important;
        }

        .device-cell {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .device-icon {
          font-size: 18px;
        }

        .device-info {
          min-width: 0;
        }

        .device-type {
          font-weight: 500;
          text-transform: capitalize;
        }

        .user-agent {
          font-size: 11px;
          color: #666;
          font-family: monospace;
        }

        .status-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .status-badge.active {
          background: #d4edda;
          color: #155724;
        }

        .status-badge.revoked {
          background: #f8d7da;
          color: #721c24;
        }

        .status-badge.expired {
          background: #ffeaa7;
          color: #856404;
        }

        .ip-address {
          font-family: monospace;
          background: #f8f9fa;
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 12px;
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

        .duration {
          font-family: monospace;
          font-size: 13px;
          color: #495057;
        }

        .revoke-reason {
          font-size: 12px;
          color: #dc3545;
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

        .history-actions {
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

        .loading, .error-message, .empty-history {
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
          .history-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }

          .history-table th,
          .history-table td {
            padding: 8px 4px;
            font-size: 12px;
          }

          .pagination {
            flex-wrap: wrap;
            gap: 10px;
          }
        }
      `}</style>
    </div>
  );
};

export default SessionHistory;
