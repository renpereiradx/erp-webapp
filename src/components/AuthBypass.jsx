/**
 * Componente temporal para bypass de autenticación
 * Solo para debug - no usar en producción
 */

import React from 'react';

const AuthBypass = ({ children }) => {
  console.log('🚫 AuthBypass: Skipping authentication completely');
  return children;
};

export default AuthBypass;
