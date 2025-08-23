/**
 * Componente principal para gestión de sesiones de usuario
 * Enfoque: MVP Guide - funcionalidad básica navegable
 */

import React, { useState, useEffect } from 'react';
import SessionsList from './SessionsList';
import SessionHistory from './SessionHistory';
import SessionActivity from './SessionActivity';
import useSessionStore from '@/store/useSessionStore';

const SessionManager = () => {
  const [activeTab, setActiveTab] = useState('active');
  const { initializeSessions, sessionConfig, getSessionStats } = useSessionStore();

  useEffect(() => {
    // Inicializar datos de sesiones al cargar el componente
    initializeSessions();
  }, []);

  const tabs = [
    { id: 'active', label: 'Sesiones Activas', icon: '🔒' },
    { id: 'history', label: 'Historial', icon: '📋' },
    { id: 'activity', label: 'Actividad', icon: '📊' }
  ];

  const stats = getSessionStats();

  const renderTabContent = () => {
    switch (activeTab) {
      case 'active':
        return <SessionsList />;
      case 'history':
        return <SessionHistory />;
      case 'activity':
        return <SessionActivity />;
      default:
        return <SessionsList />;
    }
  };

  return (
    <div className="session-manager">
      <div className="session-manager-header">
        <div className="header-content">
          <h1>Gestión de Sesiones</h1>
          <p className="header-description">
            Administra tus sesiones activas, revisa el historial y monitorea la actividad de tu cuenta.
          </p>
        </div>

        {sessionConfig && (
          <div className="session-config-info">
            <div className="config-item">
              <span className="config-label">Sesiones máximas:</span>
              <span className="config-value">{sessionConfig.max_concurrent_sessions}</span>
            </div>
            <div className="config-item">
              <span className="config-label">Timeout de sesión:</span>
              <span className="config-value">{sessionConfig.session_timeout_minutes} min</span>
            </div>
            <div className="config-item">
              <span className="config-label">Timeout de inactividad:</span>
              <span className="config-value">{sessionConfig.inactivity_timeout_minutes} min</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats cards */}
      {stats.activeCount > 0 && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">🔒</div>
            <div className="stat-content">
              <div className="stat-number">{stats.activeCount}</div>
              <div className="stat-label">Sesiones Activas</div>
            </div>
          </div>

          {stats.activeDeviceTypes.length > 0 && (
            <div className="stat-card">
              <div className="stat-icon">📱</div>
              <div className="stat-content">
                <div className="stat-number">{stats.activeDeviceTypes.length}</div>
                <div className="stat-label">Tipos de Dispositivo</div>
                <div className="stat-details">
                  {stats.activeDeviceTypes.join(', ')}
                </div>
              </div>
            </div>
          )}

          {stats.lastActivity && (
            <div className="stat-card">
              <div className="stat-icon">⏰</div>
              <div className="stat-content">
                <div className="stat-number">
                  {Math.round((Date.now() - stats.lastActivity) / 1000 / 60)}m
                </div>
                <div className="stat-label">Última Actividad</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navegación por tabs */}
      <div className="tab-navigation">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido de la tab activa */}
      <div className="tab-content">
        {renderTabContent()}
      </div>

      <style jsx>{`
        .session-manager {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
        }

        .session-manager-header {
          margin-bottom: 30px;
        }

        .header-content {
          margin-bottom: 20px;
        }

        .session-manager-header h1 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 28px;
          font-weight: 600;
        }

        .header-description {
          margin: 0;
          color: #666;
          font-size: 16px;
          line-height: 1.5;
        }

        .session-config-info {
          display: flex;
          gap: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #e9ecef;
        }

        .config-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .config-label {
          font-size: 12px;
          color: #666;
          font-weight: 500;
        }

        .config-value {
          font-size: 14px;
          color: #333;
          font-weight: 600;
        }

        .stats-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          padding: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .stat-content {
          flex: 1;
        }

        .stat-number {
          font-size: 24px;
          font-weight: 700;
          color: #333;
          line-height: 1;
        }

        .stat-label {
          font-size: 12px;
          color: #666;
          font-weight: 500;
          margin-top: 4px;
        }

        .stat-details {
          font-size: 11px;
          color: #999;
          margin-top: 2px;
          text-transform: capitalize;
        }

        .tab-navigation {
          display: flex;
          background: white;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          overflow: hidden;
          margin-bottom: 20px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .tab-button {
          flex: 1;
          padding: 16px 20px;
          border: none;
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s;
          border-right: 1px solid #e0e0e0;
        }

        .tab-button:last-child {
          border-right: none;
        }

        .tab-button:hover {
          background: #f8f9fa;
        }

        .tab-button.active {
          background: #007bff;
          color: white;
        }

        .tab-icon {
          font-size: 18px;
        }

        .tab-label {
          font-weight: 500;
          font-size: 14px;
        }

        .tab-content {
          background: white;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        @media (max-width: 768px) {
          .session-manager {
            padding: 10px;
          }

          .session-manager-header h1 {
            font-size: 24px;
          }

          .session-config-info {
            flex-direction: column;
            gap: 12px;
          }

          .stats-cards {
            grid-template-columns: 1fr;
          }

          .tab-button {
            flex-direction: column;
            padding: 12px 8px;
            gap: 4px;
          }

          .tab-label {
            font-size: 12px;
          }

          .tab-icon {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .tab-navigation {
            flex-direction: column;
          }

          .tab-button {
            flex-direction: row;
            justify-content: center;
            border-right: none;
            border-bottom: 1px solid #e0e0e0;
          }

          .tab-button:last-child {
            border-bottom: none;
          }
        }
      `}</style>
    </div>
  );
};

export default SessionManager;
