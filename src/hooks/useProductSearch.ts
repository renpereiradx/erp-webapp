import { useCallback, useEffect, useRef, useState } from 'react';
import { productService } from '@/services/productService';
import { toApiError } from '@/utils/ApiError';

/**
 * Hook canónico de búsqueda de productos (convención DESIGN.md §13):
 * debounce + AbortController por término + guard de respuesta vieja.
 *
 * Cualquier superficie que busque productos con `searchAdvanced` debe usar
 * este hook en lugar de armar su propio setTimeout — antes de él, /ventas,
 * /compras y stock-movements tenían cada uno su propia receta sin abort y
 * una respuesta lenta de un prefijo podía pisar los resultados del término
 * completo (race condition con WiFi de cliente).
 */

/**
 * Fila plana devuelta por searchAdvanced (granularity=variant): cada fila es
 * una unidad vendible y la forma exacta depende del backend — las
 * superficies consumen los campos que necesitan (id, name, sku,
 * variant_id, stock_quantity, ...).
 */
export type ProductSearchRow = Record<string, unknown> & {
  id?: string | number;
  name?: string;
  sku?: string | null;
  state?: boolean;
};

interface UseProductSearchOptions {
  /** ms entre la última tecla y el request. Convención §13: 300. */
  debounceMs?: number;
  /** mínimo de caracteres para disparar el request. Convención §13: 2. */
  minSearchLength?: number;
  /** page_size del request. Convención §13: 20 en dropdowns. */
  pageSize?: number;
  granularity?: 'variant' | 'units' | 'product';
}

interface UseProductSearchReturn {
  /** Filas de la última búsqueda exitosa (filas inactivas ya filtradas). */
  results: ProductSearchRow[];
  isSearching: boolean;
  /** Agenda la búsqueda del término con debounce. Seguro en cada tecla. */
  search: (term: string) => void;
  /** Aborta lo pendiente y vacía resultados. */
  clear: () => void;
}

export function useProductSearch(options: UseProductSearchOptions = {}): UseProductSearchReturn {
  const { debounceMs = 300, minSearchLength = 2, pageSize = 20, granularity = 'variant' } = options;

  const [results, setResults] = useState<ProductSearchRow[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  // Guard de respuesta vieja además del abort — cinturón y tirantes: el abort
  // evita el request, el seq descarta la respuesta si igual llegó (p. ej. una
  // petición cuyo abort compitió con el write de la respuesta).
  const seqRef = useRef(0);

  const cancelPending = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    controllerRef.current?.abort();
    controllerRef.current = null;
  }, []);

  const clear = useCallback(() => {
    cancelPending();
    seqRef.current += 1; // invalida cualquier respuesta en vuelo
    setResults([]);
    setIsSearching(false);
  }, [cancelPending]);

  const search = useCallback(
    (term: string) => {
      const trimmed = term.trim();
      cancelPending();

      if (trimmed.length < minSearchLength) {
        seqRef.current += 1;
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      timerRef.current = setTimeout(async () => {
        const seq = ++seqRef.current;
        const controller = new AbortController();
        controllerRef.current = controller;
        try {
          const response = await productService.searchAdvanced(
            { search: trimmed, granularity, page: 1, page_size: pageSize },
            { signal: controller.signal },
          );
          const raw = (response as { products?: unknown })?.products;
          const rows = Array.isArray(raw) ? (raw as ProductSearchRow[]) : [];
          if (seq !== seqRef.current || controller.signal.aborted) return;
          setResults(rows.filter((p) => p.state !== false));
        } catch (err) {
          if (controller.signal.aborted || (err instanceof Error && err.name === 'AbortError')) return;
          console.error(toApiError(err, 'search_error'));
          if (seq === seqRef.current) setResults([]);
        } finally {
          if (seq === seqRef.current && !controller.signal.aborted) {
            setIsSearching(false);
          }
        }
      }, debounceMs);
    },
    [cancelPending, debounceMs, granularity, minSearchLength, pageSize],
  );

  // Abort de lo pendiente al desmontar (el closure captura las refs).
  useEffect(() => cancelPending, [cancelPending]);

  return { results, isSearching, search, clear };
}

export default useProductSearch;
