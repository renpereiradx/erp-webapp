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
    expect(screen.getByText(/Hits/i)).toBeInTheDocument();
    // match label + value allowing whitespace/newlines
    expect(screen.getByText(/cache hits\s*:\s*5/i)).toBeInTheDocument();
    expect(screen.getByText(/cache misses\s*:\s*3/i)).toBeInTheDocument();
    expect(screen.getByText(/Failures/i)).toBeInTheDocument();
    expect(screen.getByText(/failures\s*:\s*2/i)).toBeInTheDocument();
  });
});
