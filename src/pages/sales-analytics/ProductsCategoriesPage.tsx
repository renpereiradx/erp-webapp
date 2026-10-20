import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import TablePagination from '@/components/ui/TablePagination'
import {
  buildProductRankItems,
  DEFAULT_PRODUCT_SORT,
  nextProductSort,
  type ProductSortState,
} from '@/domain/sales-analytics/products'
import { SALES_RANK_LIMIT } from '@/domain/sales-analytics/constants'
import {
  CategoryTable,
  ProductRankList,
  ProductsTable,
  SalesPageLayout,
  SalesPeriodSelector,
  SalesRefreshButton,
  TableCard,
  useSalesByCategory,
  useSalesByProduct,
  useSalesPeriod,
  useSalesTopBottomProducts,
} from '@/features/sales-analytics'

/**
 * F4 — Productos y categorías: desglose por categoría, rankings reales del BE
 * (más vendidos, mayor margen, menos vendidos) y detalle de productos con
 * orden y paginación server-side.
 */
const ProductsCategoriesPage = () => {
  const { t } = useI18n()
  const { period } = useSalesPeriod()
  const [sort, setSort] = useState<ProductSortState>(DEFAULT_PRODUCT_SORT)
  const [page, setPage] = useState(1)

  // Cambiar de período = nuevo análisis: la página anterior no aplica.
  useEffect(() => {
    setPage(1)
  }, [period])

  const categoryQuery = useSalesByCategory(period)
  const rankQuery = useSalesTopBottomProducts(period, SALES_RANK_LIMIT)
  const productsQuery = useSalesByProduct(period, page, sort.by, sort.order)

  const pagination = productsQuery.data?.pagination
  const errorTitle = t('salesAnalytics.errors.title', 'No se pudieron cargar los datos')

  const handleSort = (field: Parameters<typeof nextProductSort>[1]) => {
    setSort((current) => nextProductSort(current, field))
    setPage(1)
  }

  return (
    <SalesPageLayout
      title={t('salesAnalytics.products.title', 'Productos y categorías')}
      subtitle={t(
        'salesAnalytics.products.subtitle',
        'Por categoría y producto.',
      )}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <SalesPeriodSelector />
          <SalesRefreshButton />
        </div>
      }
    >
      <TableCard
        title={t('salesAnalytics.products.categoriesTitle', 'Ventas por categoría')}
        description={t(
          'salesAnalytics.products.categoriesSubtitle',
          'Participación y margen de cada categoría en el período.',
        )}
        testId="sales-categories-card"
      >
        <QueryBoundary
          isLoading={categoryQuery.isLoading}
          error={categoryQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void categoryQuery.refetch()}
          skeleton={<TableSkeleton rows={6} testId="sales-categories-skeleton" />}
        >
          <CategoryTable
            categories={categoryQuery.data?.categories ?? []}
            totalSales={categoryQuery.data?.totalSales ?? 0}
          />
        </QueryBoundary>
      </TableCard>

      <div className="grid items-start gap-xl lg:grid-cols-3">
        <SectionCard
          title={t('salesAnalytics.products.rankTopTitle', 'Más vendidos')}
          description={t(
            'salesAnalytics.products.rankTopSubtitle',
            'Mayores ventas del período.',
          )}
          testId="sales-rank-top"
        >
          <QueryBoundary
            isLoading={rankQuery.isLoading}
            error={rankQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void rankQuery.refetch()}
            skeleton={<PanelSkeleton rows={5} testId="sales-rank-top-skeleton" />}
          >
            <ProductRankList
              items={buildProductRankItems(rankQuery.data?.topSellers)}
              metric="units"
              testId="sales-rank-top-list"
            />
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('salesAnalytics.products.rankMarginTitle', 'Mayor margen')}
          description={t(
            'salesAnalytics.products.rankMarginSubtitle',
            'Productos con mayor utilidad bruta.',
          )}
          testId="sales-rank-margin"
        >
          <QueryBoundary
            isLoading={rankQuery.isLoading}
            error={rankQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void rankQuery.refetch()}
            skeleton={<PanelSkeleton rows={5} testId="sales-rank-margin-skeleton" />}
          >
            <ProductRankList
              items={buildProductRankItems(rankQuery.data?.topByMargin)}
              metric="margin"
              testId="sales-rank-margin-list"
            />
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('salesAnalytics.products.rankBottomTitle', 'Menos vendidos')}
          description={t(
            'salesAnalytics.products.rankBottomSubtitle',
            'Menores ventas del período.',
          )}
          testId="sales-rank-bottom"
        >
          <QueryBoundary
            isLoading={rankQuery.isLoading}
            error={rankQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void rankQuery.refetch()}
            skeleton={<PanelSkeleton rows={5} testId="sales-rank-bottom-skeleton" />}
          >
            <ProductRankList
              items={buildProductRankItems(rankQuery.data?.bottomSellers)}
              metric="units"
              testId="sales-rank-bottom-list"
            />
          </QueryBoundary>
        </SectionCard>
      </div>

      <TableCard
        title={t('salesAnalytics.products.detailTitle', 'Detalle por producto')}
        description={t(
          'salesAnalytics.products.detailSubtitle',
          'Ordená por columna; el orden y la paginación los resuelve el servidor.',
        )}
        testId="sales-products-card"
        footer={
          pagination ? (
            <TablePagination
              page={pagination.page}
              totalPages={pagination.total_pages}
              totalItems={pagination.total_items}
              onPageChange={setPage}
            />
          ) : null
        }
      >
        <QueryBoundary
          isLoading={productsQuery.isLoading}
          error={productsQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void productsQuery.refetch()}
          skeleton={<TableSkeleton rows={6} testId="sales-products-skeleton" />}
        >
          <ProductsTable
            products={productsQuery.data?.products ?? []}
            sort={sort}
            onSort={handleSort}
          />
        </QueryBoundary>
      </TableCard>
    </SalesPageLayout>
  )
}

export default ProductsCategoriesPage
