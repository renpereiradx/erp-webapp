/**
 * Búsqueda de entidades del picker de los drill-downs.
 *
 * Productos: misma búsqueda plana (granularidad variante) que /ventas y
 * presupuestos, con el `signal` del dropdown reenviado al HTTP (DESIGN §13).
 * Clientes/proveedores: búsqueda por nombre del service Core (la usan las
 * pantallas de parties). Los mappers son puros y se testean sin red.
 */

import { useCallback } from 'react';
import clientService from '@/services/clientService';
import supplierService from '@/services/supplierService';
import {
  searchSellableUnitsFlat,
  type SellableUnitOption,
} from '@/features/catalog/sellableUnitSearch';
import {
  entityDisplayName,
  entityDocument,
  unwrapEntityPayload,
} from '@/domain/relational-analytics/entity';
import type { EntityOption, EntitySearchFn, RelationalEntityKind } from '../types';

const partyOptions = (raw: unknown): EntityOption[] => {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    const record = unwrapEntityPayload(item);
    if (!record) return [];
    const id = String(record.id ?? record._key ?? '').trim();
    if (!id) return [];
    const sub = entityDocument(item);
    const option: EntityOption = { id, label: entityDisplayName(item, id) };
    if (sub) option.sub = sub;
    return [option];
  });
};

const sellableLabel = (unit: SellableUnitOption): string => {
  const variantName = unit.variant_name?.trim();
  if (!variantName) return unit.name;
  // El nombre de la variante a veces ya embebe el del producto: no duplicar.
  if (variantName.toLowerCase().startsWith(unit.name.toLowerCase())) return variantName;
  return `${unit.name} · ${variantName}`;
};

export const toSellableUnitOptions = (units: SellableUnitOption[]): EntityOption[] =>
  units.map((unit) => {
    const option: EntityOption = {
      id: unit.id,
      label: sellableLabel(unit),
      variantId: unit.variant_id ?? null,
    };
    if (unit.sku) option.sub = unit.sku;
    return option;
  });

/**
 * Mapper exportado para test: filtra resultados sin id (el backend puede
 * devolver wrappers vacíos) y aplana el envelope cuando existe.
 */
export const mapPartySearchResults = partyOptions;

export const useEntitySearch = (kind: RelationalEntityKind): EntitySearchFn =>
  useCallback<EntitySearchFn>(
    async (term, ctx) => {
      const trimmed = term.trim();
      if (trimmed.length < 2) return [];
      if (kind === 'product') {
        const units = await searchSellableUnitsFlat(trimmed, { signal: ctx?.signal });
        return toSellableUnitOptions(units);
      }
      if (kind === 'client') {
        return partyOptions(await clientService.searchByName(trimmed));
      }
      return partyOptions(await supplierService.searchByName(trimmed));
    },
    [kind],
  );
