// src/__tests__/Clients.page.test.jsx
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ClientsPage from '../pages/Clients';

// Mock de dependencias
vi.mock('../store/useClientStore', () => ({
  default: vi.fn(),
}));

vi.mock('../lib/i18n', () => ({
  useI18n: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

// Mock del componente DataState para aislar la prueba
vi.mock('../components/ui/DataState', () => ({
    default: ({ variant, title }) => <div data-testid={`datastate-${variant}`}>{title}</div>
}));

describe('ClientsPage', () => {
  const useClientStore = require('../store/useClientStore').default;

  it('should render loading state correctly', () => {
    useClientStore.mockReturnValue({
      clients: [],
      loading: true,
      error: null,
      fetchClients: vi.fn(),
    });

    render(<ClientsPage />);
    expect(screen.getByTestId('datastate-loading')).toBeInTheDocument();
  });

  it('should render empty state when no data and not loading', () => {
    useClientStore.mockReturnValue({
      clients: [],
      loading: false,
      error: null,
      fetchClients: vi.fn(),
    });

    render(<ClientsPage />);
    expect(screen.getByTestId('datastate-empty')).toBeInTheDocument();
    expect(screen.getByText('Sin clientes')).toBeInTheDocument();
  });

  it('should render error state correctly', () => {
    useClientStore.mockReturnValue({
      clients: [],
      loading: false,
      error: 'Failed to fetch',
      fetchClients: vi.fn(),
    });

    render(<ClientsPage />);
    expect(screen.getByTestId('datastate-error')).toBeInTheDocument();
    expect(screen.getByText('Error al cargar clientes')).toBeInTheDocument();
  });

  it('should render the client list when data is available', () => {
    useClientStore.mockReturnValue({
      clients: [{ id: 1, name: 'Test Client', contact: { email: 'test@test.com' }, tax_id: '123' }],
      loading: false,
      error: null,
      fetchClients: vi.fn(),
    });

    render(<ClientsPage />);
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });
});
