/**
 * UnitSelect — selector unificado de unidades de medida (PLAN_UNITS_FRONTEND).
 *
 * Un solo mecanismo para elegir unidad en TODO el sistema. Fuente de valores
 * (PLAN_UNITS_V2_COMPLETACION F3.2): GET /units del backend (products.
 * get_available_unit_values), cacheado por sesión vía unitsService; mientras
 * hidrata o si falla, usa el catálogo local de src/constants/units.js
 * (sincronizado con el canónico). Los labels/categorías siguen viniendo del
 * catálogo local; los valores SOLO del backend usan su description/category.
 */
import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UNIT_CONFIGS, UNIT_CATEGORIES, getUnitLabel } from '@/constants/units';
import { unitsService, type UnitCatalogEntry } from '@/services/unitsService';

interface UnitSelectProps {
  id?: string;
  value: string;
  onChange: (unit: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  /** Unidades extra a ofrecer cuando no están en el catálogo (legacy). */
  extraUnits?: string[];
}

interface UnitOptionGroup {
  label: string;
  options: Array<{ value: string; label: string }>;
}

/** Mapea el category del backend a las categorías locales de agrupación. */
const SERVER_CATEGORY_MAP: Record<string, string> = {
  basic: 'basic',
  weight: 'weight',
  mass: 'weight',
  volume: 'volume',
  packing: 'packing',
  packaging: 'packing',
  length: 'length',
  measurement: 'length',
  area: 'area',
  service: 'service',
  grocery: 'grocery',
};

/**
 * Grupos del catálogo hidratado: el ORDEN y el conjunto de valores vienen del
 * backend (fuente canónica); el label prefiere el local (es-PY curado) y
 * cae a la description del backend para valores aún no mapeados.
 */
function buildGroupsFromServer(entries: UnitCatalogEntry[]): UnitOptionGroup[] {
  const groups: Record<string, UnitOptionGroup> = {};
  for (const entry of entries) {
    const local = (UNIT_CONFIGS as Record<string, any>)[entry.value];
    const label = local?.label ?? entry.description ?? entry.value;
    const category = local?.category ?? SERVER_CATEGORY_MAP[entry.category] ?? entry.category;
    if (!groups[category]) {
      groups[category] = {
        label: UNIT_CATEGORIES[category] ?? category,
        options: [],
      };
    }
    groups[category].options.push({ value: entry.value, label });
  }
  return Object.values(groups);
}

export const UnitSelect: React.FC<UnitSelectProps> = ({
  id,
  value,
  onChange,
  disabled,
  className,
  placeholder,
  ariaLabel,
  extraUnits,
}) => {
  // Hidratación perezosa: el primer UnitSelect montado de la sesión descarga
  // el catálogo; los demás reusan la caché. Sin backend, el catálogo local
  // (sincronizado) mantiene el selector funcionando.
  const [serverUnits, setServerUnits] = useState<UnitCatalogEntry[] | null>(unitsService.getCached());
  useEffect(() => {
    if (unitsService.getCached()) return;
    let cancelled = false;
    unitsService
      .getCatalog()
      .then((entries) => {
        if (!cancelled && entries.length > 0) setServerUnits(entries);
      })
      .catch(() => {
        // fail-silent: el fallback local ya está renderizado.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const groups = React.useMemo(
    () => (serverUnits && serverUnits.length > 0 ? buildGroupsFromServer(serverUnits) : getLocalGroups()),
    [serverUnits],
  );
  // Unidad actual fuera de catálogo (legacy): se lista al final para no
  // perder el valor al abrir el selector.
  const legacy = React.useMemo(() => {
    if (!value || !extraUnits?.length) return [];
    return extraUnits.filter((u) => !groups.some((g) => g.options.some((o) => o.value === u)));
  }, [value, extraUnits, groups]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className={className} aria-label={ariaLabel}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {groups.map((group: any) => (
          <SelectGroup key={group.label}>
            <SelectLabel>{group.label}</SelectLabel>
            {group.options.map((option: any) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        ))}
        {legacy.map((u) => (
          <SelectItem key={u} value={u}>
            {getUnitLabel(u)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

function getLocalGroups(): UnitOptionGroup[] {
  const groups: Record<string, UnitOptionGroup> = {};
  Object.values(UNIT_CONFIGS).forEach((unit: any) => {
    if (!groups[unit.category]) {
      groups[unit.category] = {
        label: UNIT_CATEGORIES[unit.category] || unit.category,
        options: [],
      };
    }
    groups[unit.category].options.push({ value: unit.value, label: unit.label });
  });
  return Object.values(groups);
}

export default UnitSelect;
