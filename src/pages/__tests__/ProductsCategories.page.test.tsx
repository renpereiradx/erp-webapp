/**
 * Tests de página: ProductsCategories (sales-analytics).
 * Addendum VERIFICACION_POST_CIERRE 2026-09-21 (pendiente 5): el indicador
 * fabricado "+12% vs mes anterior" y los botones muertos (Exportar/Exportar
 * CSV/Nuevo Producto/Ver Reporte Completo/Ver todos) no deben volver.
 * Mock en la frontera del servicio; i18n real (namespace bi.* registrado
 * síncrono en vitest.setup), asserts contra strings reales de locales/es.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ProductsCategories from '../sales-analytics/ProductsCategories';
import salesAnalyticsService from '@/services/bi/salesAnalyticsService';

vi.mock('@/services/bi/salesAnalyticsService', () => ({
  default: { getByCategory: vi.fn(), getByProduct: vi.fn() },
  salesAnalyticsService: { getByCategory: vi.fn(), getByProduct: vi.fn() },
}));

const mockService = salesAnalyticsService as unknown as {
  getByCategory: ReturnType<typeof vi.fn>;
  getByProduct: ReturnType<typeof vi.fn>;
};

const categoriesPayload = {
  success: true,
  data: {
    total_sales: 15_000_000,
    categories: [
      {
        category_id: 'c1',
        category_name: 'Bebidas',
        sales: 10_000_000,
        percentage: 66.7,
        units_sold: 120,
        gross_margin_pct: 31.5,
        top_product: 'Coca-Cola 2L',
      },
      {
        category_id: 'c2',
        category_name: 'Snacks',
        sales: 5_000_000,
        percentage: 33.3,
        units_sold: 60,
        gross_margin_pct: 22,
        top_product: 'Papas Lays',
      },
    ],
  },
};

const productsPayload = {
  success: true,
  data: {
    products: [
      {
        product_id: 'p1',
        product_name: 'Coca-Cola 2L',
        sku: 'SKU-001',
        category_name: 'Bebidas',
        sales: 500_000,
        units_sold: 20,
        average_price: 25_000,
        gross_margin_pct: 30,
        growth_pct: 12.4,
      },
    ],
    pagination: { page: 1, total_pages: 2, total_items: 15 },
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockService.getByCategory.mockResolvedValue(categoriesPayload);
  mockService.getByProduct.mockResolvedValue(productsPayload);
});

describe('ProductsCategories', () => {
  it('renderiza KPIs y tablas con datos reales del servicio', async () => {
    render(<ProductsCategories />);

    expect(await screen.findByText('Analítica de Productos y Categorías')).toBeInTheDocument();
    expect(screen.getByText(/15\.000\.000/)).toBeInTheDocument();
    expect(screen.getByText('Ventas por Categoría')).toBeInTheDocument();
    // visible en tarjeta top performer, tablas y listado
    expect(screen.getAllByText('Coca-Cola 2L').length).toBeGreaterThan(0);
    expect(screen.getByText('Listado Detallado de Productos')).toBeInTheDocument();
    // crecimiento computado de los datos, no un literal
    expect(screen.getByText('+12.4%')).toBeInTheDocument();
  });

  it('no renderiza el dato fabricado "+12% vs mes anterior" ni botones muertos', async () => {
    render(<ProductsCategories />);

    await screen.findByText('Analítica de Productos y Categorías');
    expect(screen.queryByText(/\+12% vs mes anterior/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /exportar/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /nuevo producto/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ver reporte/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ver todos/i })).not.toBeInTheDocument();
  });

  it('pagina el listado server-side con page_size 10', async () => {
    render(<ProductsCategories />);

    await screen.findByText('Listado Detallado de Productos');
    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }));

    await waitFor(() => {
      expect(mockService.getByProduct).toHaveBeenCalledWith(
        expect.objectContaining({ page: 2, page_size: 10 })
      );
    });
  });

  it('cambia el periodo y refetcha ambas fuentes', async () => {
    render(<ProductsCategories />);

    await screen.findByText('Analítica de Productos y Categorías');
    await userEvent.click(screen.getByRole('button', { name: 'Semana' }));

    await waitFor(() => {
      expect(mockService.getByCategory).toHaveBeenCalledWith({ period: 'week' });
      expect(mockService.getByProduct).toHaveBeenCalledWith(
        expect.objectContaining({ period: 'week' })
      );
    });
  });

  it('muestra estado vacío cuando no hay categorías', async () => {
    mockService.getByCategory.mockResolvedValue({
      success: true,
      data: { total_sales: 0, categories: [] },
    });

    render(<ProductsCategories />);

    expect(await screen.findByText('No hay datos por categoría')).toBeInTheDocument();
  });

  it('muestra estado de error y reintenta la carga', async () => {
    mockService.getByCategory.mockRejectedValueOnce(new Error('network down'));

    render(<ProductsCategories />);

    expect(await screen.findByText('Error de Conexión')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar Carga' }));

    await waitFor(() => {
      expect(mockService.getByCategory).toHaveBeenCalledTimes(2);
    });
  });
});
