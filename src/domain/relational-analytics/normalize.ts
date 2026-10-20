/**
 * Normalización pura de respuestas de los drill-downs relacionales.
 * El contrato BE (§4) entrega {rows, total, page, page_size}; la vista
 * necesita además totalPages para TablePagination. Los formateadores son
 * puros y compartidos por las 4 pantallas: la celda no decide formatos.
 */
import { formatCurrency, formatPYG, normalizeCurrencyCode } from '@/utils/currencyUtils';
import type { RelationalResponse } from './types';

export interface DrilldownView<Row> {
  rows: Row[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** solo #4: compras en otra moneda fuera del ranking (meta D3) */
  excludedOtherCurrency: number;
}

export const normalizeResponse = <Row>(
  data?: RelationalResponse<Row> | null,
): DrilldownView<Row> => {
  const total = Math.max(data?.total ?? 0, 0);
  const pageSize = Math.max(data?.page_size ?? 10, 1);
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);
  return {
    rows: data?.rows ?? [],
    total,
    page: Math.max(data?.page ?? 1, 1),
    pageSize,
    totalPages,
    excludedOtherCurrency: data?.excluded_other_currency ?? 0,
  };
};

/**
 * Códigos de unidad genéricos del catálogo: "unit"/"unidad" se muestran como
 * "uds." para no dejar un anglicismo suelto en la UI en español. Las UOM
 * reales (kg, doc, m…) se muestran tal como las define el producto.
 */
const GENERIC_UNIT_CODES = new Set(['unit', 'units', 'unidad', 'unidades', 'uds', 'u']);

/**
 * Cantidad normalizada a base + UOM (F5): "40 kg" cuando la fila trae
 * base_unit; el fallback es el contador genérico "N uds.".
 */
export const formatDrilldownUnits = (units: number | null | undefined, baseUnit?: string | null): string => {
  const value = Number(units);
  // Una línea de venta/compra nunca tiene cantidad 0: el BE devuelve 0 cuando
  // sdBaseQty no pudo normalizar la unidad. Un "0 uds." al lado de un importe
  // real es un cero engañoso; '—' comunica que la cantidad no está disponible.
  if (!Number.isFinite(value) || value <= 0) return '—';
  const qty = value.toLocaleString('es-PY');
  const unit = typeof baseUnit === 'string' ? baseUnit.trim() : '';
  if (!unit || GENERIC_UNIT_CODES.has(unit.toLowerCase())) {
    return `${qty} ${value === 1 ? 'ud.' : 'uds.'}`;
  }
  return `${qty} ${unit}`;
};

/** Conteo del contrato (compras, filas): separador de miles es-PY. */
export const formatDrilldownCount = (value: number | null | undefined): string => {
  const count = Number(value);
  return (Number.isFinite(count) ? count : 0).toLocaleString('es-PY');
};

/**
 * Monto del contrato: los agregados #1/#2/#3 vienen en la moneda base sin
 * código (PYG en esta instalación); #4 sí declara `currency` por fila y se
 * formatea con ese código. Sin monto válido se muestra '—', nunca un cero
 * inventado.
 */
export const formatDrilldownMoney = (
  value: number | null | undefined,
  currency?: string | null,
): string => {
  if (value === null || value === undefined) return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  if (!currency) return formatPYG(amount);
  try {
    return formatCurrency(amount, normalizeCurrencyCode(currency));
  } catch {
    return formatPYG(amount);
  }
};

/** Fecha ISO del contrato → fecha local (día). Vacío/inválido → '—'. */
export const formatDrilldownDate = (value?: string | null, locale?: string): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(locale || undefined);
};
