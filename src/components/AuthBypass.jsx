/**
 * Componente temporal para bypass de autenticación
 * Solo para debug - no usar en producción
 */

import React from 'react';

const AuthBypass = ({ children }) => {
  return <div data-testid="auth-bypass">{children}</div>;
};

export default AuthBypass;
