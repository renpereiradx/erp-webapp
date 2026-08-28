// ===========================================================================
// Payment Methods Page - Configuración Financiera
// Design: DESIGN.md (design/tokens.json) - componentes ui/
// i18n: useI18n() (ES/EN)
// ===========================================================================

import { useCallback, useEffect, useState } from 'react'
import { useI18n } from '@/lib/i18n'
import { Plus, Pencil, RefreshCw, CreditCard } from 'lucide-react'
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
import { PaymentMethodService } from '@/services/paymentMethodService'

interface PaymentMethodRow {
  id?: number | string
  method_code?: string
  description?: string
  is_active?: boolean
}

interface FormValues {
  method_code: string
  description: string
  is_active: boolean
}

const emptyForm: FormValues = {
  method_code: '',
  description: '',
  is_active: true,
}

/**
 * Página /configuracion/metodos-pago
 * Administra las formas de cobro y pago (CASH, CARD, ...).
 */
export default function PaymentMethods() {
  const { t } = useI18n()
  const [methods, setMethods] = useState<PaymentMethodRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [selected, setSelected] = useState<PaymentMethodRow | null>(null)
  const [form, setForm] = useState<FormValues>(emptyForm)
  const [saving, setSaving] = useState(false)

  const fetchMethods = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await PaymentMethodService.getAll()
      setMethods(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMethods()
  }, [fetchMethods])

  const filtered = methods.filter((m) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      (m.method_code || '').toLowerCase().includes(term) ||
      (m.description || '').toLowerCase().includes(term)
    )
  })

  const openCreate = () => {
    setSelected(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  const openEdit = (m: PaymentMethodRow) => {
    setSelected(m)
    setForm({
      method_code: m.method_code || '',
      description: m.description || '',
      is_active: m.is_active !== false,
    })
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setSelected(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (selected?.id) {
        await PaymentMethodService.update(selected.id, form)
      } else {
        await PaymentMethodService.create(form)
      }
      closeModal()
      await fetchMethods()
    } catch (err: any) {
      // eslint-disable-next-line no-console
      console.error('Error saving payment method', err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-container-max px-md lg:px-lg pb-xl">
        {/* Header */}
        <header className="flex flex-col gap-1 border-l-4 border-primary pl-4 mb-lg">
          <h1 className="text-headline-md font-headline-md font-black text-foreground tracking-tight uppercase leading-none">
            {t('paymentMethods.page.title', 'Métodos de Pago')}
          </h1>
          <p className="text-body-md text-muted-foreground">
            {t(
              'paymentMethods.page.subtitle',
              'Administra las formas de cobro y pago disponibles en el sistema.'
            )}
          </p>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-lg">
          <Button variant="primary" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1.5" />
            {t('paymentMethods.action.create', 'Nuevo Método')}
          </Button>
          <div className="flex items-center gap-2 flex-1 md:justify-end">
            <div className="relative w-full max-w-sm">
              <Input
                className="pl-9 h-9 bg-surface-muted border-transparent rounded-md focus:bg-background transition-colors"
                placeholder={t('paymentMethods.search.placeholder', 'Buscar por código o descripción...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <CreditCard className="w-4 h-4" />
              </span>
            </div>
            <Button variant="ghost" size="icon" onClick={fetchMethods} aria-label={t('currencies.action.refresh', 'Actualizar Datos')}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Data states */}
        {loading ? (
          <GenericSkeletonList count={6} lineHeight={44} data-testid="payment-methods-loading" />
        ) : error ? (
          <DataState
            variant="error"
            title={t('paymentMethods.error.load', 'Error al cargar los métodos de pago')}
            message={error.message}
            onRetry={fetchMethods}
            testId="payment-methods-error"
          />
        ) : filtered.length === 0 ? (
          <DataState
            variant="empty"
            title={t('paymentMethods.empty.title', 'No hay métodos de pago')}
            description={t(
              'paymentMethods.empty.description',
              'Crea tu primer método de pago para habilitar cobros y pagos en el sistema.'
            )}
            actionLabel={t('paymentMethods.action.create', 'Nuevo Método')}
            onAction={openCreate}
            testId="payment-methods-empty"
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
                  <TableHead className="text-label-caps uppercase text-muted-foreground">
                    {t('currencies.payment_methods.table.type', 'Tipo')}
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
                {filtered.map((m) => (
                  <TableRow key={String(m.id)} className="hover:bg-surface-muted transition-colors duration-150">
                    <TableCell className="text-data-mono font-data-mono text-foreground uppercase">
                      {m.method_code}
                    </TableCell>
                    <TableCell className="text-body-md text-foreground">{m.description}</TableCell>
                    <TableCell>
                      <Badge variant={PaymentMethodService.requiresAdditionalInfo(m) ? 'info' : 'secondary'} size="sm">
                        {PaymentMethodService.requiresAdditionalInfo(m)
                          ? t('currencies.payment_methods.type.complex', 'Complejo (Info extra)')
                          : t('currencies.payment_methods.type.simple', 'Simple')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={m.is_active !== false ? 'success' : 'secondary'} size="sm">
                        {m.is_active !== false
                          ? t('currencies.status.active', 'Activo')
                          : t('currencies.status.inactive', 'Inactivo')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={t('paymentMethods.action.edit', 'Editar Método')}
                        onClick={() => openEdit(m)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
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
              ? t('paymentMethods.form.edit_title', 'Editar Método de Pago')
              : t('paymentMethods.form.create_title', 'Nuevo Método de Pago')
          }
          variant="default"
          size="sm"
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={closeModal}>{t('action.cancel', 'Cancelar')}</Button>
              <Button variant="primary" type="submit" form="payment-method-form" disabled={saving}>
                {saving ? t('action.saving', 'Guardando...') : t('action.save', 'Guardar')}
              </Button>
            </div>
          }
        >
          <form id="payment-method-form" onSubmit={handleSubmit} className="space-y-md">
            <div className="space-y-xs">
              <Label htmlFor="method_code" className="text-body-md-bold text-foreground">
                {t('paymentMethods.form.code', 'Código del Método')}
              </Label>
              <Input
                id="method_code"
                value={form.method_code}
                onChange={(e) => setForm({ ...form, method_code: e.target.value.toUpperCase() })}
                placeholder={t('paymentMethods.form.code_placeholder', 'CASH, CARD, etc.')}
                disabled={!!selected?.id}
                className="uppercase font-data-mono"
                required
              />
            </div>
            <div className="space-y-xs">
              <Label htmlFor="method_description" className="text-body-md-bold text-foreground">
                {t('paymentMethods.form.description', 'Descripción')}
              </Label>
              <Input
                id="method_description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('paymentMethods.form.description_placeholder', 'Ej: Pago en Efectivo')}
                required
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-muted rounded-md border border-border-subtle">
              <Label htmlFor="method_active" className="text-body-md-bold text-foreground">
                {t('paymentMethods.form.active', 'Método Activo')}
              </Label>
              <input
                id="method_active"
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="rounded-sm border-border-subtle text-primary size-4"
              />
            </div>
          </form>
        </EnhancedModal>
      </div>
    </div>
  )
}
