import React from 'react';
import { screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import ClientsPage from '../Clients';
import { renderWithTheme } from '@/utils/themeTestUtils';

// Mock de dependencias
// Mock store completo para evitar dependencias profundas (incluye fetchClients requerido en useEffect)
const mockStoreImpl = vi.fn();
vi.mock('../../store/useClientStore', () => ({
  default: () => mockStoreImpl(),
}));

vi.mock('../../lib/i18n', () => ({
  useI18n: () => ({
    t: (key, fallback) => fallback || key,
  }),
}));

// Mock del componente DataState para aislar la prueba
vi.mock('../../components/ui/DataState', () => ({
  default: ({ variant, title }) => <div data-testid={`datastate-${variant}`}>{title}</div>,
}));

describe('ClientsPage', () => {
  // Helper para configurar retorno del mock store
  const setStoreReturn = (value) => {
    mockStoreImpl.mockReturnValue({
      fetchClients: vi.fn(),
      createClient: vi.fn(),
      updateClient: vi.fn(),
      deleteClient: vi.fn(),
      clearError: vi.fn(),
      ...value,
    });
  };

  it('renderiza estado loading', () => {
  setStoreReturn({ clients: [], loading: true, error: null });

    renderWithTheme(<MemoryRouter><ClientsPage /></MemoryRouter>);
    expect(screen.getByTestId('datastate-loading')).toBeInTheDocument();
  });

  it('renderiza estado vacío', () => {
  setStoreReturn({ clients: [], loading: false, error: null });

    renderWithTheme(<MemoryRouter><ClientsPage /></MemoryRouter>);
    expect(screen.getByTestId('datastate-empty')).toBeInTheDocument();
  });

  it('renderiza estado error', () => {
  setStoreReturn({ clients: [], loading: false, error: 'Failed to fetch' });

    renderWithTheme(<MemoryRouter><ClientsPage /></MemoryRouter>);
    expect(screen.getByTestId('datastate-error')).toBeInTheDocument();
  });

  it('renderiza lista de clientes', () => {
  setStoreReturn({ clients: [{ id: 1, name: 'Test Client', contact: { email: 'test@test.com' }, tax_id: '123', metadata: {} }], loading: false, error: null });

    renderWithTheme(<MemoryRouter><ClientsPage /></MemoryRouter>);
    // La página (pre-rediseño) no tiene heading "Clientes": se asserts sobre
    // la fila renderizada. El rediseño maestro-detalle traerá sus propios
    // asserts cuando aterrice (ver conductor/PLAN_TEST_DESIGN_FRONTEND.md).
    expect(screen.getByText('Test Client')).toBeInTheDocument();
    expect(screen.getByText('test@test.com')).toBeInTheDocument();
  });
});
