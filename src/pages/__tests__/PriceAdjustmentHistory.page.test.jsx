/**
 * PriceAdjustmentHistory — page tests.
 * Cubre el filtrado server-side (FASE filtros historial 2026-09-14): draft vs
 * applied filters, rango de fechas ISO directo al backend, validación de
 * rango invertido y total server-side para la paginación.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PriceAdjustmentHistory from '../PriceAdjustmentHistory';
import { priceAdjustmentService } from '@/services/priceAdjustmentService';

vi.mock('@/services/priceAdjustmentService', () => ({
  priceAdjustmentService: {
    getByDateRange: vi.fn(),
  }
}));

// Mock de i18n con el diccionario que usa la página. `t` se crea UNA vez en
// el factory: si fuera nueva por render, fetchAdjustments (que la usa) cambiaría
// de identidad en cada render y el efecto refetchearía en bucle.
vi.mock('@/lib/i18n', () => {
  const t = (key) => {
    const trans = {
      'priceAdjustmentHistory.title': 'Historial de Ajustes',
      'priceAdjustmentHistory.filters.title': 'Filtros de Búsqueda',
      'priceAdjustmentHistory.filters.product': 'Producto',
      'priceAdjustmentHistory.filters.productPlaceholder': 'Buscar por nombre o SKU',
      'priceAdjustmentHistory.filters.user': 'Usuario',
      'priceAdjustmentHistory.filters.userPlaceholder': 'Buscar por nombre o ID',
      'priceAdjustmentHistory.filters.unit': 'Unidad',
      'priceAdjustmentHistory.filters.unitPlaceholder': 'Seleccionar unidad',
      'priceAdjustmentHistory.filters.adjustmentType': 'Tipo de Ajuste',
      'priceAdjustmentHistory.filters.adjustmentTypePlaceholder': 'Seleccionar tipo',
      'priceAdjustmentHistory.filters.dateFromPlaceholder': 'Fecha de inicio',
      'priceAdjustmentHistory.filters.dateToPlaceholder': 'Fecha de fin',
      'priceAdjustmentHistory.filters.apply': 'Aplicar Filtros',
      'priceAdjustmentHistory.filters.clear': 'Limpiar Filtros',
      'priceAdjustmentHistory.filters.dateRangeError': 'La fecha de inicio no puede ser mayor a la fecha de fin',
      'priceAdjustmentHistory.empty.title': 'No se encontraron resultados',
      'priceAdjustmentHistory.results.showing': 'Mostrando',
      'priceAdjustmentHistory.results.to': 'a',
      'priceAdjustmentHistory.results.of': 'de',
      'priceAdjustmentHistory.results.results': 'resultados',
      'priceAdjustmentHistory.table.product': 'Producto',
      'priceAdjustmentHistory.type.increase': 'Aumento',
      'priceAdjustmentHistory.type.decrease': 'Descuento',
      'priceAdjustmentHistory.type.correction': 'Corrección',
      'priceAdjustmentHistory.adjustmentType.MANUAL_ADJUSTMENT': 'Ajuste Manual',
    };
    return trans[key] || key;
  };
  return {
    useI18n: () => ({ t })
  };
});

describe('PriceAdjustmentHistory Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default success response
    priceAdjustmentService.getByDateRange.mockResolvedValue({
      data: [
        {
          id: '1',
          adjustment_id: 'ADJ-001',
          product_name: 'Product Test',
          old_value: 100,
          new_value: 110,
          user_id: 'abc123',
          user_name: 'User 1',
          adjustment_date: new Date().toISOString(),
          unit: 'unit',
          metadata: { adjustment_type: 'MANUAL_ADJUSTMENT' },
        }
      ],
      total: 1
    });
  });

  it('should render and fetch data on mount without filters', async () => {
    render(<PriceAdjustmentHistory />);

    expect(screen.getByText('Filtros de Búsqueda')).toBeInTheDocument();

    await waitFor(() => {
      expect(priceAdjustmentService.getByDateRange).toHaveBeenCalledWith(
        '', '', '', 25, 0,
        { user: '', unit: '', adjustment_type: '' }
      );
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
    priceAdjustmentService.getByDateRange.mockResolvedValue({
      data: [],
      total: 0
    });

    render(<PriceAdjustmentHistory />);

    await waitFor(() => {
      expect(screen.getByText('No se encontraron resultados')).toBeInTheDocument();
    });
  });

  it('should apply product filter server-side on Aplicar Filtros', async () => {
    render(<PriceAdjustmentHistory />);

    await waitFor(() => {
      expect(priceAdjustmentService.getByDateRange).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o SKU'), {
      target: { value: 'banana' }
    });

    // Tipear NO refetchea: sigue en 1 llamada hasta aplicar.
    expect(priceAdjustmentService.getByDateRange).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByText('Aplicar Filtros'));

    await waitFor(() => {
      expect(priceAdjustmentService.getByDateRange).toHaveBeenLastCalledWith(
        '', '', 'banana', 25, 0,
        { user: '', unit: '', adjustment_type: '' }
      );
    });
  });

  it('should send ISO date range to the backend when applied', async () => {
    render(<PriceAdjustmentHistory />);

    await waitFor(() => {
      expect(priceAdjustmentService.getByDateRange).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2026-09-01' } });
    fireEvent.change(screen.getByLabelText('Fecha de fin'), { target: { value: '2026-09-30' } });
    fireEvent.click(screen.getByText('Aplicar Filtros'));

    await waitFor(() => {
      expect(priceAdjustmentService.getByDateRange).toHaveBeenLastCalledWith(
        '2026-09-01', '2026-09-30', '', 25, 0,
        { user: '', unit: '', adjustment_type: '' }
      );
    });
  });

  it('should reject an inverted date range without fetching', async () => {
    render(<PriceAdjustmentHistory />);

    await waitFor(() => {
      expect(priceAdjustmentService.getByDateRange).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByLabelText('Fecha de inicio'), { target: { value: '2026-09-30' } });
    fireEvent.change(screen.getByLabelText('Fecha de fin'), { target: { value: '2026-09-01' } });
    fireEvent.click(screen.getByText('Aplicar Filtros'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
    // La llamada extra (con rango invertido) nunca ocurre.
    expect(priceAdjustmentService.getByDateRange).toHaveBeenCalledTimes(1);
  });

  it('should clear filters and refetch without them', async () => {
    render(<PriceAdjustmentHistory />);

    await waitFor(() => {
      expect(priceAdjustmentService.getByDateRange).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByPlaceholderText('Buscar por nombre o SKU'), {
      target: { value: 'banana' }
    });
    fireEvent.click(screen.getByText('Aplicar Filtros'));

    await waitFor(() => {
      expect(priceAdjustmentService.getByDateRange).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(screen.getByText('Limpiar Filtros'));

    await waitFor(() => {
      expect(priceAdjustmentService.getByDateRange).toHaveBeenLastCalledWith(
        '', '', '', 25, 0,
        { user: '', unit: '', adjustment_type: '' }
      );
    });
  });
});
