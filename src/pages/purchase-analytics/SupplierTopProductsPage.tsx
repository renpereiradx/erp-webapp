import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, Copy, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';
import DrilldownPage from '@/features/relational-analytics/components/DrilldownPage';
import type { DrilldownRowAction, DrilldownRowMenu } from '@/features/relational-analytics/components/RowActionsMenu';
import { useRowCopyValue } from '@/features/relational-analytics/hooks/useRowCopyValue';
import type { DrilldownColumn, ProductSalesRow } from '@/domain/relational-analytics/types';
import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService';
import supplierService from '@/services/supplierService';
import type { EntityOption } from '@/features/relational-analytics/components/EntitySearchSelect';

/**
 * #3 RF-BIPACK-023 — Productos más comprados a un proveedor
 * (historial de compras COMPLETED). Ruta:
 * /purchase-analytics/suppliers/top-products?supplier_id=...
 */

const columns: DrilldownColumn<ProductSalesRow>[] = [
  { key: 'product_name', labelKey: 'bi.relational.col.product', labelFallback: 'Producto', format: 'text', align: 'left', sortable: true },
  { key: 'product_sku', labelKey: 'bi.relational.col.sku', labelFallback: 'SKU', format: 'text', align: 'left' },
  { key: 'purchases', labelKey: 'bi.relational.col.purchases', labelFallback: 'Compras', format: 'number', align: 'right', sortable: true },
  { key: 'units', labelKey: 'bi.relational.col.units', labelFallback: 'Unidades', format: 'units', align: 'right', sortable: true },
  { key: 'total', labelKey: 'bi.relational.col.total', labelFallback: 'Total', format: 'money', align: 'right', sortable: true },
  { key: 'avg_unit_price', labelKey: 'bi.relational.col.avgPrice', labelFallback: 'Costo Prom.', format: 'money', align: 'right', sortable: true },
  { key: 'last_purchase_at', labelKey: 'bi.relational.col.lastPurchase', labelFallback: 'Última Compra', format: 'date', align: 'right', sortable: true },
];

const searchSuppliers = async (term: string): Promise<EntityOption[]> => {
  const results = await supplierService.searchByName(term);
  return (results ?? [])
    .map((s: Record<string, unknown>) => ({
      id: String(s.id ?? s._key ?? ''),
      label: String(s.name ?? s.first_name ?? s.id ?? ''),
      sub: s.tax_id ? String(s.tax_id) : s.document_id ? String(s.document_id) : undefined,
    }))
    .filter((opt) => opt.id);
};

const SupplierTopProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const supplierId = searchParams.get('supplier_id');
  const navigate = useNavigate();
  const { t } = useI18n();
  const copyValue = useRowCopyValue();

  // Menú por fila: pivotes a comparación de proveedores/compradores + copiar SKU.
  const buildRowMenu = (row: ProductSalesRow): DrilldownRowMenu => ({
    title: row.product_name,
    subtitle: row.product_sku ? t('bi.relational.menu.skuLabel', 'SKU: {sku}', { sku: row.product_sku }) : undefined,
    actions: [
      {
        id: 'compare-suppliers',
        label: t('bi.relational.action.compareSuppliers', 'Comparar proveedores'),
        description: t('bi.relational.menu.avgCost', 'Costo prom.: {price}', { price: formatPYG(row.avg_unit_price) }),
        icon: ArrowLeftRight,
        onSelect: () => navigate(`/purchase-analytics/products/suppliers?product_id=${encodeURIComponent(row.product_id)}`),
      },
      {
        id: 'buyers',
        label: t('bi.relational.action.buyers', 'Ver compradores'),
        description: t('bi.relational.menu.summary', '{units} uds. · {purchases} compras · {total}', {
          units: row.units,
          purchases: row.purchases,
          total: formatPYG(row.total),
        }),
        icon: Users,
        onSelect: () => navigate(`/sales-analytics/products/buyers?product_id=${encodeURIComponent(row.product_id)}`),
      },
      ...(row.product_sku
        ? [
            {
              id: 'copy-sku',
              label: t('bi.relational.action.copySku', 'Copiar SKU'),
              description: row.product_sku,
              icon: Copy,
              onSelect: () => void copyValue(row.product_sku),
            } satisfies DrilldownRowAction,
          ]
        : []),
    ],
  });

  return (
    <DrilldownPage<ProductSalesRow>
      entityId={supplierId}
      titleKey="bi.relational.supplierTop.title"
      titleFallback="Productos Suministrados"
      subtitleKey="bi.relational.supplierTop.subtitle"
      subtitleFallback="Lo que más se le compra a este proveedor (compras completadas)."
      entityLabelKey="bi.relational.entity.supplier"
      entityLabelFallback="Proveedor"
      columns={columns}
      rowKey={(row) => row.product_id}
      defaultSort="-units"
      fetcher={(id, params) => relationalAnalyticsService.getSupplierTopProducts(id, params)}
      searchEntity={searchSuppliers}
      onEntityPicked={(id) => setSearchParams({ supplier_id: id })}
      rowMenu={buildRowMenu}
      emptyKey="bi.relational.supplierTop.empty"
      emptyFallback="Sin compras completadas de este proveedor con los filtros aplicados"
      testId="supplier-top-products-page"
    />
  );
};

export default SupplierTopProductsPage;
