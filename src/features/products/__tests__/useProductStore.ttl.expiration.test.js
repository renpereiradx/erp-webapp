import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import useProductStore from '@/store/useProductStore';
import { productService } from '@/services/productService';

// Helper to advance fake timers
function advance(ms) {
  vi.advanceTimersByTime(ms);
}

describe('TTL expiration behaviour', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useProductStore.getState().reset();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  test('pageCache entry expires after overridden TTL and triggers refetch', async () => {
    const store = useProductStore.getState();
    // set short TTL for test
    store.setTestingTTL(1000); // 1s

    const firstData = [ { id: 'X1', name: 'Prod X1' } ];
    const secondData = [ { id: 'X1', name: 'Prod X1 v2' } ];
    const spy = vi.spyOn(productService, 'getProducts')
      .mockResolvedValueOnce(firstData)
      .mockResolvedValueOnce(secondData);

    // initial fetch page 1
    await store.fetchProducts(1, 10, '');
    const s1 = useProductStore.getState();
    expect(s1.products[0]).toBeDefined();
    expect(s1.products[0].name).toBe('Prod X1');
    expect(spy).toHaveBeenCalledTimes(1);

    // within TTL: loadPage should use cache (no new fetch)
    await store.loadPage(1);
    expect(spy).toHaveBeenCalledTimes(1);

    // advance beyond TTL
    advance(1100);

    // loadPage again should refetch
    await store.loadPage(1);
    expect(spy).toHaveBeenCalledTimes(2);
    const s2 = useProductStore.getState();
    expect(s2.products[0].name).toBe('Prod X1 v2');
  });

  test('searchCache expires and triggers refetch', async () => {
    const store = useProductStore.getState();
    store.setTestingTTL(1000);

    const term = 'abc';
    const firstSearch = [ { id: 'S1', name: 'abc-one' } ];
    const secondSearch = [ { id: 'S1', name: 'abc-one' }, { id: 'S2', name: 'abc-two' } ];

    const spy = vi.spyOn(productService, 'searchProducts')
      .mockResolvedValueOnce(firstSearch)
      .mockResolvedValueOnce(secondSearch);

    await store.searchProducts(term);
    const s3 = useProductStore.getState();
    expect(s3.products.length).toBe(1);
    expect(spy).toHaveBeenCalledTimes(1);

    // within TTL - cache hit (need to call again to assert caching logic path)
    await store.searchProducts(term);
    expect(spy).toHaveBeenCalledTimes(1);

    advance(1100);

    // after TTL - should refetch
    await store.searchProducts(term, {});
    expect(spy).toHaveBeenCalledTimes(2);
    const s4 = useProductStore.getState();
    expect(s4.totalProducts).toBe(2);
  });
});
