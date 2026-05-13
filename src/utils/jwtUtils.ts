/**
 * Utilidades para manejo de JWT y tokens de acceso
 */

export interface JWTPayload {
  user_id: string;
  role_id: string;
  session_id: number;
  token_type: string;
  allowed_branches: number[];
  active_branch: number | null;
  exp: number;
  iat: number;
  jti?: string;
}

/**
 * Decodifica el payload de un JWT sin validación de firma.
 * Útil para obtener claims en el frontend de forma síncrona.
 */
export const decodeJWTPayload = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Manejar base64url con soporte para caracteres especiales
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decodificando JWT payload:', error);
    return null;
  }
};

/**
 * Obtiene el session_id del access token activo en localStorage.
 * Se usa para identificar cuál sesión de la lista es la "actual".
 */
export const getCurrentSessionId = (): number | null => {
  const token = localStorage.getItem('authToken');
  if (!token || token === 'null' || token === 'undefined') return null;
  return decodeJWTPayload(token)?.session_id ?? null;
};

/**
 * Obtiene todos los claims del access token activo en localStorage.
 */
export const getJwtClaims = (): JWTPayload | null => {
  const token = localStorage.getItem('authToken');
  if (!token || token === 'null' || token === 'undefined') return null;
  return decodeJWTPayload(token);
};

/**
 * Verifica si el access token almacenado ha expirado localmente.
 * No reemplaza la validación del backend.
 */
export const isTokenExpired = (): boolean => {
  const claims = getJwtClaims();
  if (!claims?.exp) return true;
  return Date.now() / 1000 > claims.exp;
};

