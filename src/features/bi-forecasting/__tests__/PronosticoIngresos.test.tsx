/**
 * Tests FASE 5 (plan auditoría BI): PronosticoIngresos (feature bi-forecasting).
 * Contratos fijados: escenarios null → estado vacío honesto (F3J: fuera el
 * bug `recomendado: || true`); bandas lower/upper reales en la tabla mensual
 * (T20); paleta compilable (COLOR_DOT, ex `bg-${color}-500`); H7: "Exportar"
 * → "Actualizar".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PronosticoIngresos from '../components/PronosticoIngresos';
import { useBIForecasting } from '../hooks/useBIForecasting';

vi.mock('../hooks/useBIForecasting', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useBIForecasting: vi.fn(),
}));

vi.mock('../components/BIForecastingNav', () => ({ default: () => null }));

const mockUse = useBIForecasting as unknown as ReturnType<typeof vi.fn>;

const ingresosData = {
  periodo_rango: 'Sep - Dic 2026',
  escenarios: {
    pesimista: { nombre: 'Pesimista', valor: 1000000, probabilidad: 20, variacion: '+2%', descripcion: 'Escenario conservador' },
    base: { nombre: 'Base', valor: 1500000, probabilidad: 60, variacion: '+8%', descripcion: 'Escenario esperado', recomendado: true },
    optimista: { nombre: 'Optimista', valor: 2000000, probabilidad: 20, variacion: '+15%', descripcion: 'Mejor caso' },
  },
  proyeccion_mensual: [
    { mes: 'Sep 2026', base: 1500000, inf: 1275000, sup: 1725000, estado: 'Proyectado', destacado: true },
    { mes: 'Oct 2026', base: 1600000, inf: 1360000, sup: 1840000, estado: '-', destacado: false },
  ],
  categorias: [
    { nombre: 'Bebidas', valor: 900000, porcentaje: '60%', crecimiento: '+10%', color: 'primary' },
    { nombre: 'Snacks', valor: 600000, porcentaje: '40%', crecimiento: '+5%', color: 'indigo' },
  ],
  total: { valor: 1500000, porcentaje: '100%', crecimiento: '+8.2%' },
};

describe('PronosticoIngresos', () => {
  beforeEach(() => {
    mockUse.mockReset();
  });

  it('renderiza los 3 escenarios con badge Recomendado en la base', () => {
    mockUse.mockReturnValue({ data: ingresosData, loading: false, error: null, refetch: vi.fn() });

    render(<PronosticoIngresos />);

    expect(screen.getByText('Pesimista')).toBeInTheDocument();
    expect(screen.getByText('Base')).toBeInTheDocument();
    expect(screen.getByText('Optimista')).toBeInTheDocument();
    expect(screen.getByText('Recomendado')).toBeInTheDocument();
    expect(screen.getByText('Prob. 60%')).toBeInTheDocument();
  });

  it('tabla mensual con bandas T20 (límites inferior/superior) y total consolidado', () => {
    mockUse.mockReturnValue({ data: ingresosData, loading: false, error: null, refetch: vi.fn() });

    render(<PronosticoIngresos />);

    expect(screen.getByText('Límite Inferior (₲)')).toBeInTheDocument();
    expect(screen.getByText('Límite Superior (₲)')).toBeInTheDocument();
    // fila destacada con las 3 columnas del pronóstico base
    expect(screen.getAllByText(/Gs\. 1\.500\.000/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/1.275.000/)).toBeInTheDocument();
    expect(screen.getByText(/1.725.000/)).toBeInTheDocument();
    expect(screen.getByText('Total Consolidado')).toBeInTheDocument();
  });

  it('escenarios null → estado vacío honesto (sin tarjetas en cero)', () => {
    mockUse.mockReturnValue({
      data: { ...ingresosData, escenarios: null },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<PronosticoIngresos />);

    expect(screen.getByText('Sin escenarios proyectados por el servicio.')).toBeInTheDocument();
    expect(screen.queryByText('Pesimista')).not.toBeInTheDocument();
    // la proyección mensual y categorías siguen con datos reales
    expect(screen.getByText('Proyección Mensual')).toBeInTheDocument();
  });

  it('H7: el botón dice "Actualizar" (refetch honesto) en vez de "Exportar Informe"', async () => {
    const user = userEvent.setup();
    const refetch = vi.fn();
    mockUse.mockReturnValue({ data: ingresosData, loading: false, error: null, refetch });

    render(<PronosticoIngresos />);

    const refresh = screen.getByRole('button', { name: /Actualizar/ });
    expect(screen.queryByText('Exportar Informe')).not.toBeInTheDocument();

    await user.click(refresh);
    expect(refetch).toHaveBeenCalled();
  });

  it('loading y error con estados dedicados', () => {
    mockUse.mockReturnValue({ data: null, loading: true, error: null, refetch: vi.fn() });
    render(<PronosticoIngresos />);
    expect(screen.getByText('Cargando pronóstico de ingresos...')).toBeInTheDocument();

    mockUse.mockReturnValue({ data: null, loading: false, error: 'sin datos', refetch: vi.fn() });
    render(<PronosticoIngresos />);
    expect(screen.getByText('Error: sin datos')).toBeInTheDocument();
  });
});
