import { useSearchParams } from 'react-router-dom';
import DrilldownPage from '@/features/relational-analytics/components/DrilldownPage';
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
      emptyKey="bi.relational.supplierTop.empty"
      emptyFallback="Sin compras completadas de este proveedor con los filtros aplicados"
      testId="supplier-top-products-page"
    />
  );
};

export default SupplierTopProductsPage;
