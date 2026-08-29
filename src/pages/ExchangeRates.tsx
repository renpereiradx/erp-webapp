// ===========================================================================
// Exchange Rates Page - Configuración Financiera > Tipos de Cambio
// Design: DESIGN.md (design/tokens.json) - componentes ui/
// Logic: useExchangeRateStore
// Contract: internal/sale ExchangeRate (from_currency_id/to_currency_id/rate)
// i18n: useI18n() (ES; claves en locales/es/exchangeRates.js)
// ===========================================================================

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { Plus, Pencil, Trash2, RefreshCw, Download, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import DataState from '@/components/ui/DataState'
import EnhancedModal from '@/components/ui/EnhancedModal'
import useExchangeRateStore from '@/store/useExchangeRateStore'

interface CurrencyRow {
  id?: number | string
  code?: string
  currency_code?: string
  name?: string
  currency_name?: string
  is_base?: boolean
  is_base_currency?: boolean
}

interface RateRow {
  id: number
  currency_id?: number | null
  from_currency_id?: number | null
  code?: string
  currency_code?: string
  from_currency_code?: string
  currency_name?: string
  from_currency_name?: string
  to_currency_code?: string
  rate?: number | null
  rate_to_base?: number | null
  date?: string | null
  rate_date?: string | null
  created_at?: string | null
  source?: string
  is_current?: boolean
}

const getFlagUrl = (code?: string) => {
  if (!code) return null
  const mapping: Record<string, string> = {
    USD: 'us', EUR: 'eu', GBP: 'gb', JPY: 'jp', CAD: 'ca',
    AUD: 'au', PYG: 'py', BRL: 'br', ARS: 'ar', MXN: 'mx',
    CLP: 'cl', COP: 'co', PEN: 'pe', UYU: 'uy', CNY: 'cn',
  }
  const cc = mapping[code.toUpperCase()]
  return cc ? `https://flagcdn.com/w40/${cc}.png` : null
}

/**
 * Página /configuracion/tipos-cambio
 * Listado de tasas + alta/edición/baja contra POST|PUT|DELETE /exchange-rates.
 */
export default function ExchangeRates() {
  const { t } = useI18n()
  const {
    exchangeRates,
    currencies,
    loading,
    error,
    filters,
    pagination,
    fetchExchangeRates,
    fetchCurrencies,
    createExchangeRate,
    updateExchangeRate,
    deleteExchangeRate,
    setFilter,
    setViewMode,
    setPage,
  } = useExchangeRateStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<RateRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [form, setForm] = useState({
    currency_id: '',
    rate: '',
    effective_date: new Date().toISOString().split('T')[0],
    source: '',
  })

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const filtered =
    filters.searchTerm.trim().length > 0
      ? exchangeRates.filter(
          (r: RateRow) =>
            (r.from_currency_code || r.currency_code || r.code || '')
              .toLowerCase()
              .includes(filters.searchTerm.toLowerCase()) ||
            (r.from_currency_name || r.currency_name || '')
              .toLowerCase()
              .includes(filters.searchTerm.toLowerCase())
        )
      : exchangeRates

  const totalItems = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize))
  const safePage = Math.min(pagination.page, totalPages)
  const startItem = totalItems > 0 ? (safePage - 1) * pagination.pageSize + 1 : 0
  const endItem = Math.min(safePage * pagination.pageSize, totalItems)
  const paginatedRates = filtered.slice(
    (safePage - 1) * pagination.pageSize,
    safePage * pagination.pageSize
  )

  useEffect(() => {
    fetchCurrencies()
    fetchExchangeRates()
  }, [fetchCurrencies, fetchExchangeRates])

  useEffect(() => {
    fetchExchangeRates()
  }, [filters.viewMode, filters.dateFrom, filters.dateTo, fetchExchangeRates])

  const closeModal = () => {
    setModalOpen(false)
    setSelected(null)
    setFormError('')
  }

  const openCreate = () => {
    setSelected(null)
    setForm({
      currency_id: '',
      rate: '',
      effective_date: new Date().toISOString().split('T')[0],
      source: '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const openEdit = (rate: RateRow) => {
    setSelected(rate)
    setForm({
      currency_id: String(rate.from_currency_id ?? rate.currency_id ?? ''),
      rate: String(rate.rate ?? rate.rate_to_base ?? ''),
      effective_date:
        rate.rate_date?.split('T')[0] ||
        rate.date?.split('T')[0] ||
        new Date().toISOString().split('T')[0],
      source: rate.source || '',
    })
    setFormError('')
    setModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        currency_id: form.currency_id,
        rate_to_base: parseFloat(form.rate),
        date: form.effective_date,
        source: form.source,
        currencies,
      }
      if (selected?.id) {
        await updateExchangeRate(selected.id, payload)
      } else {
        await createExchangeRate(payload)
      }
      closeModal()
    } catch (err: any) {
      setFormError(err?.message || t('exchangeRates.error.save', 'Error al guardar el tipo de cambio'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!selected?.id) return
    setDeleting(true)
    try {
      await deleteExchangeRate(selected.id)
      setDeleteOpen(false)
      setSelected(null)
    } catch {
      // store already surfaced the error via `error`
    } finally {
      setDeleting(false)
    }
  }

  const handleExport = () => {
    const csvContent = [
      [
        t('exchangeRates.table.currencyPair'),
        t('exchangeRates.table.rate'),
        t('exchangeRates.table.source'),
        t('exchangeRates.table.createdAt'),
      ].join(','),
      ...filtered.map((r: RateRow) =>
        [
          `${r.from_currency_code || r.currency_code || r.code || ''}/${r.to_currency_code || 'PYG'}`,
          r.rate ?? r.rate_to_base ?? '',
          `"${(r.source || '').replace(/"/g, '""')}"`,
          r.created_at || r.rate_date || r.date || '',
        ].join(',')
      ),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `tipos_cambio_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const formatRate = (r: RateRow) => {
    const value = r.rate ?? r.rate_to_base
    if (value === null || value === undefined || Number.isNaN(value)) return '-'
    return Number(value).toLocaleString('es-PY', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        {/* Header */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-lg">
          <div className="flex flex-col gap-1 border-l-4 border-primary pl-4">
            <h1 className="text-headline-md font-headline-md font-black text-foreground tracking-tight uppercase leading-none">
              {t('exchangeRates.title', 'Tipos de Cambio')}
            </h1>
            <p className="text-body-md text-muted-foreground">
              {t(
                'exchangeRates.subtitle',
                'Visualice y administre las tasas de cambio diarias y pares de divisas.'
              )}
            </p>
          </div>
          <Button variant="primary" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            {t('exchangeRates.action.create', 'Nueva Tasa')}
          </Button>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-lg">
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <div className="relative w-full max-w-xs">
              <Input
                className="pl-9 h-9 bg-surface-muted border-transparent rounded-md focus:bg-background transition-colors"
                placeholder={t('exchangeRates.search.placeholder', 'Buscar moneda (ej. USD, EUR)')}
                value={filters.searchTerm}
                onChange={(e) => setFilter('searchTerm', e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="relative">
              <Input
                type="date"
                className="w-44 h-9 pl-9 rounded-md"
                value={filters.dateFrom}
                onChange={(e) => setFilter('dateFrom', e.target.value)}
              />
            </div>
            <div className="relative">
              <Input
                type="date"
                className="w-44 h-9 pl-9 rounded-md"
                value={filters.dateTo}
                onChange={(e) => setFilter('dateTo', e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-surface-muted rounded-md border border-border-subtle">
              <button
                type="button"
                onClick={() => setViewMode('latest')}
                className={`px-4 py-1.5 rounded-sm text-body-sm-bold uppercase tracking-wide transition-colors duration-150 ${
                  filters.viewMode === 'latest'
                    ? 'bg-surface text-primary shadow-whisper'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('exchangeRates.view.latest', 'Recientes')}
              </button>
              <button
                type="button"
                onClick={() => setViewMode('historical')}
                className={`px-4 py-1.5 rounded-sm text-body-sm-bold uppercase tracking-wide transition-colors duration-150 ${
                  filters.viewMode === 'historical'
                    ? 'bg-surface text-primary shadow-whisper'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t('exchangeRates.view.historical', 'Histórico')}
              </button>
            </div>
            <Button variant="ghost" size="icon" onClick={() => fetchExchangeRates()} aria-label={t('exchangeRates.action.refresh', 'Actualizar Datos')}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleExport} aria-label={t('exchangeRates.action.export', 'Exportar CSV')}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Data states */}
        {loading && exchangeRates.length === 0 ? (
          <GenericSkeletonList count={6} lineHeight={44} data-testid="exchange-rates-loading" />
        ) : error ? (
          <DataState
            variant="error"
            title={t('exchangeRates.error.load', 'Error al cargar los tipos de cambio')}
            message={error}
            onRetry={() => fetchExchangeRates()}
            testId="exchange-rates-error"
          />
        ) : filtered.length === 0 ? (
          <DataState
            variant="empty"
            title={
              filters.searchTerm
                ? t('exchangeRates.empty.search', 'No se encontraron tipos de cambio con ese criterio')
                : t('exchangeRates.empty.title', 'Sin tipos de cambio')
            }
            description={t('exchangeRates.empty.message', 'No hay tipos de cambio registrados')}
            actionLabel={t('exchangeRates.action.create', 'Nueva Tasa')}
            onAction={openCreate}
            testId="exchange-rates-empty"
          />
        ) : (
          <div className="rounded-md bg-surface shadow-whisper overflow-hidden border border-border-subtle">
            <Table>
              <TableHeader className="bg-surface-muted">
                <TableRow>
                  <TableHead className="text-label-caps uppercase text-muted-foreground">
                    {t('exchangeRates.table.currencyPair', 'Par de Moneda')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-muted-foreground text-right">
                    {t('exchangeRates.table.rate', 'Tasa')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-muted-foreground">
                    {t('exchangeRates.table.source', 'Fuente')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-muted-foreground">
                    {t('exchangeRates.table.createdAt', 'Fecha de Creación')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-muted-foreground text-right">
                    {t('exchangeRates.table.actions', 'Acciones')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRates.map((rate: RateRow) => {
                  const fromCode = rate.from_currency_code || rate.currency_code || rate.code || 'XXX'
                  const toCode = rate.to_currency_code || 'PYG'
                  const flagUrl = getFlagUrl(fromCode)
                  return (
                    <TableRow
                      key={rate.id}
                      className="hover:bg-surface-muted transition-colors duration-150"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="size-7 rounded-full bg-background border border-border-subtle flex items-center justify-center overflow-hidden z-10">
                              {flagUrl ? (
                                <img src={flagUrl} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <span className="text-sm">🏳️</span>
                              )}
                            </div>
                            <div className="size-7 rounded-full bg-surface-muted border border-border-subtle flex items-center justify-center overflow-hidden">
                              {getFlagUrl(toCode) ? (
                                <img src={getFlagUrl(toCode) || ''} className="w-full h-full object-cover" alt="" />
                              ) : (
                                <span className="text-sm">🏳️</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-data-mono text-body-sm-bold text-primary uppercase leading-none">
                              {fromCode} / {toCode}
                            </span>
                            <span className="text-label-caps uppercase text-muted-foreground truncate mt-1">
                              {rate.from_currency_name || rate.currency_name || fromCode}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-data-mono text-foreground tabular-nums">
                        {formatRate(rate)}
                      </TableCell>
                      <TableCell>
                        {rate.source ? (
                          <Badge variant={rate.source.toLowerCase() === 'manual' ? 'secondary' : 'info'} size="sm">
                            {rate.source}
                          </Badge>
                        ) : (
                          <span className="text-body-md text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-data-mono text-muted-foreground">
                        {(rate.created_at || rate.rate_date || rate.date || '').split('T')[0]}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('exchangeRates.action.edit', 'Editar Tasa')}
                            onClick={() => openEdit(rate)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={t('exchangeRates.action.delete', 'Eliminar Tasa')}
                            onClick={() => {
                              setSelected(rate)
                              setDeleteOpen(true)
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            {/* Pagination footer */}
            <div className="p-4 bg-surface-muted border-t border-border-subtle flex items-center justify-between">
              <p className="text-label-caps uppercase text-muted-foreground">
                {t('exchangeRates.pagination.showing', { start: startItem, end: endItem, total: totalItems })}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPage(Math.max(1, safePage - 1))}
                  disabled={safePage <= 1}
                  aria-label={t('exchangeRates.action.previous_page', 'Página anterior')}
                >
                  <span className="material-icons-round text-[18px]">chevron_left</span>
                </Button>
                <span className="font-data-mono text-body-sm-bold text-muted-foreground px-2">
                  {safePage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                  disabled={safePage >= totalPages}
                  aria-label={t('exchangeRates.action.next_page', 'Página siguiente')}
                >
                  <span className="material-icons-round text-[18px]">chevron_right</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create / Edit modal */}
        <EnhancedModal
          isOpen={modalOpen}
          onClose={closeModal}
          title={
            selected
              ? t('exchangeRates.modal.edit_title', 'Editar Tasa de Cambio')
              : t('exchangeRates.modal.create_title', 'Nueva Tasa de Cambio')
          }
          variant="default"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeModal}>
                {t('action.cancel', 'Cancelar')}
              </Button>
              <Button variant="primary" type="submit" form="exchange-rate-form" disabled={saving}>
                {saving ? t('action.saving', 'Guardando...') : t('action.save', 'Guardar')}
              </Button>
            </div>
          }
        >
          <form id="exchange-rate-form" onSubmit={handleSave} className="space-y-md">
            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <Label htmlFor="exchange-rate-currency" className="text-body-md-bold text-foreground">
                  {t('exchangeRates.field.currency', 'Moneda')}
                </Label>
                <select
                  id="exchange-rate-currency"
                  className="w-full h-9 rounded-md border border-border-subtle bg-background px-3 text-body-md text-foreground focus:ring-2 focus:ring-primary outline-none cursor-pointer disabled:opacity-60"
                  value={form.currency_id}
                  onChange={(e) => setForm({ ...form, currency_id: e.target.value })}
                  disabled={!!selected}
                  required
                >
                  <option value="">{t('exchangeRates.filter.fromCurrency', 'Moneda origen')}</option>
                  {currencies.map((c: CurrencyRow) => (
                    <option key={String(c.id)} value={String(c.id)}>
                      {(c.code || c.currency_code || '')} - {c.currency_name || c.name || ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-xs">
                <Label htmlFor="exchange-rate-value" className="text-body-md-bold text-foreground">
                  {t('exchangeRates.field.rate', 'Tasa')}
                </Label>
                <Input
                  id="exchange-rate-value"
                  type="number"
                  step="0.000001"
                  min="0"
                  value={form.rate}
                  onChange={(e) => setForm({ ...form, rate: e.target.value })}
                  placeholder="0,0000"
                  className="font-data-mono"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <Label htmlFor="exchange-rate-date" className="text-body-md-bold text-foreground">
                  {t('exchangeRates.field.effectiveDate', 'Fecha Efectiva')}
                </Label>
                <Input
                  id="exchange-rate-date"
                  type="date"
                  value={form.effective_date}
                  onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
                  className="font-data-mono"
                  required
                />
              </div>
              <div className="space-y-xs">
                <Label htmlFor="exchange-rate-source" className="text-body-md-bold text-foreground">
                  {t('exchangeRates.field.source', 'Fuente')}
                </Label>
                <Input
                  id="exchange-rate-source"
                  value={form.source}
                  onChange={(e) => setForm({ ...form, source: e.target.value })}
                  placeholder={t('exchangeRates.placeholder.source', 'Ingrese la fuente (ej. Banco Central)')}
                  maxLength={100}
                  required
                />
              </div>
            </div>
            {formError && (
              <div className="p-md rounded-md bg-error-container text-on-error-container text-body-md">
                {formError}
              </div>
            )}
          </form>
        </EnhancedModal>

        {/* Delete confirmation modal */}
        <EnhancedModal
          isOpen={deleteOpen}
          onClose={() => setDeleteOpen(false)}
          title={t('exchangeRates.modal.delete_title', 'Eliminar Tasa de Cambio')}
          variant="error"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
                {t('action.cancel', 'Cancelar')}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? t('action.saving', 'Guardando...') : t('action.delete', 'Eliminar')}
              </Button>
            </div>
          }
        >
          <p className="text-body-md text-muted-foreground">
            {t(
              'exchangeRates.modal.delete_confirm',
              '¿Estás seguro de que deseas eliminar esta tasa de cambio? Esta acción no se puede deshacer.'
            )}
          </p>
        </EnhancedModal>
      </div>
    </div>
  )
}
