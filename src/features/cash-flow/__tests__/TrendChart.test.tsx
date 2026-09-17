/**
 * Tests FASE 5 (plan auditoría BI): TrendChart del feature cash-flow.
 * Los dataKeys (ingresos/egresos/balance) están fijados por el test del hook
 * (contrato post-drift 2A); aquí se verifica la cáscara: título, leyendas y
 * montaje del contenedor del gráfico con datos (recharts en jsdom, sin mock).
 */
import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import TrendChart from '../components/TrendChart';
import type { CashFlowPoint } from '../types';

const data: CashFlowPoint[] = [
  { name: '17 sept.', ingresos: 600000, egresos: 200000, balance: 400000 },
  { name: '18 sept.', ingresos: 400000, egresos: 300000, balance: 500000 },
];

describe('TrendChart (cash-flow)', () => {
  it('renderiza título y leyendas de las 3 series', () => {
    render(<TrendChart data={data} />);

    expect(screen.getByText('Tendencia de Flujo de Caja')).toBeInTheDocument();
    expect(screen.getByText('Entradas')).toBeInTheDocument();
    expect(screen.getByText('Salidas')).toBeInTheDocument();
    expect(screen.getByText('Saldo Neto')).toBeInTheDocument();
  });

  it('monta el ResponsiveContainer tras el mount sin colgar con datos', async () => {
    const { container } = render(<TrendChart data={data} />);

    await waitFor(() => {
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
  });

  it('sin datos igual monta la cáscara (el gráfico vacío no revienta)', async () => {
    const { container } = render(<TrendChart data={[]} />);

    expect(screen.getByText('Tendencia de Flujo de Caja')).toBeInTheDocument();
    await waitFor(() => {
      expect(container.querySelector('.recharts-responsive-container')).toBeInTheDocument();
    });
  });
});
