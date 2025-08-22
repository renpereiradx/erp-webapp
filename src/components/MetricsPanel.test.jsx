import React from 'react';
import { render, screen } from '@testing-library/react';
import MetricsPanel from './MetricsPanel';
import { vi } from 'vitest';

vi.mock('@/store/useProductStore', () => {
  return {
    default: (selector) => {
      const state = {
        selectors: {
          selectCacheStats: () => ({ hits: 5, misses: 3, ratio: 5 / 8 }),
        },
        circuit: { failures: 2, openUntil: 0 },
        circuitOpen: false,
      };
      return selector(state);
    }
  };
});

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (k) => {
      const map = {
        'metrics.panel.title': 'Métricas',
        'metrics.cache.label': 'label',
        'metrics.cache_hits': 'Hits',
        'metrics.cache_misses': 'Misses',
        'metrics.cache_ratio': 'Ratio hits',
        'metrics.circuit.label': 'Circuito',
        'metrics.circuit.failures': 'Fallos',
        'metrics.circuit.open': 'Abierto',
        'metrics.circuit.closed': 'Cerrado'
      };
      return map[k];
    }
  })
}));

describe('MetricsPanel', () => {
  test('renderiza métricas básicas sin colisiones de selectores', () => {
    render(<MetricsPanel />);
    expect(screen.getByTestId('metrics-hits').textContent).toMatch(/5/);
    expect(screen.getByTestId('metrics-misses').textContent).toMatch(/3/);
    expect(screen.getByTestId('metrics-ratio').textContent).toMatch(/63/);
    expect(screen.getByTestId('metrics-failures').textContent).toMatch(/2/);
  });
});
