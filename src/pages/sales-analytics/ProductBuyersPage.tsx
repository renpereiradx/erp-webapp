import { useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, ShoppingCart } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';
import DrilldownPage from '@/features/relational-analytics/components/DrilldownPage';
import type { DrilldownRowAction, DrilldownRowMenu } from '@/features/relational-analytics/components/RowActionsMenu';
import type { EntityOption } from '@/features/relational-analytics/components/EntitySearchSelect';
import { useRowCopyValue } from '@/features/relational-analytics/hooks/useRowCopyValue';
import { searchSellableUnitsFlat } from '@/features/catalog/sellableUnitSearch';
import { sellableUnitToEntityOption } from '@/features/relational-analytics/sellableUnitOption';
import type { DrilldownColumn } from '@/domain/relational-analytics/types';
import type { ProductBuyerRow } from '@/domain/relational-analytics/types';
import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService';

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

/**
 * Búsqueda plana (granularity=variant, mismo camino que /ventas): una fila
 * por variante con SKU/stock/precio propios; elegir una variante filtra el
 * drill-down por variant_id (soportado por el endpoint).
 */
const searchProducts = async (term: string): Promise<EntityOption[]> => {
  const units = await searchSellableUnitsFlat(term);
  return units.map(sellableUnitToEntityOption);
};

const ProductBuyersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get('product_id');
  const variantId = searchParams.get('variant_id');
  const navigate = useNavigate();
  const { t } = useI18n();
  const copyValue = useRowCopyValue();

  // Menú por fila: pivote al carrito del cliente + copiar documento.
  const buildRowMenu = (row: ProductBuyerRow): DrilldownRowMenu => ({
    title: row.client_name,
    subtitle: row.client_doc ? t('bi.relational.menu.docLabel', 'Doc: {doc}', { doc: row.client_doc }) : undefined,
    actions: [
      {
        id: 'customer-top',
        label: t('bi.relational.action.customerTop', 'Productos que compra'),
        description: t('bi.relational.menu.summary', '{units} uds. · {purchases} compras · {total}', {
          units: row.units,
          purchases: row.purchases,
          total: formatPYG(row.total),
        }),
        icon: ShoppingCart,
        onSelect: () => navigate(`/sales-analytics/customers/top-products?customer_id=${encodeURIComponent(row.client_id)}`),
      },
      ...(row.client_doc
        ? [
            {
              id: 'copy-doc',
              label: t('bi.relational.action.copyDoc', 'Copiar documento'),
              description: row.client_doc,
              icon: Copy,
              onSelect: () => void copyValue(row.client_doc),
            } satisfies DrilldownRowAction,
          ]
        : []),
    ],
  });

  return (
    <DrilldownPage<ProductBuyerRow>
      entityId={productId}
      variantId={variantId}
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
      onEntityPicked={(id, opt) =>
        setSearchParams(opt.variantId ? { product_id: id, variant_id: opt.variantId } : { product_id: id })
      }
      minSearchChars={3}
      rowMenu={buildRowMenu}
      emptyKey="bi.relational.buyers.empty"
      emptyFallback="Sin compradores para este producto con los filtros aplicados"
      testId="product-buyers-page"
    />
  );
};

export default ProductBuyersPage;
