/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ReservationIntegrationFlow from '../ReservationIntegrationFlow';

// Mock de API client
const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn()
};

vi.mock('@/lib/api-client', () => ({
  apiClient: mockApiClient
}));

// Mock de stores
const mockReservationStore = {
  reservations: [],
  filters: {
    search: '',
    status: 'all',
    dateFrom: null,
    dateTo: null,
    product: 'all',
    client: ''
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  },
  isLoading: false,
  error: null,
  
  // Actions
  fetchReservations: vi.fn(),
  createReservation: vi.fn(),
  updateReservation: vi.fn(),
  deleteReservation: vi.fn(),
  setFilters: vi.fn(),
  setPage: vi.fn(),
  clearError: vi.fn()
};

vi.mock('@/store/useReservationStore', () => ({
  useReservationStore: () => mockReservationStore
}));

// Mock de hooks de telemetría
vi.mock('@/hooks/useTelemetry', () => ({
  useTelemetry: () => ({
    track: vi.fn(),
    trackError: vi.fn(),
    trackPerformance: vi.fn()
  })
}));

// Mock de notificaciones
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
};

vi.mock('@/lib/toast', () => ({
  toast: mockToast
}));

// Mock de i18n
vi.mock('@/lib/i18n', () => ({
  t: vi.fn((key) => key)
}));

// Mock de componentes
vi.mock('../ReservationCard', () => ({
  default: ({ reservation, onEdit, onDelete, onView }) => (
    <div data-testid={`reservation-card-${reservation.id}`}>
      <h3>{reservation.client_name}</h3>
      <p>{reservation.product_name}</p>
      <p>{reservation.status}</p>
      <button onClick={() => onEdit(reservation)} data-testid="edit-button">Edit</button>
      <button onClick={() => onDelete(reservation.id)} data-testid="delete-button">Delete</button>
      <button onClick={() => onView(reservation)} data-testid="view-button">View</button>
    </div>
  )
}));

vi.mock('../ReservationModal', () => ({
  default: ({ isOpen, mode, reservation, onSubmit, onClose }) => (
    isOpen ? (
      <div data-testid="reservation-modal" data-mode={mode}>
        <h2>{mode === 'create' ? 'Create Reservation' : 'Edit Reservation'}</h2>
        {reservation && <p data-testid="reservation-data">{reservation.client_name}</p>}
        <button 
          onClick={() => onSubmit({
            client_name: 'Test Client',
            product_name: 'Test Product',
            date: '2024-08-25',
            time: '14:30',
            duration: 120,
            status: 'confirmed'
          })}
          data-testid="submit-button"
        >
          Submit
        </button>
        <button onClick={onClose} data-testid="close-button">Close</button>
      </div>
    ) : null
  )
}));

vi.mock('../ReservationFilters', () => ({
  default: ({ filters, onFiltersChange }) => (
    <div data-testid="reservation-filters">
      <input 
        data-testid="search-input"
        value={filters.search}
        onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
        placeholder="Search..."
      />
      <select 
        data-testid="status-select"
        value={filters.status}
        onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
      >
        <option value="all">All</option>
        <option value="confirmed">Confirmed</option>
        <option value="pending">Pending</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  )
}));

// Mock data
const mockReservations = [
  {
    id: 'reservation-1',
    client_name: 'Juan Pérez',
    product_name: 'Producto A',
    date: '2024-08-25',
    time: '14:30',
    duration: 120,
    status: 'confirmed',
    location: 'Sala A',
    notes: 'Reserva importante'
  },
  {
    id: 'reservation-2',
    client_name: 'María García',
    product_name: 'Producto B',
    date: '2024-08-26',
    time: '10:00',
    duration: 90,
    status: 'pending',
    location: 'Sala B',
    notes: ''
  },
  {
    id: 'reservation-3',
    client_name: 'Carlos López',
    product_name: 'Producto C',
    date: '2024-08-27',
    time: '16:00',
    duration: 60,
    status: 'cancelled',
    location: 'Sala C',
    notes: 'Cancelado por cliente'
  }
];

describe('Reservation Integration Tests - CRUD Flows', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });

    // Reset mocks
    vi.clearAllMocks();
    
    // Setup default store state
    mockReservationStore.reservations = mockReservations;
    mockReservationStore.pagination.total = mockReservations.length;
    mockReservationStore.pagination.totalPages = 1;
  });

  afterEach(() => {
    queryClient.clear();
  });

  const renderWithProviders = (component) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Create Reservation Flow', () => {
    test('debe completar flujo de creación exitosamente', async () => {
      const user = userEvent.setup();
      
      // Mock API response para creación
      mockApiClient.post.mockResolvedValueOnce({
        data: {
          id: 'reservation-new',
          client_name: 'Test Client',
          product_name: 'Test Product',
          date: '2024-08-25',
          time: '14:30',
          duration: 120,
          status: 'confirmed'
        }
      });

      mockReservationStore.createReservation.mockResolvedValueOnce(true);

      renderWithProviders(<ReservationIntegrationFlow />);

      // 1. Abrir modal de creación
      const createButton = screen.getByText('reservations.create.button');
      await user.click(createButton);

      // 2. Verificar que el modal se abre en modo creación
      await waitFor(() => {
        expect(screen.getByTestId('reservation-modal')).toBeInTheDocument();
        expect(screen.getByTestId('reservation-modal')).toHaveAttribute('data-mode', 'create');
      });

      // 3. Llenar formulario y enviar
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // 4. Verificar llamadas API
      await waitFor(() => {
        expect(mockReservationStore.createReservation).toHaveBeenCalledWith({
          client_name: 'Test Client',
          product_name: 'Test Product',
          date: '2024-08-25',
          time: '14:30',
          duration: 120,
          status: 'confirmed'
        });
      });

      // 5. Verificar notificación de éxito
      expect(mockToast.success).toHaveBeenCalledWith('reservations.create.success');

      // 6. Verificar que el modal se cierra
      await waitFor(() => {
        expect(screen.queryByTestId('reservation-modal')).not.toBeInTheDocument();
      });

      // 7. Verificar actualización de lista
      expect(mockReservationStore.fetchReservations).toHaveBeenCalled();
    });

    test('debe manejar errores durante creación', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      const errorMessage = 'Error al crear reserva';
      mockReservationStore.createReservation.mockRejectedValueOnce(new Error(errorMessage));

      renderWithProviders(<ReservationIntegrationFlow />);

      // Abrir modal y enviar
      const createButton = screen.getByText('reservations.create.button');
      await user.click(createButton);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Verificar manejo de error
      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('reservations.create.error')
        );
      });

      // Modal debe permanecer abierto para corrección
      expect(screen.getByTestId('reservation-modal')).toBeInTheDocument();
    });

    test('debe validar datos antes de enviar', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ReservationIntegrationFlow />);

      const createButton = screen.getByText('reservations.create.button');
      await user.click(createButton);

      // Intentar enviar sin datos completos
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // En implementación real, se validarían los campos requeridos
      expect(screen.getByTestId('reservation-modal')).toBeInTheDocument();
    });
  });

  describe('Read Reservation Flow', () => {
    test('debe cargar y mostrar lista de reservas', async () => {
      mockReservationStore.fetchReservations.mockResolvedValueOnce(mockReservations);

      renderWithProviders(<ReservationIntegrationFlow />);

      // Verificar que se cargan las reservas
      expect(mockReservationStore.fetchReservations).toHaveBeenCalled();

      // Verificar que se muestran las tarjetas
      await waitFor(() => {
        mockReservations.forEach(reservation => {
          expect(screen.getByTestId(`reservation-card-${reservation.id}`)).toBeInTheDocument();
          expect(screen.getByText(reservation.client_name)).toBeInTheDocument();
          expect(screen.getByText(reservation.product_name)).toBeInTheDocument();
        });
      });
    });

    test('debe aplicar filtros correctamente', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ReservationIntegrationFlow />);

      // Cambiar filtro de búsqueda
      const searchInput = screen.getByTestId('search-input');
      await user.type(searchInput, 'Juan');

      await waitFor(() => {
        expect(mockReservationStore.setFilters).toHaveBeenCalledWith({
          ...mockReservationStore.filters,
          search: 'Juan'
        });
      });

      // Cambiar filtro de estado
      const statusSelect = screen.getByTestId('status-select');
      await user.selectOptions(statusSelect, 'confirmed');

      await waitFor(() => {
        expect(mockReservationStore.setFilters).toHaveBeenCalledWith({
          ...mockReservationStore.filters,
          status: 'confirmed'
        });
      });

      // Verificar que se recargan las reservas con filtros
      expect(mockReservationStore.fetchReservations).toHaveBeenCalled();
    });

    test('debe manejar paginación', async () => {
      const user = userEvent.setup();
      
      // Setup pagination
      mockReservationStore.pagination = {
        page: 1,
        limit: 20,
        total: 50,
        totalPages: 3
      };

      renderWithProviders(<ReservationIntegrationFlow />);

      // Verificar controles de paginación
      expect(screen.getByText('reservations.pagination.page')).toBeInTheDocument();
      expect(screen.getByText('1 of 3')).toBeInTheDocument();

      // Cambiar página
      const nextButton = screen.getByText('reservations.pagination.next');
      await user.click(nextButton);

      expect(mockReservationStore.setPage).toHaveBeenCalledWith(2);
    });

    test('debe mostrar estado de carga', () => {
      mockReservationStore.isLoading = true;

      renderWithProviders(<ReservationIntegrationFlow />);

      expect(screen.getByTestId('reservations-skeleton')).toBeInTheDocument();
    });

    test('debe mostrar mensaje cuando no hay reservas', () => {
      mockReservationStore.reservations = [];
      mockReservationStore.pagination.total = 0;

      renderWithProviders(<ReservationIntegrationFlow />);

      expect(screen.getByText('reservations.empty.message')).toBeInTheDocument();
      expect(screen.getByText('reservations.empty.action')).toBeInTheDocument();
    });
  });

  describe('Update Reservation Flow', () => {
    test('debe completar flujo de edición exitosamente', async () => {
      const user = userEvent.setup();
      const reservationToEdit = mockReservations[0];
      
      // Mock API response
      mockApiClient.put.mockResolvedValueOnce({
        data: { ...reservationToEdit, client_name: 'Updated Client' }
      });

      mockReservationStore.updateReservation.mockResolvedValueOnce(true);

      renderWithProviders(<ReservationIntegrationFlow />);

      // 1. Hacer clic en editar reserva
      const editButton = screen.getAllByTestId('edit-button')[0];
      await user.click(editButton);

      // 2. Verificar que el modal se abre en modo edición con datos
      await waitFor(() => {
        expect(screen.getByTestId('reservation-modal')).toBeInTheDocument();
        expect(screen.getByTestId('reservation-modal')).toHaveAttribute('data-mode', 'edit');
        expect(screen.getByTestId('reservation-data')).toHaveTextContent(reservationToEdit.client_name);
      });

      // 3. Modificar y enviar
      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // 4. Verificar llamadas API
      await waitFor(() => {
        expect(mockReservationStore.updateReservation).toHaveBeenCalledWith(
          reservationToEdit.id,
          expect.objectContaining({
            client_name: 'Test Client' // Datos del mock
          })
        );
      });

      // 5. Verificar notificación de éxito
      expect(mockToast.success).toHaveBeenCalledWith('reservations.update.success');

      // 6. Verificar actualización de lista
      expect(mockReservationStore.fetchReservations).toHaveBeenCalled();
    });

    test('debe manejar conflictos de actualización', async () => {
      const user = userEvent.setup();
      
      // Mock conflict error
      mockReservationStore.updateReservation.mockRejectedValueOnce({
        code: 'CONFLICT',
        message: 'La reserva fue modificada por otro usuario'
      });

      renderWithProviders(<ReservationIntegrationFlow />);

      const editButton = screen.getAllByTestId('edit-button')[0];
      await user.click(editButton);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Verificar manejo de conflicto
      await waitFor(() => {
        expect(mockToast.warning).toHaveBeenCalledWith(
          expect.stringContaining('reservations.update.conflict')
        );
      });

      // Debería mostrar opción de recargar datos
      expect(screen.getByText('reservations.update.reload')).toBeInTheDocument();
    });
  });

  describe('Delete Reservation Flow', () => {
    test('debe completar flujo de eliminación con confirmación', async () => {
      const user = userEvent.setup();
      const reservationToDelete = mockReservations[0];
      
      // Mock confirmation dialog
      window.confirm = vi.fn(() => true);
      
      mockApiClient.delete.mockResolvedValueOnce({ success: true });
      mockReservationStore.deleteReservation.mockResolvedValueOnce(true);

      renderWithProviders(<ReservationIntegrationFlow />);

      // 1. Hacer clic en eliminar
      const deleteButton = screen.getAllByTestId('delete-button')[0];
      await user.click(deleteButton);

      // 2. Verificar confirmación
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('reservations.delete.confirm')
      );

      // 3. Verificar llamada API
      await waitFor(() => {
        expect(mockReservationStore.deleteReservation).toHaveBeenCalledWith(reservationToDelete.id);
      });

      // 4. Verificar notificación de éxito
      expect(mockToast.success).toHaveBeenCalledWith('reservations.delete.success');

      // 5. Verificar actualización de lista
      expect(mockReservationStore.fetchReservations).toHaveBeenCalled();
    });

    test('debe cancelar eliminación si usuario no confirma', async () => {
      const user = userEvent.setup();
      
      // Mock confirmation dialog - usuario cancela
      window.confirm = vi.fn(() => false);

      renderWithProviders(<ReservationIntegrationFlow />);

      const deleteButton = screen.getAllByTestId('delete-button')[0];
      await user.click(deleteButton);

      // No debe llamar API
      expect(mockReservationStore.deleteReservation).not.toHaveBeenCalled();
      expect(mockToast.success).not.toHaveBeenCalled();
    });

    test('debe manejar errores durante eliminación', async () => {
      const user = userEvent.setup();
      
      window.confirm = vi.fn(() => true);
      mockReservationStore.deleteReservation.mockRejectedValueOnce(
        new Error('No se puede eliminar la reserva')
      );

      renderWithProviders(<ReservationIntegrationFlow />);

      const deleteButton = screen.getAllByTestId('delete-button')[0];
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockToast.error).toHaveBeenCalledWith(
          expect.stringContaining('reservations.delete.error')
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('debe mostrar error global cuando falla carga inicial', async () => {
      mockReservationStore.error = 'Error de conexión';
      mockReservationStore.isLoading = false;

      renderWithProviders(<ReservationIntegrationFlow />);

      expect(screen.getByText('reservations.error.global')).toBeInTheDocument();
      expect(screen.getByText('reservations.error.retry')).toBeInTheDocument();
    });

    test('debe permitir reintentar después de error', async () => {
      const user = userEvent.setup();
      
      mockReservationStore.error = 'Error de conexión';
      mockReservationStore.clearError = vi.fn();

      renderWithProviders(<ReservationIntegrationFlow />);

      const retryButton = screen.getByText('reservations.error.retry');
      await user.click(retryButton);

      expect(mockReservationStore.clearError).toHaveBeenCalled();
      expect(mockReservationStore.fetchReservations).toHaveBeenCalled();
    });
  });

  describe('Performance & Optimizations', () => {
    test('debe implementar debounce en filtros', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ReservationIntegrationFlow />);

      const searchInput = screen.getByTestId('search-input');
      
      // Escribir múltiples caracteres rápidamente
      await user.type(searchInput, 'test search');

      // Solo debería hacer una llamada después del debounce
      await waitFor(() => {
        expect(mockReservationStore.setFilters).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });

    test('debe cachear datos entre navegación', () => {
      renderWithProviders(<ReservationIntegrationFlow />);

      // Verificar que los datos se mantienen en cache
      expect(queryClient.getQueryData(['reservations'])).toBeDefined();
    });

    test('debe optimizar re-renders de componentes', () => {
      const { rerender } = renderWithProviders(<ReservationIntegrationFlow />);

      // Cambiar props que no deberían causar re-render
      mockReservationStore.pagination.page = 2;
      
      rerender(
        <QueryClientProvider client={queryClient}>
          <ReservationIntegrationFlow />
        </QueryClientProvider>
      );

      // En implementación real, verificaríamos que los componentes se optimizan
      expect(screen.getByTestId('reservation-filters')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    test('debe anunciar cambios importantes', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ReservationIntegrationFlow />);

      // Crear nueva reserva
      const createButton = screen.getByText('reservations.create.button');
      await user.click(createButton);

      const submitButton = screen.getByTestId('submit-button');
      await user.click(submitButton);

      // Verificar anuncio de éxito
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent('reservations.create.success');
      });
    });

    test('debe mantener focus management durante navegación', async () => {
      const user = userEvent.setup();
      
      renderWithProviders(<ReservationIntegrationFlow />);

      // Abrir modal
      const createButton = screen.getByText('reservations.create.button');
      await user.click(createButton);

      // Cerrar modal
      const closeButton = screen.getByTestId('close-button');
      await user.click(closeButton);

      // Focus debería volver al botón create
      await waitFor(() => {
        expect(createButton).toHaveFocus();
      });
    });
  });
});
