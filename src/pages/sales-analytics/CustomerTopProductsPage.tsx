import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, Copy, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';
import DrilldownPage from '@/features/relational-analytics/components/DrilldownPage';
import type { DrilldownRowAction, DrilldownRowMenu } from '@/features/relational-analytics/components/RowActionsMenu';
import { useRowCopyValue } from '@/features/relational-analytics/hooks/useRowCopyValue';
import type { DrilldownColumn, ProductSalesRow } from '@/domain/relational-analytics/types';
import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService';
import { clientService } from '@/services/clientService';
import type { EntityOption } from '@/features/relational-analytics/components/EntitySearchSelect';

/**
 * #2 RF-BIPACK-022 — Productos que más compra un cliente.
 * Ruta: /sales-analytics/customers/top-products?customer_id=...
 */

const columns: DrilldownColumn<ProductSalesRow>[] = [
  { key: 'product_name', labelKey: 'bi.relational.col.product', labelFallback: 'Producto', format: 'text', align: 'left', sortable: true },
  { key: 'product_sku', labelKey: 'bi.relational.col.sku', labelFallback: 'SKU', format: 'text', align: 'left' },
  { key: 'purchases', labelKey: 'bi.relational.col.purchases', labelFallback: 'Compras', format: 'number', align: 'right', sortable: true },
  { key: 'units', labelKey: 'bi.relational.col.units', labelFallback: 'Unidades', format: 'units', align: 'right', sortable: true },
  { key: 'total', labelKey: 'bi.relational.col.total', labelFallback: 'Total', format: 'money', align: 'right', sortable: true },
  { key: 'avg_unit_price', labelKey: 'bi.relational.col.avgPrice', labelFallback: 'Precio Prom.', format: 'money', align: 'right', sortable: true },
  { key: 'last_purchase_at', labelKey: 'bi.relational.col.lastPurchase', labelFallback: 'Última Compra', format: 'date', align: 'right', sortable: true },
];

const searchClients = async (term: string): Promise<EntityOption[]> => {
  const results = await clientService.searchByName(term);
  return (results ?? [])
    .map((c: Record<string, unknown>) => ({
      id: String(c.id ?? c._key ?? ''),
      label: String(c.name ?? c.first_name ?? c.id ?? ''),
      sub: c.document_id ? String(c.document_id) : undefined,
    }))
    .filter((opt) => opt.id);
};

const CustomerTopProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const customerId = searchParams.get('customer_id');
  const navigate = useNavigate();
  const { t } = useI18n();
  const copyValue = useRowCopyValue();

  // Menú por fila: pivotes a compradores/proveedores del producto + copiar SKU.
  const buildRowMenu = (row: ProductSalesRow): DrilldownRowMenu => ({
    title: row.product_name,
    subtitle: row.product_sku ? t('bi.relational.menu.skuLabel', 'SKU: {sku}', { sku: row.product_sku }) : undefined,
    actions: [
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
      {
        id: 'compare-suppliers',
        label: t('bi.relational.action.compareSuppliers', 'Comparar proveedores'),
        description: t('bi.relational.menu.avgPrice', 'Precio prom.: {price}', { price: formatPYG(row.avg_unit_price) }),
        icon: ArrowLeftRight,
        onSelect: () => navigate(`/purchase-analytics/products/suppliers?product_id=${encodeURIComponent(row.product_id)}`),
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
      entityId={customerId}
      titleKey="bi.relational.customerTop.title"
      titleFallback="Productos que Compra el Cliente"
      subtitleKey="bi.relational.customerTop.subtitle"
      subtitleFallback="Los productos que este cliente compra más, por unidades e importe."
      entityLabelKey="bi.relational.entity.client"
      entityLabelFallback="Cliente"
      columns={columns}
      rowKey={(row) => row.product_id}
      defaultSort="-units"
      fetcher={(id, params) => relationalAnalyticsService.getCustomerTopProducts(id, params)}
      searchEntity={searchClients}
      onEntityPicked={(id) => setSearchParams({ customer_id: id })}
      rowMenu={buildRowMenu}
      emptyKey="bi.relational.customerTop.empty"
      emptyFallback="Sin compras de este cliente con los filtros aplicados"
      testId="customer-top-products-page"
    />
  );
};

export default CustomerTopProductsPage;
