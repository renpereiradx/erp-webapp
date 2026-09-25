/**
 * UnitSelect — selector unificado de unidades de medida (PLAN_UNITS_FRONTEND).
 *
 * Un solo mecanismo para elegir unidad en TODO el sistema (productos ya lo
 * hacía con este catálogo; ventas y compras usaban datalists de texto libre
 * con listas distintas entre sí). Catálogo central: src/constants/units.js.
 * Evolución pendiente: consumir GET /units del backend como fuente única.
 */
import React from 'react';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getGroupedUnitOptions, getUnitLabel } from '@/constants/units';

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
  const groups = React.useMemo(() => getGroupedUnitOptions(), []);
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

export default UnitSelect;
