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
 * #2 RF-BIPACK-022 — Productos que más compra un cliente.
 * Ruta: /sales-analytics/customers/top-products?customer_id=...
 */

const CUSTOMER_TOP_COLUMNS: DrilldownColumn<ProductSalesRow>[] = [
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
    labelKey: 'relationalAnalytics.columns.avgPrice',
    labelFallback: 'Precio prom.',
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

const COLUMNS = withSortableColumns('top-products', CUSTOMER_TOP_COLUMNS);

const CustomerTopProductsPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const customerId = searchParams.get('customer_id');
  const copyValue = useRowCopyValue();

  const query = useDrilldownQuery<ProductSalesRow>({
    endpoint: 'top-products',
    entityId: customerId,
    fetcher: relationalAnalyticsService.getCustomerTopProducts,
    defaultSort: RELATIONAL_DEFAULT_SORT['top-products'],
  });
  const entity = useDrilldownEntity('client', customerId);
  const searchEntity = useEntitySearch('client');

  const buildRowMenu = (row: ProductSalesRow): DrilldownRowMenu => ({
    title: row.product_name,
    subtitle: row.product_sku
      ? t('relationalAnalytics.menu.skuLabel', 'SKU: {sku}', { sku: row.product_sku })
      : undefined,
    actions: [
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
      {
        id: 'compare-suppliers',
        label: t('relationalAnalytics.actions.compareSuppliers', 'Comparar proveedores'),
        description: t('relationalAnalytics.menu.avgPrice', 'Precio prom.: {price}', {
          price: formatDrilldownMoney(row.avg_unit_price),
        }),
        icon: ArrowLeftRight,
        onSelect: () =>
          navigate(
            `/purchase-analytics/products/suppliers?product_id=${encodeURIComponent(row.product_id)}`,
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
      testId="customer-top-products-page"
      title={t('relationalAnalytics.customerTop.title', 'Productos del cliente')}
      subtitle={t(
        'relationalAnalytics.customerTop.subtitle',
        'Los productos que este cliente compra más.',
      )}
      entityKind="client"
      entityId={customerId}
      entityLabel={entity.display.label}
      entitySub={entity.display.sub}
      searchEntity={searchEntity}
      onPickEntity={(id) => {
        query.clearFilters();
        setSearchParams({ customer_id: id });
      }}
      onChangeEntity={() => {
        query.clearFilters();
        setSearchParams({});
      }}
      pickerTitle={t('relationalAnalytics.picker.title', 'Elegí {entity} para ver el detalle', {
        entity: t('relationalAnalytics.entity.client', 'Cliente'),
      })}
      pickerHelp={t(
        'relationalAnalytics.picker.help',
        'Buscá por nombre, documento o SKU para ver el análisis.',
      )}
      pickerSearchPlaceholder={t(
        'relationalAnalytics.picker.searchPlaceholderClient',
        'Buscar cliente (F2)…',
      )}
      searchPlaceholder={t(
        'relationalAnalytics.filters.productPlaceholder',
        'Buscar por producto o SKU (F2)…',
      )}
      emptyTitle={t(
        'relationalAnalytics.customerTop.empty',
        'Sin compras de este cliente con los filtros aplicados',
      )}
      columns={COLUMNS}
      rowKey={(row) => row.product_id}
      rowMenu={buildRowMenu}
      query={query}
    />
  );
};

export default CustomerTopProductsPage;
