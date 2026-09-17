/**
 * Tests FASE 5 (plan auditoría BI): PronosticoDemanda (feature bi-forecasting).
 * Mock en la frontera del módulo consumido: el hook useBIForecasting
 * (importOriginal conserva formatCurrency/formatNumber). La paginación de
 * productos es server-side (cierre ② auditoría BI): el FE solo consume la
 * metadata del BE. H7: el botón de export (sin endpoint) ahora se rotula
 * "Actualizar" y ya no existe "Ver todos los productos".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PronosticoDemanda from '../components/PronosticoDemanda';
import { useBIForecasting } from '../hooks/useBIForecasting';

vi.mock('../hooks/useBIForecasting', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useBIForecasting: vi.fn(),
}));

// BIForecastingNav enlaza rutas del módulo — stub para el test de componente
vi.mock('../components/BIForecastingNav', () => ({ default: () => null }));

const mockUse = useBIForecasting as unknown as ReturnType<typeof vi.fn>;

const demandaData = {
  periodo_proyectado: 'Oct - Dic 2026',
  kpis: {
    categoria_crecimiento: { nombre: 'Bebidas', variacion: 12.5, label: 'vs. periodo anterior' },
    producto_demanda: { nombre: 'Cerveza Premium 1L', unidades: 840, label: 'Proyección trimestral' },
  },
  categorias: [
    { nombre: 'Bebidas', historico: 1200, proyectado: 1350, crecimiento: '+12.5%', tendencia: 'up', confianza: 82 },
    { nombre: 'Snacks', historico: 500, proyectado: 480, crecimiento: '-4%', tendencia: 'down', confianza: 74 },
  ],
  productos_top: [
    { producto: 'Cerveza Premium 1L', categoria: 'Bebidas', unidades: 840, valor: 8400000, confianza: 'Alta' },
    { producto: 'Papas 300g', categoria: 'Snacks', unidades: 320, valor: 1920000, confianza: 'Media' },
  ],
  ui_labels: { title: 'Pronóstico de Demanda' },
  pagination: { total_pages: 2, total_items: 12 },
};

describe('PronosticoDemanda', () => {
  beforeEach(() => {
    mockUse.mockReset();
  });

  it('loading y error con estados dedicados', () => {
    mockUse.mockReturnValue({ data: null, loading: true, error: null, refetch: vi.fn() });
    render(<PronosticoDemanda />);
    expect(screen.getByText('Cargando pronóstico de demanda...')).toBeInTheDocument();

    mockUse.mockReturnValue({ data: null, loading: false, error: 'timeout', refetch: vi.fn() });
    render(<PronosticoDemanda />);
    expect(screen.getByText('Error: timeout')).toBeInTheDocument();
  });

  it('renderiza KPIs, tablas de categorías y productos con la página 1 del BE', () => {
    const refetch = vi.fn();
    mockUse.mockReturnValue({
      data: demandaData,
      loading: false,
      error: null,
      refetch,
    });

    render(<PronosticoDemanda />);

    // "Bebidas" aparece como KPI de categoría con mayor crecimiento y en la tabla
    expect(screen.getAllByText('Bebidas').length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText('+12.5%').length).toBeGreaterThanOrEqual(2); // KPI y fila de categoría
    expect(screen.getAllByText('Cerveza Premium 1L').length).toBeGreaterThanOrEqual(2); // KPI y top productos

    // footer de paginación server-side (metadata real del BE)
    expect(screen.getByText('Mostrando 1 - 10 de 12 productos')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled();
  });

  it('Siguiente avanza de página y el hook recibe page=2', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockUse.mockImplementation((_endpoint: string, params?: { page?: number }) => ({
      data: demandaData,
      loading: false,
      error: null,
      refetch,
      pageUsed: params?.page,
    }));

    render(<PronosticoDemanda />);
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));

    // al cambiar page el hook se re-invoca con page 2 (useMemo params)
    await waitFor(() =>
      expect(mockUse).toHaveBeenLastCalledWith('demanda', { page: 2, page_size: 10 }),
    );
  });

  it('H7: el botón dice "Actualizar" (refetch honesto) y no hay "Ver todos los productos"', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockUse.mockReturnValue({ data: demandaData, loading: false, error: null, refetch });

    render(<PronosticoDemanda />);

    const refresh = screen.getByRole('button', { name: /Actualizar/ });
    expect(refresh).toBeInTheDocument();
    expect(screen.queryByText('Exportar Análisis Completo')).not.toBeInTheDocument();
    expect(screen.queryByText('Ver todos los productos')).not.toBeInTheDocument();

    await user.click(refresh);
    expect(refetch).toHaveBeenCalled();
  });
});
