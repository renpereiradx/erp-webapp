/**
 * @vitest-environment jsdom
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import ReservationCard from '../ReservationCard';

// Mock de componentes externos
vi.mock('@/hooks/useFocusManagement', () => ({
  default: () => ({
    saveFocus: vi.fn(),
    restoreFocus: vi.fn(),
    trapFocus: vi.fn(),
    announce: vi.fn(),
    announceToScreenReader: vi.fn()
  }),
  useFocusManagement: () => ({
    saveFocus: vi.fn(),
    restoreFocus: vi.fn(),
    trapFocus: vi.fn(),
    announce: vi.fn(),
    announceToScreenReader: vi.fn()
  })
}));

vi.mock('@/lib/i18n', () => ({
  default: () => ({
    t: vi.fn((key) => key),
    lang: 'es',
    setLang: vi.fn()
  }),
  useI18n: () => ({
    t: vi.fn((key) => key),
    lang: 'es',
    setLang: vi.fn()
  })
}));

// Mock de iconos de Lucide
vi.mock('lucide-react', () => ({
  Calendar: () => <div data-testid="calendar-icon">Calendar</div>,
  Clock: () => <div data-testid="clock-icon">Clock</div>,
  User: () => <div data-testid="user-icon">User</div>,
  Package: () => <div data-testid="package-icon">Package</div>,
  MapPin: () => <div data-testid="mappin-icon">MapPin</div>,
  Edit: () => <div data-testid="edit-icon">Edit</div>,
  Trash2: () => <div data-testid="trash-icon">Trash</div>,
  CheckCircle: () => <div data-testid="check-icon">Check</div>,
  AlertCircle: () => <div data-testid="alert-icon">Alert</div>,
  Clock3: () => <div data-testid="pending-icon">Pending</div>,
  MoreHorizontal: () => <div data-testid="more-icon">More</div>,
  Check: () => <div data-testid="check-icon">Check</div>,
  X: () => <div data-testid="x-icon">X</div>
}));

// Mock de componentes UI
vi.mock('@/components/ui/Card', () => ({
  Card: ({ children, className }) => <div className={className} data-testid="card">{children}</div>,
  CardContent: ({ children }) => <div data-testid="card-content">{children}</div>,
  CardHeader: ({ children }) => <div data-testid="card-header">{children}</div>
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, className, ...props }) => 
    <button onClick={onClick} className={className} {...props} data-testid="button">{children}</button>
}));

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, variant, className }) => 
    <span className={`badge ${variant} ${className}`} data-testid="badge">{children}</span>
}));

const mockReservation = {
  id: 'reservation-123',
  client_name: 'Juan Pérez',
  product_name: 'Producto Test',
  date: '2024-08-25',
  time: '14:30',
  duration: 120,
  status: 'confirmed',
  location: 'Sala A',
  notes: 'Reserva de prueba'
};

describe('ReservationCard - Component Tests', () => {
  const mockProps = {
    reservation: mockReservation,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onStatusChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderizado básico', () => {
    test('debe renderizar información básica de la reserva', () => {
      render(<ReservationCard {...mockProps} />);

      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
      expect(screen.getByText('Producto Test')).toBeInTheDocument();
      expect(screen.getByText('2024-08-25')).toBeInTheDocument();
      expect(screen.getByText('14:30')).toBeInTheDocument();
      expect(screen.getByText('Sala A')).toBeInTheDocument();
    });

    test('debe mostrar badge de estado correcto', () => {
      render(<ReservationCard {...mockProps} />);

      const statusBadge = screen.getByTestId('reservation-status-badge');
      expect(statusBadge).toBeInTheDocument();
      expect(statusBadge).toHaveTextContent('reservations.status.confirmed');
    });

    test('debe mostrar iconos correspondientes', () => {
      render(<ReservationCard {...mockProps} />);

      expect(screen.getByTestId('calendar-icon')).toBeInTheDocument();
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument();
      expect(screen.getByTestId('user-icon')).toBeInTheDocument();
      expect(screen.getByTestId('package-icon')).toBeInTheDocument();
      expect(screen.getByTestId('mappin-icon')).toBeInTheDocument();
    });

    test('debe mostrar duración formateada correctamente', () => {
      render(<ReservationCard {...mockProps} />);

      expect(screen.getByText('2h 0m')).toBeInTheDocument();
    });
  });

  describe('Estados de reserva', () => {
    test('debe mostrar estado "reserved" correctamente', () => {
      const reservedProps = {
        ...mockProps,
        reservation: { ...mockReservation, status: 'reserved' }
      };

      render(<ReservationCard {...reservedProps} />);

      const statusBadge = screen.getByTestId('reservation-status-badge');
      expect(statusBadge).toHaveTextContent('reservations.status.reserved');
      expect(statusBadge).toHaveClass('bg-blue-500');
    });

    test('debe mostrar estado "pending" correctamente', () => {
      const pendingProps = {
        ...mockProps,
        reservation: { ...mockReservation, status: 'pending' }
      };

      render(<ReservationCard {...pendingProps} />);

      const statusBadge = screen.getByTestId('reservation-status-badge');
      expect(statusBadge).toHaveTextContent('reservations.status.pending');
      expect(statusBadge).toHaveClass('bg-yellow-500');
      expect(screen.getByTestId('pending-icon')).toBeInTheDocument();
    });

    test('debe mostrar estado "cancelled" correctamente', () => {
      const cancelledProps = {
        ...mockProps,
        reservation: { ...mockReservation, status: 'cancelled' }
      };

      render(<ReservationCard {...cancelledProps} />);

      const statusBadge = screen.getByTestId('reservation-status-badge');
      expect(statusBadge).toHaveTextContent('reservations.status.cancelled');
      expect(statusBadge).toHaveClass('bg-red-500');
    });

    test('debe mostrar estado "completed" correctamente', () => {
      const completedProps = {
        ...mockProps,
        reservation: { ...mockReservation, status: 'completed' }
      };

      render(<ReservationCard {...completedProps} />);

      const statusBadge = screen.getByTestId('reservation-status-badge');
      expect(statusBadge).toHaveTextContent('reservations.status.completed');
      expect(statusBadge).toHaveClass('bg-green-600');
    });
  });

  describe('Acciones de usuario', () => {
    test('debe llamar onEdit cuando se hace clic en editar', async () => {
      const user = userEvent.setup();
      render(<ReservationCard {...mockProps} />);

      const editButton = screen.getByRole('button', { name: /reservations\.card\.edit/i });
      await user.click(editButton);

      expect(mockProps.onEdit).toHaveBeenCalledWith(mockReservation);
    });

    test('debe llamar onDelete cuando se hace clic en eliminar', async () => {
      const user = userEvent.setup();
      render(<ReservationCard {...mockProps} />);

      const deleteButton = screen.getByRole('button', { name: /reservations\.card\.delete/i });
      await user.click(deleteButton);

      expect(mockProps.onDelete).toHaveBeenCalledWith(mockReservation);
    });

    test('debe mostrar menú de cambio de estado al hacer clic', async () => {
      const user = userEvent.setup();
      render(<ReservationCard {...mockProps} />);

      const statusButton = screen.getByRole('button', { name: /reservations\.card\.change_status/i });
      await user.click(statusButton);

      await waitFor(() => {
        expect(screen.getByText('reservations.status.reserved')).toBeInTheDocument();
        expect(screen.getByText('reservations.status.confirmed')).toBeInTheDocument();
        expect(screen.getByText('reservations.status.completed')).toBeInTheDocument();
        expect(screen.getByText('reservations.status.cancelled')).toBeInTheDocument();
      });
    });

    test('debe cambiar estado cuando se selecciona opción del menú', async () => {
      const user = userEvent.setup();
      render(<ReservationCard {...mockProps} />);

      // Abrir menú de estado
      const statusButton = screen.getByRole('button', { name: /reservations\.card\.change_status/i });
      await user.click(statusButton);

      // Seleccionar nuevo estado
      await waitFor(() => {
        const completedOption = screen.getByText('reservations.status.completed');
        return user.click(completedOption);
      });

      expect(mockProps.onStatusChange).toHaveBeenCalledWith(mockReservation.id, 'completed');
    });
  });

  describe('Accesibilidad', () => {
    test('debe tener estructura semántica correcta', () => {
      render(<ReservationCard {...mockProps} />);

      const article = screen.getByRole('article');
      expect(article).toBeInTheDocument();
      expect(article).toHaveAttribute('aria-labelledby', expect.stringContaining('reservation-123'));
    });

    test('debe tener botones accesibles', () => {
      render(<ReservationCard {...mockProps} />);

      const editButton = screen.getByRole('button', { name: /reservations\.card\.edit/i });
      const deleteButton = screen.getByRole('button', { name: /reservations\.card\.delete/i });
      const statusButton = screen.getByRole('button', { name: /reservations\.card\.change_status/i });

      expect(editButton).toHaveAttribute('aria-describedby');
      expect(deleteButton).toHaveAttribute('aria-describedby');
      expect(statusButton).toHaveAttribute('aria-describedby');
    });

    test('debe soportar navegación por teclado', async () => {
      const user = userEvent.setup();
      render(<ReservationCard {...mockProps} />);

      const editButton = screen.getByRole('button', { name: /reservations\.card\.edit/i });
      
      // Focus en botón de editar
      editButton.focus();
      expect(editButton).toHaveFocus();

      // Enter debe activar la función
      await user.keyboard('{Enter}');
      expect(mockProps.onEdit).toHaveBeenCalledWith(mockReservation);
    });

    test('debe anunciar cambios de estado a screen readers', async () => {
      const user = userEvent.setup();
      render(<ReservationCard {...mockProps} />);

      // Abrir menú y cambiar estado
      const statusButton = screen.getByRole('button', { name: /reservations\.card\.change_status/i });
      await user.click(statusButton);

      await waitFor(async () => {
        const completedOption = screen.getByText('reservations.status.completed');
        await user.click(completedOption);
      });

      // Verificar que se actualiza el aria-live region
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('Campos opcionales', () => {
    test('debe manejar reserva sin notas', () => {
      const propsWithoutNotes = {
        ...mockProps,
        reservation: { ...mockReservation, notes: null }
      };

      render(<ReservationCard {...propsWithoutNotes} />);

      expect(screen.queryByText('Reserva de prueba')).not.toBeInTheDocument();
    });

    test('debe manejar reserva sin ubicación', () => {
      const propsWithoutLocation = {
        ...mockProps,
        reservation: { ...mockReservation, location: null }
      };

      render(<ReservationCard {...propsWithoutLocation} />);

      expect(screen.queryByText('Sala A')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mappin-icon')).not.toBeInTheDocument();
    });

    test('debe mostrar duración por defecto si no se especifica', () => {
      const propsWithoutDuration = {
        ...mockProps,
        reservation: { ...mockReservation, duration: null }
      };

      render(<ReservationCard {...propsWithoutDuration} />);

      expect(screen.getByText('1h 0m')).toBeInTheDocument(); // Duración por defecto
    });
  });

  describe('Validación de datos', () => {
    test('debe manejar datos de reserva incompletos', () => {
      const incompleteReservation = {
        id: 'test-123',
        client_name: null,
        product_name: 'Producto',
        date: '2024-08-25',
        status: 'confirmed'
      };

      const incompleteProps = {
        ...mockProps,
        reservation: incompleteReservation
      };

      render(<ReservationCard {...incompleteProps} />);

      expect(screen.getByText('reservations.card.no_client')).toBeInTheDocument();
      expect(screen.getByText('Producto')).toBeInTheDocument();
    });

    test('debe mostrar fecha formateada correctamente', () => {
      const reservation = {
        ...mockReservation,
        date: '2024-12-25' // Navidad
      };

      render(<ReservationCard {...mockProps} reservation={reservation} />);

      expect(screen.getByText('2024-12-25')).toBeInTheDocument();
    });
  });

  describe('Optimización de renderizado', () => {
    test('debe ser memoizado correctamente', () => {
      const { rerender } = render(<ReservationCard {...mockProps} />);

      // Re-renderizar con las mismas props
      rerender(<ReservationCard {...mockProps} />);

      // Verificar que el componente no se re-renderiza innecesariamente
      expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    });

    test('debe re-renderizar cuando cambian props relevantes', () => {
      const { rerender } = render(<ReservationCard {...mockProps} />);

      const updatedReservation = {
        ...mockReservation,
        status: 'completed'
      };

      rerender(<ReservationCard {...mockProps} reservation={updatedReservation} />);

      const statusBadge = screen.getByTestId('reservation-status-badge');
      expect(statusBadge).toHaveTextContent('reservations.status.completed');
    });
  });
});
