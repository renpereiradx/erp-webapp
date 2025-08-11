import { describe, test, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProductFilters } from '@/features/products/hooks/useProductFilters';

describe('useProductFilters cancelación con AbortController', () => {
  test('autoSearch llama onApiSearch con signal y se aborta en cleanup', async () => {
  vi.useFakeTimers();
    const onApiSearch = vi.fn().mockImplementation((_term, { signal } = {}) => {
      return new Promise((resolve, reject) => {
        if (signal) {
          signal.addEventListener('abort', () => reject(Object.assign(new Error('Aborted'), { name: 'AbortError' })));
        }
        // No resolvemos nunca; el abort debe disparar el rechazo
      });
    });

    const onClear = vi.fn();

  const { result, unmount } = renderHook((props) =>
      useProductFilters({
        products: [],
        onApiSearch,
        onClear,
    autoSearch: true,
    debounceMs: 0,
        minChars: 1,
        ...props,
      })
    );

    // Escribir término para activar autoSearch
    await act(async () => {
      result.current.setApiSearchTerm('abc');
      vi.runAllTimers();
      await Promise.resolve();
    });

    expect(onApiSearch).toHaveBeenCalledTimes(1);
    const args = onApiSearch.mock.calls[0];
    expect(args[0]).toBe('abc');
    expect(args[1]).toBeTruthy();
    expect(args[1].signal).toBeInstanceOf(AbortSignal);

    // Desmontar debe abortar
    await act(async () => {
      unmount();
      vi.runAllTimers();
    });
    vi.useRealTimers();
  });
});
