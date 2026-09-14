import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import useProductStore from '@/store/useProductStore';
import { act } from 'react';

// Mock productService
vi.mock('@/services/productService', async (orig) => {
  const mod = await orig();
  return {
    ...mod,
    productService: {
      ...mod.productService,
      getProducts: vi.fn(),
      getProductsPaginated: vi.fn(),
      // Búsqueda plana (granularity=variant): fuente primaria del listado
      // paginado y de la búsqueda (PLAN_VARIANTES_PLANAS_AJUSTES F-C).
      searchAdvanced: vi.fn(),
      searchInfo: vi.fn(),
      searchProducts: vi.fn(),
      searchProductsInfo: vi.fn(),
      updateProduct: vi.fn(async (id, data) => ({ id, ...data })),
      validateProductData: () => {},
    }
  };
});

import { productService } from '@/services/productService';

const fail = () => Promise.reject(new Error('Network fail'));

describe('Circuit breaker & prefetch', () => {
  beforeEach(() => {
    useProductStore.getState().reset();
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  test('opens circuit after threshold of failures on fetchProducts', async () => {
    productService.searchAdvanced.mockImplementation(fail);
    const threshold = useProductStore.getState().circuit.threshold; // 4

    for (let i = 0; i < threshold; i++) {
      try { // each call should throw
        // need act to update state properly
        await act(async () => { await useProductStore.getState().fetchProductsPaginated(1, 10); });
      } catch {
        // expected error in circuit breaker test
      }
    }
    // Next call should short-circuit and NOT invoke service again
    const prevCalls = productService.searchAdvanced.mock.calls.length;
    let res;
    await act(async () => {
      res = await useProductStore.getState().fetchProductsPaginated(1, 10);
    });
    expect(productService.searchAdvanced.mock.calls.length).toBe(prevCalls); // no extra
    expect(res.circuitOpen).toBe(true);
    const circuit = useProductStore.getState().circuit;
    expect(circuit.failures).toBeGreaterThanOrEqual(threshold);
    expect(circuit.openUntil).toBeGreaterThan(Date.now());
  });

  test('circuit closes after cooldown time passes', async () => {
    vi.useFakeTimers();
    // Enable fast retries in store for deterministic test behavior with fake timers
    useProductStore.getState().setTestingFastRetries(true);
    productService.searchAdvanced.mockImplementation(fail);
    const { circuit: { threshold, cooldownMs } } = useProductStore.getState();
    for (let i = 0; i < threshold; i++) {
      try { await act(async () => { await useProductStore.getState().fetchProductsPaginated(1, 10); }); } catch {
        // expected error in cooldown test
      }
    }
    // Now advance time beyond cooldown
    vi.advanceTimersByTime(cooldownMs + 10);
    // Provide a success response
    productService.searchAdvanced.mockImplementation(async () => ({ products: [{ id: 'X1', name: 'Prod X1' }], total_count: 1 }));
    await act(async () => { await useProductStore.getState().fetchProductsPaginated(1, 10); });
    const circuit = useProductStore.getState().circuit;
    expect(circuit.failures).toBe(0);
    expect(useProductStore.getState().products.length).toBe(1);
  });

  test('search uses circuit breaker similarly', async () => {
    // Búsqueda plana (granularity=variant): la fuente primaria es
    // searchAdvanced; el breaker registra la falla cuando la plana Y el
    // fallback legacy fallan (fetchInfoWithFallback sólo degrada).
    productService.searchAdvanced.mockImplementation(fail);
    productService.searchInfo.mockImplementation(fail);
    const threshold = useProductStore.getState().circuit.threshold;
    for (let i = 0; i < threshold; i++) {
      await useProductStore.getState().searchProducts('abc');
    }
    const prev = productService.searchAdvanced.mock.calls.length;
    let res;
    await act(async () => {
      res = await useProductStore.getState().searchProducts('abc');
    });
    expect(productService.searchAdvanced.mock.calls.length).toBe(prev);
    expect(res.circuitOpen).toBe(true);
  });

  test('prefetchNextPage stores next page in cache', async () => {
    // Seed initial current page data (fetchProductsPaginated consumes the
    // flat search; prefetch itself still uses getProducts/getProductsPaginated)
    productService.searchAdvanced.mockImplementation(async (payload) => ({
      products: Array.from({ length: payload?.page_size ?? 5 }, (_, i) => ({ id: `P${payload?.page ?? 1}-${i}`, name: `Prod ${payload?.page ?? 1}-${i}` })),
      total_count: 100,
    }));
    productService.getProductsPaginated.mockImplementation(async (page, size) => Array.from({ length: size }, (_, i) => ({ id: `P${page}-${i}`, name: `Prod ${page}-${i}` })));
    // Also mock getProducts for prefetch call
    productService.getProducts.mockImplementation(async (page, size) => Array.from({ length: size }, (_, i) => ({ id: `P${page}-${i}`, name: `Prod ${page}-${i}` })));
    
    await act(async () => { await useProductStore.getState().fetchProductsPaginated(1, 5); });
    const state1 = useProductStore.getState();
    expect(state1.pageCache[1]).toBeTruthy();
    // set totalPages artificially
    useProductStore.setState({ totalPages: 3 });
    await act(async () => { await useProductStore.getState().prefetchNextPage(); });
    const state2 = useProductStore.getState();
    expect(state2.pageCache[2]).toBeTruthy();
  });
});
