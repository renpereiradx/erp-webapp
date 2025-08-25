/**
 * Simple Sales Component Test - Wave 8 Testing
 * Test básico para validar infraestructura de testing de componentes
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Componente de test simple
const SimpleSalesComponent = () => {
  return (
    <div data-testid="simple-sales">
      <h1>Test de Sales Component</h1>
      <p>Componente de prueba para Wave 8</p>
    </div>
  );
};

describe('Wave 8 - Sales Component Testing Infrastructure', () => {
  it('should render a simple sales component', () => {
    render(<SimpleSalesComponent />);
    
    expect(screen.getByTestId('simple-sales')).toBeInTheDocument();
    expect(screen.getByText('Test de Sales Component')).toBeInTheDocument();
    expect(screen.getByText('Componente de prueba para Wave 8')).toBeInTheDocument();
  });

  it('should handle basic props', () => {
    const TestComponent = ({ title = 'Default Title' }) => (
      <div>
        <h2>{title}</h2>
      </div>
    );

    render(<TestComponent title="Custom Title" />);
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('should support mocking', () => {
    const mockFunction = vi.fn();
    mockFunction('test');
    
    expect(mockFunction).toHaveBeenCalledWith('test');
    expect(mockFunction).toHaveBeenCalledTimes(1);
  });
});
