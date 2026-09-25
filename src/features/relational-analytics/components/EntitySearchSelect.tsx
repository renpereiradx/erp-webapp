import { SearchableDropdown } from '@/components/ui/SearchableDropdown';
import type { SearchableDropdownItem } from '@/components/ui/SearchableDropdown';
import { useI18n } from '@/lib/i18n';

export interface EntityOption {
  id: string;
  label: string;
  /** identificador secundario en contexto: SKU (producto) o documento (persona) */
  sub?: string;
  /** variante de la fila plana (picker de productos con variantes); null = fila base */
  variantId?: string | null;
}

type DropdownItem = SearchableDropdownItem & EntityOption;

interface EntitySearchSelectProps {
  /** búsqueda del servicio correspondiente (producto/cliente/proveedor) */
  search: (term: string) => Promise<EntityOption[]>;
  /** el segundo argumento llega completo para pickers que necesitan la variante */
  onPick: (id: string, option: EntityOption) => void;
  placeholderFallback?: string;
  /** mínimo de caracteres para fetchear (búsqueda plana de productos: 3) */
  minChars?: number;
  testId?: string;
}

/**
 * Selector de entidad de los drill-downs sin id en la URL: wrapper del
 * dropmenu compartido `SearchableDropdown` (debounce, navegación por teclado
 * con flechas/Enter/Escape y resaltado) con ítems de dos líneas en contexto:
 * nombre (· variante) + SKU o documento — sin datos operativos de venta
 * (precio/stock), que quedan fuera de contexto en analítica.
 */
function EntitySearchSelect({ search, onPick, placeholderFallback, minChars = 2, testId }: EntitySearchSelectProps) {
  const { t } = useI18n();
  const placeholder = t('bi.relational.pick.searchPlaceholder', placeholderFallback ?? 'Buscar...');

  const onSearch = async (term: string): Promise<DropdownItem[]> => {
    const results = await search(term);
    return results.map((opt) => ({ ...opt, name: opt.label }));
  };

  return (
    <div data-testid={testId ?? 'entity-search'} className="w-full max-w-md">
      <SearchableDropdown<DropdownItem>
        onSearch={onSearch}
        onSelect={(opt) => onPick(opt.id, opt)}
        minSearchLength={minChars}
        placeholder={placeholder}
        emptyMessage={t('bi.relational.pick.noResults', 'Sin resultados')}
        renderItem={(opt) => (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate text-sm font-bold text-foreground">{opt.label}</span>
            {opt.sub ? <span className="font-mono text-[11px] text-on-surface-deep">{opt.sub}</span> : null}
          </span>
        )}
      />
    </div>
  );
}

export default EntitySearchSelect;
