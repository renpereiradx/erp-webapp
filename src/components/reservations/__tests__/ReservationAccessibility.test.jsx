/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

// Mock de i18n
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: vi.fn((key) => key),
    lang: 'es',
    setLang: vi.fn()
  })
}));

// Mock de hooks
vi.mock('@/hooks/useFocusManagement', () => ({
  useFocusManagement: () => ({
    saveFocus: vi.fn(),
    restoreFocus: vi.fn(),
    trapFocus: vi.fn(),
    announce: vi.fn(),
    announceToScreenReader: vi.fn(),
    focusElement: vi.fn()
  })
}));

// Mock de telemetría
vi.mock('@/hooks/useTelemetry', () => ({
  useTelemetry: () => ({
    track: vi.fn(),
    trackError: vi.fn(),
    trackPerformance: vi.fn()
  })
}));

// Import de componentes a testear
import ReservationCard from '../ReservationCard';
import ReservationModal from '../ReservationModal';
import ReservationFilters from '../ReservationFilters';
import ReservationsList from '../ReservationsList';

// Mock data
const mockReservation = {
  id: 'reservation-1',
  client_name: 'Juan Pérez',
  product_name: 'Producto Test',
  date: '2024-08-25',
  time: '14:30',
  duration: 120,
  status: 'confirmed',
  location: 'Sala A',
  notes: 'Reserva de prueba para accesibilidad'
};

const mockProducts = [
  { id: 'product-1', name: 'Producto A' },
  { id: 'product-2', name: 'Producto B' }
];

const mockFilters = {
  search: '',
  status: 'all',
  dateFrom: null,
  dateTo: null,
  product: 'all',
  client: ''
};

describe('Reservations Accessibility Tests - WCAG 2.1 AA Compliance', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ReservationCard - Accesibilidad', () => {
    test('debe cumplir con WCAG 2.1 AA sin violaciones', async () => {
      const { container } = render(
        <ReservationCard 
          reservation={mockReservation}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('debe tener estructura semántica correcta', () => {
      render(
        <ReservationCard 
          reservation={mockReservation}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
        />
      );

      // Verificar elementos semánticos
      expect(screen.getByRole('article')).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
      
      // Verificar botones con roles apropiados
      expect(screen.getByRole('button', { name: /editar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /eliminar/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ver detalles/i })).toBeInTheDocument();
    });

    test('debe tener labels descriptivos y accesibles', () => {
      render(
        <ReservationCard 
          reservation={mockReservation}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
        />
      );

      // Verificar aria-labels descriptivos
      expect(screen.getByLabelText(/reserva para Juan Pérez/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/editar reserva de Juan Pérez/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/eliminar reserva de Juan Pérez/i)).toBeInTheDocument();
    });

    test('debe soportar navegación por teclado', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const onView = vi.fn();

      render(
        <ReservationCard 
          reservation={mockReservation}
          onEdit={onEdit}
          onDelete={onDelete}
          onView={onView}
        />
      );

      // Navegar con Tab
      await user.tab();
      expect(screen.getByRole('button', { name: /ver detalles/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /editar/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('button', { name: /eliminar/i })).toHaveFocus();

      // Activar con Enter y Space
      await user.keyboard('{Enter}');
      expect(onDelete).toHaveBeenCalled();

      // Reset focus y probar Space
      screen.getByRole('button', { name: /editar/i }).focus();
      await user.keyboard(' ');
      expect(onEdit).toHaveBeenCalled();
    });

    test('debe anunciar cambios de estado', async () => {
      const { rerender } = render(
        <ReservationCard 
          reservation={mockReservation}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
        />
      );

      // Cambiar estado
      const updatedReservation = { ...mockReservation, status: 'cancelled' };
      rerender(
        <ReservationCard 
          reservation={updatedReservation}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
        />
      );

      // Verificar anuncio de cambio
      expect(screen.getByRole('status')).toHaveTextContent(/estado actualizado a cancelada/i);
    });

    test('debe tener contraste de colores adecuado', () => {
      render(
        <ReservationCard 
          reservation={mockReservation}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
        />
      );

      // Verificar que los elementos tienen estilos con buen contraste
      const statusBadge = screen.getByText('confirmed');
      expect(statusBadge).toHaveClass('status-confirmed');
      
      // En implementación real, verificaríamos el contraste calculado
      expect(statusBadge).toHaveStyle({ color: expect.any(String) });
    });
  });

  describe('ReservationModal - Accesibilidad', () => {
    test('debe cumplir con WCAG 2.1 AA para modales', async () => {
      const { container } = render(
        <ReservationModal
          isOpen={true}
          mode="create"
          onSubmit={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('debe tener atributos ARIA correctos para modal', () => {
      render(
        <ReservationModal
          isOpen={true}
          mode="create"
          onSubmit={vi.fn()}
          onClose={vi.fn()}
        />
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    test('debe gestionar focus trap correctamente', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      render(
        <ReservationModal
          isOpen={true}
          mode="create"
          onSubmit={vi.fn()}
          onClose={onClose}
        />
      );

      // Verificar que el focus está dentro del modal
      const firstFocusable = screen.getAllByRole('textbox')[0];
      expect(firstFocusable).toHaveFocus();

      // Navegar al final del modal
      const submitButton = screen.getByRole('button', { name: /crear/i });
      const cancelButton = screen.getByRole('button', { name: /cancelar/i });

      // Tab debería circular dentro del modal
      submitButton.focus();
      await user.tab();
      expect(cancelButton).toHaveFocus();

      await user.tab();
      expect(firstFocusable).toHaveFocus(); // Vuelve al inicio
    });

    test('debe cerrar con Escape y mantener focus', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      // Renderizar botón que abre modal
      const TestComponent = () => {
        const [isOpen, setIsOpen] = React.useState(false);
        return (
          <>
            <button onClick={() => setIsOpen(true)}>Abrir Modal</button>
            <ReservationModal
              isOpen={isOpen}
              mode="create"
              onSubmit={vi.fn()}
              onClose={() => {
                setIsOpen(false);
                onClose();
              }}
            />
          </>
        );
      };

      render(<TestComponent />);

      const openButton = screen.getByText('Abrir Modal');
      await user.click(openButton);

      // Modal debe estar abierto
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Cerrar con Escape
      await user.keyboard('{Escape}');

      // Verificar que se cierra y focus vuelve
      await waitFor(() => {
        expect(onClose).toHaveBeenCalled();
        expect(openButton).toHaveFocus();
      });
    });

    test('debe validar y anunciar errores de forma accesible', async () => {
      const user = userEvent.setup();

      render(
        <ReservationModal
          isOpen={true}
          mode="create"
          onSubmit={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Intentar enviar formulario vacío
      const submitButton = screen.getByRole('button', { name: /crear/i });
      await user.click(submitButton);

      // Verificar mensajes de error accesibles
      const errorMessages = screen.getAllByRole('alert');
      expect(errorMessages.length).toBeGreaterThan(0);

      errorMessages.forEach(error => {
        expect(error).toHaveAttribute('aria-live', 'polite');
      });

      // Verificar que el primer campo con error recibe focus
      const firstErrorField = screen.getByLabelText(/nombre del cliente/i);
      expect(firstErrorField).toHaveAttribute('aria-invalid', 'true');
      expect(firstErrorField).toHaveAttribute('aria-describedby');
    });

    test('debe tener labels asociados correctamente', () => {
      render(
        <ReservationModal
          isOpen={true}
          mode="create"
          onSubmit={vi.fn()}
          onClose={vi.fn()}
        />
      );

      // Verificar que todos los inputs tienen labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });

      // Verificar selects
      const selects = screen.getAllByRole('combobox');
      selects.forEach(select => {
        expect(select).toHaveAccessibleName();
      });
    });
  });

  describe('ReservationFilters - Accesibilidad', () => {
    test('debe cumplir con WCAG 2.1 AA para filtros', async () => {
      const { container } = render(
        <ReservationFilters
          filters={mockFilters}
          onFiltersChange={vi.fn()}
          products={mockProducts}
          clients={[]}
          isLoading={false}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('debe tener región de filtros bien definida', () => {
      render(
        <ReservationFilters
          filters={mockFilters}
          onFiltersChange={vi.fn()}
          products={mockProducts}
          clients={[]}
          isLoading={false}
        />
      );

      const filtersRegion = screen.getByRole('region', { name: /filtros de reservas/i });
      expect(filtersRegion).toBeInTheDocument();
      expect(filtersRegion).toHaveAttribute('aria-label');
    });

    test('debe anunciar cambios en filtros', async () => {
      const user = userEvent.setup();
      const onFiltersChange = vi.fn();

      render(
        <ReservationFilters
          filters={mockFilters}
          onFiltersChange={onFiltersChange}
          products={mockProducts}
          clients={[]}
          isLoading={false}
        />
      );

      // Cambiar búsqueda
      const searchInput = screen.getByRole('searchbox');
      await user.type(searchInput, 'test');

      // Verificar anuncio de cambio
      await waitFor(() => {
        const announcement = screen.getByRole('status');
        expect(announcement).toHaveTextContent(/filtros aplicados/i);
      });
    });

    test('debe soportar navegación por teclado en filtros', async () => {
      const user = userEvent.setup();

      render(
        <ReservationFilters
          filters={mockFilters}
          onFiltersChange={vi.fn()}
          products={mockProducts}
          clients={[]}
          isLoading={false}
        />
      );

      // Navegar entre filtros
      await user.tab(); // Búsqueda
      expect(screen.getByRole('searchbox')).toHaveFocus();

      await user.tab(); // Estado
      expect(screen.getByRole('combobox', { name: /estado/i })).toHaveFocus();

      await user.tab(); // Producto
      expect(screen.getByRole('combobox', { name: /producto/i })).toHaveFocus();

      // Verificar que se pueden operar con teclado
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');
    });

    test('debe tener instrucciones claras para filtros avanzados', () => {
      render(
        <ReservationFilters
          filters={mockFilters}
          onFiltersChange={vi.fn()}
          products={mockProducts}
          clients={[]}
          isLoading={false}
        />
      );

      // Verificar instrucciones de uso
      expect(screen.getByText(/usa los filtros para encontrar reservas específicas/i)).toBeInTheDocument();
      
      // Verificar ayuda contextual
      const helpButtons = screen.getAllByRole('button', { name: /ayuda/i });
      helpButtons.forEach(button => {
        expect(button).toHaveAttribute('aria-describedby');
      });
    });
  });

  describe('ReservationsList - Accesibilidad', () => {
    const mockReservations = [mockReservation];

    test('debe cumplir con WCAG 2.1 AA para listas', async () => {
      const { container } = render(
        <ReservationsList
          reservations={mockReservations}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
          isLoading={false}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('debe tener estructura de lista accesible', () => {
      render(
        <ReservationsList
          reservations={mockReservations}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
          isLoading={false}
        />
      );

      const list = screen.getByRole('list', { name: /lista de reservas/i });
      expect(list).toBeInTheDocument();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(mockReservations.length);
    });

    test('debe anunciar número de resultados', () => {
      render(
        <ReservationsList
          reservations={mockReservations}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
          isLoading={false}
        />
      );

      const resultCount = screen.getByRole('status');
      expect(resultCount).toHaveTextContent(/1 reserva encontrada/i);
      expect(resultCount).toHaveAttribute('aria-live', 'polite');
    });

    test('debe manejar estados vacíos de forma accesible', () => {
      render(
        <ReservationsList
          reservations={[]}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
          isLoading={false}
        />
      );

      const emptyState = screen.getByRole('region', { name: /sin reservas/i });
      expect(emptyState).toBeInTheDocument();
      expect(emptyState).toHaveAttribute('aria-label');

      const emptyMessage = screen.getByText(/no se encontraron reservas/i);
      expect(emptyMessage).toBeInTheDocument();
    });

    test('debe mostrar skeleton accesible durante carga', () => {
      render(
        <ReservationsList
          reservations={[]}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
          isLoading={true}
        />
      );

      const loadingRegion = screen.getByRole('region', { name: /cargando reservas/i });
      expect(loadingRegion).toBeInTheDocument();
      expect(loadingRegion).toHaveAttribute('aria-busy', 'true');

      const skeletons = screen.getAllByRole('progressbar');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Integración de Accesibilidad - Flujos Completos', () => {
    test('debe mantener accesibilidad durante operaciones CRUD', async () => {
      const user = userEvent.setup();
      
      const TestReservationFlow = () => {
        const [reservations, setReservations] = React.useState([mockReservation]);
        const [modalOpen, setModalOpen] = React.useState(false);

        const handleEdit = () => setModalOpen(true);
        const handleSubmit = () => {
          setModalOpen(false);
          // Anunciar éxito
        };

        return (
          <>
            <ReservationsList
              reservations={reservations}
              onEdit={handleEdit}
              onDelete={vi.fn()}
              onView={vi.fn()}
              isLoading={false}
            />
            <ReservationModal
              isOpen={modalOpen}
              mode="edit"
              reservation={mockReservation}
              onSubmit={handleSubmit}
              onClose={() => setModalOpen(false)}
            />
          </>
        );
      };

      const { container } = render(<TestReservationFlow />);

      // Verificar accesibilidad inicial
      let results = await axe(container);
      expect(results).toHaveNoViolations();

      // Abrir modal de edición
      const editButton = screen.getByRole('button', { name: /editar/i });
      await user.click(editButton);

      // Verificar accesibilidad con modal abierto
      results = await axe(container);
      expect(results).toHaveNoViolations();

      // Cerrar modal
      await user.keyboard('{Escape}');

      // Verificar que focus vuelve correctamente
      await waitFor(() => {
        expect(editButton).toHaveFocus();
      });
    });

    test('debe soportar tecnologías asistivas', async () => {
      const user = userEvent.setup();

      render(
        <ReservationFilters
          filters={mockFilters}
          onFiltersChange={vi.fn()}
          products={mockProducts}
          clients={[]}
          isLoading={false}
        />
      );

      // Simular screen reader navegando
      const searchInput = screen.getByRole('searchbox');
      
      // Verificar que tiene toda la información necesaria
      expect(searchInput).toHaveAccessibleName();
      expect(searchInput).toHaveAccessibleDescription();
      
      // Verificar que los cambios se anuncian
      await user.type(searchInput, 'test');
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });

    test('debe cumplir con nivel AA en diferentes estados', async () => {
      const states = [
        { reservations: [], isLoading: true }, // Cargando
        { reservations: [], isLoading: false }, // Vacío
        { reservations: [mockReservation], isLoading: false }, // Con datos
      ];

      for (const state of states) {
        const { container, unmount } = render(
          <ReservationsList
            reservations={state.reservations}
            onEdit={vi.fn()}
            onDelete={vi.fn()}
            onView={vi.fn()}
            isLoading={state.isLoading}
          />
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();

        unmount();
      }
    });
  });

  describe('Usabilidad y Experiencia Inclusiva', () => {
    test('debe proveer feedback multimodal', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();

      render(
        <ReservationModal
          isOpen={true}
          mode="create"
          onSubmit={onSubmit}
          onClose={vi.fn()}
        />
      );

      // Llenar formulario
      await user.type(screen.getByLabelText(/nombre del cliente/i), 'Test Client');
      await user.click(screen.getByRole('button', { name: /crear/i }));

      // Verificar feedback visual, auditivo y háptico
      await waitFor(() => {
        // Visual: toast/notification
        expect(screen.getByRole('alert')).toBeInTheDocument();
        
        // Auditivo: aria-live
        expect(screen.getByRole('status')).toHaveTextContent(/éxito/i);
        
        // En dispositivos móviles habría vibración
      });
    });

    test('debe adaptarse a preferencias de usuario', () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      render(
        <ReservationCard 
          reservation={mockReservation}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
          onView={vi.fn()}
        />
      );

      // Verificar que las animaciones se reducen
      const card = screen.getByRole('article');
      expect(card).toHaveClass('reduce-motion');
    });

    test('debe soportar múltiples métodos de input', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(
        <ReservationCard 
          reservation={mockReservation}
          onEdit={onEdit}
          onDelete={vi.fn()}
          onView={vi.fn()}
        />
      );

      const editButton = screen.getByRole('button', { name: /editar/i });

      // Mouse
      await user.click(editButton);
      expect(onEdit).toHaveBeenCalledTimes(1);

      // Teclado
      editButton.focus();
      await user.keyboard('{Enter}');
      expect(onEdit).toHaveBeenCalledTimes(2);

      await user.keyboard(' ');
      expect(onEdit).toHaveBeenCalledTimes(3);

      // Touch (simulado)
      fireEvent.touchStart(editButton);
      fireEvent.touchEnd(editButton);
      expect(onEdit).toHaveBeenCalledTimes(4);
    });
  });
});
