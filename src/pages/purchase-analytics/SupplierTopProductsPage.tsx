import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, Copy, Users } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  formatDrilldownCount,
  formatDrilldownMoney,
  formatDrilldownUnits,
} from '@/domain/relational-analytics/normalize';
import {
  RELATIONAL_DEFAULT_SORT,
  withSortableColumns,
} from '@/domain/relational-analytics/sort';
import type {
  DrilldownColumn,
  ProductSalesRow,
} from '@/domain/relational-analytics/types';
import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService';
import {
  DrilldownScreen,
  useDrilldownEntity,
  useDrilldownQuery,
  useEntitySearch,
  useRowCopyValue,
  type DrilldownRowMenu,
} from '@/features/relational-analytics';

/**
 * #3 RF-BIPACK-023 — Productos más comprados a un proveedor (historial de
 * compras COMPLETED). Ruta:
 * /purchase-analytics/suppliers/top-products?supplier_id=...
 */

const SUPPLIER_TOP_COLUMNS: DrilldownColumn<ProductSalesRow>[] = [
  {
    key: 'product_name',
    labelKey: 'relationalAnalytics.columns.product',
    labelFallback: 'Producto',
    format: 'text',
    align: 'left',
  },
  {
    key: 'product_sku',
    labelKey: 'relationalAnalytics.columns.sku',
    labelFallback: 'SKU',
    format: 'text',
    align: 'left',
    mono: true,
    muted: true,
  },
  {
    key: 'purchases',
    labelKey: 'relationalAnalytics.columns.purchases',
    labelFallback: 'Compras',
    format: 'number',
    align: 'right',
  },
  {
    key: 'units',
    labelKey: 'relationalAnalytics.columns.units',
    labelFallback: 'Cantidad',
    format: 'units',
    align: 'right',
  },
  {
    key: 'total',
    labelKey: 'relationalAnalytics.columns.total',
    labelFallback: 'Importe total',
    format: 'money',
    align: 'right',
  },
  {
    key: 'avg_unit_price',
    labelKey: 'relationalAnalytics.columns.avgCost',
    labelFallback: 'Costo prom.',
    format: 'money',
    align: 'right',
  },
  {
    key: 'last_purchase_at',
    labelKey: 'relationalAnalytics.columns.lastPurchase',
    labelFallback: 'Última compra',
    format: 'date',
    align: 'right',
  },
];

const COLUMNS = withSortableColumns('top-products', SUPPLIER_TOP_COLUMNS);

const SupplierTopProductsPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const supplierId = searchParams.get('supplier_id');
  const copyValue = useRowCopyValue();

  const query = useDrilldownQuery<ProductSalesRow>({
    endpoint: 'top-products',
    entityId: supplierId,
    fetcher: relationalAnalyticsService.getSupplierTopProducts,
    defaultSort: RELATIONAL_DEFAULT_SORT['top-products'],
  });
  const entity = useDrilldownEntity('supplier', supplierId);
  const searchEntity = useEntitySearch('supplier');

  const buildRowMenu = (row: ProductSalesRow): DrilldownRowMenu => ({
    title: row.product_name,
    subtitle: row.product_sku
      ? t('relationalAnalytics.menu.skuLabel', 'SKU: {sku}', { sku: row.product_sku })
      : undefined,
    actions: [
      {
        id: 'compare-suppliers',
        label: t('relationalAnalytics.actions.compareSuppliers', 'Comparar proveedores'),
        description: t('relationalAnalytics.menu.avgCost', 'Costo prom.: {price}', {
          price: formatDrilldownMoney(row.avg_unit_price),
        }),
        icon: ArrowLeftRight,
        onSelect: () =>
          navigate(
            `/purchase-analytics/products/suppliers?product_id=${encodeURIComponent(row.product_id)}`,
          ),
      },
      {
        id: 'buyers',
        label: t('relationalAnalytics.actions.buyers', 'Ver compradores'),
        description: t(
          'relationalAnalytics.menu.summary',
          '{total} · Compras: {purchases} · {units}',
          {
            units: formatDrilldownUnits(row.units, row.base_unit),
            purchases: formatDrilldownCount(row.purchases),
            total: formatDrilldownMoney(row.total),
          },
        ),
        icon: Users,
        onSelect: () =>
          navigate(
            `/sales-analytics/products/buyers?product_id=${encodeURIComponent(row.product_id)}`,
          ),
      },
      ...(row.product_sku
        ? [
            {
              id: 'copy-sku',
              label: t('relationalAnalytics.actions.copySku', 'Copiar SKU'),
              description: row.product_sku,
              icon: Copy,
              onSelect: () => void copyValue(row.product_sku),
            },
          ]
        : []),
    ],
  });

  return (
    <DrilldownScreen<ProductSalesRow>
      testId="supplier-top-products-page"
      title={t('relationalAnalytics.supplierTop.title', 'Productos suministrados')}
      subtitle={t(
        'relationalAnalytics.supplierTop.subtitle',
        'Lo que más se le compra a este proveedor.',
      )}
      entityKind="supplier"
      entityId={supplierId}
      entityLabel={entity.display.label}
      entitySub={entity.display.sub}
      searchEntity={searchEntity}
      onPickEntity={(id) => {
        query.clearFilters();
        setSearchParams({ supplier_id: id });
      }}
      onChangeEntity={() => {
        query.clearFilters();
        setSearchParams({});
      }}
      pickerTitle={t('relationalAnalytics.picker.title', 'Elegí {entity} para ver el detalle', {
        entity: t('relationalAnalytics.entity.supplier', 'Proveedor'),
      })}
      pickerHelp={t(
        'relationalAnalytics.picker.help',
        'Buscá por nombre, documento o SKU para ver el análisis.',
      )}
      pickerSearchPlaceholder={t(
        'relationalAnalytics.picker.searchPlaceholderSupplier',
        'Buscar proveedor (F2)…',
      )}
      searchPlaceholder={t(
        'relationalAnalytics.filters.productPlaceholder',
        'Buscar por producto o SKU (F2)…',
      )}
      emptyTitle={t(
        'relationalAnalytics.supplierTop.empty',
        'Sin compras completadas de este proveedor con los filtros aplicados',
      )}
      columns={COLUMNS}
      rowKey={(row) => row.product_id}
      rowMenu={buildRowMenu}
      query={query}
    />
  );
};

export default SupplierTopProductsPage;
