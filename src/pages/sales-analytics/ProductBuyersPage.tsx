import { useNavigate, useSearchParams } from 'react-router-dom';
import { Copy, ShoppingCart } from 'lucide-react';
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
  ProductBuyerRow,
} from '@/domain/relational-analytics/types';
import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService';
import {
  DrilldownScreen,
  useDrilldownEntity,
  useDrilldownQuery,
  useEntitySearch,
  useRowCopyValue,
  type DrilldownRowMenu,
  type EntityOption,
} from '@/features/relational-analytics';

/**
 * #1 RF-BIPACK-021 — Compradores de un producto (drill-down relacional).
 * Ruta: /sales-analytics/products/buyers?product_id=... (entrada desde la
 * ficha de producto o desde el grupo BI).
 */

const BUYER_COLUMNS: DrilldownColumn<ProductBuyerRow>[] = [
  {
    key: 'client_name',
    labelKey: 'relationalAnalytics.columns.client',
    labelFallback: 'Cliente',
    format: 'text',
    align: 'left',
  },
  {
    key: 'client_doc',
    labelKey: 'relationalAnalytics.columns.doc',
    labelFallback: 'Documento',
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

const COLUMNS = withSortableColumns('product-buyers', BUYER_COLUMNS);

const ProductBuyersPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get('product_id');
  const variantId = searchParams.get('variant_id');
  const copyValue = useRowCopyValue();

  const query = useDrilldownQuery<ProductBuyerRow>({
    endpoint: 'product-buyers',
    entityId: productId,
    variantId,
    fetcher: relationalAnalyticsService.getProductBuyers,
    defaultSort: RELATIONAL_DEFAULT_SORT['product-buyers'],
  });
  const entity = useDrilldownEntity('product', productId, variantId);
  const searchEntity = useEntitySearch('product');

  const pickProduct = (id: string, option: EntityOption) => {
    // Nueva entidad = nuevo análisis: filtros/página no se arrastran.
    query.clearFilters();
    setSearchParams(
      option.variantId
        ? { product_id: id, variant_id: option.variantId }
        : { product_id: id },
    );
  };

  const buildRowMenu = (row: ProductBuyerRow): DrilldownRowMenu => ({
    title: row.client_name,
    subtitle: row.client_doc
      ? t('relationalAnalytics.menu.docLabel', 'Doc: {doc}', { doc: row.client_doc })
      : undefined,
    actions: [
      {
        id: 'customer-top',
        label: t('relationalAnalytics.actions.customerTop', 'Productos que compra'),
        description: t(
          'relationalAnalytics.menu.summary',
          '{total} · Compras: {purchases} · {units}',
          {
            units: formatDrilldownUnits(row.units, row.base_unit),
            purchases: formatDrilldownCount(row.purchases),
            total: formatDrilldownMoney(row.total),
          },
        ),
        icon: ShoppingCart,
        onSelect: () =>
          navigate(
            `/sales-analytics/customers/top-products?customer_id=${encodeURIComponent(row.client_id)}`,
          ),
      },
      ...(row.client_doc
        ? [
            {
              id: 'copy-doc',
              label: t('relationalAnalytics.actions.copyDoc', 'Copiar documento'),
              description: row.client_doc,
              icon: Copy,
              onSelect: () => void copyValue(row.client_doc),
            },
          ]
        : []),
    ],
  });

  return (
    <DrilldownScreen<ProductBuyerRow>
      testId="product-buyers-page"
      title={t('relationalAnalytics.buyers.title', 'Compradores del producto')}
      subtitle={t(
        'relationalAnalytics.buyers.subtitle',
        'Qué clientes compraron este producto.',
      )}
      entityKind="product"
      entityId={productId}
      entityLabel={entity.display.label}
      entitySub={entity.display.sub}
      variantLabel={entity.variantLabel}
      searchEntity={searchEntity}
      minSearchChars={3}
      onPickEntity={pickProduct}
      onChangeEntity={() => {
        query.clearFilters();
        setSearchParams({});
      }}
      pickerTitle={t('relationalAnalytics.picker.title', 'Elegí {entity} para ver el detalle', {
        entity: t('relationalAnalytics.entity.product', 'Producto'),
      })}
      pickerHelp={t(
        'relationalAnalytics.picker.help',
        'Buscá por nombre, documento o SKU para ver el análisis.',
      )}
      pickerSearchPlaceholder={t(
        'relationalAnalytics.picker.searchPlaceholderProduct',
        'Buscar producto (F2)…',
      )}
      searchPlaceholder={t(
        'relationalAnalytics.filters.partyPlaceholder',
        'Buscar por nombre o documento (F2)…',
      )}
      emptyTitle={t(
        'relationalAnalytics.buyers.empty',
        'Sin compradores para este producto con los filtros aplicados',
      )}
      columns={COLUMNS}
      rowKey={(row) => row.client_id}
      rowMenu={buildRowMenu}
      query={query}
    />
  );
};

export default ProductBuyersPage;
