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

describe('MetricsPanel', () => {
  test('renders cache stats and circuit info', () => {
    render(<MetricsPanel />);
    // Label y valor viven en nodos separados (label : <span>valor</span>):
    // se aserta sobre la fila contenedora, no sobre un único nodo de texto.
    expect(screen.getByText(/hits/i)).toBeInTheDocument();
    expect(screen.getByText(/cache hits/i).parentElement).toHaveTextContent('5');
    expect(screen.getByText(/cache misses/i).parentElement).toHaveTextContent('3');
    expect(screen.getByText(/failures/i).parentElement).toHaveTextContent('2');
    expect(screen.getByText(/closed/i)).toBeInTheDocument();
  });
});
