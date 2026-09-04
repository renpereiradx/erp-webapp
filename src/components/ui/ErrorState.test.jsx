import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithTheme } from '@/utils/themeTestUtils';
import ErrorState from './ErrorState';
import { vi } from 'vitest';

describe('ErrorState', () => {
  test('renders message, code, hint and retry', () => {
    const onRetry = vi.fn();
    renderWithTheme(
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
    // El mensaje vive en un role="status" con aria-live.
    expect(screen.getByRole('status')).toHaveTextContent('Network unreachable');
    // Contrato con i18n real (vitest.setup): 'errors.code_label' → 'Código: {code}'.
    expect(screen.getByText('Código: NETWORK')).toBeInTheDocument();
    expect(screen.getByText('Check network')).toBeInTheDocument();
    expect(screen.getByTestId('error-retry')).toHaveAccessibleName(/reintentar/i);
    fireEvent.click(screen.getByTestId('error-retry'));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
