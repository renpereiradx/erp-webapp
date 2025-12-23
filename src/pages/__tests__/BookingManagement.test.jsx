/**
 * Tests MVP para BookingManagement
 * Smoke test: Verifica que el componente renderiza sin crashes
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import BookingManagement from '../BookingManagement';

// Mock de stores
vi.mock('@/store/useReservationStore', () => ({
  default: () => ({
    reservations: [],
    loading: false,
    error: null,
    fetchReservations: vi.fn(),
    clearError: vi.fn(),
  }),
}));

vi.mock('@/store/useProductStore', () => ({
  default: () => ({
    products: [],
    fetchProducts: vi.fn(),
  }),
}));

vi.mock('@/store/useClientStore', () => ({
  default: () => ({
    clients: [],
    fetchClients: vi.fn(),
  }),
}));

// Mock de i18n
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key, fallback) => fallback || key,
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
    const reservationsTab = screen.getByText(/Reservas/i);
    expect(reservationsTab).toBeInTheDocument();
  });
});
