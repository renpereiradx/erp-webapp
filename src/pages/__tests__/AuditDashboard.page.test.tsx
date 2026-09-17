/**
 * Tests FASE 5 (plan auditoría BI): AuditDashboard.
 * Fuente real (F3C): GET /audit/dashboard (kpis + security_alerts +
 * actions_by_category + top_users) y GET /audit/trends (curva). Mock en la
 * frontera del servicio. KPIs mock nunca más (12.450/42/188/3.120 fuera).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AuditDashboard from '../AuditDashboard';

const mocks = vi.hoisted(() => ({
  getSummary: vi.fn(),
  getTrends: vi.fn(),
}));

vi.mock('@/services/bi/auditService', () => ({
  default: mocks,
  auditService: mocks,
}));

const mockService = mocks as unknown as {
  getSummary: ReturnType<typeof vi.fn>;
  getTrends: ReturnType<typeof vi.fn>;
};

const summaryEnvelope = {
  data: {
    kpis: { total_actions: 1234, success_rate: 96, unique_users: 12 },
    security_alerts: [
      { severity: 'HIGH', occurred_at: '2026-09-16T10:00:00Z', message: 'Login fallido repetido', user_id: 7, ip_address: '10.0.0.8' },
    ],
    actions_by_category: [
      { category: 'SALE', percentage: 60 },
      { category: 'AUTH', percentage: 40 },
    ],
    top_users: [
      { user_id: 7, username: 'admin', total_actions: 800, successful_actions: 760 },
    ],
  },
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <AuditDashboard />
    </MemoryRouter>,
  );

describe('AuditDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockService.getSummary.mockResolvedValue(summaryEnvelope);
    mockService.getTrends.mockResolvedValue({
      data: [
        { label: '01 sep', total_actions: 100, successful: 90, failed: 10 },
        { label: '02 sep', total_actions: 140, successful: 130, failed: 10 },
      ],
    });
  });

  it('monta KPIs reales del endpoint (envelope desenvuelto) con período month', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText('Dashboard de Auditoría')).toBeInTheDocument());
    expect(mockService.getSummary).toHaveBeenCalledWith('month');
    expect(screen.getByText('Total de Acciones')).toBeInTheDocument();
    // el total aparece en el KPI y en el centro del donut
    expect(screen.getAllByText('1.234')).toHaveLength(2);
    expect(screen.getByText('96%')).toBeInTheDocument();
    expect(screen.getByText('Óptimo')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument(); // usuarios únicos
    expect(screen.getAllByText('1')).toHaveLength(2); // alerta en KPI y en badge
    
  });

  it('curva con trends reales pinta labels, y sin trends muestra empty honesto', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('02 sep')).toBeInTheDocument()); // labels de la curva
    expect(screen.getByText('SALE')).toBeInTheDocument();
    expect(screen.getByText('AUTH')).toBeInTheDocument();

    cleanup();
    mockService.getTrends.mockResolvedValue({ data: [] });
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Sin actividad registrada en el período.')).toBeInTheDocument(),
    );
  });

  it('sin KPIs la tasa de éxito es n/d (no 100% inventado)', async () => {
    mockService.getSummary.mockResolvedValue({
      data: { kpis: null, security_alerts: [], actions_by_category: [], top_users: [] },
    });
    renderPage();

    await waitFor(() => expect(screen.getByText('n/d')).toBeInTheDocument());
    expect(screen.getByText('Sin datos de categorías en el período.')).toBeInTheDocument();
  });

  it('top usuarios con % de éxito calculado y link al detalle', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('admin')).toBeInTheDocument());

    const link = screen.getByRole('link', { name: 'admin' });
    expect(link).toHaveAttribute('href', '/auditoria/usuarios/7');
    expect(screen.getByText('95.0%')).toBeInTheDocument(); // 760/800
    expect(screen.getByText('Explorar historial completo')).toHaveAttribute('href', '/auditoria/logs');
  });

  it('fallo del summary → estado de error con Reintentar que re-consulta', async () => {
    const user = userEvent.setup();
    mockService.getSummary.mockRejectedValueOnce(new Error('down'));
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('No se pudo cargar el dashboard de auditoría.')).toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    await waitFor(() => expect(mockService.getSummary).toHaveBeenCalledTimes(2));
  });

  it('cambiar el período re-consulta con el período nuevo', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByText('Dashboard de Auditoría')).toBeInTheDocument());

    await user.click(screen.getByText('hoy'));
    await waitFor(() => expect(mockService.getSummary).toHaveBeenCalledWith('today'));
  });
});
