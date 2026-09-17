/**
 * Tests FASE 5 (plan auditoría BI): KpiSection del feature cash-flow.
 * Componente puro — sin mocks salvo i18n (no lo usa; los montos van con
 * formatNumber/toLocaleString de utils). Asserts por texto de contrato.
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import KpiSection from '../components/KpiSection';

describe('KpiSection (cash-flow)', () => {
  it('muestra los 4 KPIs con montos y pesos en el flujo', () => {
    render(
      <KpiSection
        coverageRatio={1.5}
        netFlow={125000}
        totalInflows={750000}
        totalOutflows={250000}
      />,
    );

    expect(screen.getByText('Ratio de Cobertura')).toBeInTheDocument();
    // formatNumber usa Intl es-PY → separador decimal coma
    expect(screen.getByText('1,5')).toBeInTheDocument();
    expect(screen.getByText('Saludable')).toBeInTheDocument();

    expect(screen.getByText('Flujo Neto Proyectado')).toBeInTheDocument();
    expect(screen.getByText(/Gs\. 125\.000/)).toBeInTheDocument();

    expect(screen.getByText('Total Entradas')).toBeInTheDocument();
    expect(screen.getByText(/Gs\. 750\.000/)).toBeInTheDocument();
    expect(screen.getByText('Total Salidas')).toBeInTheDocument();
    expect(screen.getByText(/Gs\. 250\.000/)).toBeInTheDocument();

    // 750k / 1M = 75% entradas; 25% salidas
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('ratio < 1 se marca Riesgo y volumen total en cero deriva 0%', () => {
    render(
      <KpiSection coverageRatio={0.4} netFlow={-100000} totalInflows={0} totalOutflows={0} />,
    );

    expect(screen.getByText('Riesgo')).toBeInTheDocument();
    expect(screen.getAllByText('0%')).toHaveLength(2);
  });
});
