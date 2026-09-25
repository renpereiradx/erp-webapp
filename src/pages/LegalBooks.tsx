/**
 * LegalBooks — libros legales IVA (ventas y compras) con estado SIFEN
 * (FE5.1). Fuente: GET /bi/financial-reports/sales-ledger y /purchase-ledger
 * vía el hook legacy @/hooks/useFinancialReports (la migración a hooks por
 * recurso de features/financial-reports está pendiente: no cubre ledgers).
 *
 * Alineado a DESIGN.md: PageHeader, tabla canónica (ui/table), estados
 * loading/empty/error (§6.7), tokens semánticos y data-tabular en importes.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { BookOpen, Printer } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import SegmentedControl from '@/components/ui/SegmentedControl';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableFooter,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import EmptyState from '@/components/ui/EmptyState';
import ErrorState from '@/components/ui/ErrorState';
import { useFinancialReports } from '@/hooks/useFinancialReports';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';
import FiscalStateBadge from '@/features/fiscal/components/FiscalStateBadge';
import { formatCDC } from '@/domain/fiscal/cdc';
import { FISCAL_STATES } from '@/domain/fiscal/states';

const SOURCE_IS_DEMO = import.meta.env.VITE_USE_DEMO === 'true';

interface LedgerSummary {
  total_transactions?: number;
  total_net?: number;
  total_vat_5?: number;
  total_vat_10?: number;
  total_exempt?: number;
  total_gross?: number;
}

interface LedgerRow {
  date?: string;
  invoice_number?: string;
  timbrado?: string | null;
  cdc?: string | null;
  fiscal_estado?: string | null;
  client_ruc?: string | null;
  client_name?: string | null;
  supplier_ruc?: string | null;
  supplier_name?: string | null;
  gross_amount?: number;
  vat_10?: number;
  vat_5?: number;
  exempt?: number;
}

interface LedgerResponse {
  summary?: LedgerSummary;
  pagination?: { total_items?: number };
  entries?: LedgerRow[];
}

/** Contrato del hook legacy @/hooks/useFinancialReports (JS, sin tipos). */
interface UseFinancialReportsLegacy {
  loading: boolean;
  error: string | null;
  salesLedger: LedgerResponse | null;
  purchaseLedger: LedgerResponse | null;
  fetchSalesLedger: (period?: string, page?: number, pageSize?: number) => void;
  fetchSalesLedgerDateRange: (
    startDate: string,
    endDate: string,
    page?: number,
    pageSize?: number,
    filters?: Record<string, string>,
  ) => void;
  fetchPurchaseLedger: (period?: string, page?: number, pageSize?: number) => void;
  fetchPurchaseLedgerDateRange: (startDate: string, endDate: string, page?: number, pageSize?: number) => void;
}

interface LedgerRowView {
  date: string;
  invoiceNo: string;
  timbrado: string;
  cdc: string | null;
  fiscalState: string | null;
  ruc: string;
  name: string;
  exempt: number;
  iva5: number;
  iva10: number;
  gross: number;
}

const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const toDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDate = (dateLike: string): string => {
  const date = new Date(dateLike);
  if (Number.isNaN(date.getTime())) {
    return dateLike || '-';
  }

  return date.toLocaleDateString('es-PY');
};

const PAGE_SIZES = [20, 50, 100] as const;

const LegalBooks: React.FC = () => {
  const { t } = useI18n();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [activeTab, setActiveTab] = useState<'ventas' | 'compras'>('ventas');
  const [fromDate, setFromDate] = useState(toDateInputValue(monthStart));
  const [toDate, setToDate] = useState(toDateInputValue(now));
  const [pageSize, setPageSize] = useState(50);

  // Filtros SIFEN (FE5.1): draft (inputs) vs aplicados (van al fetch).
  const [filterState, setFilterState] = useState('');
  const [filterCdc, setFilterCdc] = useState('');
  const [filterTimbrado, setFilterTimbrado] = useState('');
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});

  const {
    loading,
    error,
    salesLedger,
    purchaseLedger,
    fetchSalesLedger,
    fetchSalesLedgerDateRange,
    fetchPurchaseLedger,
    fetchPurchaseLedgerDateRange,
  } = useFinancialReports() as UseFinancialReportsLegacy;

  useEffect(() => {
    document.title = t('fiscal.legalBooks.title', 'Libros Legales') + ' | ERP System'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [t])

  useEffect(() => {
    const hasRange = fromDate && toDate

    if (activeTab === 'ventas') {
      if (hasRange) {
        fetchSalesLedgerDateRange(fromDate, toDate, 1, pageSize, appliedFilters)
      } else {
        fetchSalesLedger('month', 1, pageSize)
      }
      return
    }

    if (hasRange) {
      fetchPurchaseLedgerDateRange(fromDate, toDate, 1, pageSize)
    } else {
      fetchPurchaseLedger('month', 1, pageSize)
    }
  }, [
    activeTab,
    appliedFilters,
    fetchPurchaseLedger,
    fetchPurchaseLedgerDateRange,
    fetchSalesLedger,
    fetchSalesLedgerDateRange,
    fromDate,
    pageSize,
    toDate,
  ])

  const isSalesTab = activeTab === 'ventas'
  const activeLedger = isSalesTab ? salesLedger : purchaseLedger
  const summary = activeLedger?.summary || {}
  const pagination = activeLedger?.pagination || {}

  const applyFilters = () => {
    setAppliedFilters({
      ...(filterState ? { estado: filterState } : {}),
      ...(filterCdc.trim() ? { cdc: filterCdc.trim() } : {}),
      ...(filterTimbrado.trim() ? { timbrado: filterTimbrado.trim() } : {}),
    })
  }

  const clearFilters = () => {
    setFilterState('')
    setFilterCdc('')
    setFilterTimbrado('')
    setAppliedFilters({})
  }

  const retry = () => {
    const hasRange = fromDate && toDate

    if (isSalesTab) {
      if (hasRange) {
        fetchSalesLedgerDateRange(fromDate, toDate, 1, pageSize, appliedFilters)
      } else {
        fetchSalesLedger('month', 1, pageSize)
      }
      return
    }

    if (hasRange) {
      fetchPurchaseLedgerDateRange(fromDate, toDate, 1, pageSize)
    } else {
      fetchPurchaseLedger('month', 1, pageSize)
    }
  }

  const tableRows = useMemo<LedgerRowView[]>(() => {
    const currentEntries = Array.isArray(activeLedger?.entries)
      ? activeLedger.entries
      : []

    return currentEntries.map(item => ({
      date: formatDate(item.date ?? ''),
      invoiceNo: item.invoice_number || '-',
      timbrado: item.timbrado || '-',
      cdc: item.cdc ? (formatCDC(item.cdc) || item.cdc) : null,
      fiscalState: item.fiscal_estado || null,
      ruc: (isSalesTab ? item.client_ruc : item.supplier_ruc) || '-',
      name: (isSalesTab ? item.client_name : item.supplier_name) || '-',
      exempt: toNumber(item.exempt),
      iva5: toNumber(item.vat_5),
      iva10: toNumber(item.vat_10),
      gross: toNumber(item.gross_amount),
    }))
  }, [activeLedger, isSalesTab])

  const shown = tableRows.length
  const total = toNumber(pagination.total_items) || shown

  if (loading && !activeLedger) {
    // §6.7: skeleton que imita la forma final (filtros + tabla + 3 resúmenes).
    return (
      <div className='min-h-screen bg-background'>
        <div
          className='mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg'
          aria-busy='true'
          data-testid='legal-books-skeleton'
        >
          <div className='h-16 bg-surface-muted rounded-md animate-pulse' />
          <div className='h-32 bg-surface-muted rounded-md animate-pulse' />
          <div className='h-96 bg-surface-muted rounded-md animate-pulse' />
          <div className='grid grid-cols-1 md:grid-cols-3 gap-md'>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='h-28 bg-surface-muted rounded-md animate-pulse' />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-background'>
      <div className='mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl space-y-lg'>
        <PageHeader
          breadcrumb={[
            { label: t('fiscal.legalBooks.breadcrumb.reports', 'Reportes') },
            { label: t('fiscal.legalBooks.breadcrumb.compliance', 'Cumplimiento') },
          ]}
          title={t('fiscal.legalBooks.title', 'Libros Legales')}
          subtitle={t('fiscal.legalBooks.subtitle', 'Ventas y Compras • Origen: {source}', {
            source: SOURCE_IS_DEMO
              ? t('fiscal.legalBooks.source.demo', 'Demo')
              : t('fiscal.legalBooks.source.api', 'API'),
          })}
          actions={
            <>
              <SegmentedControl
                options={[
                  { value: 'ventas', label: t('fiscal.legalBooks.tab.sales', 'Libro Ventas') },
                  { value: 'compras', label: t('fiscal.legalBooks.tab.purchases', 'Libro Compras') },
                ]}
                value={activeTab}
                onChange={(value: string) => setActiveTab(value as 'ventas' | 'compras')}
                aria-label={t('fiscal.legalBooks.title', 'Libros Legales')}
              />
              <Button variant='primary' onClick={() => window.print()}>
                <Printer className='size-4' aria-hidden='true' />
                {t('fiscal.legalBooks.print', 'Imprimir Libro')}
              </Button>
            </>
          }
        />

        {error && !activeLedger && (
          <section>
            <ErrorState
              title={t('fiscal.legalBooks.error.title', 'No se pudo cargar el libro legal desde la API.')}
              message={error ?? undefined}
              onRetry={retry}
            />
          </section>
        )}

        {/* Filtros de rango + filtros SIFEN (FE5.1, solo libro de ventas) */}
        <section>
          <Card className='rounded-md bg-surface border-0 shadow-whisper'>
            <CardContent className='p-lg space-y-md'>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-md items-end'>
                <div className='space-y-xs'>
                  <Label htmlFor='legal-books-from' className='text-body-sm-bold text-on-surface-deep'>
                    {t('fiscal.legalBooks.from', 'Desde')}
                  </Label>
                  <Input
                    id='legal-books-from'
                    className='bg-surface'
                    type='date'
                    value={fromDate}
                    onChange={e => setFromDate(e.target.value)}
                  />
                </div>

                <div className='space-y-xs'>
                  <Label htmlFor='legal-books-to' className='text-body-sm-bold text-on-surface-deep'>
                    {t('fiscal.legalBooks.to', 'Hasta')}
                  </Label>
                  <Input
                    id='legal-books-to'
                    className='bg-surface'
                    type='date'
                    value={toDate}
                    onChange={e => setToDate(e.target.value)}
                  />
                </div>

                <div className='space-y-xs'>
                  <Label htmlFor='legal-books-filter-state' className='text-body-sm-bold text-on-surface-deep'>
                    {t('fiscal.legalBooks.filter.state', 'Estado SIFEN')}
                  </Label>
                  <Select
                    value={filterState || 'all'}
                    onValueChange={(val: string) => setFilterState(val === 'all' ? '' : val)}
                    disabled={!isSalesTab}
                  >
                    <SelectTrigger id='legal-books-filter-state' className='w-full'>
                      <SelectValue placeholder={t('fiscal.legalBooks.filter.stateAll', 'Todos los estados')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>{t('fiscal.legalBooks.filter.stateAll', 'Todos los estados')}</SelectItem>
                      {FISCAL_STATES.map(state => (
                        <SelectItem key={state} value={state}>
                          {t(`fiscal.states.${state}`, state)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-xs'>
                  <Label htmlFor='legal-books-filter-cdc' className='text-body-sm-bold text-on-surface-deep'>
                    {t('fiscal.legalBooks.filter.cdc', 'CDC')}
                  </Label>
                  <Input
                    id='legal-books-filter-cdc'
                    className='bg-surface'
                    placeholder={t('fiscal.legalBooks.filter.cdcPlaceholder', 'Filtrar por CDC (parcial)')}
                    type='text'
                    value={filterCdc}
                    onChange={e => setFilterCdc(e.target.value)}
                    disabled={!isSalesTab}
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-md items-end'>
                <div className='space-y-xs'>
                  <Label htmlFor='legal-books-filter-timbrado' className='text-body-sm-bold text-on-surface-deep'>
                    {t('fiscal.legalBooks.filter.timbrado', 'Timbrado')}
                  </Label>
                  <Input
                    id='legal-books-filter-timbrado'
                    className='bg-surface'
                    placeholder={t('fiscal.legalBooks.filter.timbradoPlaceholder', 'Filtrar por timbrado (exacto)')}
                    type='text'
                    value={filterTimbrado}
                    onChange={e => setFilterTimbrado(e.target.value)}
                    disabled={!isSalesTab}
                  />
                </div>

                <div className='md:col-span-3 flex flex-wrap justify-end gap-sm'>
                  <Button variant='secondary' onClick={retry}>
                    {t('fiscal.legalBooks.refresh', 'Actualizar Reporte')}
                  </Button>
                  <Button variant='ghost' onClick={clearFilters} disabled={!isSalesTab}>
                    {t('fiscal.legalBooks.filter.clear', 'Limpiar')}
                  </Button>
                  <Button variant='secondary' onClick={applyFilters} disabled={!isSalesTab}>
                    {t('fiscal.legalBooks.filter.apply', 'Aplicar filtros')}
                  </Button>
                </div>
              </div>

              <p className='text-body-md text-on-surface-deep'>
                {isSalesTab
                  ? t('fiscal.legalBooks.filter.salesOnlyHint', 'Los filtros SIFEN aplican solo al libro de ventas')
                  : t('fiscal.legalBooks.purchases.noFiscalNote', 'El libro de compras no emite DE SIFEN (NRE opcional, D12): la columna de estado aplica solo a ventas.')}
              </p>
            </CardContent>
          </Card>
        </section>

        {/* Libro activo */}
        <section>
          <Card className='rounded-md bg-surface border-0 shadow-whisper overflow-hidden p-0'>
            <CardContent className='p-0'>
              {tableRows.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title={t('fiscal.legalBooks.empty', 'No hay registros para el rango seleccionado.')}
                />
              ) : (
                <div className='overflow-x-auto'>
                  <Table>
                    <TableHeader>
                      <TableRow className='bg-surface-muted hover:bg-surface-muted border-0'>
                        <TableHead className='text-label-caps uppercase text-on-surface-deep'>{t('fiscal.legalBooks.col.date', 'Fecha')}</TableHead>
                        <TableHead className='text-label-caps uppercase text-on-surface-deep'>{t('fiscal.legalBooks.col.invoiceNo', 'Nº Factura')}</TableHead>
                        <TableHead className='text-label-caps uppercase text-on-surface-deep'>{t('fiscal.legalBooks.col.timbrado', 'Timbrado')}</TableHead>
                        {isSalesTab && <TableHead className='text-label-caps uppercase text-on-surface-deep'>{t('fiscal.legalBooks.col.cdc', 'CDC')}</TableHead>}
                        {isSalesTab && <TableHead className='text-label-caps uppercase text-on-surface-deep'>{t('fiscal.legalBooks.col.fiscalState', 'Estado SIFEN')}</TableHead>}
                        <TableHead className='text-label-caps uppercase text-on-surface-deep'>{t('fiscal.legalBooks.col.ruc', 'RUC')}</TableHead>
                        <TableHead className='text-label-caps uppercase text-on-surface-deep'>
                          {isSalesTab ? t('fiscal.legalBooks.col.client', 'Cliente') : t('fiscal.legalBooks.col.supplier', 'Proveedor')}
                        </TableHead>
                        <TableHead className='text-label-caps uppercase text-on-surface-deep text-right'>{t('fiscal.legalBooks.col.exempt', 'Exento')}</TableHead>
                        <TableHead className='text-label-caps uppercase text-on-surface-deep text-right'>{t('fiscal.legalBooks.col.iva5', 'IVA 5%')}</TableHead>
                        <TableHead className='text-label-caps uppercase text-on-surface-deep text-right'>{t('fiscal.legalBooks.col.iva10', 'IVA 10%')}</TableHead>
                        <TableHead className='text-label-caps uppercase text-on-surface-deep text-right'>{t('fiscal.legalBooks.col.gross', 'Monto Bruto')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tableRows.map((row, index) => (
                        <TableRow key={`${row.invoiceNo}-${index}`} className='hover:bg-surface-muted transition-colors duration-150'>
                          <TableCell className='text-data-mono font-data-mono text-on-surface-deep whitespace-nowrap'>{row.date}</TableCell>
                          <TableCell className='text-data-mono font-data-mono text-foreground'>{row.invoiceNo}</TableCell>
                          <TableCell className='text-data-mono font-data-mono text-on-surface-deep'>{row.timbrado}</TableCell>
                          {isSalesTab && (
                            <TableCell className='text-data-mono font-data-mono text-on-surface-deep' title={row.cdc ?? undefined}>
                              {row.cdc || '-'}
                            </TableCell>
                          )}
                          {isSalesTab && (
                            <TableCell>
                              <FiscalStateBadge
                                state={row.fiscalState ?? undefined}
                                emptyLabel={t('fiscal.legalBooks.notFiscal', 'No fiscal')}
                              />
                            </TableCell>
                          )}
                          <TableCell className='text-data-mono font-data-mono text-on-surface-deep'>{row.ruc}</TableCell>
                          <TableCell className='text-body-md text-foreground'>{row.name}</TableCell>
                          <TableCell className='text-data-tabular font-data-tabular text-right text-on-surface-deep whitespace-nowrap'>{formatPYG(row.exempt)}</TableCell>
                          <TableCell className='text-data-tabular font-data-tabular text-right text-on-surface-deep whitespace-nowrap'>{formatPYG(row.iva5)}</TableCell>
                          <TableCell className='text-data-tabular font-data-tabular text-right text-on-surface-deep whitespace-nowrap'>{formatPYG(row.iva10)}</TableCell>
                          <TableCell className='text-data-tabular font-data-tabular text-right text-foreground whitespace-nowrap'>
                            {formatPYG(row.gross)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className='bg-surface-muted hover:bg-surface-muted border-t border-divider'>
                        <TableCell colSpan={isSalesTab ? 6 : 4} className='text-right text-label-caps uppercase text-on-surface-deep'>
                          {t('fiscal.legalBooks.summary.period', 'Resumen Total del Periodo')}
                        </TableCell>
                        <TableCell className='text-data-tabular font-data-tabular text-right text-primary whitespace-nowrap'>
                          {formatPYG(toNumber(summary.total_exempt))}
                        </TableCell>
                        <TableCell className='text-data-tabular font-data-tabular text-right text-primary whitespace-nowrap'>
                          {formatPYG(toNumber(summary.total_vat_5))}
                        </TableCell>
                        <TableCell className='text-data-tabular font-data-tabular text-right text-primary whitespace-nowrap'>
                          {formatPYG(toNumber(summary.total_vat_10))}
                        </TableCell>
                        <TableCell className='text-data-tabular font-data-tabular text-right text-primary whitespace-nowrap'>
                          {formatPYG(toNumber(summary.total_gross))}
                        </TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>
              )}

              <div className='px-lg py-md border-t border-border-subtle flex flex-col md:flex-row items-center justify-between gap-md'>
                <p className='text-data-mono font-data-mono text-on-surface-deep'>
                  {t('fiscal.legalBooks.pagination.showing', 'Mostrando {shown} de {total} registros', {
                    shown: String(shown),
                    total: String(total),
                  })}
                </p>

                <div className='flex items-center gap-sm'>
                  <Label htmlFor='legal-books-page-size' className='text-body-md text-on-surface-deep'>
                    {t('fiscal.legalBooks.pagination.rowsPerPage', 'Filas por página:')}
                  </Label>
                  <Select value={String(pageSize)} onValueChange={(val: string) => setPageSize(Number(val))}>
                    <SelectTrigger id='legal-books-page-size' className='w-20'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZES.map(size => (
                        <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Resumen del periodo */}
        <section>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-md'>
            <div className='flex flex-col gap-sm rounded-md bg-surface border border-border-subtle shadow-whisper p-lg'>
              <span className='text-label-caps uppercase text-on-surface-deep'>
                {t('fiscal.legalBooks.summary.transactions', 'Transacciones')}
              </span>
              <span className='text-4xl font-black font-mono text-foreground'>
                {toNumber(summary.total_transactions)}
              </span>
            </div>

            <div className='flex flex-col gap-sm rounded-md bg-surface border border-border-subtle shadow-whisper p-lg'>
              <span className='text-label-caps uppercase text-on-surface-deep'>
                {t('fiscal.legalBooks.summary.net', 'Total Neto')}
              </span>
              <span className='text-4xl font-black font-mono text-foreground'>
                {formatPYG(toNumber(summary.total_net))}
              </span>
            </div>

            <div className='flex flex-col gap-sm rounded-md bg-surface border border-border-subtle shadow-whisper p-lg'>
              <span className='text-label-caps uppercase text-on-surface-deep'>
                {t('fiscal.legalBooks.summary.iva', 'IVA Total')}
              </span>
              <span className='text-4xl font-black font-mono text-foreground'>
                {formatPYG(toNumber(summary.total_vat_10) + toNumber(summary.total_vat_5))}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default LegalBooks
