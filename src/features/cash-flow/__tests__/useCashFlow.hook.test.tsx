/**
 * Tests FASE 5 (plan auditoría BI) del hook useCashFlow.
 * Fuentes reales: GET /payables/cash-flow (proyección diaria) y
 * GET /payables/schedule (calendario). Mock en la frontera del módulo
 * consumido: @/services/bi/payablesService (PLAN_TEST_DESIGN_FRONTEND §2).
 *
 * Hallazgo que este suite fija: las fechas date-only del BE ('YYYY-MM-DD')
 * se parseaban como UTC y en TZ America/Asuncion se mostraban con un día de
 * retraso (formatDay) y el badge HOY jamás aparecía (isToday).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useCashFlow } from '../hooks/useCashFlow';
import { payablesService } from '@/services/bi/payablesService';

vi.mock('@/services/bi/payablesService', () => ({
  payablesService: {
    getCashFlowProjection: vi.fn(),
    getSchedule: vi.fn(),
  },
}));

const localDay = (offsetDays = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatDay = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('es-PY', { day: '2-digit', month: 'short' });

const projectionPayload = {
  expected_inflows: 1_000_000,
  expected_outflows: 500_000,
  net_cash_flow: 500_000,
  projection_days: [
    { date: localDay(1), inflows: 600000, outflows: 200000, cumulative_flow: 400000 },
    { date: localDay(2), inflows: '400000', outflows: '300000', cumulative_flow: '500000' },
  ],
};

const schedulePayload = {
  schedule: [
    {
      date: localDay(0),
      total_due: 300000,
      items: [
        { payable_id: 'PO-1', supplier_name: 'BodyTech', days_until_due: 0, priority: 'URGENT', amount: 300000 },
      ],
    },
    {
      date: localDay(3),
      total_due: 150000,
      items: [
        { payable_id: 'PO-2', supplier_name: 'acme corp', days_until_due: 3, priority: 'LOW', amount: 100000 },
        { payable_id: 'PO-3', supplier_name: null, days_until_due: -2, priority: 'HIGH', amount: 50000 },
        { payable_id: 'PO-4', supplier_name: 'sin fecha', days_until_due: null, priority: undefined, amount: undefined },
      ],
    },
  ],
};

describe('useCashFlow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(payablesService.getCashFlowProjection).mockResolvedValue({
      success: true,
      data: projectionPayload,
    });
    vi.mocked(payablesService.getSchedule).mockResolvedValue({
      success: true,
      data: schedulePayload,
    });
  });

  it('trae proyección + schedule en paralelo con el período default (30D) y mapea puntos del gráfico', async () => {
    const { result } = renderHook(() => useCashFlow());

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(payablesService.getCashFlowProjection).toHaveBeenCalledWith(30);
    expect(payablesService.getSchedule).toHaveBeenCalledWith(30);

    expect(result.current.filteredData).toEqual([
      { name: formatDay(localDay(1)), ingresos: 600000, egresos: 200000, balance: 400000 },
      { name: formatDay(localDay(2)), ingresos: 400000, egresos: 300000, balance: 500000 },
    ]);
  });

  it('deriva los KPIs de la proyección: ratio de cobertura con guard de división por cero', async () => {
    const { result } = renderHook(() => useCashFlow());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.stats).toEqual({
      coverageRatio: 2, // 1.000.000 / 500.000
      netFlow: 500000,
      totalInflows: 1000000,
      totalOutflows: 500000,
    });

    vi.mocked(payablesService.getCashFlowProjection).mockResolvedValue({
      success: true,
      data: { expected_inflows: 100, expected_outflows: 0, projection_days: [] },
    });

    await act(async () => {
      result.current.setPeriod('60D');
    });
    await waitFor(() => expect(result.current.stats.coverageRatio).toBe(0));
  });

  it('agrupa el calendario por día: HOY, descripciones de vencimiento y prioridad alta', async () => {
    const { result } = renderHook(() => useCashFlow());
    await waitFor(() => expect(result.current.pendingPayments).toHaveLength(2));

    const [today, later] = result.current.pendingPayments;

    expect(today.date).toBe(formatDay(localDay(0)));
    expect(today.isToday).toBe(true);
    expect(today.subtotal).toBe(300000);
    expect(today.items[0]).toMatchObject({
      id: 'PO-1',
      code: 'BO',
      name: 'BodyTech',
      description: 'Vence en 0 días',
      priority: 'PRIORIDAD ALTA',
      amount: 300000,
    });

    expect(later.isToday).toBe(false);
    expect(later.items[0].description).toBe('Vence en 3 días');
    expect(later.items[0].priority).toBe('PROGRAMADO');
    // proveedor sin nombre → code ?? y nombre por defecto; vencido → "Vencido hace N"
    expect(later.items[1]).toMatchObject({
      code: '??',
      name: 'Proveedor',
      description: 'Vencido hace 2 días',
      priority: 'PRIORIDAD ALTA',
    });
    // sin días ni monto → honesto en 0 / sin fecha
    expect(later.items[2]).toMatchObject({
      description: 'Fecha no disponible',
      category: 'MEDIA',
      amount: 0,
    });
  });

  it('cambiar el período re-consulta con los días nuevos', async () => {
    const { result } = renderHook(() => useCashFlow());
    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      result.current.setPeriod('90D');
    });

    await waitFor(() => expect(payablesService.getCashFlowProjection).toHaveBeenCalledWith(90));
    expect(payablesService.getSchedule).toHaveBeenCalledWith(90);
  });

  it('fallo de la API → estado de error con mensaje y loading en false', async () => {
    vi.mocked(payablesService.getCashFlowProjection).mockRejectedValue(new Error('boom'));
    const { result } = renderHook(() => useCashFlow());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('boom');
    expect(result.current.filteredData).toEqual([]);
    expect(result.current.pendingPayments).toEqual([]);
  });
});
