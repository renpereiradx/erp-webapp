/**
 * Tests FASE 5 (plan auditoría BI) del hook useSupplierAnalysis.
 * Contrato real (auditoría 2A): GET /payables/supplier/{id}/analysis (dto
 * plano) + GET /payables/supplier/{id} (detalle con payables[]). Mock en la
 * frontera: @/services/bi/payablesService.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSupplierAnalysis } from '../hooks/useSupplierAnalysis';
import { payablesService } from '@/services/bi/payablesService';

vi.mock('@/services/bi/payablesService', () => ({
  payablesService: {
    getSupplierAnalysis: vi.fn(),
    getSupplierPayables: vi.fn(),
  },
}));

const analysisDto = {
  supplier_id: 'SUP-1',
  supplier_name: 'BodyTech S.A.',
  payment_history: 'POOR',
  importance: 'CRITICAL',
  share_percentage: 42.5,
  total_pending: 3009450,
  total_overdue: 1200000,
  avg_days_to_pay: 18.4,
  credit_terms: 30,
  oldest_debt: '2026-01-15',
};

const detailDto = {
  supplier_id: 'SUP-1',
  supplier_name: 'BodyTech S.A.',
  // blob JSON crudo del BE (fix 3A): se resuelve a email/phone
  supplier_contact: '{"fax":"","email":"pagos@bodytech.com","phone":"+595981000001"}',
  payables: [
    { id: 'FAC-1', purchase_date: '2026-08-01', due_date: '2026-09-01', original_amount: 1000000, pending_amount: 1000000, status: 'OVERDUE' },
    { id: 'FAC-2', purchase_date: '2026-08-20', due_date: '2026-10-01', original_amount: 2000000, pending_amount: 500000, status: 'PARTIAL' },
    { id: 'FAC-3', purchase_date: '2026-09-01', due_date: '2026-10-15', original_amount: 1000000, pending_amount: 1000000, status: 'PENDING' },
    { id: 'FAC-4', purchase_date: '2026-07-01', due_date: '2026-08-01', original_amount: 800000, pending_amount: 0, status: 'PAID' },
  ],
};

describe('useSupplierAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(payablesService.getSupplierAnalysis).mockResolvedValue({
      success: true,
      data: analysisDto,
    });
    vi.mocked(payablesService.getSupplierPayables).mockResolvedValue({
      success: true,
      data: detailDto,
    });
  });

  it('mapea analysis + detalle al contrato del feature: importancia, contacto JSON y stats', async () => {
    const { result } = renderHook(() => useSupplierAnalysis('SUP-1'));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(payablesService.getSupplierAnalysis).toHaveBeenCalledWith('SUP-1');
    expect(payablesService.getSupplierPayables).toHaveBeenCalledWith('SUP-1');

    const s = result.current.supplier!;
    expect(s.id).toBe('SUP-1');
    expect(s.name).toBe('BodyTech S.A.');
    expect(s.contact).toBe('pagos@bodytech.com'); // email del blob JSON
    expect(s.importance).toBe('Crítica'); // IMPORTANCE_LABELS

    expect(s.stats).toEqual({
      totalPending: 3009450,
      totalOverdue: 1200000,
      avgPaymentDays: 18.4,
      activeInvoices: 4,
      overdueCount: 1,
      shareOfPayables: 42.5,
    });

    expect(result.current.tableStats).toEqual({ total: 4, overdue: 1 });
  });

  it('mapea estados de factura y describe el historial de pago real (enum → label)', async () => {
    const { result } = renderHook(() => useSupplierAnalysis('SUP-1'));
    await waitFor(() => expect(result.current.supplier).not.toBeNull());

    const s = result.current.supplier!;
    expect(s.rating.historyLabel).toBe('Pobre');
    expect(s.rating.color).toBe('rose');
    expect(s.rating.description).toContain('paga en promedio a 18 días');

    expect(s.invoices.map((i) => i.status)).toEqual([
      'Atrasado',
      'Parcialmente Pagado',
      'En Proceso',
      'Completado',
    ]);
    expect(s.invoices[0].isOverdue).toBe(true);
    expect(s.invoices[3].isOverdue).toBe(false);
  });

  it('sin datos en el dto cae honesto a defaults (sin score inventado)', async () => {
    vi.mocked(payablesService.getSupplierAnalysis).mockResolvedValue({
      success: true,
      data: {},
    });
    vi.mocked(payablesService.getSupplierPayables).mockResolvedValue({
      success: true,
      data: { payables: [] },
    });

    const { result } = renderHook(() => useSupplierAnalysis('SUP-9'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const s = result.current.supplier!;
    expect(s.name).toBe('Proveedor');
    expect(s.importance).toBeNull();
    expect(s.rating.historyLabel).toBe('Sin datos');
    expect(s.stats.avgPaymentDays).toBeNull();
    expect(s.terms.creditDays).toBeNull();
    expect(s.terms.oldestInvoice).toBe('N/A');
  });

  it('fallo de la API → error y sin proveedor', async () => {
    vi.mocked(payablesService.getSupplierAnalysis).mockRejectedValue(new Error('timeout'));
    const { result } = renderHook(() => useSupplierAnalysis('SUP-1'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('timeout');
    expect(result.current.supplier).toBeNull();
  });

  it('sin id no consulta nada', async () => {
    renderHook(() => useSupplierAnalysis(undefined));
    expect(payablesService.getSupplierAnalysis).not.toHaveBeenCalled();
    expect(payablesService.getSupplierPayables).not.toHaveBeenCalled();
  });
});
