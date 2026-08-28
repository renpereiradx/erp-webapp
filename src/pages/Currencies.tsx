// ===========================================================================
// Currencies Page - Configuración Financiera > Monedas
// Design: DESIGN.md (design/tokens.json) - componentes ui/
// Logic: useCurrencyStore
// i18n: useI18n() (ES/EN)
// ===========================================================================

import { useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { Plus, Pencil, RefreshCw, Download, Coins } from 'lucide-react'
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
import useCurrencyStore from '@/store/useCurrencyStore'

interface CurrencyRow {
  id?: number | string
  code?: string
  currency_code?: string
  name?: string
  currency_name?: string
  symbol?: string
  decimal_places?: number
  exchange_rate?: number | null
  is_enabled?: boolean
  is_base_currency?: boolean
  flag_emoji?: string
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
 * Página /configuracion/monedas
 * Catálogo de monedas activas + moneda base del sistema.
 */
export default function Currencies() {
  const { t } = useI18n()
  const {
    currencies,
    loading: currenciesLoading,
    error: storeError,
    searchTerm,
    setSearchTerm,
    fetchCurrencies,
    createCurrency,
    updateCurrency,
    getFilteredCurrencies,
  } = useCurrencyStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<CurrencyRow | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    currency_name: '',
    currency_code: '',
    symbol: '',
    decimal_places: 2,
    is_enabled: true,
  })

  const filtered = getFilteredCurrencies()
  const baseCurrency = currencies.find((c: CurrencyRow) => c.is_base_currency)

  useEffect(() => {
    fetchCurrencies()
  }, [fetchCurrencies])

  const openCreate = () => {
    setSelected(null)
    setForm({
      currency_name: '',
      currency_code: '',
      symbol: '',
      decimal_places: 2,
      is_enabled: true,
    })
    setModalOpen(true)
  }

  const openEdit = (c: CurrencyRow) => {
    setSelected(c)
    setForm({
      currency_name: c.currency_name || c.name || '',
      currency_code: c.currency_code || c.code || '',
      symbol: c.symbol || '',
      decimal_places: c.decimal_places ?? 2,
      is_enabled: c.is_enabled !== false,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelected(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        currency_name: form.currency_name,
        currency_code: form.currency_code,
        symbol: form.symbol,
        decimal_places: form.decimal_places,
        is_enabled: form.is_enabled,
      }
      if (selected?.id) {
        await updateCurrency(selected.id, payload)
      } else {
        await createCurrency(payload)
      }
      closeModal()
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Error saving currency', err)
    } finally {
      setSaving(false)
    }
  }

  const handleExport = () => {
    const csvContent = [
      [
        t('currencies.table.code'),
        t('currencies.table.name'),
        t('currencies.table.symbol'),
        t('currencies.field.decimals'),
        t('currencies.table.status'),
        t('currencies.table.exchange_rate'),
      ].join(','),
      ...filtered.map((c) => [
        c.currency_code || c.code,
        `"${c.currency_name || c.name}"`,
        c.symbol,
        c.decimal_places,
        c.is_enabled !== false
          ? t('currencies.status.enabled')
          : t('currencies.status.disabled'),
        c.exchange_rate || '',
      ].join(',')),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `monedas_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const formatCurrencyValue = (value: number | null | undefined, currency: CurrencyRow) => {
    if (value === null || value === undefined) return '-'
    const decimals =
      (baseCurrency?.currency_code || baseCurrency?.code) === 'PYG'
        ? 0
        : (currency?.decimal_places ?? 4)
    return Number(value).toLocaleString('es-PY', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        {/* Header + base currency widget */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-lg">
          <header className="flex flex-col gap-1 border-l-4 border-primary pl-4">
            <h1 className="text-headline-md font-headline-md font-black text-foreground tracking-tight uppercase leading-none">
              {t('currencies.page.title', 'Monedas')}
            </h1>
            <p className="text-body-md text-muted-foreground">
              {t(
                'currencies.page.subtitle',
                'Administra la moneda base del sistema y el catálogo de monedas para transacciones.'
              )}
            </p>
          </header>

          <div className="bg-surface p-4 rounded-md border border-border-subtle shadow-whisper flex items-center gap-6">
            <div>
              <p className="text-label-caps uppercase text-muted-foreground leading-none mb-2">
                {t('currencies.widget.base_currency', 'Moneda Base')}
              </p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-primary leading-none font-data-mono uppercase">
                  {baseCurrency?.currency_code || baseCurrency?.code || 'PYG'}
                </span>
                <span className="text-body-sm-bold text-muted-foreground">
                  ({baseCurrency?.symbol || '₲'})
                </span>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="h-9">
              {t('currencies.widget.change', 'Cambiar')}
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-lg">
          <Button variant="primary" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            {t('currencies.action.create', 'Agregar Nueva Moneda')}
          </Button>
          <div className="flex items-center gap-2 flex-1 md:justify-end">
            <div className="relative w-full max-w-sm">
              <Input
                className="pl-9 h-9 bg-surface-muted border-transparent rounded-md focus:bg-background transition-colors"
                placeholder={t('currencies.search.placeholder', 'Buscar por código ISO o nombre...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Coins className="w-4 h-4" />
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchCurrencies} aria-label={t('currencies.action.refresh', 'Actualizar Datos')}>
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleExport} aria-label={t('currencies.action.export', 'Exportar')}>
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Data states */}
        {currenciesLoading ? (
          <GenericSkeletonList count={6} lineHeight={44} data-testid="currencies-loading" />
        ) : storeError ? (
          <DataState
            variant="error"
            title={t('currencies.error.load', 'Error al cargar las monedas')}
            message={storeError}
            onRetry={fetchCurrencies}
            testId="currencies-error"
          />
        ) : filtered.length === 0 ? (
          <DataState
            variant="empty"
            title={t('currencies.empty.search', 'No se encontraron monedas')}
            description={t(
              'currencies.empty.message',
              'No hay monedas configuradas. Crea la primera para habilitar transacciones.'
            )}
            actionLabel={t('currencies.action.create', 'Agregar Nueva Moneda')}
            onAction={openCreate}
            testId="currencies-empty"
          />
        ) : (
          <div className="rounded-md bg-surface shadow-whisper overflow-hidden border border-border-subtle">
            <Table>
              <TableHeader className="bg-surface-muted">
                <TableRow>
                  <TableHead className="text-label-caps uppercase text-muted-foreground">
                    {t('currencies.table.code', 'Código ISO')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-muted-foreground">
                    {t('currencies.table.name', 'Nombre')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-muted-foreground text-center">
                    {t('currencies.table.symbol', 'Símbolo')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-muted-foreground text-right">
                    {t('currencies.table.exchange_rate', 'Tasa de Cambio')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-muted-foreground">
                    {t('currencies.table.status', 'Estado')}
                  </TableHead>
                  <TableHead className="text-label-caps uppercase text-muted-foreground text-right">
                    {t('currencies.table.actions', 'Acciones')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const flagUrl = getFlagUrl(c.currency_code || c.code)
                  return (
                    <TableRow
                      key={String(c.id)}
                      className={`hover:bg-surface-muted transition-colors duration-150 ${
                        c.is_base_currency ? 'bg-surface-muted' : ''
                      }`}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="size-8 rounded-full bg-background border border-border-subtle flex items-center justify-center overflow-hidden">
                            {flagUrl ? (
                              <img src={flagUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <span className="text-sm">{c.flag_emoji || '🏳️'}</span>
                            )}
                          </div>
                          <span className="font-data-mono font-bold text-primary uppercase">
                            {c.currency_code || c.code}
                          </span>
                          {c.is_base_currency && (
                            <Badge variant="default" size="sm">
                              {t('currencies.badge.base', 'BASE')}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-body-md text-foreground">
                        {c.currency_name || c.name}
                      </TableCell>
                      <TableCell className="text-center font-data-mono text-muted-foreground">
                        {c.symbol}
                      </TableCell>
                      <TableCell className="text-right font-data-mono text-foreground tabular-nums">
                        {c.is_base_currency ? '-' : formatCurrencyValue(c.exchange_rate, c)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={c.is_enabled !== false ? 'success' : 'secondary'} size="sm">
                          {c.is_enabled !== false
                            ? t('currencies.status.active', 'Activo')
                            : t('currencies.status.inactive', 'Inactivo')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={t('currencies.action.edit', 'Editar Moneda')}
                          onClick={() => openEdit(c)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>

            <div className="p-4 bg-surface-muted border-t border-border-subtle flex items-center justify-between">
              <p className="text-label-caps uppercase text-muted-foreground">
                {t('currencies.results', {
                  count: filtered.length,
                  total: filtered.length,
                })}
              </p>
            </div>
          </div>
        )}

        {/* Create / Edit modal */}
        <EnhancedModal
          isOpen={modalOpen}
          onClose={closeModal}
          title={
            selected
              ? t('currencies.modal.edit_title', 'Editar Moneda')
              : t('currencies.modal.create_title', 'Nueva Moneda')
          }
          variant="default"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeModal}>{t('action.cancel', 'Cancelar')}</Button>
              <Button variant="primary" type="submit" form="currency-form" disabled={saving}>
                {saving ? t('action.saving', 'Guardando...') : t('action.save', 'Guardar')}
              </Button>
            </div>
          }
        >
          <form id="currency-form" onSubmit={handleSave} className="space-y-md">
            <div className="space-y-xs">
              <Label htmlFor="currency_name" className="text-body-md-bold text-foreground">
                {t('currencies.field.name', 'Nombre')}
              </Label>
              <Input
                id="currency_name"
                value={form.currency_name}
                onChange={(e) => setForm({ ...form, currency_name: e.target.value })}
                placeholder={t('currencies.placeholder.name', 'Dólar Estadounidense')}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-md">
              <div className="space-y-xs">
                <Label htmlFor="currency_code" className="text-body-md-bold text-foreground">
                  {t('currencies.field.code', 'Código ISO')}
                </Label>
                <Input
                  id="currency_code"
                  value={form.currency_code}
                  onChange={(e) => setForm({ ...form, currency_code: e.target.value.toUpperCase() })}
                  placeholder="EUR"
                  maxLength={3}
                  disabled={!!selected?.id}
                  className="uppercase font-data-mono"
                  required
                />
              </div>
              <div className="space-y-xs">
                <Label htmlFor="currency_symbol" className="text-body-md-bold text-foreground">
                  {t('currencies.field.symbol', 'Símbolo')}
                </Label>
                <Input
                  id="currency_symbol"
                  value={form.symbol}
                  onChange={(e) => setForm({ ...form, symbol: e.target.value })}
                  placeholder="$"
                  maxLength={5}
                  className="font-data-mono"
                />
              </div>
            </div>
            <div className="space-y-xs">
              <Label htmlFor="currency_decimals" className="text-body-md-bold text-foreground">
                {t('currencies.field.decimals', 'Decimales')}
              </Label>
              <Input
                id="currency_decimals"
                type="number"
                min={0}
                max={4}
                value={form.decimal_places}
                onChange={(e) => setForm({ ...form, decimal_places: parseInt(e.target.value) || 0 })}
                className="font-data-mono"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-muted rounded-md border border-border-subtle">
              <Label htmlFor="currency_enabled" className="text-body-md-bold text-foreground">
                {t('currencies.field.enabled', 'Moneda habilitada para transacciones')}
              </Label>
              <input
                id="currency_enabled"
                type="checkbox"
                checked={form.is_enabled}
                onChange={(e) => setForm({ ...form, is_enabled: e.target.checked })}
                className="rounded-sm border-border-subtle text-primary size-4"
              />
            </div>
          </form>
        </EnhancedModal>
      </div>
    </div>
  )
}
