import { renderHook, act, waitFor } from '@testing-library/react';
import { useProductFilters } from '../hooks/useProductFilters';

describe('useProductFilters', () => {
  test('minChars gate and manual search handler', async () => {
  const onApiSearch = vi.fn(async () => {});
    const onClear = vi.fn();

    const { result } = renderHook(() =>
      useProductFilters({ products: [], onApiSearch, onClear, autoSearch: true, debounceMs: 350, minChars: 4 })
    );

    // Below threshold: should not trigger search
    await act(async () => {
      result.current.setApiSearchTerm('abc');
      await result.current.handleApiSearch();
    });
    expect(onApiSearch).not.toHaveBeenCalled();

    // At threshold: triggers
    await act(async () => {
      result.current.setApiSearchTerm('abcd');
    });
    await waitFor(() => {
      expect(result.current.apiSearchTerm).toBe('abcd');
    });
    await act(async () => {
      await result.current.handleApiSearch();
    });
    expect(onApiSearch).toHaveBeenCalledWith('abcd');

    // Escape clears
    const e = { key: 'Escape' };
    act(() => result.current.handleApiSearchKeyPress(e));
    expect(onClear).toHaveBeenCalled();

  });
});
