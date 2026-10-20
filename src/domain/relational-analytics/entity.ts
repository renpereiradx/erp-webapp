/**
 * Identidad visible de la entidad de un drill-down (producto/cliente/
 * proveedor y variante). El id sigue siendo la fuente de verdad de la ruta;
 * el nombre resuelto es solo contexto de cabecera.
 *
 * El BE de BI devuelve solo ids en las filas y en la URL no viaja el nombre:
 * la página resuelve el nombre contra el endpoint Core de la entidad
 * (`/products/{id}`, `/api/v1/clients/{id}`, `/api/v1/suppliers/{id}`) y cae
 * al id cuando no está disponible. Sin dependencias de React ni side effects.
 */

import type { RelationalEntityKind } from './types';

export interface EntityDisplay {
  label: string;
  /** documento (personas) o código del producto (SKU/código de barras) */
  sub?: string;
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value !== null && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

/**
 * Acepta la entidad cruda o el envelope `{data: {...}}` de algunos endpoints
 * Core (los services ya desenvuelven una capa, esto cubre el resto).
 */
export const unwrapEntityPayload = (raw: unknown): Record<string, unknown> | null => {
  const record = asRecord(raw);
  if (!record) return null;
  const nested = asRecord(record.data);
  return nested ?? record;
};

const text = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

const firstText = (record: Record<string, unknown>, keys: readonly string[]): string => {
  for (const key of keys) {
    const value = text(record[key]);
    if (value) return value;
  }
  return '';
};

/**
 * Nombre de la entidad con los alias que devuelven los endpoints Core
 * (productos: `name`; parties: `name`/`business_name` o first+last name).
 */
export const entityDisplayName = (raw: unknown, fallbackId: string): string => {
  const record = unwrapEntityPayload(raw);
  if (!record) return fallbackId;
  const direct = firstText(record, [
    'name',
    'product_name',
    'business_name',
    'displayName',
    'razon_social',
  ]);
  if (direct) return direct;
  const fullName = `${text(record.first_name)} ${text(record.last_name)}`.trim();
  return fullName || fallbackId;
};

/** Documento de una party: tax_id (RUC) o document_id (CI), el que exista. */
export const entityDocument = (raw: unknown): string | undefined => {
  const record = unwrapEntityPayload(raw);
  if (!record) return undefined;
  return firstText(record, ['tax_id', 'document_id', 'ruc', 'document']) || undefined;
};

/** Referencia del producto: código de barras o SKU si el endpoint la trae. */
export const productReference = (raw: unknown): string | undefined => {
  const record = unwrapEntityPayload(raw);
  if (!record) return undefined;
  return firstText(record, ['barcode', 'sku', 'code']) || undefined;
};

export const variantDisplayName = (raw: unknown, fallbackId: string): string => {
  const record = unwrapEntityPayload(raw);
  if (!record) return fallbackId;
  return firstText(record, ['variant_name', 'name']) || fallbackId;
};

/** Contexto de cabecera: nombre + referencia secundaria según el tipo. */
export const entityDisplay = (
  kind: RelationalEntityKind,
  raw: unknown,
  fallbackId: string,
): EntityDisplay => {
  const label = entityDisplayName(raw, fallbackId);
  const sub = kind === 'product' ? productReference(raw) : entityDocument(raw);
  return sub ? { label, sub } : { label };
};
