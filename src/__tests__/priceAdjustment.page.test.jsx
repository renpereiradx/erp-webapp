/**
 * Tests para PriceAdjustmentHistory
 * Adaptados al componente real que usa priceAdjustmentService directamente.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PriceAdjustmentHistory from '../pages/PriceAdjustmentHistory';
import { priceAdjustmentService } from '@/services/priceAdjustmentService';

// Mock de servicios
vi.mock('@/services/priceAdjustmentService', () => ({
  priceAdjustmentService: {
    getRecentAdjustments: vi.fn(),
  }
}));

// Mock de i18n
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key) => {
      const trans = {
        'priceAdjustmentHistory.title': 'Historial de Ajustes',
        'priceAdjustmentHistory.filters.title': 'Filtros de Búsqueda',
        'priceAdjustmentHistory.filters.product': 'Producto',
        'priceAdjustmentHistory.filters.productPlaceholder': 'Buscar por producto...',
        'priceAdjustmentHistory.empty.title': 'Sin ajustes de precios',
        'priceAdjustmentHistory.empty.description': 'No se encontraron resultados',
        'priceAdjustmentHistory.table.product': 'Producto',
        'priceAdjustmentHistory.results.showing': 'Mostrando',
      };
      return trans[key] || key;
    }
  })
}));

// Mock de lucide-react para evitar problemas de renderizado
vi.mock('lucide-react', () => ({
  RefreshCw: () => null,
  Download: () => null,
  ChevronLeft: () => null,
  ChevronRight: () => null,
  ArrowDown: () => null,
  ArrowUp: () => null,
  ArrowLeftRight: () => null,
  Search: () => null,
}));

describe('PriceAdjustmentHistory Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default success response
    priceAdjustmentService.getRecentAdjustments.mockResolvedValue({
      data: [
        {
          id: '1',
          adjustment_id: 'ADJ-001',
          product_name: 'Product Test',
          old_value: 100,
          new_value: 110,
          user_id: 'User 1',
          adjustment_date: new Date().toISOString(),
          unit: 'Unit 1',
        }
      ],
      total: 1
    });
  });

  it('should render and fetch data on mount', async () => {
    render(<PriceAdjustmentHistory />);
    
    // Check for title or filters title
    expect(screen.getByText('Filtros de Búsqueda')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(priceAdjustmentService.getRecentAdjustments).toHaveBeenCalled();
    });
  });

  it('should render adjustments list when data exists', async () => {
    render(<PriceAdjustmentHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Product Test')).toBeInTheDocument();
      expect(screen.getByText('ADJ-001')).toBeInTheDocument();
    });
  });

  it('should show empty state when no data is returned', async () => {
    priceAdjustmentService.getRecentAdjustments.mockResolvedValue({
      data: [],
      total: 0
    });
    
    render(<PriceAdjustmentHistory />);
    
    await waitFor(() => {
      expect(screen.getByText('Sin ajustes de precios')).toBeInTheDocument();
    });
  });

  it('should handle filters correctly', async () => {
    render(<PriceAdjustmentHistory />);
    
    const productInput = screen.getByPlaceholderText('Buscar por producto...');
    fireEvent.change(productInput, { target: { value: 'banana' } });
    
    const applyButton = screen.getByText('priceAdjustmentHistory.filters.apply');
    fireEvent.click(applyButton);
    
    await waitFor(() => {
      expect(priceAdjustmentService.getRecentAdjustments).toHaveBeenCalledWith(
        expect.objectContaining({ product: 'banana' })
      );
    });
  });
});
