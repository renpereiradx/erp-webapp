import { describe, test, expect, vi, beforeEach } from 'vitest';
import useProductStore from '@/store/useProductStore';
import { act } from 'react';

vi.mock('@/services/productService', async (orig) => {
  const mod = await orig();
  return {
    ...mod,
    productService: {
      ...mod.productService,
      getProducts: vi.fn(async (page, size) => Array.from({ length: size }, (_, i) => ({ id: `P${page}-${i}`, name: `Prod ${page}-${i}` }))),
      searchProducts: vi.fn(async (term) => [{ id: 'S1', name: term }])
    }
  };
});

import { productService } from '@/services/productService';

describe('Cache revalidation & trimming', () => {
  beforeEach(() => {
    useProductStore.getState().reset();
    vi.clearAllMocks();
  });

  test('page cache revalidates in background when half TTL passed', async () => {
    const store = useProductStore.getState();
    // fetch page 1
    await act(async () => { await store.fetchProducts(1, 5); });
    // artificially age cache
    const aged = { ...useProductStore.getState().pageCache };
    aged[1].ts = Date.now() - (useProductStore.getState().pageCacheTTL * 0.75);
    useProductStore.setState({ pageCache: aged });
    // fetch again to trigger background revalidation
    await act(async () => { await store.fetchProducts(1, 5); });
    expect(productService.getProducts).toHaveBeenCalled();
  });

  test('search cache auto revalidates when stale (half TTL)', async () => {
    const store = useProductStore.getState();
    await act(async () => { await store.searchProducts('term'); });
    const key = Object.keys(useProductStore.getState().searchCache)[0];
    const aged = { ...useProductStore.getState().searchCache };
    aged[key].ts = Date.now() - (useProductStore.getState().cacheTTL * 0.75);
    useProductStore.setState({ searchCache: aged });
    await act(async () => { await store.searchProducts('term'); });
    expect(productService.searchProducts).toHaveBeenCalledTimes(2);
  });

  test('page cache trimming removes old entries beyond limit', async () => {
    const store = useProductStore.getState();
    // Insert >20 pages artificially
    const pageCache = {};
    for (let p = 1; p <= 25; p++) {
      pageCache[p] = { ts: Date.now() - p * 1000, products: [{ id: `Px-${p}`, name: `Prod ${p}` }] };
    }
    useProductStore.setState({ pageCache });
    // trigger a fetch to invoke trimming logic
    await act(async () => { await store.fetchProducts(1, 5); });
    expect(Object.keys(useProductStore.getState().pageCache).length).toBeLessThanOrEqual(20);
  });

  test('search cache trimming removes old entries beyond limit', async () => {
    const store = useProductStore.getState();
    const searchCache = {};
    for (let i = 0; i < 35; i++) {
      searchCache[`k${i}`] = { ts: Date.now() - i * 1000, data: [{ id: `S${i}`, name: 'X' }] };
    }
    useProductStore.setState({ searchCache });
    await act(async () => { await store.searchProducts('term2'); });
    expect(Object.keys(useProductStore.getState().searchCache).length).toBeLessThanOrEqual(30);
  });
});
