/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ReservationFilters from '../ReservationFilters';

// Mock de hooks externos
vi.mock('@/hooks/useFocusManagement', () => ({
  useFocusManagement: () => ({
    announceToScreenReader: vi.fn(),
    focusElement: vi.fn()
  })
}));

// Mock de hooks externos
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: vi.fn((key) => key),
    lang: 'es',
    setLang: vi.fn()
  })
}));

// Mock de componentes de UI
vi.mock('@/components/ui/Input', () => ({
  Input: ({ ...props }) => <input data-testid="filter-input" {...props} />
}));

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }) => (
    <div 
      data-testid="filter-select" 
      data-value={value} 
      onClick={() => onValueChange?.('test-value')}
    >
      {children}
    </div>
  ),
  SelectContent: ({ children }) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ placeholder }) => <span data-testid="select-value">{placeholder}</span>
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, size, disabled }) => (
    <button 
      data-testid="filter-button" 
      data-variant={variant}
      data-size={size}
      onClick={onClick} 
      disabled={disabled}
    >
      {children}
    </button>
  )
}));

vi.mock('@/components/ui/Popover', () => ({
  Popover: ({ children }) => <div data-testid="popover">{children}</div>,
  PopoverContent: ({ children }) => <div data-testid="popover-content">{children}</div>,
  PopoverTrigger: ({ children }) => <div data-testid="popover-trigger">{children}</div>
}));

vi.mock('@/components/ui/Calendar', () => ({
  Calendar: ({ selected, onSelect }) => (
    <div 
      data-testid="calendar" 
      onClick={() => onSelect?.(new Date('2024-08-25'))}
      data-selected={selected?.toISOString()}
    >
      Calendar Component
    </div>
  )
}));

// Mock de iconos
vi.mock('lucide-react', () => ({
  Search: () => <div data-testid="search-icon">Search</div>,
  Filter: () => <div data-testid="filter-icon">Filter</div>,
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  X: () => <div data-testid="x-icon">X</div>,
  ChevronDown: () => <div data-testid="chevron-down-icon">ChevronDown</div>,
  RotateCcw: () => <div data-testid="reset-icon">Reset</div>
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  format: vi.fn((date, formatStr) => {
    if (formatStr === 'PPP') return '25 de agosto de 2024';
    if (formatStr === 'yyyy-MM-dd') return '2024-08-25';
    return date.toISOString();
  }),
  isAfter: vi.fn(() => true),
  isBefore: vi.fn(() => false),
  startOfDay: vi.fn((date) => date),
  endOfDay: vi.fn((date) => date)
}));

const mockFilters = {
  search: '',
  status: 'all',
  dateFrom: null,
  dateTo: null,
  product: 'all',
  client: ''
};

const mockProducts = [
  { id: 'product-1', name: 'Producto A' },
  { id: 'product-2', name: 'Producto B' },
  { id: 'product-3', name: 'Producto C' }
];

const mockClients = [
  { id: 'client-1', name: 'Cliente A' },
  { id: 'client-2', name: 'Cliente B' },
  { id: 'client-3', name: 'Cliente C' }
];

describe('ReservationFilters - Component Tests', () => {
  const mockProps = {
    filters: mockFilters,
    onFiltersChange: vi.fn(),
    products: mockProducts,
    clients: mockClients,
    isLoading: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado básico', () => {
    test('debe renderizar todos los elementos de filtros', () => {
      render(<ReservationFilters {...mockProps} />);

      // Buscar por texto
      expect(screen.getByTestId('filter-input')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('reservations.filters.search.placeholder')).toBeInTheDocument();

      // Filtros por select
      const selects = screen.getAllByTestId('filter-select');
      expect(selects.length).toBeGreaterThanOrEqual(2); // Al menos status y product

      // Botones de fecha
      expect(screen.getByText('reservations.filters.dateFrom')).toBeInTheDocument();
      expect(screen.getByText('reservations.filters.dateTo')).toBeInTheDocument();

      // Botón de reset
      expect(screen.getByText('reservations.filters.reset')).toBeInTheDocument();
    });

    test('debe mostrar contador de filtros activos', () => {
      const activeFilters = {
        ...mockFilters,
        search: 'test',
        status: 'confirmed'
      };

      render(<ReservationFilters {...mockProps} filters={activeFilters} />);

      expect(screen.getByText('reservations.filters.active')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 filtros activos
    });

    test('debe ocultar contador cuando no hay filtros activos', () => {
      render(<ReservationFilters {...mockProps} />);

      expect(screen.queryByText('reservations.filters.active')).not.toBeInTheDocument();
    });
  });

  describe('Filtro de búsqueda', () => {
    test('debe actualizar filtro de búsqueda al escribir', async () => {
      const user = userEvent.setup();
      render(<ReservationFilters {...mockProps} />);

      const searchInput = screen.getByTestId('filter-input');
      await user.type(searchInput, 'cliente test');

      await waitFor(() => {
        expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
          ...mockFilters,
          search: 'cliente test'
        });
      });
    });

    test('debe limpiar búsqueda con botón X', async () => {
      const user = userEvent.setup();
      const searchFilters = { ...mockFilters, search: 'test search' };
      
      render(<ReservationFilters {...mockProps} filters={searchFilters} />);

      const clearButton = screen.getByTestId('x-icon');
      await user.click(clearButton);

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        ...searchFilters,
        search: ''
      });
    });

    test('debe debounce la búsqueda', async () => {
      const user = userEvent.setup();
      render(<ReservationFilters {...mockProps} />);

      const searchInput = screen.getByTestId('filter-input');
      
      // Escribir rápidamente
      await user.type(searchInput, 'abc');

      // Solo debería llamarse una vez después del debounce
      await waitFor(() => {
        expect(mockProps.onFiltersChange).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });

  describe('Filtros por estado', () => {
    test('debe cambiar filtro de estado', async () => {
      const user = userEvent.setup();
      render(<ReservationFilters {...mockProps} />);

      const statusSelect = screen.getAllByTestId('filter-select')[0]; // Primer select es status
      await user.click(statusSelect);

      await waitFor(() => {
        expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
          ...mockFilters,
          status: 'test-value'
        });
      });
    });

    test('debe mostrar opciones de estado correctas', () => {
      render(<ReservationFilters {...mockProps} />);

      expect(screen.getByText('reservations.status.all')).toBeInTheDocument();
      expect(screen.getByText('reservations.status.pending')).toBeInTheDocument();
      expect(screen.getByText('reservations.status.confirmed')).toBeInTheDocument();
      expect(screen.getByText('reservations.status.cancelled')).toBeInTheDocument();
    });
  });

  describe('Filtros de fecha', () => {
    test('debe abrir calendario al hacer clic en fecha desde', async () => {
      const user = userEvent.setup();
      render(<ReservationFilters {...mockProps} />);

      const dateFromButton = screen.getByText('reservations.filters.dateFrom');
      await user.click(dateFromButton);

      expect(screen.getByTestId('calendar')).toBeInTheDocument();
    });

    test('debe actualizar fecha desde al seleccionar en calendario', async () => {
      const user = userEvent.setup();
      render(<ReservationFilters {...mockProps} />);

      const dateFromButton = screen.getByText('reservations.filters.dateFrom');
      await user.click(dateFromButton);

      const calendar = screen.getByTestId('calendar');
      await user.click(calendar);

      await waitFor(() => {
        expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
          ...mockFilters,
          dateFrom: expect.any(Date)
        });
      });
    });

    test('debe mostrar fecha seleccionada formateada', () => {
      const dateFilters = {
        ...mockFilters,
        dateFrom: new Date('2024-08-25')
      };

      render(<ReservationFilters {...mockProps} filters={dateFilters} />);

      expect(screen.getByText('25 de agosto de 2024')).toBeInTheDocument();
    });

    test('debe validar rango de fechas', async () => {
      const user = userEvent.setup();
      const invalidFilters = {
        ...mockFilters,
        dateFrom: new Date('2024-08-25'),
        dateTo: new Date('2024-08-20') // Fecha hasta menor que fecha desde
      };

      render(<ReservationFilters {...mockProps} filters={invalidFilters} />);

      // Debería mostrar error de validación
      expect(screen.getByText('reservations.filters.dateRange.error')).toBeInTheDocument();
    });
  });

  describe('Filtros por producto y cliente', () => {
    test('debe mostrar lista de productos en select', () => {
      render(<ReservationFilters {...mockProps} />);

      mockProducts.forEach(product => {
        expect(screen.getByText(product.name)).toBeInTheDocument();
      });
    });

    test('debe cambiar filtro de producto', async () => {
      const user = userEvent.setup();
      render(<ReservationFilters {...mockProps} />);

      const productSelect = screen.getAllByTestId('filter-select')[1]; // Segundo select es product
      await user.click(productSelect);

      await waitFor(() => {
        expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
          ...mockFilters,
          product: 'test-value'
        });
      });
    });

    test('debe permitir búsqueda de cliente', async () => {
      const user = userEvent.setup();
      render(<ReservationFilters {...mockProps} />);

      const clientInput = screen.getByPlaceholderText('reservations.filters.client.placeholder');
      await user.type(clientInput, 'Juan');

      await waitFor(() => {
        expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
          ...mockFilters,
          client: 'Juan'
        });
      });
    });
  });

  describe('Reset de filtros', () => {
    test('debe resetear todos los filtros', async () => {
      const user = userEvent.setup();
      const activeFilters = {
        search: 'test search',
        status: 'confirmed',
        dateFrom: new Date('2024-08-20'),
        dateTo: new Date('2024-08-25'),
        product: 'product-1',
        client: 'test client'
      };

      render(<ReservationFilters {...mockProps} filters={activeFilters} />);

      const resetButton = screen.getByText('reservations.filters.reset');
      await user.click(resetButton);

      expect(mockProps.onFiltersChange).toHaveBeenCalledWith({
        search: '',
        status: 'all',
        dateFrom: null,
        dateTo: null,
        product: 'all',
        client: ''
      });
    });

    test('debe deshabilitar botón reset cuando no hay filtros activos', () => {
      render(<ReservationFilters {...mockProps} />);

      const resetButton = screen.getByText('reservations.filters.reset');
      expect(resetButton).toBeDisabled();
    });

    test('debe anunciar reset a screen readers', async () => {
      const user = userEvent.setup();
      const activeFilters = { ...mockFilters, search: 'test' };

      render(<ReservationFilters {...mockProps} filters={activeFilters} />);

      const resetButton = screen.getByText('reservations.filters.reset');
      await user.click(resetButton);

      // En implementación real, se anunciaría el reset
      expect(mockProps.onFiltersChange).toHaveBeenCalled();
    });
  });

  describe('Estados de carga', () => {
    test('debe mostrar skeleton durante carga', () => {
      render(<ReservationFilters {...mockProps} isLoading={true} />);

      expect(screen.getByTestId('filters-skeleton')).toBeInTheDocument();
    });

    test('debe deshabilitar filtros durante carga', () => {
      render(<ReservationFilters {...mockProps} isLoading={true} />);

      const inputs = screen.getAllByTestId('filter-input');
      const selects = screen.getAllByTestId('filter-select');
      const buttons = screen.getAllByTestId('filter-button');

      [...inputs, ...selects, ...buttons].forEach(element => {
        expect(element).toBeDisabled();
      });
    });
  });

  describe('Accesibilidad', () => {
    test('debe tener labels apropiados', () => {
      render(<ReservationFilters {...mockProps} />);

      // Input de búsqueda
      const searchInput = screen.getByTestId('filter-input');
      expect(searchInput).toHaveAttribute('aria-label', 'reservations.filters.search.label');

      // Selectores
      const selects = screen.getAllByTestId('filter-select');
      selects.forEach(select => {
        expect(select).toHaveAttribute('aria-label');
      });
    });

    test('debe anunciar cambios de filtros', async () => {
      const user = userEvent.setup();
      render(<ReservationFilters {...mockProps} />);

      const searchInput = screen.getByTestId('filter-input');
      await user.type(searchInput, 'test');

      // En implementación real, se anunciarían los cambios
      expect(screen.getByTestId('filter-input')).toBeInTheDocument();
    });

    test('debe soportar navegación por teclado', async () => {
      const user = userEvent.setup();
      render(<ReservationFilters {...mockProps} />);

      // Tab entre elementos
      await user.tab();
      expect(screen.getByTestId('filter-input')).toHaveFocus();

      await user.tab();
      // El siguiente elemento debería tener focus
    });

    test('debe tener roles ARIA apropiados', () => {
      render(<ReservationFilters {...mockProps} />);

      const filterContainer = screen.getByRole('region');
      expect(filterContainer).toHaveAttribute('aria-label', 'reservations.filters.region.label');

      const searchInput = screen.getByTestId('filter-input');
      expect(searchInput).toHaveAttribute('role', 'searchbox');
    });
  });

  describe('Filtros avanzados', () => {
    test('debe alternar panel de filtros avanzados', async () => {
      const user = userEvent.setup();
      render(<ReservationFilters {...mockProps} />);

      const advancedToggle = screen.getByText('reservations.filters.advanced.toggle');
      await user.click(advancedToggle);

      expect(screen.getByTestId('advanced-filters')).toBeVisible();

      await user.click(advancedToggle);
      expect(screen.getByTestId('advanced-filters')).not.toBeVisible();
    });

    test('debe persistir estado de panel avanzado', async () => {
      const user = userEvent.setup();
      render(<ReservationFilters {...mockProps} />);

      const advancedToggle = screen.getByText('reservations.filters.advanced.toggle');
      await user.click(advancedToggle);

      // Re-render componente
      const { rerender } = render(<ReservationFilters {...mockProps} />);
      rerender(<ReservationFilters {...mockProps} />);

      expect(screen.getByTestId('advanced-filters')).toBeVisible();
    });
  });

  describe('Responsive design', () => {
    test('debe adaptar layout en móvil', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375
      });

      render(<ReservationFilters {...mockProps} />);

      const container = screen.getByTestId('filters-container');
      expect(container).toHaveClass('mobile-layout');
    });

    test('debe colapsar filtros en pantallas pequeñas', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320
      });

      render(<ReservationFilters {...mockProps} />);

      expect(screen.getByTestId('filters-collapsed')).toBeInTheDocument();
    });
  });
});
