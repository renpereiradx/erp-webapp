import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import InventoryPage from '../pages/Inventory';

// Mock del store de inventarios
vi.mock('../store/useInventoryStore', () => ({
  default: () => ({
    inventories: [],
    loading: false,
    error: null,
    fetchInventories: vi.fn(),
    createInventory: vi.fn(),
    invalidateInventory: vi.fn(),
    fetchInventoryDetails: vi.fn(),
    validateStockConsistency: vi.fn(),
    clearError: vi.fn()
  })
}));

// Mock del sistema i18n
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key, fallback) => fallback || key
  })
}));

// Mock del sistema de temas
vi.mock('@/hooks/useThemeStyles', () => ({
  useThemeStyles: () => ({
    styles: {
      header: (level) => `header-${level}`,
      card: (classes = '') => `card-class ${classes}`,
      button: (variant) => `button-${variant}`,
      input: () => 'input-class',
      container: (classes = '') => `container-class ${classes}`,
      label: () => 'label-class'
    }
  })
}));

// Componente wrapper para pruebas
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('InventoryPage', () => {
  it('should render empty state when no inventories', () => {
    render(
      <TestWrapper>
        <InventoryPage />
      </TestWrapper>
    );
    
    expect(screen.getByText('Sin inventarios')).toBeInTheDocument();
    expect(screen.getByText('No hay inventarios registrados')).toBeInTheDocument();
    expect(screen.getByText('Crear Inventario')).toBeInTheDocument();
  });

  it('should render loading state', () => {
    vi.doMock('../store/useInventoryStore', () => ({
      default: () => ({
        inventories: [],
        loading: true,
        error: null,
        fetchInventories: vi.fn(),
        createInventory: vi.fn(),
        invalidateInventory: vi.fn(),
        fetchInventoryDetails: vi.fn(),
        validateStockConsistency: vi.fn(),
        clearError: vi.fn()
      })
    }));

    render(
      <TestWrapper>
        <InventoryPage />
      </TestWrapper>
    );

    // DataState component should show loading state
    // Note: The actual content depends on DataState implementation
    expect(screen.queryByText('Sin inventarios')).not.toBeInTheDocument();
  });

  it('should render error state', () => {
    vi.doMock('../store/useInventoryStore', () => ({
      default: () => ({
        inventories: [],
        loading: false,
        error: 'Error de conexión',
        fetchInventories: vi.fn(),
        createInventory: vi.fn(),
        invalidateInventory: vi.fn(),
        fetchInventoryDetails: vi.fn(),
        validateStockConsistency: vi.fn(),
        clearError: vi.fn()
      })
    }));

    render(
      <TestWrapper>
        <InventoryPage />
      </TestWrapper>
    );

    // DataState component should show error state
    expect(screen.queryByText('Sin inventarios')).not.toBeInTheDocument();
  });

  it('should render inventory list when data is available', () => {
    const mockInventories = [
      {
        id: 1,
        user_id: 'test-user-1',
        check_date: '2025-09-06T10:00:00Z',
        state: true
      },
      {
        id: 2,
        user_id: 'test-user-2',
        check_date: '2025-09-05T15:30:00Z',
        state: false
      }
    ];

    vi.doMock('../store/useInventoryStore', () => ({
      default: () => ({
        inventories: mockInventories,
        loading: false,
        error: null,
        fetchInventories: vi.fn(),
        createInventory: vi.fn(),
        invalidateInventory: vi.fn(),
        fetchInventoryDetails: vi.fn(),
        validateStockConsistency: vi.fn(),
        clearError: vi.fn()
      })
    }));

    render(
      <TestWrapper>
        <InventoryPage />
      </TestWrapper>
    );

    // Should show the main title
    expect(screen.getByText('Gestión de Inventario')).toBeInTheDocument();
    
    // Should show the search input
    expect(screen.getByPlaceholderText('Buscar inventarios...')).toBeInTheDocument();
    
    // Should show action buttons
    expect(screen.getByText('Validar Consistencia')).toBeInTheDocument();
    expect(screen.getByText('Nuevo Inventario')).toBeInTheDocument();
  });

  it('should show page title and subtitle', () => {
    render(
      <TestWrapper>
        <InventoryPage />
      </TestWrapper>
    );

    expect(screen.getByText('Gestión de Inventario')).toBeInTheDocument();
    expect(screen.getByText('Control de stock, inventarios físicos y transacciones')).toBeInTheDocument();
  });

  it('should show search input', () => {
    render(
      <TestWrapper>
        <InventoryPage />
      </TestWrapper>
    );

    const searchInput = screen.getByPlaceholderText('Buscar inventarios...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveClass('input-class');
  });

  it('should show action buttons in header', () => {
    render(
      <TestWrapper>
        <InventoryPage />
      </TestWrapper>
    );

    const createButton = screen.getByText('Nuevo Inventario');
    const validateButton = screen.getByText('Validar Consistencia');
    
    expect(createButton).toBeInTheDocument();
    expect(validateButton).toBeInTheDocument();
    
    // Check if buttons have expected classes
    expect(createButton.closest('button')).toHaveClass('button-primary');
    expect(validateButton.closest('button')).toHaveClass('button-secondary');
  });
});