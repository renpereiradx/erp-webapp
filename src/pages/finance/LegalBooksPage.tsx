import { useState } from 'react'
import { BookOpen, FileText, Receipt } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import TablePagination from '@/components/ui/TablePagination'
import SegmentedControl from '@/components/ui/SegmentedControl'
import {
  FinanceKpiLedger,
  FinancePeriodSelector,
  FinanceRefreshButton,
  FinanceTable,
  FinancialReportsPageLayout,
  LedgerFilters,
  useFinancePeriod,
  usePurchaseLedger,
  useSalesLedger,
  type FinanceColumn,
  type FinanceKpiItem,
  type FinanceKpiTone,
  type LedgerFilterValues,
} from '@/features/financial-reports'
import { formatFinancialRange } from '@/domain/finance/reportPeriod'
import { formatDate, formatMoney } from '@/domain/finance/format'
import { fiscalText, hasFiscalData, ledgerKpis } from '@/domain/finance/ledgers'
import { formatKpiValue, type FinanceKpiValue } from '@/domain/finance/kpis'
import type { PurchaseLedgerEntry, SalesLedgerEntry } from '@/types/bi'

type BookKey = 'sales' | 'purchases'

interface KpiMeta {
  icon: LucideIcon
  tone: FinanceKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const SUMMARY_META: Record<string, KpiMeta> = {
  transactions: {
    icon: Receipt,
    tone: 'primary',
    labelKey: 'finance.ledger.kpis.transactions',
    label: 'Comprobantes',
    hintKey: 'finance.ledger.hints.transactions',
    hint: 'Total del filtro, no de la página',
  },
  gross: {
    icon: FileText,
    tone: 'secondary',
    labelKey: 'finance.ledger.kpis.gross',
    label: 'Total bruto',
    hintKey: 'finance.ledger.hints.gross',
    hint: 'Importe bruto del libro',
  },
  vat10: {
    icon: FileText,
    tone: 'secondary',
    labelKey: 'finance.ledger.kpis.vat10',
    label: 'IVA 10%',
    hintKey: 'finance.ledger.hints.vat10',
    hint: 'IVA incluido al 10%',
  },
  vat5: {
    icon: FileText,
    tone: 'secondary',
    labelKey: 'finance.ledger.kpis.vat5',
    label: 'IVA 5%',
    hintKey: 'finance.ledger.hints.vat5',
    hint: 'IVA incluido al 5%',
  },
  exempt: {
    icon: FileText,
    tone: 'neutral',
    labelKey: 'finance.ledger.kpis.exempt',
    label: 'Exento',
    hintKey: 'finance.ledger.hints.exempt',
    hint: 'Operaciones exentas',
  },
  net: {
    icon: FileText,
    tone: 'success',
    labelKey: 'finance.ledger.kpis.net',
    label: 'Total neto',
    hintKey: 'finance.ledger.hints.net',
    hint: 'Bruto − IVA',
  },
}

const EMPTY_FILTERS: LedgerFilterValues = {
  startDate: '',
  endDate: '',
  estado: '',
  cdc: '',
  timbrado: '',
}

const isInvalidRange = (values: LedgerFilterValues): boolean =>
  Boolean(values.startDate && values.endDate && values.startDate > values.endDate)

/**
 * F9 — Libros legales de ventas y compras. El libro de ventas admite filtros
 * SIFEN (estado, CDC, timbrado) solo junto a un rango de fechas: el endpoint
 * por período no los acepta. Los campos fiscales vacíos se muestran `—`.
 */
const LegalBooksPage = () => {
  const { t, lang } = useI18n()
  const { period, setPeriod } = useFinancePeriod()
  const [searchParams, setSearchParams] = useSearchParams()
  const book: BookKey = searchParams.get('book') === 'purchases' ? 'purchases' : 'sales'
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState<LedgerFilterValues>(EMPTY_FILTERS)
  const [applied, setApplied] = useState<LedgerFilterValues>(EMPTY_FILTERS)

  const invalidRange = isInvalidRange(draft)
  const partialRange = Boolean(draft.startDate || draft.endDate) && !(draft.startDate && draft.endDate)

  const sales = useSalesLedger({
    period,
    page,
    startDate: applied.startDate,
    endDate: applied.endDate,
    estado: applied.estado,
    cdc: applied.cdc,
    timbrado: applied.timbrado,
    enabled: book === 'sales',
  })
  const purchases = usePurchaseLedger({
    period,
    page,
    startDate: applied.startDate,
    endDate: applied.endDate,
    enabled: book === 'purchases',
  })
  const query = book === 'sales' ? sales : purchases

  const errorTitle = t('finance.errors.title', 'No se pudieron cargar los datos')
  const salesData = book === 'sales' ? sales.data : null
  const purchaseData = book === 'purchases' ? purchases.data : null
  const summary = salesData?.ledger.summary ?? purchaseData?.summary ?? null
  const pagination = salesData?.ledger.pagination ?? purchaseData?.pagination ?? null
  const range =
    formatFinancialRange(
      salesData?.ledger.period ?? purchaseData?.period ?? null,
      lang,
    )

  const kpiItems: FinanceKpiItem[] = ledgerKpis(summary).map((row: FinanceKpiValue) => {
    const meta = SUMMARY_META[row.id]
    return {
      id: row.id,
      icon: meta.icon,
      tone: meta.tone,
      label: t(meta.labelKey, meta.label),
      hint: t(meta.hintKey, meta.hint),
      value: formatKpiValue(row),
    }
  })

  const switchBook = (next: BookKey) => {
    const params = new URLSearchParams(searchParams)
    if (next === 'sales') params.delete('book')
    else params.set('book', 'purchases')
    setSearchParams(params, { replace: true })
    setPage(1)
    setApplied(EMPTY_FILTERS)
    setDraft(EMPTY_FILTERS)
  }

  const applyFilters = () => {
    if (invalidRange) return
    setApplied(draft)
    setPage(1)
  }

  const clearFilters = () => {
    setDraft(EMPTY_FILTERS)
    setApplied(EMPTY_FILTERS)
    setPage(1)
  }

  const salesColumns: Array<FinanceColumn<SalesLedgerEntry>> = [
    {
      key: 'date',
      mono: true,
      header: t('finance.ledger.date', 'Fecha'),
      render: (row) => formatDate(row.date, lang),
    },
    {
      key: 'invoice',
      mono: true,
      header: t('finance.ledger.invoice', 'Comprobante'),
      render: (row) => (
        <div className="flex flex-col">
          <span>{fiscalText(row.invoice_number) ?? '—'}</span>
          <span className="text-body-sm text-on-surface-deep">
            {fiscalText(row.timbrado)
              ? t('finance.ledger.timbradoValue', 'Timbrado: {value}', {
                  value: fiscalText(row.timbrado),
                })
              : t('finance.ledger.noTimbrado', 'Sin timbrado')}
          </span>
        </div>
      ),
    },
    {
      key: 'client',
      header: t('finance.ledger.client', 'Cliente'),
      render: (row) => (
        <div className="flex flex-col">
          <span>{row.client_name || '—'}</span>
          <span className="text-body-sm text-on-surface-deep">
            {fiscalText(row.client_ruc) ?? t('finance.ledger.noRuc', 'Sin RUC')}
          </span>
        </div>
      ),
    },
    {
      key: 'gross',
      align: 'right',
      header: t('finance.ledger.gross', 'Bruto'),
      render: (row) => formatMoney(row.gross_amount),
    },
    {
      key: 'vat10',
      align: 'right',
      header: t('finance.ledger.vat10', 'IVA 10%'),
      render: (row) => formatMoney(row.vat_10),
    },
    {
      key: 'vat5',
      align: 'right',
      header: t('finance.ledger.vat5', 'IVA 5%'),
      render: (row) => formatMoney(row.vat_5),
    },
    {
      key: 'exempt',
      align: 'right',
      header: t('finance.ledger.exempt', 'Exento'),
      render: (row) => formatMoney(row.exempt),
    },
    {
      key: 'net',
      align: 'right',
      header: t('finance.ledger.net', 'Neto'),
      render: (row) => formatMoney(row.net_amount),
    },
    {
      key: 'status',
      header: t('finance.ledger.paymentStatus', 'Estado'),
      render: (row) => row.payment_status || '—',
    },
    {
      key: 'sifen',
      header: t('finance.ledger.sifen', 'SIFEN'),
      render: (row) =>
        hasFiscalData(row) ? (
          <div className="flex flex-col">
            <span>{fiscalText(row.fiscal_estado) ?? '—'}</span>
            <span className="text-body-sm text-on-surface-deep">
              {fiscalText(row.cdc) ?? '—'}
            </span>
          </div>
        ) : (
          <span className="text-body-sm text-on-surface-deep">
            {t('finance.ledger.notFiscal', 'No fiscal')}
          </span>
        ),
    },
  ]

  const purchaseColumns: Array<FinanceColumn<PurchaseLedgerEntry>> = [
    {
      key: 'date',
      mono: true,
      header: t('finance.ledger.date', 'Fecha'),
      render: (row) => formatDate(row.date, lang),
    },
    {
      key: 'invoice',
      mono: true,
      header: t('finance.ledger.invoice', 'Comprobante'),
      render: (row) => (
        <div className="flex flex-col">
          <span>{fiscalText(row.invoice_number) ?? '—'}</span>
          <span className="text-body-sm text-on-surface-deep">
            {fiscalText(row.timbrado)
              ? t('finance.ledger.timbradoValue', 'Timbrado: {value}', {
                  value: fiscalText(row.timbrado),
                })
              : t('finance.ledger.noTimbrado', 'Sin timbrado')}
          </span>
        </div>
      ),
    },
    {
      key: 'supplier',
      header: t('finance.ledger.supplier', 'Proveedor'),
      render: (row) => (
        <div className="flex flex-col">
          <span>{row.supplier_name || '—'}</span>
          <span className="text-body-sm text-on-surface-deep">
            {fiscalText(row.supplier_ruc) ?? t('finance.ledger.noRuc', 'Sin RUC')}
          </span>
        </div>
      ),
    },
    {
      key: 'gross',
      align: 'right',
      header: t('finance.ledger.gross', 'Bruto'),
      render: (row) => formatMoney(row.gross_amount),
    },
    {
      key: 'vat10',
      align: 'right',
      header: t('finance.ledger.vat10', 'IVA 10%'),
      render: (row) => formatMoney(row.vat_10),
    },
    {
      key: 'vat5',
      align: 'right',
      header: t('finance.ledger.vat5', 'IVA 5%'),
      render: (row) => formatMoney(row.vat_5),
    },
    {
      key: 'exempt',
      align: 'right',
      header: t('finance.ledger.exempt', 'Exento'),
      render: (row) => formatMoney(row.exempt),
    },
    {
      key: 'net',
      align: 'right',
      header: t('finance.ledger.net', 'Neto'),
      render: (row) => formatMoney(row.net_amount),
    },
    {
      key: 'status',
      header: t('finance.ledger.paymentStatus', 'Estado'),
      render: (row) => row.payment_status || '—',
    },
    {
      key: 'category',
      header: t('finance.ledger.expenseCategory', 'Categoría de gasto'),
      render: (row) => fiscalText(row.expense_category) ?? '—',
    },
  ]

  const rows = book === 'sales' ? (salesData?.entries ?? []) : (purchaseData?.entries ?? [])

  return (
    <FinancialReportsPageLayout
      title={t('finance.ledger.title', 'Libros legales')}
      subtitle={t(
        'finance.ledger.subtitle',
        'Libro de ventas y compras con IVA por línea. Los comprobantes no fiscales se identifican como tales.',
      )}
      range={range}
      actions={
        <div className="flex max-w-full flex-wrap items-center justify-end gap-sm">
          <FinancePeriodSelector value={period} onChange={setPeriod} />
          <FinanceRefreshButton />
        </div>
      }
    >
      <SectionCard
        title={t('finance.ledger.bookTitle', 'Libro')}
        description={t(
          'finance.ledger.bookDescription',
          'Elegí el libro; los filtros SIFEN aplican solo al de ventas.',
        )}
        action={
          <SegmentedControl
            options={[
              { value: 'sales', label: t('finance.ledger.sales', 'Ventas') },
              { value: 'purchases', label: t('finance.ledger.purchases', 'Compras') },
            ]}
            value={book}
            onChange={(next: string) => switchBook(next as BookKey)}
            aria-label={t('finance.ledger.bookAria', 'Libro a consultar')}
            size="small"
          />
        }
        testId="finance-legal-book-selector"
      >
        <p className="text-body-sm text-on-surface-deep">
          {t(
            'finance.ledger.bookHint',
            'El rango de fechas y los filtros SIFEN usan el endpoint date-range; sin rango se usa el período seleccionado.',
          )}
        </p>
      </SectionCard>

      <LedgerFilters
        values={draft}
        onChange={(next) => setDraft((current) => ({ ...current, ...next }))}
        onApply={applyFilters}
        onClear={clearFilters}
        invalidRange={invalidRange}
        showSifen={book === 'sales'}
        testId="finance-legal-filters"
      />

      {partialRange ? (
        <p role="alert" className="text-body-sm text-error">
          {t(
            'finance.ledger.partialRange',
            'Completá ambas fechas o limpiá el rango para consultar por período.',
          )}
        </p>
      ) : null}

      <SectionCard
        title={t('finance.ledger.summaryTitle', 'Resumen del libro')}
        description={t(
          'finance.ledger.summaryDescription',
          'Totales del filtro aplicado, no de la página.',
        )}
        testId="finance-legal-summary"
      >
        <QueryBoundary
          isLoading={query.isLoading}
          error={query.error}
          errorTitle={errorTitle}
          onRetry={() => void query.refetch()}
          skeleton={<PanelSkeleton rows={6} />}
        >
          <FinanceKpiLedger items={kpiItems} testId="finance-legal-kpis" />
        </QueryBoundary>
      </SectionCard>

      <TableCard
        title={
          book === 'sales'
            ? t('finance.ledger.salesTitle', 'Libro de ventas')
            : t('finance.ledger.purchasesTitle', 'Libro de compras')
        }
        description={t(
          'finance.ledger.tableDescription',
          'IVA por línea según el libro; 10 comprobantes por página.',
        )}
        testId="finance-legal-table-card"
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
          isLoading={query.isLoading}
          error={query.error}
          errorTitle={errorTitle}
          onRetry={() => void query.refetch()}
          skeleton={<TableSkeleton rows={6} />}
        >
          {book === 'sales' ? (
            <FinanceTable
              columns={salesColumns}
              rows={rows as SalesLedgerEntry[]}
              rowKey={(row) => `${row.date}-${row.invoice_number}-${row.client_name}`}
              minWidthClass="min-w-[1020px]"
              dense
              testId="finance-legal-sales-table"
              caption={t('finance.ledger.salesCaption', 'Libro de ventas')}
              empty={
                <TableEmptyState
                  icon={BookOpen}
                  title={t('finance.ledger.empty', 'Sin comprobantes en el libro')}
                  description={t(
                    'finance.ledger.emptyHint',
                    'No hay ventas registradas para el período o filtro.',
                  )}
                />
              }
            />
          ) : (
            <FinanceTable
              columns={purchaseColumns}
              rows={rows as PurchaseLedgerEntry[]}
              rowKey={(row) => `${row.date}-${row.invoice_number}-${row.supplier_name}`}
              minWidthClass="min-w-[960px]"
              dense
              testId="finance-legal-purchases-table"
              caption={t('finance.ledger.purchasesCaption', 'Libro de compras')}
              empty={
                <TableEmptyState
                  icon={BookOpen}
                  title={t('finance.ledger.empty', 'Sin comprobantes en el libro')}
                  description={t(
                    'finance.ledger.emptyHint',
                    'No hay compras registradas para el período o filtro.',
                  )}
                />
              }
            />
          )}
        </QueryBoundary>
      </TableCard>
    </FinancialReportsPageLayout>
  )
}

export default LegalBooksPage
