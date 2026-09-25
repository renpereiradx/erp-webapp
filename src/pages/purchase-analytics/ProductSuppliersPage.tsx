import { useNavigate, useSearchParams } from 'react-router-dom';
import { Boxes, Copy, Info } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';
import DrilldownPage from '@/features/relational-analytics/components/DrilldownPage';
import type { DrilldownRowAction, DrilldownRowMenu } from '@/features/relational-analytics/components/RowActionsMenu';
import type { EntityOption } from '@/features/relational-analytics/components/EntitySearchSelect';
import { useRowCopyValue } from '@/features/relational-analytics/hooks/useRowCopyValue';
import { searchSellableUnitsFlat } from '@/features/catalog/sellableUnitSearch';
import { sellableUnitToEntityOption } from '@/features/relational-analytics/sellableUnitOption';
import type { DrilldownColumn, ProductSupplierRow } from '@/domain/relational-analytics/types';
import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService';

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

/**
 * Búsqueda plana (granularity=variant, mismo camino que /ventas): una fila
 * por variante con SKU/stock/precio propios; elegir una variante filtra el
 * drill-down por variant_id (soportado por el endpoint).
 */
const searchProducts = async (term: string): Promise<EntityOption[]> => {
  const units = await searchSellableUnitsFlat(term);
  return units.map(sellableUnitToEntityOption);
};

const ProductSuppliersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get('product_id');
  const variantId = searchParams.get('variant_id');
  const navigate = useNavigate();
  const { t } = useI18n();
  const copyValue = useRowCopyValue();

  // Menú por fila: pivote a todo lo que suministra el proveedor + copiar RUC.
  const buildRowMenu = (row: ProductSupplierRow): DrilldownRowMenu => ({
    title: row.supplier_name,
    subtitle: row.supplier_doc ? t('bi.relational.menu.docLabel', 'Doc: {doc}', { doc: row.supplier_doc }) : undefined,
    actions: [
      {
        id: 'supplier-top',
        label: t('bi.relational.action.supplierTop', 'Productos suministrados'),
        description: t('bi.relational.menu.lastPriceSummary', 'Último: {price} · {purchases} compras', {
          price: formatPYG(row.last_unit_price),
          purchases: row.purchases,
        }),
        icon: Boxes,
        onSelect: () => navigate(`/purchase-analytics/suppliers/top-products?supplier_id=${encodeURIComponent(row.supplier_id)}`),
      },
      ...(row.supplier_doc
        ? [
            {
              id: 'copy-doc',
              label: t('bi.relational.action.copyDoc', 'Copiar documento'),
              description: row.supplier_doc,
              icon: Copy,
              onSelect: () => void copyValue(row.supplier_doc),
            } satisfies DrilldownRowAction,
          ]
        : []),
    ],
  });

  return (
    <DrilldownPage<ProductSupplierRow>
      entityId={productId}
      variantId={variantId}
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
      onEntityPicked={(id, opt) =>
        setSearchParams(opt.variantId ? { product_id: id, variant_id: opt.variantId } : { product_id: id })
      }
      minSearchChars={3}
      rowMenu={buildRowMenu}
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
