import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';

export interface EntityOption {
  id: string;
  label: string;
  /** identificador secundario de personas (documento/RUC); productos usan sku */
  sub?: string;
  /** fila plana de producto (granularity=variant): variante ya resuelta */
  variantId?: string | null;
  variantName?: string | null;
  sku?: string;
  price?: number;
  stock?: number;
  baseUnit?: string;
}

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
 * Selector de entidad para los drill-downs sin id en la URL (entrada desde
 * el menú): búsqueda con debounce y lista local de resultados con filas
 * informativas estilo POS (Nombre · Variante, SKU, stock coloreado, precio).
 * Al elegir, el padre navega (setSearchParams) y la página toma el id.
 */
function EntitySearchSelect({ search, onPick, placeholderFallback, minChars = 2, testId }: EntitySearchSelectProps) {
  const { t } = useI18n();
  const [term, setTerm] = useState('');
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < minChars) {
      setOptions([]);
      setOpen(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      search(trimmed)
        .then((results) => {
          if (cancelled) return;
          setOptions(results.slice(0, 8));
          setOpen(true);
        })
        .catch(() => {
          if (!cancelled) {
            setOptions([]);
            setOpen(false);
          }
        })
        .finally(() => {
          if (!cancelled) setSearching(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [term, search, minChars]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const isProductRow = (opt: EntityOption) => opt.price !== undefined || !!opt.sku;

  return (
    <div ref={boxRef} className="relative w-full max-w-md" data-testid={testId ?? 'entity-search'}>
      <div className="flex items-center gap-2 rounded-input border border-border-subtle bg-surface px-3 py-2 shadow-sm">
        <Search className="text-on-surface-deep" size={16} aria-hidden="true" />
        <input
          type="text"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          onFocus={() => options.length > 0 && setOpen(true)}
          placeholder={t('bi.relational.pick.searchPlaceholder', placeholderFallback ?? 'Buscar...')}
          className="w-full bg-transparent text-sm font-medium outline-none"
          aria-label={t('bi.relational.pick.searchPlaceholder', placeholderFallback ?? 'Buscar...')}
        />
        {searching ? <span className="text-[10px] font-black uppercase text-on-surface-deep">{t('bi.relational.pick.searching', 'Buscando...')}</span> : null}
      </div>
      {open && options.length > 0 && (
        <ul
          className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border-subtle bg-surface shadow-md animate-in fade-in duration-150"
          role="listbox"
          aria-label={t('bi.relational.pick.results', 'Resultados')}
        >
          {options.map((opt) => (
            <li key={opt.variantId ? `${opt.id}-${opt.variantId}` : opt.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-surface-muted transition-colors"
                onClick={() => {
                  setOpen(false);
                  setTerm('');
                  onPick(opt.id, opt);
                }}
              >
                <span className="min-w-0 flex flex-col gap-0.5">
                  <span className="truncate text-sm font-bold text-foreground">{opt.label}</span>
                  {isProductRow(opt) ? (
                    <span className="flex items-center gap-2 font-mono text-[11px] text-on-surface-deep">
                      {opt.sku ? <span>SKU: {opt.sku}</span> : null}
                      {opt.stock !== undefined ? (
                        <span className={opt.stock > 0 ? 'text-success' : 'text-error'}>
                          {t('products.search.stock_label', 'Stock: {stock} {unit}', { stock: opt.stock, unit: opt.baseUnit || 'unit' })}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </span>
                {opt.price !== undefined ? (
                  <span className="shrink-0 font-mono text-xs font-black text-primary">{formatPYG(opt.price)}</span>
                ) : opt.sub ? (
                  <span className="shrink-0 font-mono text-[10px] text-on-surface-deep">{opt.sub}</span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !searching && options.length === 0 && term.trim().length >= minChars && (
        <p className="absolute z-20 mt-1 w-full rounded-md border border-border-subtle bg-surface px-4 py-2.5 text-xs italic text-on-surface-deep shadow-sm">
          {t('bi.relational.pick.noResults', 'Sin resultados')}
        </p>
      )}
    </div>
  );
}

export default EntitySearchSelect;
