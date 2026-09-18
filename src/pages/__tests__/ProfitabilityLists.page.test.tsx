/**
 * Tests FASE 2 (plan alineación BI): páginas de lista de rentabilidad
 * (Product / Customer / Category). Mock del hook del feature.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProductProfitability from '@/features/profitability/components/ProductProfitability';
import CustomerProfitability from '@/features/profitability/components/CustomerProfitability';
import CategoryProfitability from '@/features/profitability/components/CategoryProfitability';
import { useProfitability } from '@/features/profitability/hooks/useProfitability';

vi.mock('@/features/profitability/hooks/useProfitability', () => ({
  useProfitability: vi.fn(),
}));

const mockUse = useProfitability as unknown as ReturnType<typeof vi.fn>;

const productsData = {
  products: [
    { product_id: 'p1', product_name: 'Mate Imperial', sku: 'MAT-001', units_sold: 12, revenue: 900000, gross_profit: 300000, gross_margin_pct: 33.3, markup: 50, performance: 'EXCELLENT' },
    { product_id: 'p2', product_name: 'Termo Perdido', sku: 'TER-002', units_sold: 2, revenue: 100000, gross_profit: -20000, gross_margin_pct: -20, markup: -16.7, performance: 'LOSS' },
  ],
  summary: { total_products: 240, total_products_growth: 3, average_margin: 28.5, margin_growth: 1.1, total_profit: 5200000, profit_growth: -0.4 },
  pagination: { page: 1, total_items: 240, total_pages: 24 },
};

const customersData = {
  customers: [
    { customer_id: 'c1', customer_name: 'Despensa Central', segment: 'PLATINUM', total_purchases: 31, total_revenue: 8200000, gross_profit: 2400000, gross_margin_pct: 29.3 },
  ],
  summary: {
    active_customers: 182, active_customers_growth: 4, average_customer_value: 450000,
    avg_value_growth: 2.1, top_customers_pct: 61.5, top_customers_variation: 0.8, inactive_risk_customers: 7,
  },
};

const categoriesData = {
  categories: [
    { category_id: 'g1', category_name: 'Termos', product_count: 24, units_sold: 310, revenue: 5200000, revenue_contribution_pct: 42, gross_profit: 1500000, gross_margin_pct: 28.8 },
    { category_id: 'g2', category_name: 'Accesorios', product_count: 61, units_sold: 88, revenue: 900000, revenue_contribution_pct: 7, gross_profit: 60000, gross_margin_pct: 6.7 },
  ],
  summary: {
    total_profit: 2100000, total_profit_growth: 1.9,
    most_profitable_name: 'Termos', most_profitable_value: 1500000, most_profitable_growth: 2.4,
    least_profitable_name: 'Accesorios', least_profitable_margin: 6.7,
  },
};

const renderWith = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('ProductProfitability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUse.mockReturnValue({ data: productsData, loading: false, error: null, refresh: vi.fn() });
  });

  it('muestra KPIs, tabla con badge de desempeño y montos con signo', () => {
    renderWith(<ProductProfitability />);

    expect(screen.getByText('Análisis por SKU')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-total-profit')).toBeInTheDocument();
    expect(screen.getByText('Mate Imperial')).toBeInTheDocument();
    expect(screen.getByText('MAT-001')).toBeInTheDocument();
    expect(screen.getByText('EXCELLENT')).toBeInTheDocument();
    // Beneficio bruto con signo según valor
    expect(screen.getByText('-20.000')).toBeInTheDocument();
  });

  it('cablea la paginación server-side', async () => {
    renderWith(<ProductProfitability />);

    expect(screen.getByTestId('products-pagination-label')).toHaveTextContent('Página 1 de 24');
    expect(screen.getByTestId('products-prev')).toBeDisabled();
    await userEvent.click(screen.getByTestId('products-next'));
    // El mock del hook no re-renderiza con nuevo estado: verificamos que el botón estaba habilitado y prev deshabilitado
    expect(screen.getByTestId('products-next')).not.toBeDisabled();
  });

  it('muestra EmptyState sin productos y ErrorState con reintento', async () => {
    const refresh = vi.fn();
    mockUse.mockReturnValue({ data: { products: [] }, loading: false, error: null, refresh });
    const { unmount } = renderWith(<ProductProfitability />);
    expect(screen.getByText('Sin datos de productos')).toBeInTheDocument();
    unmount();

    mockUse.mockReturnValue({ data: null, loading: false, error: 'boom', refresh });
    renderWith(<ProductProfitability />);
    expect(screen.getByText('boom')).toBeInTheDocument();
    await userEvent.click(screen.getByTestId('error-retry'));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});

describe('CustomerProfitability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUse.mockReturnValue({ data: customersData, loading: false, error: null, refresh: vi.fn() });
  });

  it('muestra KPIs, segmentos y paneles laterales', () => {
    renderWith(<CustomerProfitability />);

    expect(screen.getByText('Cartera de Clientes')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-pareto')).toBeInTheDocument();
    // En tabla y en el panel Elite Platinum
    expect(screen.getAllByText('Despensa Central').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('PLATINUM')).toBeInTheDocument();
    expect(screen.getByTestId('platinum-panel')).toBeInTheDocument();
    // El contador de retención crítica es real (inactive_risk_customers)
    expect(screen.getByTestId('retention-panel')).toHaveTextContent('7 Clientes');
  });

  it('no renderiza los botones de contacto sin handler del legacy', () => {
    renderWith(<CustomerProfitability />);
    expect(screen.queryByRole('button', { name: /mail|teléfono|phone/i })).not.toBeInTheDocument();
  });

  it('muestra EmptyState sin clientes', () => {
    mockUse.mockReturnValue({ data: { customers: [] }, loading: false, error: null, refresh: vi.fn() });
    renderWith(<CustomerProfitability />);
    expect(screen.getByText('Sin datos de clientes')).toBeInTheDocument();
  });
});

describe('CategoryProfitability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUse.mockReturnValue({ data: categoriesData, loading: false, error: null, refresh: vi.fn() });
  });

  it('muestra KPIs con subtítulos reales y la matriz de desempeño', () => {
    renderWith(<CategoryProfitability />);

    expect(screen.getByText('Familias de Productos')).toBeInTheDocument();
    expect(screen.getByTestId('kpi-category-leader')).toHaveTextContent('Termos');
    expect(screen.getByTestId('kpi-critical-margin')).toHaveTextContent('Accesorios');
    expect(screen.getByText('Matriz de Desempeño por Familia')).toBeInTheDocument();
    expect(screen.getByText('42%')).toBeInTheDocument();
  });

  it('la barra de ventas del panel de eficiencia usa la contribución real (no el 90% fijo)', () => {
    renderWith(<CategoryProfitability />);

    const panel = screen.getByTestId('portfolio-efficiency');
    const bars = panel.querySelectorAll('.bg-primary\\/20');
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveStyle({ width: '42%' });
    expect(bars[1]).toHaveStyle({ width: '7%' });
  });

  it('muestra ErrorState con reintento', async () => {
    const refresh = vi.fn();
    mockUse.mockReturnValue({ data: null, loading: false, error: 'fallo fiscal', refresh });
    renderWith(<CategoryProfitability />);

    await userEvent.click(screen.getByTestId('error-retry'));
    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
