import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { CardGridSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import TablePagination from '@/components/ui/TablePagination'
import { buildCustomerSummaryItems } from '@/domain/sales-analytics/customers'
import {
  CustomerSummaryCards,
  CustomersTable,
  SalesPageLayout,
  SalesPeriodSelector,
  SalesRefreshButton,
  SellersTable,
  TableCard,
  useSalesByCustomer,
  useSalesBySeller,
  useSalesPeriod,
} from '@/features/sales-analytics'

/**
 * F4 — Clientes y vendedores: resumen de clientes del período (nuevos,
 * recurrentes, retención real y valores históricos) + tabla de clientes y
 * ranking de vendedores, ambos paginados por el BE.
 */
const CustomerSellerInsightsPage = () => {
  const { t } = useI18n()
  const { period } = useSalesPeriod()
  const [customerPage, setCustomerPage] = useState(1)
  const [sellerPage, setSellerPage] = useState(1)

  useEffect(() => {
    setCustomerPage(1)
    setSellerPage(1)
  }, [period])

  const customersQuery = useSalesByCustomer(period, customerPage)
  const sellersQuery = useSalesBySeller(period, sellerPage)

  const summaryItems = buildCustomerSummaryItems(customersQuery.data?.summary)
  const customerPagination = customersQuery.data?.pagination
  const sellerPagination = sellersQuery.data?.pagination
  const errorTitle = t('salesAnalytics.errors.title', 'No se pudieron cargar los datos')

  return (
    <SalesPageLayout
      title={t('salesAnalytics.insights.title', 'Clientes y vendedores')}
      subtitle={t(
        'salesAnalytics.insights.subtitle',
        'Quién compra y quién vende.',
      )}
      actions={
        <div className="flex flex-wrap items-center gap-sm">
          <SalesPeriodSelector />
          <SalesRefreshButton />
        </div>
      }
    >
      <section aria-labelledby="customer-summary-title" className="space-y-sm">
        <h2 id="customer-summary-title" className="text-title-md text-foreground">
          {t('salesAnalytics.customers.summaryTitle', 'Resumen de clientes')}
        </h2>
        <QueryBoundary
          isLoading={customersQuery.isLoading}
          error={customersQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void customersQuery.refetch()}
          skeleton={<CardGridSkeleton count={6} columns={3} testId="customer-summary-skeleton" />}
        >
          <CustomerSummaryCards items={summaryItems} />
        </QueryBoundary>
      </section>

      <TableCard
        title={t('salesAnalytics.customers.title', 'Clientes del período')}
        description={t(
          'salesAnalytics.customers.subtitle',
          'Compras, frecuencia y segmento por cliente.',
        )}
        testId="sales-customers-card"
        footer={
          customerPagination ? (
            <TablePagination
              page={customerPagination.page}
              totalPages={customerPagination.total_pages}
              totalItems={customerPagination.total_items}
              onPageChange={setCustomerPage}
            />
          ) : null
        }
      >
        <QueryBoundary
          isLoading={customersQuery.isLoading}
          error={customersQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void customersQuery.refetch()}
          skeleton={<TableSkeleton rows={6} testId="sales-customers-skeleton" />}
        >
          <CustomersTable customers={customersQuery.data?.customers ?? []} />
        </QueryBoundary>
      </TableCard>

      <TableCard
        title={t('salesAnalytics.sellers.title', 'Ranking de vendedores')}
        description={t(
          'salesAnalytics.sellers.subtitle',
          'Ventas del período ordenadas por vendedor.',
        )}
        testId="sales-sellers-card"
        footer={
          sellerPagination ? (
            <TablePagination
              page={sellerPagination.page}
              totalPages={sellerPagination.total_pages}
              totalItems={sellerPagination.total_items}
              onPageChange={setSellerPage}
            />
          ) : null
        }
      >
        <QueryBoundary
          isLoading={sellersQuery.isLoading}
          error={sellersQuery.error}
          errorTitle={errorTitle}
          onRetry={() => void sellersQuery.refetch()}
          skeleton={<TableSkeleton rows={6} testId="sales-sellers-skeleton" />}
        >
          <SellersTable sellers={sellersQuery.data?.sellers ?? []} />
        </QueryBoundary>
      </TableCard>
    </SalesPageLayout>
  )
}

export default CustomerSellerInsightsPage
