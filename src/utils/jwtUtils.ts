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
}

/**
 * Decodifica el payload de un JWT sin validación de firma
 * Útil para obtener claims en el frontend de forma síncrona
 */
export const decodeJWTPayload = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payload = parts[1];
    // Manejar base64 con soporte para caracteres especiales
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodedPayload);
  } catch (error) {
    console.error('Error decodificando JWT payload:', error);
    return null;
  }
};
