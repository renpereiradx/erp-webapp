/**
 * Envelope estándar de la API BI: {success, data, metadata}.
 * Los servicios devuelven el envelope crudo (convención de la casa);
 * los hooks unwrapean.
 */
export interface Envelope<T> {
  success?: boolean;
  data?: T;
  metadata?: Record<string, unknown>;
  error?: { code?: string; message?: string };
}
