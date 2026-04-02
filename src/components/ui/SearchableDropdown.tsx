import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from './input';

export interface SearchableDropdownItem {
  id: string;
  name: string;
  sku?: string;
  price?: number | string;
  stock?: number;
  [key: string]: unknown;
}

export interface SearchableDropdownProps<T extends SearchableDropdownItem> {
  onSelect: (item: T) => void;
  onSearch: (term: string) => Promise<T[]>;
  placeholder?: string;
  autoFocus?: boolean;
  inputRef?: React.RefObject<HTMLInputElement>;
  renderItem?: (item: T, index: number, isHighlighted: boolean) => React.ReactNode;
  disabled?: boolean;
  className?: string;
  searchInputClassName?: string;
  dropdownClassName?: string;
  minSearchLength?: number;
  debounceMs?: number;
  emptyMessage?: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export function SearchableDropdown<T extends SearchableDropdownItem>({
  onSelect,
  onSearch,
  placeholder = 'Buscar...',
  autoFocus = false,
  inputRef: externalInputRef,
  renderItem,
  disabled = false,
  className = '',
  searchInputClassName = '',
  dropdownClassName = '',
  minSearchLength = 3,
  debounceMs = 300,
  emptyMessage = 'No se encontraron resultados',
}: SearchableDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [items, setItems] = useState<T[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const internalInputRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef || internalInputRef;

  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    const controller = new AbortController();
    
    const performSearch = async () => {
      if (debouncedSearchTerm.length < minSearchLength) {
        setItems([]);
        return;
      }

      setIsSearching(true);
      try {
        const results = await onSearchRef.current(debouncedSearchTerm);
        if (!controller.signal.aborted) {
          setItems(results);
          setHighlightedIndex(results.length > 0 ? 0 : -1);
          setIsOpen(true);
        }
      } catch {
        if (!controller.signal.aborted) {
          setItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false);
        }
      }
    };

    performSearch();

    return () => {
      controller.abort();
    };
  }, [debouncedSearchTerm, minSearchLength]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || items.length === 0) {
        if (event.key === 'ArrowDown' && items.length > 0) {
          setIsOpen(true);
          setHighlightedIndex(0);
          event.preventDefault();
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setHighlightedIndex((prev) => (prev < items.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Enter':
          event.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < items.length) {
            onSelect(items[highlightedIndex]);
            setSearchTerm('');
            setIsOpen(false);
            setHighlightedIndex(-1);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setHighlightedIndex(-1);
          break;
      }
    },
    [isOpen, items, highlightedIndex, onSelect]
  );

  const defaultRenderItem = useCallback(
    (item: T, _index: number, _isHighlighted: boolean) => (
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-sm">{item.name}</p>
          {item.sku && <p className="text-xs text-slate-500">SKU: {item.sku}</p>}
        </div>
        {item.price !== undefined && (
          <div className="text-right">
            <p className="font-black text-primary">
              {typeof item.price === 'number'
                ? item.price.toLocaleString('es-PY', {
                    style: 'currency',
                    currency: 'PYG',
                    minimumFractionDigits: 0,
                  })
                : item.price}
            </p>
            {item.stock !== undefined && (
              <p
                className={cn(
                  'text-[10px] font-bold uppercase',
                  item.stock > 0 ? 'text-success' : 'text-error'
                )}
              >
                Stock: {item.stock}
              </p>
            )}
          </div>
        )}
      </div>
    ),
    []
  );

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Search
          className={cn(
            'absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400',
            isSearching && 'animate-spin'
          )}
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => items.length > 0 && setIsOpen(true)}
          disabled={disabled}
          className={cn('pl-10 pr-4 h-11', searchInputClassName)}
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 animate-spin" />
        )}
      </div>

      {isOpen && items.length > 0 && (
        <div
          className={cn(
            'absolute z-50 w-full mt-1 bg-white border border-border-subtle rounded-xl shadow-fluent-16 overflow-hidden',
            'max-h-80 overflow-y-auto',
            dropdownClassName
          )}
        >
          <div className="py-2">
            {items.map((item, index) => {
              const isHighlighted = index === highlightedIndex;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item);
                    setSearchTerm('');
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    isHighlighted
                      ? 'bg-primary/5 border-l-4 border-primary'
                      : 'hover:bg-slate-50 border-l-4 border-transparent'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    {renderItem
                      ? renderItem(item, index, isHighlighted)
                      : defaultRenderItem(item, index, isHighlighted)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isOpen && searchTerm.length >= minSearchLength && items.length === 0 && !isSearching && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-border-subtle rounded-xl shadow-fluent-16 p-4 text-center text-slate-500">
          <p className="text-sm">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}

export default SearchableDropdown;
