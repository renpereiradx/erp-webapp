/**
 * Tests migración full (VERIFICACION_POST_CIERRE 2026-09-21 §5.1):
 * PronosticoVentas des-minificado y tipado. Mock en la frontera del hook
 * useBIForecasting (importOriginal conserva formatters). i18n: las
 * etiquetas salen de `bi.forecast.sales.*` — los `ui_labels` del BE ya no
 * participan. H7: "Exportar Reporte" (hacía refetch) no debe volver.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PronosticoVentas from '../components/PronosticoVentas';
import { useBIForecasting } from '../hooks/useBIForecasting';

vi.mock('../hooks/useBIForecasting', async (importOriginal) => ({
  ...(await importOriginal<object>()),
  useBIForecasting: vi.fn(),
}));

// BIForecastingNav enlaza rutas del módulo — stub para el test de componente
vi.mock('../components/BIForecastingNav', () => ({ default: () => null }));

const mockUse = useBIForecasting as unknown as ReturnType<typeof vi.fn>;

const ventasData = {
  periodo_proyectado: 'Oct - Dic 2026',
  model_info: {
    granularidad: 'MENSUAL',
    modelo: 'Holt-Winters',
    confianza_label: 'Intervalo de confianza 95%',
  },
  kpis: {
    crecimiento: { valor: 8.4, periodo_anterior: 5.1, label: 'Vs. periodo anterior' },
    confianza: { valor: 92 },
    mae: { valor: 1250000, porcentaje: 4.2, label: 'Promedio mensual de error' },
    r_cuadrado: { valor: 0.87, label: 'Bondad de ajuste del modelo' },
  },
  historial: [
    { periodo: 'Jul 2026', valor: 48000000, variacion: '+3.2%', positivo: true },
    { periodo: 'Ago 2026', valor: 45000000, variacion: '-6.3%', positivo: false },
  ],
  proyeccion: [
    { periodo: 'Oct 2026', valor: 52000000, destacado: true },
    { periodo: 'Nov 2026', valor: 54000000, destacado: false },
  ],
  estacionalidad: {
    picos: [{ mes: 'Dic', descripcion: 'fin de año' }],
    valles: [{ mes: 'Feb', descripcion: 'post festivo' }],
    factores: [
      { mes: 'Ene', factor: 0.9, tipo: 'bajo' },
      { mes: 'Dic', factor: 1.4, tipo: 'alto' },
    ],
  },
};

describe('PronosticoVentas', () => {
  beforeEach(() => {
    mockUse.mockReset();
  });

  it('estados dedicados de carga y error', () => {
    mockUse.mockReturnValue({ data: null, loading: true, error: null, refetch: vi.fn() });
    render(<PronosticoVentas />);
    expect(screen.getByTestId('forecast-skeleton')).toBeInTheDocument();

    mockUse.mockReturnValue({ data: null, loading: false, error: 'timeout', refetch: vi.fn() });
    render(<PronosticoVentas />);
    expect(screen.getByText('No se pudo cargar el pronóstico')).toBeInTheDocument();
  });

  it('renderiza KPIs, tablas y estacionalidad con etiquetas de i18n (no del BE)', () => {
    const refetch = vi.fn();
    mockUse.mockReturnValue({ data: ventasData, loading: false, error: null, refetch });
    render(<PronosticoVentas />);

    // título y modelo real del servicio
    expect(screen.getByText('Detalle de Pronóstico de Ventas')).toBeInTheDocument();
    expect(screen.getByText('Holt-Winters')).toBeInTheDocument();
    expect(screen.getByText('Tasa de Crecimiento')).toBeInTheDocument();
    // rótulos de tabla acompañan el largo real de los datos
    expect(screen.getByText('Historial Reciente · 2 meses')).toBeInTheDocument();
    expect(screen.getByText('Proyección · 2 meses')).toBeInTheDocument();
    expect(screen.getByText('Jul 2026')).toBeInTheDocument();
    expect(screen.getByText('Análisis de Estacionalidad')).toBeInTheDocument();
    // H7: sin "Exportar Reporte" (hacía refetch)
    expect(screen.queryByText('Exportar Reporte')).not.toBeInTheDocument();
  });

  it('botones Actualizar y Recalcular disparan refetch', async () => {
    const refetch = vi.fn();
    mockUse.mockReturnValue({ data: ventasData, loading: false, error: null, refetch });
    render(<PronosticoVentas />);

    await userEvent.click(screen.getByRole('button', { name: /Actualizar/ }));
    expect(refetch).toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: /Recalcular/ }));
    expect(refetch).toHaveBeenCalledTimes(2);
  });

  it('sin estacionalidad ni datos → estados vacíos honestos, no blanks', () => {
    mockUse.mockReturnValue({
      data: { ...ventasData, historial: [], proyeccion: [], estacionalidad: undefined },
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    render(<PronosticoVentas />);

    expect(screen.getByText('Sin historial disponible.')).toBeInTheDocument();
    expect(screen.getByText('Sin proyección disponible.')).toBeInTheDocument();
    expect(screen.getByText('Sin datos de estacionalidad.')).toBeInTheDocument();
  });
});
