import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorState from './ErrorState';
import { vi } from 'vitest';

describe('ErrorState', () => {
  test('renders message, code, hint and retry', () => {
    const onRetry = vi.fn();
    render(
      <ErrorState
        title="Load failed"
        message="Network unreachable"
        code="NETWORK"
        hint="Check network"
        onRetry={onRetry}
        data-testid="error-test"
      />
    );

    expect(screen.getByText('Load failed')).toBeInTheDocument();
    expect(screen.getByText('Network unreachable')).toBeInTheDocument();
    expect(screen.getByText(/Código|Error code|Código:/i) || screen.getByText(/Error code:/i)).toBeTruthy();
    const retry = screen.getByTestId('error-retry');
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
