/**
 * PriceAdjustmentNew — page tests (alineación DESIGN.md 2026-09-29).
 * Cubre: render de filas planas con precio canónico es-PY, estado empty,
 * F2 → foco al buscador (§12.4) y navegación al detalle al seleccionar.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import PriceAdjustmentNew from '../PriceAdjustmentNew';

// Estado mutable del store mockeado (mock en la frontera del módulo consumido)
const storeState = vi.hoisted(() => ({ current: null }));
vi.mock('@/store/usePriceAdjustmentNewStore', () => ({
  default: () => storeState.current,
}));

const navigateMock = vi.hoisted(() => vi.fn());
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigateMock,
}));

const basePagination = { page: 1, page_size: 10, total: 2, total_pages: 1 };

const buildStore = (overrides = {}) => ({
  products: [
    {
      id: 1,
      product_name: 'Coca Cola 2L',
      sku: 'COC-2L',
      current_price: 12000,
    },
    {
      id: 2,
      product_name: 'Pepsi',
      variant_id: 'v2',
      variant_name: 'Pepsi 1L Manzana',
      sku: 'PEP-1L-MANZ',
      current_price: 8000,
    },
  ],
  loading: false,
  error: null,
  searchTerm: '',
  pagination: basePagination,
  searchProducts: vi.fn().mockResolvedValue(undefined),
  setSearchTerm: vi.fn(),
  clearError: vi.fn(),
  changePage: vi.fn(),
  selectProductForAdjustment: vi.fn().mockResolvedValue(undefined),
  resetState: vi.fn(),
  ...overrides,
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <PriceAdjustmentNew />
    </MemoryRouter>
  );

describe('PriceAdjustmentNew Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storeState.current = buildStore();
  });

  it('renderiza filas planas con nombre, SKU y precio canónico es-PY', () => {
    renderPage();

    expect(screen.getByText('Coca Cola 2L')).toBeInTheDocument();
    // El SKU aparece en la celda de nombre y en la columna ID
    expect(screen.getAllByText('COC-2L').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Gs. 12.000')).toBeInTheDocument();

    // Fila plana: la variante indica su producto padre
    expect(screen.getByText(/Producto padre: Pepsi/)).toBeInTheDocument();
    expect(screen.getByText('Gs. 8.000')).toBeInTheDocument();
  });

  it('estado empty: sin productos muestra EmptyState y no renderiza tabla (§6.7)', () => {
    storeState.current = buildStore({
      products: [],
      pagination: { page: 1, page_size: 10, total: 0, total_pages: 0 },
    });
    renderPage();

    expect(screen.getByText('Sin resultados')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('F2 enfoca el buscador de la página (§12.4)', () => {
    renderPage();

    const search = screen.getByPlaceholderText(/Buscar por nombre o ID de producto/);
    fireEvent.keyDown(document, { key: 'F2' });

    expect(search).toBe(document.activeElement);
  });

  it('Seleccionar resuelve el producto y navega al detalle', async () => {
    renderPage();

    fireEvent.click(screen.getAllByRole('button', { name: 'Seleccionar' })[0]);

    await waitFor(() => {
      expect(storeState.current.selectProductForAdjustment).toHaveBeenCalledWith(1);
    });
    expect(navigateMock).toHaveBeenCalledWith(
      '/ajustes-precios/detalle',
      expect.objectContaining({
        state: expect.objectContaining({
          selectedProduct: expect.objectContaining({ id: 1 }),
        }),
      })
    );
  });
});
