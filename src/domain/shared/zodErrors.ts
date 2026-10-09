import { z } from 'zod';

/**
 * Extrae el primer mensaje de error de Zod por campo. Los mensajes del schema
 * son claves i18n; el componente las renderiza con t(key, fallback).
 */
export const zodFieldErrors = (error: z.ZodError): Record<string, string> => {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === 'string' && !fieldErrors[key]) {
      fieldErrors[key] = issue.message;
    }
  }
  return fieldErrors;
};
