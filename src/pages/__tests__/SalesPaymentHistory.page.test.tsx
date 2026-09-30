/**
 * Tests del fix de impresión de SalesPaymentHistory (PLAN impresión checkout):
 * "Imprimir" arma el reporte y lo manda por printHtml (iframe aislado) —
 * NUNCA window.print() (imprimiría la SPA entera). El body del reporte debe
 * traer venta, totales y saldo.
 * Servicios mockeados en frontera; RegisterSalePaymentModal stubbeado
 * (importOriginal no aplica: el modal real arrastra formularios completos).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mockGetPaymentStatus = vi.hoisted(() => vi.fn());
const mockProcessPayment = vi.hoisted(() => vi.fn());
vi.mock('@/services/salePaymentService', () => ({
  salePaymentService: {
    getSalePaymentStatus: mockGetPaymentStatus,
    processSalePaymentWithCashRegister: mockProcessPayment,
  },
}));

const mockGetSalesByClient = vi.hoisted(() => vi.fn());
vi.mock('@/services/saleService', () => ({
  saleService: { getSalesByClient: mockGetSalesByClient },
}));

const mockGetClient = vi.hoisted(() => vi.fn());
vi.mock('@/services/clientService', () => ({
  clientService: { getById: mockGetClient },
}));

const mockPrintHtml = vi.hoisted(() => vi.fn());
vi.mock('@/lib/printHtml', () => ({ printHtml: mockPrintHtml }));

vi.mock('@/components/sales/RegisterSalePaymentModal', () => ({
  default: () => null,
}));

import SalesPaymentHistory from '@/pages/SalesPaymentHistory';

const renderPage = (saleId = '9') =>
  render(
    <MemoryRouter initialEntries={[`/cobros-ventas/${saleId}`]}>
      <Routes>
        <Route path="/cobros-ventas/:saleId" element={<SalesPaymentHistory />} />
      </Routes>
    </MemoryRouter>,
  );

const partialStatus = {
  sale_id: '9',
  total_amount: 100000,
  total_paid: 40000,
  balance_due: 60000,
  payment_progress: 40,
  is_fully_paid: false,
  payment_status: 'PARTIAL',
  client_id: 'C-1',
  client_name: 'Juana Pérez',
  status: 'PARTIAL',
  payments: [
    {
      payment_id: 'p1',
      amount_received: 40000,
      change_amount: 0,
      payment_method_code: 'CASH',
      payment_reference: 'REF-1',
      payment_notes: 'adelanto',
      processed_by_name: 'caja1',
      payment_date: '2026-09-30T10:00:00Z',
      status: 'COMPLETED',
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetPaymentStatus.mockResolvedValue(partialStatus);
  mockGetSalesByClient.mockResolvedValue({ data: [] });
  mockGetClient.mockResolvedValue(null);
});

describe('SalesPaymentHistory — impresión del reporte', () => {
  it('renderiza el resumen de la venta', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Historial de Cobros')).toBeInTheDocument());
    expect(screen.getByText(/Venta #9/)).toBeInTheDocument();
  });

  it('"Imprimir" manda SOLO el reporte por printHtml (sin window.print)', async () => {
    const user = userEvent.setup();
    const printSpy = vi.spyOn(window, 'print').mockImplementation(() => {});
    renderPage();
    await waitFor(() => expect(screen.getByText('Historial de Cobros')).toBeInTheDocument());

    await user.click(screen.getByRole('button', { name: /imprimir/i }));

    expect(mockPrintHtml).toHaveBeenCalledTimes(1);
    const { title, body } = mockPrintHtml.mock.calls[0][0];
    expect(title).toContain('9');
    expect(body).toContain('Historial de Cobros');
    expect(body).toContain('Juana Pérez');
    // Saldo pendiente visible en el reporte (cobro parcial).
    expect(body).toContain('60.000');
    // El cobro registrado aparece en la tabla.
    expect(body).toContain('REF-1');
    expect(body).toContain('caja1');
    // window.print() jamás: imprimiría la app entera.
    expect(printSpy).not.toHaveBeenCalled();
    printSpy.mockRestore();
  });
});
