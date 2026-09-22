import { useSearchParams } from 'react-router-dom';
import DrilldownPage from '@/features/relational-analytics/components/DrilldownPage';
import type { DrilldownColumn } from '@/domain/relational-analytics/types';
import type { ProductBuyerRow } from '@/domain/relational-analytics/types';
import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService';
import { productService } from '@/services/productService';
import type { EntityOption } from '@/features/relational-analytics/components/EntitySearchSelect';

/**
 * #1 RF-BIPACK-021 — Compradores de un producto (drill-down relacional).
 * Ruta: /sales-analytics/products/buyers?product_id=... (entrada desde la
 * ficha de producto o desde el menú BI).
 */

const columns: DrilldownColumn<ProductBuyerRow>[] = [
  { key: 'client_name', labelKey: 'bi.relational.col.client', labelFallback: 'Cliente', format: 'text', align: 'left' },
  { key: 'client_doc', labelKey: 'bi.relational.col.doc', labelFallback: 'Documento', format: 'text', align: 'left' },
  { key: 'purchases', labelKey: 'bi.relational.col.purchases', labelFallback: 'Compras', format: 'number', align: 'right', sortable: true },
  { key: 'units', labelKey: 'bi.relational.col.units', labelFallback: 'Unidades', format: 'units', align: 'right', sortable: true },
  { key: 'total', labelKey: 'bi.relational.col.total', labelFallback: 'Total', format: 'money', align: 'right', sortable: true },
  { key: 'avg_unit_price', labelKey: 'bi.relational.col.avgPrice', labelFallback: 'Precio Prom.', format: 'money', align: 'right', sortable: true },
  { key: 'last_purchase_at', labelKey: 'bi.relational.col.lastPurchase', labelFallback: 'Última Compra', format: 'date', align: 'right', sortable: true },
];

const searchProducts = async (term: string): Promise<EntityOption[]> => {
  const results = await productService.search(term);
  return (results ?? [])
    .map((p): EntityOption => {
      // La búsqueda devuelve enriquecidos legacy/planos: los campos
      // product_id/product_name/sku son fallbacks opcionales.
      const row = p as unknown as { product_id?: string; id?: string; name?: string; product_name?: string; sku?: string };
      return {
        id: String(row.product_id ?? row.id ?? ''),
        label: String(row.name ?? row.product_name ?? row.id ?? ''),
        sub: row.sku ? String(row.sku) : undefined,
      };
    })
    .filter((opt) => opt.id);
};

const ProductBuyersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get('product_id');

  return (
    <DrilldownPage<ProductBuyerRow>
      entityId={productId}
      titleKey="bi.relational.buyers.title"
      titleFallback="Compradores del Producto"
      subtitleKey="bi.relational.buyers.subtitle"
      subtitleFallback="Qué clientes compraron este producto, cuánto y cuándo."
      entityLabelKey="bi.relational.entity.product"
      entityLabelFallback="Producto"
      columns={columns}
      rowKey={(row) => row.client_id}
      defaultSort="-total"
      fetcher={(id, params) => relationalAnalyticsService.getProductBuyers(id, params)}
      searchEntity={searchProducts}
      onEntityPicked={(id) => setSearchParams({ product_id: id })}
      emptyKey="bi.relational.buyers.empty"
      emptyFallback="Sin compradores para este producto con los filtros aplicados"
      testId="product-buyers-page"
    />
  );
};

export default ProductBuyersPage;
