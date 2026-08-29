/**
 * Modal de búsqueda de producto para el feature Stock Movements.
 * Reutiliza el patrón del viejo InventoryAdjustmentManual (debounce + teclado) pero aislado
 * y tipado. Usa productService.search (catálogo v3.0+). Diseño: DESIGN.md (EnhancedModal).
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Package, Search } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import EnhancedModal from '@/components/ui/EnhancedModal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { productService } from '@/services/productService';
import { formatNumber } from '@/utils/currencyUtils';
import { toApiError } from '@/utils/ApiError';

/**
 * Forma mínima del producto del catálogo tal como la usa este feature.
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
    <EnhancedModal
      isOpen={open}
      onClose={onClose}
      title={t('stockMovements.search.title', 'Buscar Producto')}
      size="lg"
      footer={
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            {t('action.cancel', 'Cancelar')}
          </Button>
        </div>
      }
    >
      <div className="space-y-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            ref={inputRef}
            type="text"
            className="pl-10 h-12"
            placeholder={t('stockMovements.search.placeholder', 'Nombre, SKU o ID de producto...')}
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onKeyDown={handleKey}
          />
        </div>

        <div className="overflow-y-auto max-h-[45vh] custom-scrollbar" ref={listRef}>
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-body-sm-bold text-muted-foreground uppercase tracking-widest">
                {t('stockMovements.search.searching', 'Buscando...')}
              </p>
            </div>
          ) : filtered.length > 0 ? (
            <div className="grid grid-cols-1 gap-1">
              {filtered.map((product, index) => (
                <button
                  key={product.id}
                  id={`sm-option-${index}`}
                  type="button"
                  className={`p-4 flex gap-4 text-left cursor-pointer rounded-input transition-all ${
                    highlight === index ? 'bg-primary text-on-primary' : 'hover:bg-surface-muted'
                  }`}
                  onClick={() => onSelect(product)}
                  onMouseEnter={() => setHighlight(index)}
                >
                  <div className="size-12 bg-surface rounded-input flex items-center justify-center text-primary overflow-hidden shrink-0 border border-border-subtle">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-6 h-6" strokeWidth={1.5} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className={`text-data-mono font-data-mono font-bold uppercase ${highlight === index ? 'text-on-primary/80' : 'text-primary'}`}>
                        {product.id}
                      </p>
                      <p className={`text-body-sm-bold uppercase ${highlight === index ? 'text-on-primary/90' : 'text-muted-foreground'}`}>
                        {t('stockMovements.search.stock', 'Stock')}: {formatNumber(product.stock_quantity || 0)}
                      </p>
                    </div>
                    <h4 className="text-body-md-bold leading-tight truncate">{product.name}</h4>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Package className="mx-auto text-border mb-4" size={64} strokeWidth={1} />
              <p className="text-muted-foreground italic">
                {term.trim().length < 2
                  ? t('stockMovements.search.minChars', 'Escribe al menos 2 caracteres')
                  : t('stockMovements.search.noResults', 'No se encontraron productos')}
              </p>
            </div>
          )}
        </div>
      </div>
    </EnhancedModal>
  );
}
