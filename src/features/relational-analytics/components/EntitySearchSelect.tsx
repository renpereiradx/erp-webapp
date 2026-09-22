import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

export interface EntityOption {
  id: string;
  label: string;
  sub?: string;
}

interface EntitySearchSelectProps {
  /** búsqueda del servicio correspondiente (producto/cliente/proveedor) */
  search: (term: string) => Promise<EntityOption[]>;
  onPick: (id: string) => void;
  placeholderFallback?: string;
  testId?: string;
}

/**
 * Selector de entidad para los drill-downs sin id en la URL (entrada desde
 * el menú): búsqueda con debounce y lista local de resultados. Al elegir,
 * el padre navega (setSearchParams) y el page toma el id.
 */
function EntitySearchSelect({ search, onPick, placeholderFallback, testId }: EntitySearchSelectProps) {
  const { t } = useI18n();
  const [term, setTerm] = useState('');
  const [options, setOptions] = useState<EntityOption[]>([]);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
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
  }, [term, search]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

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
            <li key={opt.id}>
              <button
                type="button"
                role="option"
                aria-selected={false}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-surface-muted transition-colors"
                onClick={() => {
                  setOpen(false);
                  setTerm('');
                  onPick(opt.id);
                }}
              >
                <span className="text-sm font-bold text-foreground">{opt.label}</span>
                {opt.sub ? <span className="font-mono text-[10px] text-on-surface-deep">{opt.sub}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !searching && options.length === 0 && term.trim().length >= 2 && (
        <p className="absolute z-20 mt-1 w-full rounded-md border border-border-subtle bg-surface px-4 py-2.5 text-xs italic text-on-surface-deep shadow-sm">
          {t('bi.relational.pick.noResults', 'Sin resultados')}
        </p>
      )}
    </div>
  );
}

export default EntitySearchSelect;
