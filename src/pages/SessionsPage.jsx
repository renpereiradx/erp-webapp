/**
 * Página de gestión de sesiones de usuario
 * Enfoque: MVP Guide - funcionalidad básica navegable
 */

import React from 'react';
import SessionManager from '@/components/Sessions/SessionManager';
import { Helmet } from 'react-helmet-async';

const SessionsPage = () => {
  return (
    <>
      <Helmet>
        <title>Gestión de Sesiones - ERP WebApp</title>
        <meta 
          name="description" 
          content="Administra tus sesiones activas, revisa el historial y monitorea la actividad de tu cuenta de forma segura." 
        />
      </Helmet>
      
      <div className="sessions-page">
        <SessionManager />
      </div>
      
      <style jsx>{`
        .sessions-page {
          min-height: 100vh;
          background: #f8f9fa;
          padding: 0;
        }
      `}</style>
    </>
  );
};

export default SessionsPage;
