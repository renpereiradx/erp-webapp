/**
 * PriceAdjustmentHistory — page tests.
 * Movido desde src/__tests__/priceAdjustment.page.test.jsx. Cambios según el
 * diseño de tests: sin mock de lucide-react (jsdom renderiza los SVG) y con
 * el diccionario i18n local completo para las keys que aserta el test.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PriceAdjustmentHistory from '../PriceAdjustmentHistory';
import { priceAdjustmentService } from '@/services/priceAdjustmentService';

vi.mock('@/services/priceAdjustmentService', () => ({
  priceAdjustmentService: {
    getRecentAdjustments: vi.fn(),
  }
}));

// Mock de i18n con el diccionario que usa la página.
vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key) => {
      const trans = {
        'priceAdjustmentHistory.title': 'Historial de Ajustes',
        'priceAdjustmentHistory.filters.title': 'Filtros de Búsqueda',
        'priceAdjustmentHistory.filters.product': 'Producto',
        'priceAdjustmentHistory.filters.productPlaceholder': 'Buscar por producto...',
        'priceAdjustmentHistory.filters.apply': 'Aplicar Filtros',
        'priceAdjustmentHistory.filters.clear': 'Limpiar Filtros',
        'priceAdjustmentHistory.empty.title': 'Sin ajustes de precios',
        'priceAdjustmentHistory.empty.description': 'No se encontraron resultados',
        'priceAdjustmentHistory.table.product': 'Producto',
        'priceAdjustmentHistory.results.showing': 'Mostrando',
      };
      return trans[key] || key;
    }
  })
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

  it('should apply product filter and refetch', async () => {
    render(<PriceAdjustmentHistory />);

    const productInput = screen.getByPlaceholderText('Buscar por producto...');
    fireEvent.change(productInput, { target: { value: 'banana' } });

    fireEvent.click(screen.getByText('Aplicar Filtros'));

    await waitFor(() => {
      expect(priceAdjustmentService.getRecentAdjustments).toHaveBeenCalledWith(
        expect.objectContaining({ product: 'banana' })
      );
    });
  });
});
