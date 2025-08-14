// Central enum + metadata for API / domain errors
export const ERROR_CODES = {
  UNAUTHORIZED: { severity: 'warn', hint: 'Reinicia sesión para continuar.' },
  NOT_FOUND: { severity: 'info', hint: 'El recurso no existe o fue eliminado.' },
  INTERNAL: { severity: 'error', hint: 'Problema interno, intenta más tarde.' },
  NETWORK: { severity: 'error', hint: 'Verifica tu conexión a internet.' },
  VALIDATION: { severity: 'warn', hint: 'Revisa los datos ingresados.' },
  RATE_LIMIT: { severity: 'warn', hint: 'Demasiadas solicitudes, espera e intenta de nuevo.' },
  CONFLICT: { severity: 'warn', hint: 'Conflicto de estado, refresca los datos.' },
  UNKNOWN: { severity: 'error', hint: 'Ocurrió un error inesperado.' }
};
