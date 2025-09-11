/**
 * Tests MVP para Price Adjustments Page
 * Testing básico de renderizado y funcionalidad principal
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PriceAdjustmentsPage from '../pages/PriceAdjustments';

// Mock del store
const mockStore = {
  adjustments: [],
  loading: false,
  error: null,
  creating: false,
  fetchRecentAdjustments: vi.fn(),
  createPriceAdjustment: vi.fn(),
  fetchProductHistory: vi.fn(),
  clearError: vi.fn()
};

vi.mock('../store/usePriceAdjustmentStore', () => ({
  default: () => mockStore
}));

// Mock de componentes
vi.mock('../components/ui/ProductSearchInput', () => ({
  default: ({ onProductSelect, selectedProduct }) => (
    <div data-testid="product-search">
      {selectedProduct ? (
        <div data-testid="selected-product">
          {selectedProduct.name || selectedProduct.product_name}
        </div>
      ) : (
        <button 
          onClick={() => onProductSelect({ 
            id: 'PROD_TEST_001', 
            name: 'Test Product',
            price_formatted: 'PYG 15,000'
          })}
        >
          Select Product
        </button>
      )}
    </div>
  )
}));

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key, fallback) => fallback || key
  })
}));

vi.mock('@/hooks/useThemeStyles', () => ({
  useThemeStyles: () => ({
    styles: {
      header: (variant) => `header-${variant}`,
      button: (variant) => `button-${variant}`,
      card: (classes) => `card ${classes}`,
      input: () => 'input-class',
      label: () => 'label-class',
      container: (classes) => `container ${classes}`
    }
  })
}));

vi.mock('@/components/ui/DataState', () => ({
  default: ({ variant, title, message, onRetry, actionLabel, onAction }) => (
    <div data-testid={`data-state-${variant}`}>
      {title && <h2>{title}</h2>}
      {message && <p>{message}</p>}
      {onRetry && <button onClick={onRetry}>Retry</button>}
      {onAction && <button onClick={onAction}>{actionLabel}</button>}
    </div>
  )
}));

describe('PriceAdjustmentsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock store state
    Object.assign(mockStore, {
      adjustments: [],
      loading: false,
      error: null,
      creating: false
    });
  });

  it('should render loading state', () => {
    mockStore.loading = true;
    
    render(<PriceAdjustmentsPage />);
    
    expect(screen.getByTestId('data-state-loading')).toBeInTheDocument();
  });

  it('should render error state with retry button', () => {
    mockStore.error = 'Network error';
    
    render(<PriceAdjustmentsPage />);
    
    expect(screen.getByTestId('data-state-error')).toBeInTheDocument();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);
    
    expect(mockStore.clearError).toHaveBeenCalled();
    expect(mockStore.fetchRecentAdjustments).toHaveBeenCalled();
  });

  it('should render empty state with create action', () => {
    render(<PriceAdjustmentsPage />);
    
    expect(screen.getByTestId('data-state-empty')).toBeInTheDocument();
    expect(screen.getByText('Sin ajustes de precios')).toBeInTheDocument();
    
    const createButton = screen.getByText('Crear Ajuste');
    expect(createButton).toBeInTheDocument();
  });

  it('should render adjustments list when data exists', () => {
    mockStore.adjustments = [
      {
        id: 1,
        product_id: 'PROD_TEST_001',
        old_price: 15.00,
        new_price: 16.50,
        price_change: 1.50,
        price_change_percent: 10.00,
        unit: 'UNIT',
        reason: 'Market adjustment',
        user_id: 'user123',
        created_at: new Date().toISOString(),
        metadata: {}
      },
      {
        id: 2,
        product_id: 'PROD_TEST_002',
        old_price: 20.00,
        new_price: 18.00,
        price_change: -2.00,
        price_change_percent: -10.00,
        unit: 'kg',
        reason: 'Promotion',
        user_id: 'user456',
        created_at: new Date().toISOString(),
        metadata: {}
      }
    ];
    
    render(<PriceAdjustmentsPage />);
    
    // Should render page title
    expect(screen.getByText('Ajustes de Precios')).toBeInTheDocument();
    
    // Should render create button
    expect(screen.getByText('Nuevo Ajuste')).toBeInTheDocument();
    
    // Should render search input
    expect(screen.getByPlaceholderText('Buscar por producto, razón o usuario...')).toBeInTheDocument();
    
    // Should render statistics
    expect(screen.getByText('Total Ajustes')).toBeInTheDocument();
    expect(screen.getByText('Incrementos')).toBeInTheDocument();
    expect(screen.getByText('Decrementos')).toBeInTheDocument();
    
    // Should render adjustment cards
    expect(screen.getByText('PROD_TEST_001')).toBeInTheDocument();
    expect(screen.getByText('PROD_TEST_002')).toBeInTheDocument();
    expect(screen.getByText('Market adjustment')).toBeInTheDocument();
    expect(screen.getByText('Promotion')).toBeInTheDocument();
  });

  it('should display create button in empty state', () => {
    mockStore.adjustments = []; // Empty state to show create button
    
    render(<PriceAdjustmentsPage />);
    
    // Should show empty state with create button
    expect(screen.getByText('Sin ajustes de precios')).toBeInTheDocument();
    expect(screen.getByText('Crear Ajuste')).toBeInTheDocument();
  });

  it('should show create button when adjustments exist', () => {
    mockStore.adjustments = [
      {
        id: 1,
        product_id: 'PROD_TEST_001',
        old_price: 15.00,
        new_price: 16.50,
        price_change: 1.50,
        price_change_percent: 10.00,
        unit: 'UNIT',
        reason: 'Test adjustment',
        user_id: 'user123',
        created_at: new Date().toISOString(),
        metadata: {}
      }
    ];
    
    render(<PriceAdjustmentsPage />);
    
    // Should show main page with create button
    expect(screen.getByText('Ajustes de Precios')).toBeInTheDocument();
    expect(screen.getByText('Nuevo Ajuste')).toBeInTheDocument();
  });

  it('should filter adjustments by search term', () => {
    mockStore.adjustments = [
      {
        id: 1,
        product_id: 'PROD_BANANA_001',
        reason: 'Market adjustment',
        user_id: 'user123',
        old_price: 15.00,
        new_price: 16.50,
        price_change: 1.50,
        price_change_percent: 10.00,
        created_at: new Date().toISOString(),
        metadata: {}
      },
      {
        id: 2,
        product_id: 'PROD_RICE_002',
        reason: 'Promotion',
        user_id: 'user456',
        old_price: 20.00,
        new_price: 18.00,
        price_change: -2.00,
        price_change_percent: -10.00,
        created_at: new Date().toISOString(),
        metadata: {}
      }
    ];
    
    render(<PriceAdjustmentsPage />);
    
    const searchInput = screen.getByPlaceholderText('Buscar por producto, razón o usuario...');
    
    // Search for "banana"
    fireEvent.change(searchInput, { target: { value: 'banana' } });
    
    // Should show only banana product
    expect(screen.getByText('PROD_BANANA_001')).toBeInTheDocument();
    expect(screen.queryByText('PROD_RICE_002')).not.toBeInTheDocument();
    
    // Search for "promotion"
    fireEvent.change(searchInput, { target: { value: 'promotion' } });
    
    // Should show only promotion adjustment
    expect(screen.queryByText('PROD_BANANA_001')).not.toBeInTheDocument();
    expect(screen.getByText('PROD_RICE_002')).toBeInTheDocument();
  });

  it('should call fetchRecentAdjustments on mount', () => {
    render(<PriceAdjustmentsPage />);
    
    expect(mockStore.fetchRecentAdjustments).toHaveBeenCalled();
  });

  it('should display statistics correctly', () => {
    mockStore.adjustments = [
      { id: 1, price_change: 1.50 }, // Increment
      { id: 2, price_change: -2.00 }, // Decrement
      { id: 3, price_change: 0.75 }, // Increment
    ];
    
    render(<PriceAdjustmentsPage />);
    
    // Total should be 3
    const totalCards = screen.getAllByText('3');
    expect(totalCards.length).toBeGreaterThan(0);
    
    // Increments should be 2
    const incrementCards = screen.getAllByText('2');
    expect(incrementCards.length).toBeGreaterThan(0);
    
    // Decrements should be 1
    const decrementCards = screen.getAllByText('1');
    expect(decrementCards.length).toBeGreaterThan(0);
  });
});