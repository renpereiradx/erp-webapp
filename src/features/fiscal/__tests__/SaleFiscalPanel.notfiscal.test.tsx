/**
 * Tests de la rama no-fiscal de SaleFiscalPanel (PLAN impresión checkout):
 * una venta sin documento fiscal ahora ofrece Imprimir ticket + Descargar
 * comprobante reutilizando las acciones del hook (el BE ya las soporta para
 * ventas no fiscales). Gates: documents:read y RECEIPT configurada.
 * El hook se mockea en frontera (el componente lo consume completo).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockUseSaleFiscalPanel = vi.hoisted(() => vi.fn());
vi.mock('@/features/fiscal/hooks/useSaleFiscalPanel', () => ({
  useSaleFiscalPanel: mockUseSaleFiscalPanel,
}));

vi.mock('@/features/fiscal/components/EmitNoteModal', () => ({ default: () => null }));
vi.mock('qrcode.react', () => ({ QRCodeSVG: () => <svg data-testid="qr" /> }));

import SaleFiscalPanel from '@/features/fiscal/components/SaleFiscalPanel';

const hookState = (over: Record<string, unknown> = {}) => ({
  status: null,
  isLoading: false,
  isNotFiscal: true,
  error: null,
  refetch: vi.fn(),
  retrying: false,
  downloading: false,
  emailing: false,
  reprinting: false,
  reprintCount: null,
  printConfigured: true,
  canUseDocuments: true,
  retryEmission: vi.fn(),
  downloadPdf: vi.fn().mockResolvedValue(undefined),
  emailComprobante: vi.fn(),
  reprintTicket: vi.fn().mockResolvedValue(undefined),
  ...over,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUseSaleFiscalPanel.mockReturnValue(hookState());
});

describe('SaleFiscalPanel — venta no fiscal', () => {
  it('ofrece Imprimir ticket y Descargar comprobante', async () => {
    const user = userEvent.setup();
    const state = mockUseSaleFiscalPanel();
    render(<SaleFiscalPanel saleId="SALE-1" />);

    expect(screen.getByTestId('notfiscal-print-ticket')).toBeInTheDocument();
    expect(screen.getByTestId('notfiscal-download-pdf')).toBeInTheDocument();

    await user.click(screen.getByTestId('notfiscal-print-ticket'));
    await user.click(screen.getByTestId('notfiscal-download-pdf'));
    expect(state.reprintTicket).toHaveBeenCalledTimes(1);
    expect(state.downloadPdf).toHaveBeenCalledTimes(1);
  });

  it('sin documents:read no ofrece acciones', () => {
    mockUseSaleFiscalPanel.mockReturnValue(hookState({ canUseDocuments: false }));
    render(<SaleFiscalPanel saleId="SALE-1" />);
    expect(screen.queryByTestId('notfiscal-print-ticket')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notfiscal-download-pdf')).not.toBeInTheDocument();
  });

  it('sin impresora RECEIPT: imprimir deshabilitado con hint', () => {
    mockUseSaleFiscalPanel.mockReturnValue(hookState({ printConfigured: false }));
    render(<SaleFiscalPanel saleId="SALE-1" />);
    expect(screen.getByTestId('notfiscal-print-ticket')).toBeDisabled();
    expect(screen.getByTestId('notfiscal-print-ticket')).toHaveAttribute(
      'title',
      expect.stringContaining('Sin impresora configurada'),
    );
  });
});
