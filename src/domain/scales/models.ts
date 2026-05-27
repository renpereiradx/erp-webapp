/**
 * Reglas de dominio puras y validaciones para códigos de barras y balanzas.
 * Independiente de React (Framework-Agnostic).
 */

/**
 * Valida si un código de barras tiene exactamente 13 caracteres numéricos.
 */
export const isValidBarcodeLength = (barcode: string): boolean => {
  return /^\d{13}$/.test(barcode);
};

/**
 * Calcula el dígito verificador para un código EAN-13.
 * Toma los primeros 12 dígitos del código.
 */
export const calculateEan13CheckDigit = (barcode12: string): number => {
  if (!/^\d{12}$/.test(barcode12)) {
    throw new Error('Se requieren exactamente 12 dígitos numéricos para calcular el dígito verificador.');
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode12[i], 10);
    // Posiciones impares (1-indexed) x 1, posiciones pares x 3
    sum += (i % 2 === 0) ? digit : digit * 3;
  }

  const remainder = sum % 10;
  return remainder === 0 ? 0 : 10 - remainder;
};

/**
 * Verifica si el dígito de control de un código de barras EAN-13 es válido.
 */
export const validateEan13Checksum = (barcode: string): boolean => {
  if (!isValidBarcodeLength(barcode)) return false;
  
  const barcode12 = barcode.slice(0, 12);
  const checkDigit = parseInt(barcode[12], 10);
  
  try {
    return calculateEan13CheckDigit(barcode12) === checkDigit;
  } catch {
    return false;
  }
};

/**
 * Determina si un código de barras corresponde a una medida variable (balanza)
 * detectando si el prefijo de 2 dígitos está en el rango [20, 29].
 */
export const isCatchWeightBarcode = (barcode: string, allowedPrefixes = ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29']): boolean => {
  if (!barcode || barcode.length < 2) return false;
  const prefix = barcode.slice(0, 2);
  return allowedPrefixes.includes(prefix);
};

/**
 * Extrae la información estructurada de un código de barras de peso/precio variable.
 * Formato estándar:
 * - Prefijo: 2 dígitos (ej: 20)
 * - Código de balanza (scale_code): 4 dígitos (posiciones 2 a 5)
 * - Valor (precio o peso): 6 dígitos (posiciones 6 a 11)
 * - Dígito verificador: 1 dígito (posición 12)
 */
export interface ParsedVariableBarcode {
  scaleCode: string;
  value: number;
}

export const parseVariableBarcode = (barcode: string): ParsedVariableBarcode => {
  if (!isValidBarcodeLength(barcode)) {
    throw new Error('El código de barras no tiene la longitud requerida de 13 dígitos.');
  }

  const scaleCode = barcode.slice(2, 6);
  const rawValue = barcode.slice(6, 12);
  const value = parseInt(rawValue, 10);

  return {
    scaleCode,
    value: isNaN(value) ? 0 : value
  };
};
