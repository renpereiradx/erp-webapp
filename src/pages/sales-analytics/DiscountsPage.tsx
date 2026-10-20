import { useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import TablePagination from '@/components/ui/TablePagination'
import type { DiscountGroupBy } from '@/types/bi'
import { SALES_DISCOUNTS_PAGE_SIZE } from '@/domain/sales-analytics/constants'
import {
  buildDiscountSummaryView,
  DEFAULT_DISCOUNT_GROUP,
  defaultDiscountRange,
  validateDiscountRange,
} from '@/domain/sales-analytics/discounts'
import { formatCalendarDate } from '@/domain/sales-analytics/periods'
import {
  DiscountsControls,
  DiscountsSummary,
  DiscountsTable,
  SalesPageLayout,
  SalesRefreshButton,
  TableCard,
  useDiscounts,
  useDiscountsSummary,
} from '@/features/sales-analytics'

/**
 * F4 — Descuentos: "quién descontó cuánto" sobre
 * `/sales-analytics/discounts[/summary]` (gate reports:read). Fechas
 * obligatorias; el rango aplicado se muestra tal cual se pidió (el
 * `metadata.end_date` del BE es el límite exclusivo de la query).
 */
const DiscountsPage = () => {
  const { t, lang } = useI18n()
  const [initialRange] = useState(() => defaultDiscountRange(new Date()))
  const [draft, setDraft] = useState(initialRange)
  const [applied, setApplied] = useState(initialRange)
  const [groupBy, setGroupBy] = useState<DiscountGroupBy>(DEFAULT_DISCOUNT_GROUP)
  const [page, setPage] = useState(1)

  const draftInvalid = !validateDiscountRange(draft.start_date, draft.end_date)
  const appliedValid = validateDiscountRange(applied.start_date, applied.end_date)

  const summaryQuery = useDiscountsSummary(
    { start_date: applied.start_date, end_date: applied.end_date, group_by: groupBy },
    appliedValid,
  )
  const linesQuery = useDiscounts(
    {
      start_date: applied.start_date,
      end_date: applied.end_date,
      page,
      page_size: SALES_DISCOUNTS_PAGE_SIZE,
    },
    appliedValid,
  )

  const summaryView = buildDiscountSummaryView(summaryQuery.data?.rows)
  const totalCount = linesQuery.data?.totalCount ?? 0
  const totalPages = Math.max(1, Math.ceil(totalCount / SALES_DISCOUNTS_PAGE_SIZE))
  const errorTitle = t('salesAnalytics.errors.title', 'No se pudieron cargar los datos')
  const appliedRange = `${formatCalendarDate(applied.start_date, lang)} – ${formatCalendarDate(
    applied.end_date,
    lang,
  )}`

  const handleApply = () => {
    if (!draftInvalid) {
      setApplied(draft)
      setPage(1)
    }
  }

  return (
    <SalesPageLayout
      title={t('salesAnalytics.discounts.title', 'Descuentos en ventas')}
      subtitle={t(
        'salesAnalytics.discounts.subtitle',
        'Quién descontó cuánto.',
      )}
      actions={<SalesRefreshButton />}
    >
      <SectionCard
        title={t('salesAnalytics.discounts.controlsTitle', 'Rango y agrupación')}
        description={t(
          'salesAnalytics.discounts.controlsSubtitle',
          'Elegí las fechas y cómo agrupar el resumen.',
        )}
        testId="sales-discounts-controls"
      >
        <DiscountsControls
          draft={draft}
          onDraftChange={setDraft}
          onApply={handleApply}
          groupBy={groupBy}
          onGroupByChange={setGroupBy}
          invalid={draftInvalid}
          isFetching={linesQuery.isFetching || summaryQuery.isFetching}
        />
      </SectionCard>

      <SectionCard
        title={t('salesAnalytics.discounts.summaryTitle', 'Resumen de descuentos')}
        description={t('salesAnalytics.discounts.appliedRange', 'Rango aplicado: {range}', {
          range: appliedRange,
        })}
        testId="sales-discounts-summary-card"
      >
        {appliedValid ? (
          <QueryBoundary
            isLoading={summaryQuery.isLoading}
            error={summaryQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void summaryQuery.refetch()}
            skeleton={<PanelSkeleton rows={4} testId="sales-discounts-summary-skeleton" />}
          >
            <DiscountsSummary view={summaryView} />
          </QueryBoundary>
        ) : (
          <p className="text-body-md text-on-surface-deep">
            {t(
              'salesAnalytics.discounts.fixRange',
              'Corregí el rango de fechas para ver el reporte.',
            )}
          </p>
        )}
      </SectionCard>

      <TableCard
        title={t('salesAnalytics.discounts.linesTitle', 'Líneas con descuento')}
        description={t('salesAnalytics.discounts.appliedRange', 'Rango aplicado: {range}', {
          range: appliedRange,
        })}
        testId="sales-discounts-lines-card"
        footer={
          appliedValid ? (
            <TablePagination
              page={page}
              totalPages={totalPages}
              totalItems={totalCount}
              onPageChange={setPage}
            />
          ) : null
        }
      >
        {appliedValid ? (
          <QueryBoundary
            isLoading={linesQuery.isLoading}
            error={linesQuery.error}
            errorTitle={errorTitle}
            onRetry={() => void linesQuery.refetch()}
            skeleton={<TableSkeleton rows={6} testId="sales-discounts-lines-skeleton" />}
          >
            <DiscountsTable lines={linesQuery.data?.lines ?? []} />
          </QueryBoundary>
        ) : (
          <p className="px-lg pb-lg text-body-md text-on-surface-deep">
            {t(
              'salesAnalytics.discounts.fixRange',
              'Corregí el rango de fechas para ver el reporte.',
            )}
          </p>
        )}
      </TableCard>
    </SalesPageLayout>
  )
}

export default DiscountsPage
