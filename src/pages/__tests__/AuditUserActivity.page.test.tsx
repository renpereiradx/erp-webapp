/**
 * Tests migración full (VERIFICACION_POST_CIERRE 2026-09-21):
 * AuditUserActivity. Mock en la frontera del servicio
 * (auditService.getUserActivity); i18n real; useParams vía MemoryRouter +
 * Routes. Honestidad: los badges fabricados (+12%/+5%/-2%), "Tendencia
 * Positiva +15%", la IP hardcodeada y los botones muertos no deben volver.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import AuditUserActivity from '../AuditUserActivity';
import auditService from '@/services/bi/auditService';

vi.mock('@/services/bi/auditService', () => ({
  default: { getUserActivity: vi.fn() },
}));

const mockService = auditService as unknown as {
  getUserActivity: ReturnType<typeof vi.fn>;
};

const activityPayload = {
  username: 'vendedor1',
  user_id: 'u-123',
  summary: {
    total_actions: 240,
    avg_actions_per_day: 12,
    unique_categories: 5,
    successful_actions: 228,
  },
  actions_by_category: [
    { category: 'SALES', count: 150, percentage: 62.5 },
    { category: 'INVENTORY', count: 90, percentage: 37.5 },
  ],
  recent_actions: [
    {
      id: 1,
      action: 'CREATE',
      description: 'Venta registrada',
      entity_id: '42',
      timestamp: '2026-09-21T10:30:00Z',
      success: true,
      category: 'SALES',
      ip_address: '10.0.0.8',
    },
  ],
};

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/audit/users/u-123']}>
      <Routes>
        <Route path='/audit/users/:id' element={<AuditUserActivity />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => {
  vi.clearAllMocks();
  mockService.getUserActivity.mockResolvedValue(activityPayload);
});

describe('AuditUserActivity', () => {
  it('renderiza KPIs reales, distribución y timeline del servicio', async () => {
    renderPage();

    expect((await screen.findAllByText('vendedor1')).length).toBeGreaterThan(0);
    expect(screen.getByText('Acciones Totales')).toBeInTheDocument();
    expect(screen.getByText('240')).toBeInTheDocument();
    // tasa de éxito computada: 228/240 = 95.0%
    expect(screen.getByText('95.0%')).toBeInTheDocument();
    expect(screen.getByText('SALES')).toBeInTheDocument();
    expect(screen.getByText('Venta registrada : #42')).toBeInTheDocument();
    // IP real del registro, no una hardcodeada
    expect(screen.getByText(/10\.0\.0\.8/)).toBeInTheDocument();
  });

  it('no renderiza fabricaciones ni botones muertos', async () => {
    renderPage();

    await screen.findAllByText('vendedor1');
    expect(screen.queryByText('+12%')).not.toBeInTheDocument();
    expect(screen.queryByText('+5%')).not.toBeInTheDocument();
    expect(screen.queryByText('-2%')).not.toBeInTheDocument();
    expect(screen.queryByText(/Tendencia Positiva/i)).not.toBeInTheDocument();
    expect(screen.queryByText('Exportar Reporte')).not.toBeInTheDocument();
    expect(screen.queryByText('Editar Perfil')).not.toBeInTheDocument();
    expect(screen.queryByText('192.168.1.104')).not.toBeInTheDocument();
  });

  it('muestra estado de carga y luego estado de error con retry', async () => {
    mockService.getUserActivity.mockRejectedValueOnce(new Error('boom'));
    renderPage();

    await waitFor(() =>
      expect(screen.getByText('No se encontraron datos de actividad')).toBeInTheDocument(),
    );
  });
});
