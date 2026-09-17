/**
 * Tests FASE 5 (plan auditoría BI): SupplierAnalysis (página contenedora).
 * Estados loading/error/not-found/success según el hook del feature (mock en
 * la frontera del módulo). Los componentes del feature tienen suite propia.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SupplierAnalysis from '../SupplierAnalysis';
import { useSupplierAnalysis } from '@/features/accounts-payable/hooks/useSupplierAnalysis';
import type { SupplierAnalysisData } from '@/features/accounts-payable/types';

vi.mock('@/features/accounts-payable/hooks/useSupplierAnalysis', () => ({
  useSupplierAnalysis: vi.fn(),
}));

const mockUse = useSupplierAnalysis as unknown as ReturnType<typeof vi.fn>;

const supplier: SupplierAnalysisData = {
  id: 'SUP-1',
  name: 'BodyTech S.A.',
  contact: 'pagos@bodytech.com',
  importance: 'Crítica',
  stats: {
    totalPending: 3009450,
    totalOverdue: 1200000,
    avgPaymentDays: 18,
    activeInvoices: 2,
    overdueCount: 1,
    shareOfPayables: 42.5,
  },
  rating: { historyLabel: 'Pobre', color: 'rose', avgDays: 18, description: 'Historial pobre' },
  terms: { creditDays: 30, oldestInvoice: '15 ene. 2026' },
  invoices: [
    {
      id: 'FAC-1',
      date: '01 ago. 2026',
      dueDate: '01 sept. 2026',
      originalAmount: 1000000,
      pendingAmount: 1000000,
      status: 'Atrasado',
      isOverdue: true,
    },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/payables/supplier/SUP-1']}>
      <Routes>
        <Route path="/payables/supplier/:id" element={<SupplierAnalysis />} />
      </Routes>
    </MemoryRouter>,
  );

describe('SupplierAnalysis (página)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUse.mockReturnValue({ loading: false, supplier, tableStats: { total: 1, overdue: 1 }, error: null });
  });

  it('renderiza el análisis completo del proveedor con el id de la ruta', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText('BodyTech S.A.')).toBeInTheDocument());
    expect(mockUse).toHaveBeenCalledWith('SUP-1');
    expect(screen.getByText('Crítica')).toBeInTheDocument();
    expect(screen.getByText('Obligaciones Activas')).toBeInTheDocument();
    expect(screen.getByText('FAC-1')).toBeInTheDocument();
  });

  it('loading → spinner; error → mensaje honesto', () => {
    mockUse.mockReturnValue({ loading: true, supplier: null, tableStats: { total: 0, overdue: 0 }, error: null });
    const { unmount } = renderPage();
    expect(screen.getByText('Cargando Análisis Inteligente...')).toBeInTheDocument();
    unmount();

    mockUse.mockReturnValue({ loading: false, supplier: null, tableStats: { total: 0, overdue: 0 }, error: 'timeout' });
    renderPage();
    expect(screen.getByText('No se pudo cargar el análisis del proveedor.')).toBeInTheDocument();
  });

  it('sin proveedor (id inexistente) → "Proveedor no encontrado."', () => {
    mockUse.mockReturnValue({ loading: false, supplier: null, tableStats: { total: 0, overdue: 0 }, error: null });
    renderPage();

    expect(screen.getByText('Proveedor no encontrado.')).toBeInTheDocument();
  });
});
