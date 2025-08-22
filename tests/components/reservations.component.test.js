/**
 * Test de Componentes de Reservas - Verificación Programática
 * Verifica que los componentes funcionen correctamente
 */

import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ReservationModal from '../src/components/reservations/ReservationModal';
import ReservationFilters from '../src/components/reservations/ReservationFilters';

// Mock del hook useI18n
const mockT = (key, vars) => {
  const translations = {
    'reservations.modal.create_title': 'Nueva Reserva',
    'reservations.modal.product_label': 'Producto/Servicio *',
    'reservations.modal.client_label': 'Cliente *',
    'reservations.filters.title': 'Filtros',
    'reservations.filters.status_label': 'Estado',
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar'
  };
  
  let result = translations[key] || key;
  if (vars) {
    Object.keys(vars).forEach(varKey => {
      result = result.replace(new RegExp(`\\{${varKey}\\}`, 'g'), vars[varKey]);
    });
  }
  return result;
};

jest.mock('../src/lib/i18n', () => ({
  useI18n: () => ({ t: mockT })
}));

describe('ReservationModal', () => {
  test('renders create modal correctly', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();
    
    render(
      <ReservationModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="create"
      />
    );
    
    // Verificar título
    expect(screen.getByText('Nueva Reserva')).toBeInTheDocument();
    
    // Verificar campos requeridos
    expect(screen.getByText('Producto/Servicio *')).toBeInTheDocument();
    expect(screen.getByText('Cliente *')).toBeInTheDocument();
    
    // Verificar botones
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Guardar')).toBeInTheDocument();
  });
  
  test('handles form submission', () => {
    const mockOnClose = jest.fn();
    const mockOnSubmit = jest.fn();
    
    render(
      <ReservationModal
        isOpen={true}
        onClose={mockOnClose}
        onSubmit={mockOnSubmit}
        mode="create"
      />
    );
    
    // Simular click en botón guardar
    const saveButton = screen.getByText('Guardar');
    fireEvent.click(saveButton);
    
    // Verificar que se muestre validación (campos requeridos vacíos)
    expect(screen.getByText('Selecciona un producto')).toBeInTheDocument();
  });
});

describe('ReservationFilters', () => {
  test('renders filters correctly', () => {
    const mockOnFiltersChange = jest.fn();
    const mockOnClose = jest.fn();
    
    render(
      <ReservationFilters
        onFiltersChange={mockOnFiltersChange}
        onClose={mockOnClose}
      />
    );
    
    // Verificar título
    expect(screen.getByText('Filtros')).toBeInTheDocument();
    
    // Verificar campo de estado
    expect(screen.getByText('Estado')).toBeInTheDocument();
    
    // Verificar filtros rápidos
    expect(screen.getByText('Hoy')).toBeInTheDocument();
    expect(screen.getByText('Esta Semana')).toBeInTheDocument();
  });
  
  test('applies quick filters', () => {
    const mockOnFiltersChange = jest.fn();
    const mockOnClose = jest.fn();
    
    render(
      <ReservationFilters
        onFiltersChange={mockOnFiltersChange}
        onClose={mockOnClose}
      />
    );
    
    // Simular click en filtro rápido "Hoy"
    const todayFilter = screen.getByText('Hoy');
    fireEvent.click(todayFilter);
    
    // Verificar que la fecha actual se estableció
    const today = new Date().toISOString().split('T')[0];
    const dateInput = screen.getByDisplayValue(today);
    expect(dateInput).toBeInTheDocument();
  });
});

export default 'test-complete';
