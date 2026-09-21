/**
 * Tests deuda ≤10 filas + i18n (VERIFICACION_POST_CIERRE 2026-09-21):
 * SaludInventario (feature bi-forecasting). Mock en la frontera del módulo
 * consumido: el hook useBIForecasting (importOriginal conserva los
 * formatters). La paginación de productos es server-side (patrón
 * PronosticoDemanda): el FE solo consume la metadata del BE. H7: el botón
 * de export (sin endpoint) se rotula "Actualizar" y ya existe estado vacío
 * de tabla.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SaludInventario from '../components/SaludInventario';
import { useBIForecasting } from '../hooks/useBIForecasting';

vi.mock('../hooks/useBIForecasting', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useBIForecasting: vi.fn(),
}));

// BIForecastingNav enlaza rutas del módulo — stub para el test de componente
vi.mock('../components/BIForecastingNav', () => ({ default: () => null }));

const mockUse = useBIForecasting as unknown as ReturnType<typeof vi.fn>;

const inventoryData = {
  updated_text: 'Actualizado hace 5 min',
  kpis: {
    stock_total: { valor: 4200, variacion: -3.2, label: 'vs. periodo anterior' },
    cobertura: { valor: 71.3, variacion: 2.1, label: 'de eficiencia' },
    productos_riesgo: { valor: 7, label: 'Crítico: Quiebre inminente' },
  },
  notificaciones: 'Stock se agotara en 2 dias',
  productos: [
    { id: 'SKU-001', nombre: 'Cerveza Premium 1L', stock: 24, venta_promedio: 12, pronostico: 360, dias_restantes: 2, reorden: 96, riesgo: 'ALTO' },
    { id: 'SKU-002', nombre: 'Papas 300g', stock: 180, venta_promedio: 8, pronostico: 240, dias_restantes: 22, reorden: 64, riesgo: 'BAJO' },
  ],
  paginacion: { total: 34, mostrando: 2, page: 1, total_pages: 4 },
  ui_labels: { title: 'Salud del Inventario' },
};

describe('SaludInventario', () => {
  beforeEach(() => {
    mockUse.mockReset();
  });

  it('loading y error con estados dedicados', () => {
    mockUse.mockReturnValue({ data: null, loading: true, error: null, refetch: vi.fn() });
    render(<SaludInventario />);
    expect(screen.getByTestId('forecast-skeleton')).toBeInTheDocument();

    mockUse.mockReturnValue({ data: null, loading: false, error: 'timeout', refetch: vi.fn() });
    render(<SaludInventario />);
    expect(screen.getByText('No se pudo cargar el pronóstico')).toBeInTheDocument();
  });

  it('consume page/page_size del hook y renderiza KPIs y tabla con la página del BE', () => {
    const refetch = vi.fn();
    mockUse.mockImplementation((endpoint: string, params: { page?: number; page_size?: number }) => {
      expect(endpoint).toBe('inventario');
      expect(params).toEqual({ page: 1, page_size: 10 });
      return { data: inventoryData, loading: false, error: null, refetch };
    });
    render(<SaludInventario />);

    expect(screen.getByText('Salud del Inventario')).toBeInTheDocument();
    expect(screen.getByText('Cerveza Premium 1L')).toBeInTheDocument();
    expect(screen.getByText('ALTO')).toBeInTheDocument();
    expect(screen.getByText('7 Alertas Críticas')).toBeInTheDocument();
    // H7: el botón refresca con rótulo honesto (no "Exportar Reporte")
    expect(screen.queryByText('Exportar Reporte')).not.toBeInTheDocument();
    expect(screen.queryByText('Ver Detalles')).not.toBeInTheDocument();
    // metadata real del BE, no un total fabricado
    expect(screen.getByText('Mostrando 1 - 10 de 34 items de inventario')).toBeInTheDocument();
  });

  it('botón Actualizar dispara refetch; paginación navega con la metadata del BE', async () => {
    const refetch = vi.fn();
    mockUse.mockReturnValue({ data: inventoryData, loading: false, error: null, refetch });
    render(<SaludInventario />);

    await userEvent.click(screen.getByRole('button', { name: /Actualizar/ }));
    expect(refetch).toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    // el cambio de página pasa por los params del hook (page 2)
    expect(mockUse).toHaveBeenLastCalledWith('inventario', { page: 2, page_size: 10 });
  });

  it('sin productos → estado vacío de tabla', () => {
    mockUse.mockReturnValue({
      data: { ...inventoryData, productos: [], paginacion: { total: 0, mostrando: 0, page: 1, total_pages: 1 } },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<SaludInventario />);

    expect(screen.getByText('Sin productos con datos de inventario.')).toBeInTheDocument();
  });
});
