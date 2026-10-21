import { useState } from 'react'
import { FileText, Landmark, Percent, Receipt, Scale } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { SectionCard } from '@/components/ui/SectionCard'
import { TableCard } from '@/components/ui/TableCard'
import { QueryBoundary } from '@/components/ui/QueryBoundary'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import { PanelSkeleton, TableSkeleton } from '@/components/ui/DataSkeletons'
import {
  FinanceKpiLedger,
  FinancePeriodSelector,
  FinanceRefreshButton,
  FinanceTable,
  FinancialReportsPageLayout,
  ProrrateoDetailsTable,
  ProrrateoHistoryTable,
  StatementTable,
  VatStatusBadge,
  useFinancePeriod,
  useProrrateoDetails,
  useProrrateoHistory,
  useTaxSummary,
  useVatReport,
  type FinanceColumn,
  type FinanceKpiItem,
  type FinanceKpiTone,
  type StatementRow,
} from '@/features/financial-reports'
import { formatFinancialRange } from '@/domain/finance/reportPeriod'
import { formatMoney, formatUtcMonth } from '@/domain/finance/format'
import {
  taxSummaryKpis,
  taxSummaryView,
  vatKpis,
  vatStatusKey,
  vatView,
} from '@/domain/finance/vat'
import {
  formatKpiValue,
  type FinanceKpiValue,
} from '@/domain/finance/kpis'
import {
  prorrateoDetailRows,
  prorrateoRows,
} from '@/domain/finance/prorrateo'
import type { MonthlyTax, MonthlyVat } from '@/types/bi'

interface KpiMeta {
  icon: LucideIcon
  tone: FinanceKpiTone
  labelKey: string
  label: string
  hintKey: string
  hint: string
}

const VAT_META: Record<string, KpiMeta> = {
  vatDebit: {
    icon: Percent,
    tone: 'primary',
    labelKey: 'finance.vat.kpis.debit',
    label: 'IVA débito',
    hintKey: 'finance.vat.hints.debit',
    hint: 'IVA de las ventas del período',
  },
  vatCredit: {
    icon: Percent,
    tone: 'success',
    labelKey: 'finance.vat.kpis.credit',
    label: 'IVA crédito',
    hintKey: 'finance.vat.hints.credit',
    hint: 'IVA de las compras del período',
  },
  vatPayable: {
    icon: Scale,
    tone: 'warning',
    labelKey: 'finance.vat.kpis.payable',
    label: 'Saldo a pagar',
    hintKey: 'finance.vat.hints.payable',
    hint: 'Débito − crédito (0 si hay saldo a favor)',
  },
  vatCarryover: {
    icon: Landmark,
    tone: 'secondary',
    labelKey: 'finance.vat.kpis.carryover',
    label: 'Saldo a favor',
    hintKey: 'finance.vat.hints.carryover',
    hint: 'Crédito que arrastra el período',
  },
}

const TAX_META: Record<string, KpiMeta> = {
  taxLiability: {
    icon: Receipt,
    tone: 'error',
    labelKey: 'finance.tax.kpis.liability',
    label: 'Obligación fiscal',
    hintKey: 'finance.tax.hints.liability',
    hint: 'IVA + retenciones del período',
  },
  taxCredits: {
    icon: Percent,
    tone: 'success',
    labelKey: 'finance.tax.kpis.credits',
    label: 'Créditos fiscales',
    hintKey: 'finance.tax.hints.credits',
    hint: 'Crédito de IVA disponible',
  },
  netTaxPosition: {
    icon: Scale,
    tone: 'primary',
    labelKey: 'finance.tax.kpis.net',
    label: 'Posición neta',
    hintKey: 'finance.tax.hints.net',
    hint: 'Obligación − créditos',
  },
  netRetentions: {
    icon: FileText,
    tone: 'warning',
    labelKey: 'finance.tax.kpis.retentions',
    label: 'Retenciones netas',
    hintKey: 'finance.tax.hints.retentions',
    hint: 'Solo si el backend las calcula',
  },
}

export const TaxManagementPage = () => {
  const { t, lang } = useI18n()
  const { period, setPeriod } = useFinancePeriod()
  const vat = useVatReport(period)
  const tax = useTaxSummary(period)
  const history = useProrrateoHistory()
  const [selectedProrrateo, setSelectedProrrateo] = useState<number | null>(null)
  const details = useProrrateoDetails(selectedProrrateo)

  const errorTitle = t('finance.errors.title', 'No se pudieron cargar los datos')
  const vatViewData = vatView(vat.data)
  const taxViewData = taxSummaryView(tax.data)
  const range = formatFinancialRange(vat.data?.period, lang)

  const vatItems: FinanceKpiItem[] = (vatViewData ? vatKpis(vatViewData) : []).map(
    (row: FinanceKpiValue) => {
      const meta = VAT_META[row.id]
      return {
        id: row.id,
        icon: meta.icon,
        tone: meta.tone,
        label: t(meta.labelKey, meta.label),
        hint: t(meta.hintKey, meta.hint),
        value: formatKpiValue(row),
      }
    },
  )

  const taxItems: FinanceKpiItem[] = (taxViewData ? taxSummaryKpis(taxViewData) : []).map(
    (row: FinanceKpiValue) => {
      const meta = TAX_META[row.id]
      return {
        id: row.id,
        icon: meta.icon,
        tone: meta.tone,
        label: t(meta.labelKey, meta.label),
        hint: t(meta.hintKey, meta.hint),
        value: formatKpiValue(row),
      }
    },
  )

  const salesRows: StatementRow[] = vatViewData
    ? [
        { id: 'base10', label: t('finance.vat.base10', 'Base IVA 10%'), amount: vatViewData.sales.base10 },
        { id: 'vat10', label: t('finance.vat.vat10', 'IVA 10%'), amount: vatViewData.sales.vat10 },
        { id: 'base5', label: t('finance.vat.base5', 'Base IVA 5%'), amount: vatViewData.sales.base5 },
        { id: 'vat5', label: t('finance.vat.vat5', 'IVA 5%'), amount: vatViewData.sales.vat5 },
        { id: 'exempt', label: t('finance.vat.exempt', 'Exentas'), amount: vatViewData.sales.exempt },
        {
          id: 'totalGross',
          label: t('finance.vat.totalGross', 'Total bruto'),
          amount: vatViewData.sales.totalGross,
          emphasis: 'subtotal',
        },
        {
          id: 'totalVat',
          label: t('finance.vat.totalVat', 'Total IVA débito'),
          amount: vatViewData.sales.totalVat,
          emphasis: 'total',
        },
      ]
    : []

  const purchaseRows: StatementRow[] = vatViewData
    ? [
        {
          id: 'base10',
          label: t('finance.vat.base10', 'Base IVA 10%'),
          amount: vatViewData.purchases.base10,
        },
        { id: 'vat10', label: t('finance.vat.vat10', 'IVA 10%'), amount: vatViewData.purchases.vat10 },
        { id: 'base5', label: t('finance.vat.base5', 'Base IVA 5%'), amount: vatViewData.purchases.base5 },
        { id: 'vat5', label: t('finance.vat.vat5', 'IVA 5%'), amount: vatViewData.purchases.vat5 },
        {
          id: 'exempt',
          label: t('finance.vat.exempt', 'Exentas'),
          amount: vatViewData.purchases.exempt,
        },
        {
          id: 'totalGross',
          label: t('finance.vat.totalGross', 'Total bruto'),
          amount: vatViewData.purchases.totalGross,
          emphasis: 'subtotal',
        },
        {
          id: 'totalVat',
          label: t('finance.vat.totalVatCredit', 'Total IVA crédito'),
          amount: vatViewData.purchases.totalVat,
          emphasis: 'total',
        },
      ]
    : []

  const monthlyVatColumns: Array<FinanceColumn<MonthlyVat>> = [
    {
      key: 'month',
      header: t('finance.common.month', 'Mes'),
      render: (row) => formatUtcMonth(row.month, lang),
    },
    {
      key: 'debit',
      align: 'right',
      header: t('finance.vat.kpis.debit', 'IVA débito'),
      render: (row) => formatMoney(row.vat_debito),
    },
    {
      key: 'credit',
      align: 'right',
      header: t('finance.vat.kpis.credit', 'IVA crédito'),
      render: (row) => formatMoney(row.vat_credito),
    },
    {
      key: 'balance',
      align: 'right',
      header: t('finance.vat.balance', 'Saldo'),
      render: (row) => formatMoney(row.balance),
    },
    {
      key: 'status',
      header: t('finance.common.status', 'Estado'),
      render: (row) => <VatStatusBadge status={row.status} />,
    },
  ]

  const monthlyTaxColumns: Array<FinanceColumn<MonthlyTax>> = [
    {
      key: 'month',
      header: t('finance.common.month', 'Mes'),
      render: (row) => formatUtcMonth(row.month, lang),
    },
    {
      key: 'debit',
      align: 'right',
      header: t('finance.vat.kpis.debit', 'IVA débito'),
      render: (row) => formatMoney(row.vat_debito),
    },
    {
      key: 'credit',
      align: 'right',
      header: t('finance.vat.kpis.credit', 'IVA crédito'),
      render: (row) => formatMoney(row.vat_credito),
    },
    {
      key: 'net',
      align: 'right',
      header: t('finance.tax.netVat', 'IVA neto'),
      render: (row) => formatMoney(row.net_vat),
    },
    {
      key: 'retentions',
      align: 'right',
      header: t('finance.tax.kpis.retentions', 'Retenciones'),
      render: (row) => formatMoney(row.retentions),
    },
    {
      key: 'liability',
      align: 'right',
      header: t('finance.tax.kpis.liability', 'Obligación'),
      render: (row) => formatMoney(row.total_liability),
    },
  ]

  return (
    <FinancialReportsPageLayout
      title={t('finance.tax.title', 'Gestión de IVA')}
      subtitle={t(
        'finance.tax.subtitle',
        'IVA débito/crédito, resumen fiscal y prorrateos registrados del período.',
      )}
      range={range}
      actions={
        <div className="flex max-w-full flex-wrap items-center justify-end gap-sm">
          <FinancePeriodSelector value={period} onChange={setPeriod} />
          <FinanceRefreshButton />
        </div>
      }
    >
      <div className="grid gap-lg xl:grid-cols-2">
        <SectionCard
          title={t('finance.tax.vatTitle', 'IVA del período')}
          description={t(
            'finance.tax.vatDescription',
            'IVA débito de ventas y crédito de compras según las vistas del libro.',
          )}
          action={
            vatViewData ? <VatStatusBadge status={vatViewData.status} /> : undefined
          }
          testId="finance-tax-vat"
        >
          <QueryBoundary
            isLoading={vat.isLoading}
            error={vat.error}
            errorTitle={errorTitle}
            onRetry={() => void vat.refetch()}
            skeleton={<PanelSkeleton rows={4} />}
          >
            <FinanceKpiLedger items={vatItems} testId="finance-tax-vat-kpis" />
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('finance.tax.summaryTitle', 'Resumen fiscal')}
          description={t(
            'finance.tax.summaryDescription',
            'Obligación, créditos y posición neta del período.',
          )}
          testId="finance-tax-summary"
        >
          <QueryBoundary
            isLoading={tax.isLoading}
            error={tax.error}
            errorTitle={errorTitle}
            onRetry={() => void tax.refetch()}
            skeleton={<PanelSkeleton rows={4} />}
          >
            <FinanceKpiLedger items={taxItems} testId="finance-tax-kpis" />
            <p className="mt-md text-body-sm text-on-surface-deep">
              {t(
                'finance.tax.retentionsNote',
                'Las retenciones solo se muestran si el backend las calcula (distintas de 0).',
              )}
            </p>
          </QueryBoundary>
        </SectionCard>
      </div>

      <div className="grid gap-lg xl:grid-cols-2">
        <SectionCard
          title={t('finance.tax.salesVatTitle', 'IVA ventas')}
          description={t(
            'finance.tax.salesVatDescription',
            'Bases imponibles y débito fiscal del período.',
          )}
          testId="finance-tax-sales-vat"
        >
          <QueryBoundary
            isLoading={vat.isLoading}
            error={vat.error}
            errorTitle={errorTitle}
            onRetry={() => void vat.refetch()}
            skeleton={<PanelSkeleton rows={6} />}
          >
            <StatementTable rows={salesRows} testId="finance-tax-sales-rows" />
          </QueryBoundary>
        </SectionCard>

        <SectionCard
          title={t('finance.tax.purchasesVatTitle', 'IVA compras')}
          description={t(
            'finance.tax.purchasesVatDescription',
            'Bases imponibles y crédito fiscal del período.',
          )}
          testId="finance-tax-purchases-vat"
        >
          <QueryBoundary
            isLoading={vat.isLoading}
            error={vat.error}
            errorTitle={errorTitle}
            onRetry={() => void vat.refetch()}
            skeleton={<PanelSkeleton rows={6} />}
          >
            <StatementTable rows={purchaseRows} testId="finance-tax-purchases-rows" />
          </QueryBoundary>
        </SectionCard>
      </div>

      <div className="space-y-lg">
        <TableCard
          title={t('finance.tax.monthlyVatTitle', 'IVA por mes')}
          description={t(
            'finance.tax.monthlyVatDescription',
            'Detalle mensual del reporte de IVA del período seleccionado.',
          )}
          testId="finance-tax-monthly-vat"
        >
          <QueryBoundary
            isLoading={vat.isLoading}
            error={vat.error}
            errorTitle={errorTitle}
            onRetry={() => void vat.refetch()}
            skeleton={<TableSkeleton rows={4} />}
          >
            <FinanceTable
              columns={monthlyVatColumns}
              rows={vatViewData?.monthly ?? []}
              rowKey={(row) => row.month}
              minWidthClass="min-w-[560px]"
              testId="finance-tax-monthly-vat-table"
              caption={t('finance.tax.monthlyVatCaption', 'IVA del período por mes')}
              empty={
                <TableEmptyState
                  icon={Percent}
                  title={t('finance.tax.monthlyVatEmpty', 'Sin meses con IVA')}
                  description={t(
                    'finance.tax.monthlyVatEmptyHint',
                    'No hay movimientos de IVA en el rango seleccionado.',
                  )}
                />
              }
            />
          </QueryBoundary>
        </TableCard>

        <TableCard
          title={t('finance.tax.monthlyTaxTitle', 'Detalle fiscal por mes')}
          description={t(
            'finance.tax.monthlyTaxDescription',
            'IVA neto, retenciones y obligación mensual del resumen fiscal.',
          )}
          testId="finance-tax-monthly-tax"
        >
          <QueryBoundary
            isLoading={tax.isLoading}
            error={tax.error}
            errorTitle={errorTitle}
            onRetry={() => void tax.refetch()}
            skeleton={<TableSkeleton rows={4} />}
          >
            <FinanceTable
              columns={monthlyTaxColumns}
              rows={taxViewData?.monthly ?? []}
              rowKey={(row) => row.month}
              minWidthClass="min-w-[720px]"
              dense
              testId="finance-tax-monthly-tax-table"
              caption={t('finance.tax.monthlyTaxCaption', 'Resumen fiscal por mes')}
              empty={
                <TableEmptyState
                  icon={Receipt}
                  title={t('finance.tax.monthlyTaxEmpty', 'Sin detalle fiscal mensual')}
                  description={t(
                    'finance.tax.monthlyTaxEmptyHint',
                    'El resumen fiscal no trae meses para el período.',
                  )}
                />
              }
            />
          </QueryBoundary>
        </TableCard>
      </div>

      <TableCard
        title={t('finance.prorrateo.title', 'Prorrateo de IVA')}
        description={t(
          'finance.prorrateo.description',
          'Historial de períodos de prorrateo registrados. El detalle se carga al seleccionar un período.',
        )}
        testId="finance-tax-prorrateo"
      >
        <QueryBoundary
          isLoading={history.isLoading}
          error={history.error}
          errorTitle={errorTitle}
          onRetry={() => void history.refetch()}
          skeleton={<TableSkeleton rows={4} />}
        >
          <ProrrateoHistoryTable
            rows={prorrateoRows(history.data)}
            selectedId={selectedProrrateo}
            onSelect={setSelectedProrrateo}
          />
        </QueryBoundary>
      </TableCard>

      {selectedProrrateo !== null ? (
        <TableCard
          title={t('finance.prorrateo.detailsTitle', 'Detalle del prorrateo')}
          description={t(
            'finance.prorrateo.detailsDescription',
            'Crédito original y porción deducible por orden de compra.',
          )}
          testId="finance-tax-prorrateo-details-card"
        >
          <QueryBoundary
            isLoading={details.isLoading}
            error={details.error}
            errorTitle={errorTitle}
            onRetry={() => void details.refetch()}
            skeleton={<TableSkeleton rows={4} />}
          >
            <ProrrateoDetailsTable rows={prorrateoDetailRows(details.data)} />
          </QueryBoundary>
        </TableCard>
      ) : null}

      <p className="text-body-sm text-on-surface-deep">
        {t('finance.tax.statusFootnote', 'Estado del IVA del período: {status}', {
          status: t(`finance.vat.status.${vatStatusKey(vatViewData?.status)}`, '—'),
        })}{' '}
        · {t('finance.tax.sourceFootnote', 'Fuente: vistas del libro SIFEN y resumen fiscal.')}
      </p>
    </FinancialReportsPageLayout>
  )
}

export default TaxManagementPage
