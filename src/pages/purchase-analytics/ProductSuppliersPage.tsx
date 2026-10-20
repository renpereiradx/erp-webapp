import { useNavigate, useSearchParams } from 'react-router-dom';
import { Boxes, Copy } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import {
  formatDrilldownCount,
  formatDrilldownMoney,
} from '@/domain/relational-analytics/normalize';
import {
  RELATIONAL_DEFAULT_SORT,
  withSortableColumns,
} from '@/domain/relational-analytics/sort';
import type {
  DrilldownColumn,
  ProductSupplierRow,
} from '@/domain/relational-analytics/types';
import { relationalAnalyticsService } from '@/services/bi/relationalAnalyticsService';
import {
  DrilldownMetaBanner,
  DrilldownScreen,
  useDrilldownEntity,
  useDrilldownQuery,
  useEntitySearch,
  useRowCopyValue,
  type DrilldownRowMenu,
  type EntityOption,
} from '@/features/relational-analytics';

/**
 * #4 RF-BIPACK-024 — Proveedores de un producto y sus precios (ranking en
 * moneda base, D3; mejor precio = último precio, D5). Ruta:
 * /purchase-analytics/products/suppliers?product_id=...
 */

const PRODUCT_SUPPLIER_COLUMNS: DrilldownColumn<ProductSupplierRow>[] = [
  {
    key: 'supplier_name',
    labelKey: 'relationalAnalytics.columns.supplier',
    labelFallback: 'Proveedor',
    format: 'text',
    align: 'left',
  },
  {
    key: 'supplier_doc',
    labelKey: 'relationalAnalytics.columns.doc',
    labelFallback: 'Documento',
    format: 'text',
    align: 'left',
    mono: true,
    muted: true,
  },
  {
    key: 'last_unit_price',
    labelKey: 'relationalAnalytics.columns.lastPrice',
    labelFallback: 'Último precio',
    format: 'money',
    align: 'right',
    currencyKey: 'currency',
  },
  {
    key: 'avg_unit_price',
    labelKey: 'relationalAnalytics.columns.avgPrice',
    labelFallback: 'Precio prom.',
    format: 'money',
    align: 'right',
    currencyKey: 'currency',
  },
  {
    key: 'min_unit_price',
    labelKey: 'relationalAnalytics.columns.minPrice',
    labelFallback: 'Mínimo histórico',
    format: 'money',
    align: 'right',
    currencyKey: 'currency',
  },
  {
    key: 'units',
    labelKey: 'relationalAnalytics.columns.units',
    labelFallback: 'Cantidad',
    format: 'units',
    align: 'right',
  },
  {
    key: 'purchases',
    labelKey: 'relationalAnalytics.columns.purchases',
    labelFallback: 'Compras',
    format: 'number',
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

const COLUMNS = withSortableColumns('product-suppliers', PRODUCT_SUPPLIER_COLUMNS);

const ProductSuppliersPage = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const productId = searchParams.get('product_id');
  const variantId = searchParams.get('variant_id');
  const copyValue = useRowCopyValue();

  const query = useDrilldownQuery<ProductSupplierRow>({
    endpoint: 'product-suppliers',
    entityId: productId,
    variantId,
    fetcher: relationalAnalyticsService.getProductSuppliers,
    defaultSort: RELATIONAL_DEFAULT_SORT['product-suppliers'],
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

  const buildRowMenu = (row: ProductSupplierRow): DrilldownRowMenu => ({
    title: row.supplier_name,
    subtitle: row.supplier_doc
      ? t('relationalAnalytics.menu.docLabel', 'Doc: {doc}', { doc: row.supplier_doc })
      : undefined,
    actions: [
      {
        id: 'supplier-top',
        label: t('relationalAnalytics.actions.supplierTop', 'Productos suministrados'),
        description: t(
          'relationalAnalytics.menu.lastPriceSummary',
          'Último: {price} · Compras: {purchases}',
          {
            price: formatDrilldownMoney(row.last_unit_price, row.currency),
            purchases: formatDrilldownCount(row.purchases),
          },
        ),
        icon: Boxes,
        onSelect: () =>
          navigate(
            `/purchase-analytics/suppliers/top-products?supplier_id=${encodeURIComponent(row.supplier_id)}`,
          ),
      },
      ...(row.supplier_doc
        ? [
            {
              id: 'copy-doc',
              label: t('relationalAnalytics.actions.copyDoc', 'Copiar documento'),
              description: row.supplier_doc,
              icon: Copy,
              onSelect: () => void copyValue(row.supplier_doc),
            },
          ]
        : []),
    ],
  });

  return (
    <DrilldownScreen<ProductSupplierRow>
      testId="product-suppliers-page"
      title={t('relationalAnalytics.productSuppliers.title', 'Comparar proveedores')}
      subtitle={t(
        'relationalAnalytics.productSuppliers.subtitle',
        'Quién ofrece este producto y a qué precio, en moneda base.',
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
        'relationalAnalytics.productSuppliers.empty',
        'Sin proveedores que hayan comprado este producto (compras completadas)',
      )}
      columns={COLUMNS}
      rowKey={(row) => row.supplier_id}
      rowMenu={buildRowMenu}
      metaBanner={
        <DrilldownMetaBanner excludedOtherCurrency={query.view.excludedOtherCurrency} />
      }
      query={query}
    />
  );
};

export default ProductSuppliersPage;
