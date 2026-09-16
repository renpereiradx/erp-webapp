import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks en la frontera de los módulos consumidos por el store (nunca internals)
vi.mock('../../services/bi/dashboardService', () => ({
  dashboardService: {
    getSummary: vi.fn(),
    getAlerts: vi.fn(),
    getRecentActivity: vi.fn(),
    getTrends: vi.fn(),
  },
}));
vi.mock('../../services/bi/receivablesService', () => ({
  receivablesService: { getSummary: vi.fn() },
}));
vi.mock('../../services/bi/payablesService', () => ({
  payablesService: { getOverview: vi.fn() },
}));
vi.mock('../../services/bi/salesAnalyticsService', () => ({
  salesAnalyticsService: { getPerformance: vi.fn() },
}));
vi.mock('../../features/profitability/services/profitabilityService', () => ({
  default: { getTrends: vi.fn() },
}));

import { dashboardService } from '../../services/bi/dashboardService';
import { receivablesService } from '../../services/bi/receivablesService';
import { payablesService } from '../../services/bi/payablesService';
import { salesAnalyticsService } from '../../services/bi/salesAnalyticsService';
import profitabilityService from '../../features/profitability/services/profitabilityService';
import useDashboardStore from '../useDashboardStore';

function mockAllServicesOk(): void {
  vi.mocked(dashboardService.getSummary).mockResolvedValue({
    data: { sales: { total: 1, count: 1, average_ticket: 1, currency: 'PYG' } },
  } as never);
  vi.mocked(dashboardService.getAlerts).mockResolvedValue({ data: { alerts: [] } } as never);
  vi.mocked(dashboardService.getRecentActivity).mockResolvedValue({ data: { activities: [] } } as never);
  vi.mocked(dashboardService.getTrends).mockResolvedValue({ data: { series: [] } } as never);
  vi.mocked(receivablesService.getSummary).mockResolvedValue({ data: { collection_rate: 1 } } as never);
  vi.mocked(payablesService.getOverview).mockResolvedValue({ data: { payment_rate: 1 } } as never);
  vi.mocked(salesAnalyticsService.getPerformance).mockResolvedValue({ data: { comparison: {} } } as never);
  vi.mocked(profitabilityService.getTrends).mockResolvedValue({ data: { data_points: [] } } as never);
}

describe('useDashboardStore.fetchDashboardData — gate por permiso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAllServicesOk();
  });

  it('sin lista persistida pide los 8 endpoints (comportamiento previo)', async () => {
    await useDashboardStore.getState().fetchDashboardData('month');

    expect(dashboardService.getSummary).toHaveBeenCalledTimes(1);
    expect(receivablesService.getSummary).toHaveBeenCalledTimes(1);
    expect(payablesService.getOverview).toHaveBeenCalledTimes(1);
    expect(salesAnalyticsService.getPerformance).toHaveBeenCalledTimes(1);
    expect(profitabilityService.getTrends).toHaveBeenCalledTimes(1);
    expect(useDashboardStore.getState().error).toBeNull();
  });

  it('perfil vendor (sin analytics:read ni payables:read) no dispara los 403', async () => {
    localStorage.setItem('permissions', JSON.stringify(['dashboard:read', 'receivables:read']));

    await useDashboardStore.getState().fetchDashboardData('month');

    // Permitidos
    expect(dashboardService.getSummary).toHaveBeenCalledTimes(1);
    expect(dashboardService.getTrends).toHaveBeenCalledTimes(1);
    expect(receivablesService.getSummary).toHaveBeenCalledTimes(1);
    // Gateados: no se llama al backend
    expect(salesAnalyticsService.getPerformance).not.toHaveBeenCalled();
    expect(profitabilityService.getTrends).not.toHaveBeenCalled();
    expect(payablesService.getOverview).not.toHaveBeenCalled();

    const state = useDashboardStore.getState();
    expect(state.error).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.salesPerformance).toBeNull();
    expect(state.profitabilityTrends).toBeNull();
  });

  it('con analytics:read y payables:read pide los 8 endpoints', async () => {
    localStorage.setItem(
      'permissions',
      JSON.stringify(['dashboard:read', 'receivables:read', 'analytics:read', 'payables:read'])
    );

    await useDashboardStore.getState().fetchDashboardData('month');

    expect(salesAnalyticsService.getPerformance).toHaveBeenCalledTimes(1);
    expect(profitabilityService.getTrends).toHaveBeenCalledTimes(1);
    expect(payablesService.getOverview).toHaveBeenCalledTimes(1);
    expect(useDashboardStore.getState().salesPerformance).toEqual({ comparison: {} });
  });

  it('NA-DB-1: guarda el payload (.data), no el envelope {success, data}', async () => {
    await useDashboardStore.getState().fetchDashboardData('month');

    const state = useDashboardStore.getState();
    // El bug original: summary = {success, data:{sales...}} → Dashboard.jsx
    // leía summary?.sales?.total → undefined → Resumen Ejecutivo en Gs. 0.
    expect(state.summary).toEqual({ sales: { total: 1, count: 1, average_ticket: 1, currency: 'PYG' } });
    expect(state.payablesOverview).toEqual({ payment_rate: 1 });
    expect(state.receivablesOverview).toEqual({ collection_rate: 1 });
    expect(state.trends).toEqual({ series: [] });
    expect(state.profitabilityTrends).toEqual({ data_points: [] });
  });
});
