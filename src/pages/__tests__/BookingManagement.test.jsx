/**
 * Tests MVP para BookingManagement
 * Smoke test: Verifica que el componente renderiza sin crashes
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import BookingManagement from '../BookingManagement';

// Mock de stores
const MOCK_RESERVATION_STORE = {
  reservations: [],
  loading: false,
  error: null,
  fetchReservations: vi.fn(),
  clearError: vi.fn(),
};

const MOCK_PRODUCT_STORE = {
  products: [],
  fetchProducts: vi.fn(),
  fetchProductsPaginated: vi.fn(),
  fetchCategories: vi.fn(),
};

const MOCK_CLIENT_STORE = {
  clients: [],
  searchResults: [],
  fetchClients: vi.fn(),
};

vi.mock('@/store/useReservationStore', () => ({
  __esModule: true,
  default: (sel) => (typeof sel === 'function' ? sel(MOCK_RESERVATION_STORE) : MOCK_RESERVATION_STORE),
}));

vi.mock('@/store/useProductStore', () => ({
  __esModule: true,
  default: (sel) => (typeof sel === 'function' ? sel(MOCK_PRODUCT_STORE) : MOCK_PRODUCT_STORE),
}));

vi.mock('@/store/useClientStore', () => ({
  __esModule: true,
  default: (sel) => (typeof sel === 'function' ? sel(MOCK_CLIENT_STORE) : MOCK_CLIENT_STORE),
}));

// Mock de i18n con textos esperados por este test
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key) => {
      const translations = {
        'booking.title': 'Gestión de Reservas',
        'booking.action.create': 'Nueva Reserva',
        'booking.action.back': 'Volver',
        'booking.tab.reservations': 'Reservas',
        'booking.status.confirmed': 'Confirmado',
        'booking.status.pending': 'Pendiente',
        'booking.status.cancelled': 'Cancelado',
      };
      return translations[key] || key;
    },
  }),
}));

// Wrapper con Router
const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BookingManagement - MVP Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    renderWithRouter(<BookingManagement />);
    expect(screen.getByText(/Gestión de Reservas/i)).toBeInTheDocument();
  });

  it('should display empty state when no reservations', () => {
    renderWithRouter(<BookingManagement />);
    // Verificar que muestra estado vacío o mensaje apropiado
    const emptyMessage = screen.queryByText(/Sin reservas/i) ||
                        screen.queryByText(/No hay reservas/i);
    expect(emptyMessage).toBeTruthy();
  });

  it('should display the "Nueva Reserva" button', () => {
    renderWithRouter(<BookingManagement />);
    const createButton = screen.getByText(/Nueva Reserva/i);
    expect(createButton).toBeInTheDocument();
  });

  it('should display the back button', () => {
    renderWithRouter(<BookingManagement />);
    const backButton = screen.getByLabelText(/Volver/i);
    expect(backButton).toBeInTheDocument();
  });

  it('should display tabs', () => {
    renderWithRouter(<BookingManagement />);
    const reservationsTab = screen.getByRole('tab', { name: /Reservas/i });
    expect(reservationsTab).toBeInTheDocument();
  });
});
