/**
 * Tests FASE 2 (plan alineación BI) del hook useProfitability.
 * Mock en la frontera del módulo consumido:
 * @/services/bi/profitabilityService (PLAN_TEST_DESIGN_FRONTEND §2).
 *
 * Fija: desenvelope del envelope {success, data}, respuesta sin envelope,
 * error traducido con success:false, guard anti-carrera (respuesta vieja
 * descartada) y refresh expuesto para onRetry.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProfitability } from '../hooks/useProfitability';
import profitabilityService from '@/services/bi/profitabilityService';

vi.mock('@/services/bi/profitabilityService', () => ({
  default: {
    getDashboard: vi.fn(),
    getProducts: vi.fn(),
    getCustomers: vi.fn(),
    getCategories: vi.fn(),
    getTrends: vi.fn(),
    getSellers: vi.fn(),
  },
}));

const mockedService = vi.mocked(profitabilityService, true);

describe('useProfitability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('desenvuelve el envelope {success, data} del BE', async () => {
    vi.mocked(mockedService.getDashboard).mockResolvedValue({
      success: true,
      data: { kpis: { total_revenue: 1000 } },
    });

    const { result } = renderHook(() => useProfitability('getDashboard', 'month'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ kpis: { total_revenue: 1000 } });
    expect(result.current.error).toBeNull();
    expect(mockedService.getDashboard).toHaveBeenCalledWith('month');
  });

  it('acepta respuestas sin envelope explícito (data = response)', async () => {
    vi.mocked(mockedService.getTrends).mockResolvedValue({ data_points: [{ label: 'Ene' }] });

    const { result } = renderHook(() => useProfitability('getTrends', { period: 'month' }));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ data_points: [{ label: 'Ene' }] });
  });

  it('con success:false expone el mensaje del BE como error', async () => {
    vi.mocked(mockedService.getProducts).mockResolvedValue({
      success: false,
      message: 'periodo inválido',
    });

    const { result } = renderHook(() =>
      useProfitability('getProducts', { period: 'month', page: 1, page_size: 10 }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('periodo inválido');
    expect(result.current.data).toBeNull();
  });

  it('rechaza en el catch del servicio y expone err.message', async () => {
    vi.mocked(mockedService.getCategories).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useProfitability('getCategories', 'month'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('network down');
  });

  it('guard anti-carrera: la respuesta tardía del params viejo se descarta', async () => {
    let resolveMonth!: (v: unknown) => void;
    vi.mocked(mockedService.getDashboard).mockImplementationOnce(
      () => new Promise((res) => { resolveMonth = res; }),
    );
    vi.mocked(mockedService.getDashboard).mockResolvedValueOnce({
      success: true,
      data: { kpis: { total_revenue: 2 } },
    });

    const { result, rerender } = renderHook(
      ({ period }) => useProfitability('getDashboard', period),
      { initialProps: { period: 'month' as string } },
    );

    await waitFor(() => expect(result.current.loading).toBe(true));
    // Cambia el período mientras la primera petición sigue en vuelo
    rerender({ period: 'year' });
    await waitFor(() => expect(result.current.data).toEqual({ kpis: { total_revenue: 2 } }));

    // La respuesta vieja (month) llega tarde: NO debe pisar el estado
    await act(async () => {
      resolveMonth({ success: true, data: { kpis: { total_revenue: 1 } } });
    });
    expect(result.current.data).toEqual({ kpis: { total_revenue: 2 } });
    expect(result.current.error).toBeNull();
  });

  it('refresh vuelve a pedir el mismo recurso', async () => {
    vi.mocked(mockedService.getSellers).mockResolvedValue({
      success: true,
      data: { sellers: [], contribution_share: [] },
    });

    const { result } = renderHook(() => useProfitability('getSellers', 'month'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.refresh();
    });
    await waitFor(() => expect(mockedService.getSellers).toHaveBeenCalledTimes(2));
  });
});
