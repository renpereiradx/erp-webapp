import { useState } from 'react'
import { Boxes, Tags } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableSkeleton } from '@/components/ui/DataSkeletons'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import TablePagination from '@/components/ui/TablePagination'
import {
  clampPage,
  formatCount,
  formatIsoDate,
  formatMoney,
  formatPercent,
  formatQuantity,
} from '@/domain/sales-analytics/format'
import {
  DEFAULT_PURCHASE_PRODUCT_SORT,
  isPurchaseProductSortField,
  nextPurchaseProductSort,
} from '@/domain/purchase-analytics/products'
import {
  PurchasePageLayout,
  PurchasePeriodSelector,
  PurchaseRefreshButton,
  PurchaseTable,
  SortableHeader,
  usePurchasePeriod,
  usePurchasesByCategory,
  usePurchasesByProduct,
} from '@/features/purchase-analytics'

/**
 * Productos y categorías de compras: tabla por categoría (top del BE) y
 * tabla de productos paginada/ordenada server-side. Sin columna SKU (el BE
 * devuelve el id como `sku`) ni rank (es rank por monto aunque se ordene por
 * otro campo) — mismos drifts documentados que en ventas.
 */
const PurchaseProductsCategoriesPage = () => {
  const { t, lang } = useI18n()
  const { period } = usePurchasePeriod()

  const [page, setPage] = useState(1)
  const [sort, setSort] = useState(DEFAULT_PURCHASE_PRODUCT_SORT)

  const categoriesQuery = usePurchasesByCategory(period)
  const productsQuery = usePurchasesByProduct(period, page, sort.by, sort.order)

  const categories = categoriesQuery.data?.categories ?? []
  const products = productsQuery.data?.products ?? []
  const pagination = productsQuery.data?.pagination
  const errorTitle = t('purchaseAnalytics.errors.title', 'No se pudieron cargar los datos')

  const handleSort = (field: typeof sort.by) => {
    if (!isPurchaseProductSortField(field)) return
    const next = nextPurchaseProductSort(sort, field)
    setSort(next)
    setPage(1)
  }

  const ariaSortFor = (field: typeof sort.by): 'ascending' | 'descending' | 'none' =>
    sort.by === field ? (sort.order === 'asc' ? 'ascending' : 'descending') : 'none'

  const categoryColumns = [
    {
      key: 'category',
      header: t('purchaseAnalytics.columns.category', 'Categoría'),
      render: (row: (typeof categories)[number]) => row.category_name,
    },
    {
      key: 'purchases',
      header: t('purchaseAnalytics.columns.purchases', 'Compras'),
      align: 'right' as const,
      render: (row: (typeof categories)[number]) => formatMoney(row.purchases),
    },
    {
      key: 'share',
      header: t('purchaseAnalytics.columns.share', 'Participación'),
      align: 'right' as const,
      render: (row: (typeof categories)[number]) => formatPercent(row.percentage),
    },
    {
      key: 'orders',
      header: t('purchaseAnalytics.columns.ordersCount', 'Órdenes'),
      align: 'right' as const,
      render: (row: (typeof categories)[number]) => formatCount(row.transactions),
    },
    {
      key: 'units',
      header: t('purchaseAnalytics.columns.units', 'Unidades'),
      align: 'right' as const,
      render: (row: (typeof categories)[number]) => formatQuantity(row.units_purchased),
    },
    {
      key: 'topProduct',
      header: t('purchaseAnalytics.columns.topProduct', 'Producto principal'),
      render: (row: (typeof categories)[number]) => row.top_product || '—',
    },
  ]

  const productColumns = [
    {
      key: 'product',
      header: (
        <SortableHeader
          label={t('purchaseAnalytics.columns.product', 'Producto')}
          active={sort.by === 'name'}
          order={sort.order}
          onSort={() => handleSort('name')}
          testId="sort-product-name"
        />
      ),
      render: (row: (typeof products)[number]) => (
        <div className="min-w-0">
          <p className="truncate text-body-md text-foreground">{row.product_name || row.product_id}</p>
          <p className="text-body-sm text-on-surface-deep">{row.category_name || '—'}</p>
        </div>
      ),
    },
    {
      key: 'purchases',
      header: (
        <SortableHeader
          label={t('purchaseAnalytics.columns.purchases', 'Compras')}
          active={sort.by === 'purchases'}
          order={sort.order}
          onSort={() => handleSort('purchases')}
          testId="sort-product-purchases"
        />
      ),
      align: 'right' as const,
      ariaSort: ariaSortFor('purchases'),
      render: (row: (typeof products)[number]) => formatMoney(row.purchases),
    },
    {
      key: 'units',
      header: (
        <SortableHeader
          label={t('purchaseAnalytics.columns.units', 'Unidades')}
          active={sort.by === 'units'}
          order={sort.order}
          onSort={() => handleSort('units')}
          testId="sort-product-units"
        />
      ),
      align: 'right' as const,
      ariaSort: ariaSortFor('units'),
      render: (row: (typeof products)[number]) => formatQuantity(row.units_purchased),
    },
    {
      key: 'avgPrice',
      header: t('purchaseAnalytics.columns.avgPrice', 'Precio promedio'),
      align: 'right' as const,
      render: (row: (typeof products)[number]) => formatMoney(row.average_price),
    },
    {
      key: 'orders',
      header: t('purchaseAnalytics.columns.ordersCount', 'Órdenes'),
      align: 'right' as const,
      render: (row: (typeof products)[number]) => formatCount(row.transactions),
    },
    {
      key: 'lastPurchase',
      header: (
        <SortableHeader
          label={t('purchaseAnalytics.columns.lastPurchase', 'Última compra')}
          active={sort.by === 'last_purchase'}
          order={sort.order}
          onSort={() => handleSort('last_purchase')}
          testId="sort-product-last-purchase"
        />
      ),
      align: 'right' as const,
      mono: true,
      ariaSort: ariaSortFor('last_purchase'),
      render: (row: (typeof products)[number]) => formatIsoDate(row.last_purchase_date, lang),
    },
  ]

  return (
    <PurchasePageLayout
      title={t('purchaseAnalytics.productsPage.title', 'Compras por producto y categoría')}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <PurchasePeriodSelector />
          <PurchaseRefreshButton />
        </div>
      }
    >
      <SectionCard
        title={t('purchaseAnalytics.categories.title', 'Compras por categoría')}
        testId="purchase-categories"
      >
        <QueryBoundary
          isLoading={categoriesQuery.isLoading}
          error={categoriesQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void categoriesQuery.refetch()}
          skeleton={<TableSkeleton rows={5} testId="purchase-categories-skeleton" />}
        >
          <PurchaseTable
            columns={categoryColumns}
            rows={categories}
            rowKey={(row) => row.category_id}
            minWidthClass="min-w-[760px]"
            testId="purchase-categories-table"
            empty={
              <TableEmptyState
                icon={Tags}
                title={t('purchaseAnalytics.categories.empty', 'Sin compras en el período')}
                description={t(
                  'purchaseAnalytics.categories.emptyHint',
                  'Probá con otro período.',
                )}
              />
            }
          />
        </QueryBoundary>
      </SectionCard>

      <SectionCard
        title={t('purchaseAnalytics.products.title', 'Productos comprados')}
        testId="purchase-products"
      >
        <QueryBoundary
          isLoading={productsQuery.isLoading}
          error={productsQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void productsQuery.refetch()}
          skeleton={<TableSkeleton rows={8} testId="purchase-products-skeleton" />}
        >
          <PurchaseTable
            columns={productColumns}
            rows={products}
            rowKey={(row) => row.product_id}
            minWidthClass="min-w-[820px]"
            testId="purchase-products-table"
            empty={
              <TableEmptyState
                icon={Boxes}
                title={t('purchaseAnalytics.products.empty', 'Sin productos comprados')}
                description={t('purchaseAnalytics.products.emptyHint', 'Probá con otro período.')}
              />
            }
          />
          {pagination && pagination.total_pages > 1 ? (
            <TablePagination
              page={clampPage(pagination.page, pagination)}
              totalPages={pagination.total_pages}
              totalItems={pagination.total_items}
              onPageChange={(next) => setPage(clampPage(next, pagination))}
            />
          ) : null}
        </QueryBoundary>
      </SectionCard>
    </PurchasePageLayout>
  )
}

export default PurchaseProductsCategoriesPage
