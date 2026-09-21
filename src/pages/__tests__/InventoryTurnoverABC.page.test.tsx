import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InventoryTurnoverABC } from '../InventoryAnalytics/InventoryTurnoverABC';

// Mock en la frontera del módulo consumido (servicio BI). El mock exporta
// named + default: el barrel del servicio expone ambos.
const mocks = vi.hoisted(() => ({
  getTurnover: vi.fn(),
  getABC: vi.fn(),
}));

vi.mock('@/services/bi/inventoryAnalyticsService', () => ({
  inventoryAnalyticsService: {
    getTurnover: mocks.getTurnover,
    getABC: mocks.getABC,
  },
  default: {
    getTurnover: mocks.getTurnover,
    getABC: mocks.getABC,
  },
}));

const turnoverPayload = {
  success: true,
  data: {
    overall: { turnover_rate: 0.85, days_of_inventory: 118 },
    by_category: [
      {
        category_id: 'cat-1',
        category_name: 'Bebidas',
        turnover_rate: 1.4,
        units_sold: 42,
        performance: 'GOOD',
      },
    ],
  },
};

const abcPayload = {
  success: true,
  data: {
    summary: { class_a_value_pct: 78.5, class_b_value_pct: 15.2, class_c_value_pct: 6.3 },
    class_a: [
      {
        product_id: 'p-1',
        product_name: 'Producto Alpha',
        sales_percentage: 31.4,
        stock_value: 1250000,
      },
    ],
  },
};

describe('<InventoryTurnoverABC />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getTurnover.mockResolvedValue(turnoverPayload);
    mocks.getABC.mockResolvedValue(abcPayload);
  });

  it('consulta turnover y ABC con el token de período del API, no la etiqueta', async () => {
    render(<InventoryTurnoverABC />);

    await waitFor(() => {
      expect(mocks.getTurnover).toHaveBeenCalledWith({ period: 'month' });
    });
    expect(mocks.getABC).toHaveBeenCalledWith({ period: 'month' });
  });

  it('renderiza las métricas de rotación y las categorías del turnover', async () => {
    render(<InventoryTurnoverABC />);

    expect(await screen.findByText('Tasa Promedio de Rotación')).toBeTruthy();
    expect(screen.getByText(/0,85/)).toBeTruthy();
    expect(screen.getByText(/118/)).toBeTruthy();
    expect(screen.getByText('Bebidas')).toBeTruthy();
  });

  it('renderiza el ABC del endpoint /abc (productos clase A y % de valor)', async () => {
    render(<InventoryTurnoverABC />);

    expect(await screen.findByText('Producto Alpha')).toBeTruthy();
    expect(screen.getByText(/31,4/)).toBeTruthy();
  });

  it('al cambiar el período refetcha con el token del API', async () => {
    const user = userEvent.setup();
    render(<InventoryTurnoverABC />);
    await screen.findByText('Tasa Promedio de Rotación');

    await user.click(screen.getByText('Semana'));

    await waitFor(() => {
      expect(mocks.getTurnover).toHaveBeenLastCalledWith({ period: 'week' });
    });
    expect(mocks.getABC).toHaveBeenLastCalledWith({ period: 'week' });
  });

  it('sin datos del API no fabrica badge de variación', async () => {
    render(<InventoryTurnoverABC />);
    await screen.findByText('Tasa Promedio de Rotación');

    // turnover_rate_change / days_of_inventory_change no existen en la
    // respuesta del backend: nunca debe aparecer un "+0%" ni "trending".
    expect(screen.queryByText(/\+0%/)).toBeNull();
  });
});
