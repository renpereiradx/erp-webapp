import { useSearchParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import DrilldownPage from '@/features/relational-analytics/components/DrilldownPage';
import type { DrilldownColumn, ProductSupplierRow } from '@/domain/relational-analytics/types';
import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService';
import { productService } from '@/services/productService';
import type { EntityOption } from '@/features/relational-analytics/components/EntitySearchSelect';

/**
 * #4 RF-BIPACK-024 — Proveedores de un producto y sus precios
 * (ranking en moneda base, D3; mejor precio = último precio, D5). Ruta:
 * /purchase-analytics/products/suppliers?product_id=...
 */

const columns: DrilldownColumn<ProductSupplierRow>[] = [
  { key: 'supplier_name', labelKey: 'bi.relational.col.supplier', labelFallback: 'Proveedor', format: 'text', align: 'left', sortable: true },
  { key: 'supplier_doc', labelKey: 'bi.relational.col.doc', labelFallback: 'RUC/Doc', format: 'text', align: 'left' },
  { key: 'last_unit_price', labelKey: 'bi.relational.col.lastPrice', labelFallback: 'Último Precio', format: 'money', align: 'right', sortable: true },
  { key: 'avg_unit_price', labelKey: 'bi.relational.col.avgPrice', labelFallback: 'Precio Prom.', format: 'money', align: 'right', sortable: true },
  { key: 'min_unit_price', labelKey: 'bi.relational.col.minPrice', labelFallback: 'Mín. Histórico', format: 'money', align: 'right', sortable: true },
  { key: 'currency', labelKey: 'bi.relational.col.currency', labelFallback: 'Moneda', format: 'text', align: 'left' },
  { key: 'units', labelKey: 'bi.relational.col.units', labelFallback: 'Unidades', format: 'units', align: 'right', sortable: true },
  { key: 'purchases', labelKey: 'bi.relational.col.purchases', labelFallback: 'Compras', format: 'number', align: 'right', sortable: true },
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

const ProductSuppliersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get('product_id');
  const { t } = useI18n();

  return (
    <DrilldownPage<ProductSupplierRow>
      entityId={productId}
      titleKey="bi.relational.productSuppliers.title"
      titleFallback="Comparar Proveedores"
      subtitleKey="bi.relational.productSuppliers.subtitle"
      subtitleFallback="Quién ofrece este producto y a qué precio (último, promedio y mínimo histórico, en moneda base)."
      entityLabelKey="bi.relational.entity.product"
      entityLabelFallback="Producto"
      columns={columns}
      rowKey={(row) => row.supplier_id}
      defaultSort="+last_unit_price"
      fetcher={(id, params) => relationalAnalyticsService.getProductSuppliers(id, params)}
      searchEntity={searchProducts}
      onEntityPicked={(id) => setSearchParams({ product_id: id })}
      renderMetaBanner={({ excludedOtherCurrency }) =>
        excludedOtherCurrency > 0 ? (
          <div
            className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-muted px-4 py-2.5 text-xs font-bold text-on-surface-deep"
            data-testid="excluded-other-currency-banner"
          >
            <Info size={14} className="text-primary shrink-0" aria-hidden="true" />
            {t('bi.relational.excludedBanner', '{count} compras en otra moneda quedan fuera del ranking (solo se compara la moneda base).', { count: excludedOtherCurrency })}
          </div>
        ) : null
      }
      emptyKey="bi.relational.productSuppliers.empty"
      emptyFallback="Sin proveedores que hayan comprado este producto (compras completadas)"
      testId="product-suppliers-page"
    />
  );
};

export default ProductSuppliersPage;
