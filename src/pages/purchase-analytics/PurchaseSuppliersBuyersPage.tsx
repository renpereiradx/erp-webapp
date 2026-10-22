import { useState } from 'react'
import { Store, UserCog } from 'lucide-react'
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
  formatQuantity,
} from '@/domain/sales-analytics/format'
import { buildSupplierPurchaseRows } from '@/domain/purchase-analytics/suppliers'
import {
  DEFAULT_PURCHASE_SUPPLIER_SORT,
  isPurchaseSupplierSortField,
  nextPurchaseSupplierSort,
} from '@/domain/purchase-analytics/suppliers'
import {
  PurchasePageLayout,
  PurchasePeriodSelector,
  PurchaseRefreshButton,
  PurchaseTable,
  SortableHeader,
  usePurchasePeriod,
  usePurchasesByBuyer,
  usePurchasesBySupplier,
} from '@/features/purchase-analytics'

/**
 * Insights de compras: tabla de proveedores (paginada/ordenada server-side)
 * y ranking de compradores (usuarios que registran las órdenes). El documento
 * del proveedor (RUC/CI) va como sublínea cuando existe.
 */
const PurchaseSuppliersBuyersPage = () => {
  const { t, lang } = useI18n()
  const { period } = usePurchasePeriod()

  const [supplierPage, setSupplierPage] = useState(1)
  const [supplierSort, setSupplierSort] = useState(DEFAULT_PURCHASE_SUPPLIER_SORT)
  const [buyerPage, setBuyerPage] = useState(1)

  const suppliersQuery = usePurchasesBySupplier(
    period,
    supplierPage,
    supplierSort.by,
    supplierSort.order,
  )
  const buyersQuery = usePurchasesByBuyer(period, buyerPage)

  const suppliers = buildSupplierPurchaseRows(suppliersQuery.data?.suppliers)
  const buyers = buyersQuery.data?.buyers ?? []
  const supplierPagination = suppliersQuery.data?.pagination
  const buyerPagination = buyersQuery.data?.pagination
  const errorTitle = t('purchaseAnalytics.errors.title', 'No se pudieron cargar los datos')

  const handleSupplierSort = (field: typeof supplierSort.by) => {
    if (!isPurchaseSupplierSortField(field)) return
    setSupplierSort(nextPurchaseSupplierSort(supplierSort, field))
    setSupplierPage(1)
  }

  const ariaSortFor = (field: typeof supplierSort.by): 'ascending' | 'descending' | 'none' =>
    supplierSort.by === field
      ? supplierSort.order === 'asc'
        ? 'ascending'
        : 'descending'
      : 'none'

  const supplierColumns = [
    {
      key: 'supplier',
      header: (
        <SortableHeader
          label={t('purchaseAnalytics.columns.supplier', 'Proveedor')}
          active={supplierSort.by === 'name'}
          order={supplierSort.order}
          onSort={() => handleSupplierSort('name')}
          testId="sort-supplier-name"
        />
      ),
      ariaSort: ariaSortFor('name'),
      render: (row: (typeof suppliers)[number]) => (
        <div className="min-w-0">
          <p className="truncate text-body-md text-foreground">{row.name}</p>
          {row.doc ? (
            <p className="font-data-mono text-data-mono text-body-sm text-on-surface-deep">{row.doc}</p>
          ) : null}
        </div>
      ),
    },
    {
      key: 'amount',
      header: (
        <SortableHeader
          label={t('purchaseAnalytics.columns.amount', 'Monto comprado')}
          active={supplierSort.by === 'amount'}
          order={supplierSort.order}
          onSort={() => handleSupplierSort('amount')}
          testId="sort-supplier-amount"
        />
      ),
      align: 'right' as const,
      ariaSort: ariaSortFor('amount'),
      render: (row: (typeof suppliers)[number]) => formatMoney(row.totalPurchases),
    },
    {
      key: 'orders',
      header: (
        <SortableHeader
          label={t('purchaseAnalytics.columns.ordersCount', 'Órdenes')}
          active={supplierSort.by === 'purchases'}
          order={supplierSort.order}
          onSort={() => handleSupplierSort('purchases')}
          testId="sort-supplier-orders"
        />
      ),
      align: 'right' as const,
      ariaSort: ariaSortFor('purchases'),
      render: (row: (typeof suppliers)[number]) => formatCount(row.orders),
    },
    {
      key: 'avgOrder',
      header: t('purchaseAnalytics.columns.avgOrder', 'Orden promedio'),
      align: 'right' as const,
      render: (row: (typeof suppliers)[number]) => formatMoney(row.averageOrder),
    },
    {
      key: 'lastPurchase',
      header: (
        <SortableHeader
          label={t('purchaseAnalytics.columns.lastPurchase', 'Última compra')}
          active={supplierSort.by === 'last_purchase'}
          order={supplierSort.order}
          onSort={() => handleSupplierSort('last_purchase')}
          testId="sort-supplier-last-purchase"
        />
      ),
      align: 'right' as const,
      mono: true,
      ariaSort: ariaSortFor('last_purchase'),
      render: (row: (typeof suppliers)[number]) => formatIsoDate(row.lastPurchaseIso, lang),
    },
  ]

  const buyerColumns = [
    {
      key: 'buyer',
      header: t('purchaseAnalytics.columns.buyer', 'Comprador'),
      render: (row: (typeof buyers)[number]) => row.buyer_name || row.buyer_id,
    },
    {
      key: 'amount',
      header: t('purchaseAnalytics.columns.amount', 'Monto comprado'),
      align: 'right' as const,
      render: (row: (typeof buyers)[number]) => formatMoney(row.total_purchases),
    },
    {
      key: 'orders',
      header: t('purchaseAnalytics.columns.ordersCount', 'Órdenes'),
      align: 'right' as const,
      render: (row: (typeof buyers)[number]) => formatCount(row.transaction_count),
    },
    {
      key: 'units',
      header: t('purchaseAnalytics.columns.units', 'Unidades'),
      align: 'right' as const,
      render: (row: (typeof buyers)[number]) => formatQuantity(row.units_purchased),
    },
    {
      key: 'avgOrder',
      header: t('purchaseAnalytics.columns.avgOrder', 'Orden promedio'),
      align: 'right' as const,
      render: (row: (typeof buyers)[number]) => formatMoney(row.average_order),
    },
  ]

  return (
    <PurchasePageLayout
      title={t('purchaseAnalytics.insights.title', 'Proveedores y compradores')}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <PurchasePeriodSelector />
          <PurchaseRefreshButton />
        </div>
      }
    >
      <SectionCard title={t('purchaseAnalytics.suppliers.title', 'Compras por proveedor')} testId="purchase-suppliers">
        <QueryBoundary
          isLoading={suppliersQuery.isLoading}
          error={suppliersQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void suppliersQuery.refetch()}
          skeleton={<TableSkeleton rows={8} testId="purchase-suppliers-skeleton" />}
        >
          <PurchaseTable
            columns={supplierColumns}
            rows={suppliers}
            rowKey={(row) => row.id}
            minWidthClass="min-w-[760px]"
            testId="purchase-suppliers-table"
            empty={
              <TableEmptyState
                icon={Store}
                title={t('purchaseAnalytics.suppliers.empty', 'Sin compras en el período')}
                description={t('purchaseAnalytics.suppliers.emptyHint', 'Probá con otro período.')}
              />
            }
          />
          {supplierPagination && supplierPagination.total_pages > 1 ? (
            <TablePagination
              page={clampPage(supplierPagination.page, supplierPagination)}
              totalPages={supplierPagination.total_pages}
              totalItems={supplierPagination.total_items}
              onPageChange={(next) => setSupplierPage(clampPage(next, supplierPagination))}
            />
          ) : null}
        </QueryBoundary>
      </SectionCard>

      <SectionCard title={t('purchaseAnalytics.buyers.title', 'Compras por comprador')} testId="purchase-buyers">
        <QueryBoundary
          isLoading={buyersQuery.isLoading}
          error={buyersQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void buyersQuery.refetch()}
          skeleton={<TableSkeleton rows={5} testId="purchase-buyers-skeleton" />}
        >
          <PurchaseTable
            columns={buyerColumns}
            rows={buyers}
            rowKey={(row) => row.buyer_id}
            minWidthClass="min-w-[680px]"
            testId="purchase-buyers-table"
            empty={
              <TableEmptyState
                icon={UserCog}
                title={t('purchaseAnalytics.buyers.empty', 'Sin compradores en el período')}
                description={t('purchaseAnalytics.buyers.emptyHint', 'Probá con otro período.')}
              />
            }
          />
          {buyerPagination && buyerPagination.total_pages > 1 ? (
            <TablePagination
              page={clampPage(buyerPagination.page, buyerPagination)}
              totalPages={buyerPagination.total_pages}
              totalItems={buyerPagination.total_items}
              onPageChange={(next) => setBuyerPage(clampPage(next, buyerPagination))}
            />
          ) : null}
        </QueryBoundary>
      </SectionCard>
    </PurchasePageLayout>
  )
}

export default PurchaseSuppliersBuyersPage
