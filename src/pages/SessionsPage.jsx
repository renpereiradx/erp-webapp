/**
 * Página de gestión de sesiones de usuario
 * Enfoque: MVP Guide - funcionalidad básica navegable
 */

import React from 'react';
import SessionManager from '@/components/Sessions/SessionManager';

const SessionsPage = () => {
  return (
    <div className="sessions-page">
      <SessionManager />
      
      <style jsx>{`
        .sessions-page {
          min-height: 100vh;
          background: #f8f9fa;
          padding: 0;
        }
      `}</style>
    </div>
  );
};

export default SessionsPage;
