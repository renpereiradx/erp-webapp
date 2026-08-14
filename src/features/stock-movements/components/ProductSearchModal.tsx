/**
 * Modal de búsqueda de producto para el feature Stock Movements.
 * Reutiliza el patrón del viejo InventoryAdjustmentManual (debounce + teclado) pero aislado
 * y tipado. Usa productService.search (catálogo v3.0+).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Package, Search, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { productService } from '@/services/productService';
import { formatNumber } from '@/utils/currencyUtils';
import { toApiError } from '@/utils/ApiError';

/**
 * Forma mínima del producto del catálogo tal como la usa este feature.
 * Se define a mano (en vez de derivar de ProductEnriched) porque la respuesta real incluye
 * campos como `image_url` que no están declarados en el tipo ProductEnriched pero sí existen
 * en runtime (los usa ProductsTable).
 */
export interface CatalogProduct {
  id: string;
  name: string;
  image_url?: string | null;
  base_unit?: string;
  stock_quantity?: number | null;
  state?: boolean;
  is_active?: boolean;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (product: CatalogProduct) => void;
}

export function ProductSearchModal({ open, onClose, onSelect }: Props) {
  const { t } = useI18n();
  const [term, setTerm] = useState('');
  const [results, setResults] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Búsqueda con debounce
  useEffect(() => {
    if (!open) return;
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const id = setTimeout(async () => {
      try {
        const raw = await productService.search(trimmed);
        const arr = ((Array.isArray(raw) ? raw : [raw]) as CatalogProduct[]).filter(
          (p) => p.state !== false && p.is_active !== false,
        );
        if (!cancelled) setResults(arr);
      } catch (e) {
        if (!cancelled) {
          console.error(toApiError(e, 'search_error'));
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [term, open]);

  // Reset al abrir/cerrar
  useEffect(() => {
    if (open) {
      setTerm('');
      setResults([]);
      setHighlight(-1);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Scroll al item resaltado
  useEffect(() => {
    if (highlight >= 0 && listRef.current) {
      const el = listRef.current.querySelector(`#sm-option-${highlight}`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [highlight]);

  const filtered = useMemo(() => results, [results]);

  if (!open) return null;

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const n = filtered.length;
    if (n === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((p) => (p < n - 1 ? p + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((p) => (p > 0 ? p - 1 : n - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = highlight >= 0 && highlight < n ? filtered[highlight] : filtered[0];
      if (target) onSelect(target);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className='fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200'>
      <div className='bg-white w-full max-w-2xl rounded-xl shadow-fluent-16 overflow-hidden flex flex-col max-h-[80vh] scale-100 animate-in zoom-in-95 duration-200'>
        <header className='p-6 border-b border-border-subtle flex items-center justify-between bg-white sticky top-0 z-10'>
          <div>
            <h2 className='text-xl font-black text-text-main tracking-tighter uppercase'>
              {t('stockMovements.search.title', 'Buscar Producto')}
            </h2>
            <p className='text-xs text-text-secondary font-medium uppercase tracking-widest'>
              {t('stockMovements.search.hint', 'Ctrl+A para abrir rápido')}
            </p>
          </div>
          <button onClick={onClose} className='p-2 hover:bg-slate-100 rounded-full transition-colors'>
            <X size={24} className='text-text-secondary' />
          </button>
        </header>

        <div className='p-6 bg-slate-50 border-b border-border-subtle'>
          <div className='relative'>
            <Search className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400' size={20} />
            <input
              ref={inputRef}
              type='text'
              className='w-full pl-12 pr-4 h-14 border border-border-subtle rounded-xl text-lg bg-white focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all'
              placeholder={t('stockMovements.search.placeholder', 'Nombre, SKU o ID de producto...')}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              onKeyDown={handleKey}
            />
          </div>
        </div>

        <div className='flex-1 overflow-auto p-2 custom-scrollbar' ref={listRef}>
          {loading ? (
            <div className='py-12 flex flex-col items-center gap-3'>
              <div className='size-8 border-4 border-primary border-t-transparent rounded-full animate-spin' />
              <p className='text-xs font-bold text-slate-400 uppercase tracking-widest'>
                {t('stockMovements.search.searching', 'Buscando...')}
              </p>
            </div>
          ) : filtered.length > 0 ? (
            <div className='grid grid-cols-1 gap-1'>
              {filtered.map((product, index) => (
                <div
                  key={product.id}
                  id={`sm-option-${index}`}
                  className={`p-4 flex gap-4 cursor-pointer rounded-lg transition-all ${
                    highlight === index ? 'bg-primary text-white' : 'hover:bg-slate-50'
                  }`}
                  onClick={() => onSelect(product)}
                  onMouseEnter={() => setHighlight(index)}
                >
                  <div className='size-12 bg-white rounded-lg flex items-center justify-center text-primary overflow-hidden flex-shrink-0 border border-border-subtle'>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className='w-full h-full object-cover' />
                    ) : (
                      <Package size={24} strokeWidth={1.5} />
                    )}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex justify-between items-start'>
                      <p
                        className={`text-[10px] font-data-mono font-bold uppercase ${
                          highlight === index ? 'text-white/80' : 'text-primary'
                        }`}
                      >
                        {product.id}
                      </p>
                      <p
                        className={`text-[10px] font-black uppercase ${
                          highlight === index ? 'text-white/90' : 'text-slate-400'
                        }`}
                      >
                        {t('stockMovements.search.stock', 'Stock')}: {formatNumber(product.stock_quantity || 0)}
                      </p>
                    </div>
                    <h4 className='font-bold leading-tight truncate'>{product.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='py-20 text-center'>
              <Package className='mx-auto text-slate-200 mb-4' size={64} strokeWidth={1} />
              <p className='text-slate-400 font-medium italic'>
                {term.trim().length < 2
                  ? t('stockMovements.search.minChars', 'Escribe al menos 2 caracteres')
                  : t('stockMovements.search.noResults', 'No se encontraron productos')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
