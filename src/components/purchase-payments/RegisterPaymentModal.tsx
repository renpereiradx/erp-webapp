/**
 * RegisterPaymentModal — registro de pagos a proveedores vinculado a caja.
 *
 * Espejo de RegisterSalePaymentModal (ventas) bajo el contrato DESIGN.md:
 * panel izquierdo de resumen sobre bg-inverse-surface y formulario en cards
 * sobre bg-surface. La caja es REQUERIDA (el backend ProcessPaymentWithCashRegister
 * devuelve 409 sin caja): el submit se bloquea y se muestra guía.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Receipt,
  Coins,
  ArrowUpRight,
  User,
  Hash,
  Building
} from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import { toApiError } from '@/utils/ApiError'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cashRegisterService } from '@/services/cashRegisterService'
import { CurrencyService } from '@/services/currencyService'
import { PaymentMethodService } from '@/services/paymentMethodService'
import { normalizeCurrencyCode, formatPYG } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'

const DEFAULT_CURRENCY_CODE = 'PYG'
const CASH_REGISTER_NONE_VALUE = '__none__'

interface Order {
  id: number | string;
  pendingAmount: number | null;
  currency: string;
  supplierName?: string;
  supplierId?: number | string | null;
  priority?: number | null;
}

interface RegisterPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
  onSubmit: (data: any) => Promise<void>;
}

const RegisterPaymentModal: React.FC<RegisterPaymentModalProps> = ({ open, onOpenChange, order, onSubmit }) => {
  const { lang, t } = useI18n()

  const [amount, setAmount] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')
  const [originalAmount, setOriginalAmount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [currencyCode, setCurrencyCode] = useState((order?.currency || DEFAULT_CURRENCY_CODE).toUpperCase())
  const [cashRegister, setCashRegister] = useState('')
  const [amountError, setAmountError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const [cashRegisters, setCashRegisters] = useState<any[]>([])
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])

  const formatNumberWithDots = useCallback((value: string) => {
    if (!value) return ''
    const numericValue = value.toString().replace(/\D/g, '')
    if (!numericValue) return ''
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }, [])

  const parseNumberWithDots = useCallback((value: string) => {
    if (!value) return ''
    return value.toString().replace(/\./g, '')
  }, [])

  const resetForm = useCallback(() => {
    setAmount(''); setExchangeRate(''); setOriginalAmount(''); setReference(''); setNotes(''); setPaymentMethodId('');
    setCurrencyCode((order?.currency || DEFAULT_CURRENCY_CODE).toUpperCase());
    setCashRegister(''); setAmountError(null); setFormError(null); setSubmitting(false);
  }, [order?.currency])

  useEffect(() => { if (open) resetForm() }, [open, resetForm])

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm()
    if (onOpenChange) onOpenChange(nextOpen)
  }

  const formatLocalizedCurrency = useCallback((value: number, currCode = 'PYG') => {
    const code = normalizeCurrencyCode(currCode)
    if (code === 'PYG') return formatPYG(Number(value || 0))
    const formatter = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
      style: 'currency', currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return formatter.format(Number(value || 0))
  }, [lang])

  const pendingLabel = useMemo(() => !order || order.pendingAmount === null ? null : formatLocalizedCurrency(order.pendingAmount, order.currency), [formatLocalizedCurrency, order])
  const numericAmount = useMemo(() => {
    const val = Number.parseFloat(parseNumberWithDots(amount));
    return Number.isFinite(val) ? val : 0
  }, [amount, parseNumberWithDots])

  const projectedBalance = useMemo(() => {
    if (!order || order.pendingAmount === null) return 0
    return Math.max(0, Number(order.pendingAmount) - numericAmount)
  }, [order, numericAmount])

  const loadData = useCallback(async () => {
    try {
      const [methods, currencyList, registersData] = await Promise.all([
        PaymentMethodService.getAll().catch(() => []),
        CurrencyService.getAll().catch(() => []),
        Promise.all([
          cashRegisterService.getCashRegisters().catch(() => []),
          cashRegisterService.getActiveCashRegister().catch(() => null)
        ])
      ])

      const validMethods = Array.isArray(methods) ? methods : []
      setPaymentMethods(validMethods)
      if (validMethods.length > 0) {
        const def = validMethods.find((m: any) => m.is_default) || validMethods[0]
        setPaymentMethodId(curr => curr || String(def.id || def.payment_method_id))
      }

      setCurrencies(Array.isArray(currencyList) ? currencyList : [])

      const [allRegs, activeReg] = registersData
      const openRegs = Array.isArray(allRegs) ? allRegs.filter((cr: any) => (cr?.status || cr?.state || '').toUpperCase() === 'OPEN') : []
      setCashRegisters(openRegs)

      if (activeReg?.id) {
        const isActiveInBranch = openRegs.some(cr => String(cr.id) === String(activeReg.id));
        if (isActiveInBranch) {
          setCashRegister(c => c || String(activeReg.id))
        }
      }
    } catch (e) { console.error('Error loading modal data:', e) }
  }, [])

  useEffect(() => { if (open) loadData() }, [loadData, open])

  const currencySelectorData = useMemo(() => {
    if (currencies.length) return currencies.map(c => ({ id: c.currency_code, code: c.currency_code, name: c.currency_name, currency_id: c.id }))
    const fb = (order?.currency || DEFAULT_CURRENCY_CODE).toUpperCase()
    return [{ id: fb, code: fb, name: fb, currency_id: null }]
  }, [currencies, order?.currency])

  const paymentMethodOptions = useMemo(() => paymentMethods.map(m => {
    const id = String(m.id || m.payment_method_id)
    const label = m.description || m.method_code || m.display_name || m.name || id
    return { id, label }
  }).filter(o => o.id !== 'undefined'), [paymentMethods])

  const cashRegisterOptions = useMemo(() => cashRegisters.map(cr => ({
    value: String(cr.id),
    label: cr.name || `Caja #${cr.id}`,
    balanceLabel: typeof cr.current_balance === 'number' ? formatLocalizedCurrency(cr.current_balance, cr.currency) : null
  })), [cashRegisters, formatLocalizedCurrency])

  const cashRegisterRequired = !cashRegister || cashRegister === CASH_REGISTER_NONE_VALUE
  const isSubmitDisabled = !order || isSubmitting || !paymentMethodId || !currencyCode || !!amountError || !amount || cashRegisterRequired

  // Caja REQUERIDA para pagar (el backend ProcessPaymentWithCashRegister
  // devuelve 409 sin caja). Se bloquea el submit y se muestra guía.
  const cashRegisterHint = useMemo(() => {
    if (cashRegisterRequired) {
      return t('purchases.errors.cashRegisterRequired', 'Necesitás una caja abierta para pagar. Abrí una caja e intentá de nuevo.')
    }
    return ''
  }, [cashRegisterRequired, t])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!order) return
    if (cashRegisterRequired) return
    const num = Number.parseFloat(parseNumberWithDots(amount))
    if (!Number.isFinite(num) || num <= 0) {
      setAmountError(t('purchasePaymentsMvp.registerModal.amount.errorRequired', 'Ingresá un monto válido.'))
      return
    }

    setSubmitting(true)
    try {
      const selectedCurrency = currencySelectorData.find(c => c.code === String(currencyCode).toUpperCase())

      await onSubmit({
        orderId: order.id,
        amount: Number(num.toFixed(2)),
        paymentMethodId: Number(paymentMethodId),
        currencyCode: String(currencyCode).toUpperCase(),
        currencyId: selectedCurrency ? (selectedCurrency as any).currency_id : undefined,
        exchange_rate: exchangeRate ? Number(exchangeRate) : undefined,
        original_amount: originalAmount ? Number(originalAmount) : undefined,
        reference: reference.trim() || null,
        cashRegisterId: (cashRegister && cashRegister !== CASH_REGISTER_NONE_VALUE) ? Number(cashRegister) : undefined,
        notes: notes.trim() || null,
      })
      resetForm(); handleDialogChange(false)
    } catch (e: any) {
      const norm = toApiError(e)
      if (norm.code === 'CONFLICT') {
        setFormError(t('purchases.errors.cashRegisterRequired', 'Necesitás una caja abierta para pagar. Abrí una caja e intentá de nuevo.'))
      } else {
        setFormError(e?.message || t('purchasePaymentsMvp.registerModal.submitError', 'No se pudo registrar el pago. Intentá nuevamente.'))
      }
    } finally { setSubmitting(false) }
  }

  const paymentPercentage = useMemo(() => !order || !order.pendingAmount ? 0 : Math.min(100, Math.round((numericAmount / Number(order.pendingAmount)) * 100)), [order, numericAmount])

  const isForeign = normalizeCurrencyCode(currencyCode) !== normalizeCurrencyCode(order?.currency || DEFAULT_CURRENCY_CODE)
  const labelClass = 'text-label-caps uppercase text-muted-foreground'

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className='register-payment-modal w-[95vw] lg:!w-[1150px] lg:!max-w-[calc(95vw-288px)] p-0 overflow-hidden border border-border-subtle shadow-fluent-16 rounded-xl bg-background'>
        <DialogTitle className='sr-only'>{t('purchasePaymentsMvp.registerModal.title', 'Registrar nuevo pago')}</DialogTitle>
        <DialogDescription className='sr-only'>{t('purchasePaymentsMvp.registerModal.orderFallback', 'Seleccioná una orden con saldo pendiente para registrar el pago.')}</DialogDescription>
        <form onSubmit={handleSubmit} className='flex flex-col md:flex-row h-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto md:overflow-hidden'>
          {/* PANEL IZQUIERDO: RESUMEN OPERATIVO */}
          <div className='w-full md:w-[35%] bg-inverse-surface text-on-primary p-lg md:p-xl flex flex-col relative overflow-hidden border-b md:border-b-0 md:border-r border-on-primary/10'>
            <div className='relative z-10 flex flex-col h-full'>
              <header className='mb-xl'>
                <div className='size-12 bg-primary rounded-md flex items-center justify-center text-on-primary mb-lg shadow-fluent-2'>
                  <Building size={24} aria-hidden='true' />
                </div>
                <h2 className='text-headline-lg font-black tracking-tighter uppercase leading-none mb-md'>
                  {t('purchasePaymentsMvp.registerModal.panelTitle', 'Registrar Pago')} <br />
                  <span className='text-primary'>{t('purchasePaymentsMvp.registerModal.panelSubtitle', 'Proveedor')}</span>
                </h2>
                <div className='inline-flex items-center gap-sm px-md py-xs bg-on-primary/5 border border-on-primary/10 rounded-full text-body-sm-bold text-on-primary/60 uppercase'>
                  <Receipt size={12} className='text-primary' aria-hidden='true' /> {t('purchasePaymentsMvp.registerModal.invoiceLabel', 'Factura #{id}', { id: order?.id || '---' })}
                </div>
              </header>

              <div className='space-y-lg flex-1'>
                {/* Proveedor */}
                <div className='bg-on-primary/5 rounded-md p-md border border-on-primary/10 flex items-center gap-md'>
                  <div className='size-10 bg-on-primary/10 rounded-md flex items-center justify-center text-on-primary/60'>
                    <User size={18} aria-hidden='true' />
                  </div>
                  <div className='min-w-0'>
                    <p className='text-label-caps uppercase text-on-primary/50 mb-0.5'>{t('purchasePaymentsMvp.table.supplier', 'Proveedor')}</p>
                    <p className='text-body-md-bold text-on-primary truncate'>{order?.supplierName || '---'}</p>
                  </div>
                </div>

                {/* Deuda pendiente + progreso */}
                <div className='space-y-sm'>
                  <div className='flex justify-between items-end'>
                    <p className='text-label-caps uppercase text-on-primary/50'>{t('purchasePaymentsMvp.detail.summary.pending', 'Saldo pendiente')}</p>
                    <p className='text-headline-lg-mobile font-black text-on-primary font-data-mono text-data-mono'>{pendingLabel || formatLocalizedCurrency(0)}</p>
                  </div>
                  <div className='h-2 bg-on-primary/10 rounded-full overflow-hidden'>
                    <div className='h-full bg-primary transition-all duration-150' style={{ width: `${paymentPercentage}%` }} />
                  </div>
                  <div className='text-label-caps uppercase text-primary text-right'>
                    {t('purchasePaymentsMvp.registerModal.percentCovered', '{pct}% cubierto', { pct: paymentPercentage })}
                  </div>
                </div>

                {/* Saldo proyectado */}
                <div className='p-md bg-primary/10 rounded-md border border-primary/20'>
                  <div className='flex items-center gap-md'>
                    <div className='size-8 bg-primary rounded-md flex items-center justify-center text-on-primary shadow-fluent-2'>
                      <ArrowUpRight size={16} aria-hidden='true' />
                    </div>
                    <div>
                      <p className='text-label-caps uppercase text-on-primary/50 mb-0.5'>{t('purchasePaymentsMvp.registerModal.projectedBalance', 'Saldo Proyectado')}</p>
                      <p className={cn(
                        'text-title-md font-black font-data-mono text-data-mono transition-colors duration-150',
                        projectedBalance === 0 ? 'text-success' : 'text-on-primary'
                      )}>
                        {formatLocalizedCurrency(projectedBalance, order?.currency)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <footer className='mt-xl pt-lg border-t border-on-primary/10 hidden md:block'>
                <p className='text-label-caps uppercase text-on-primary/30 leading-relaxed'>
                  {t('purchasePaymentsMvp.registerModal.treasuryNote', '* Verifique los datos de tesorería antes de confirmar.')}
                </p>
              </footer>
            </div>
          </div>

          {/* PANEL DERECHO: FORMULARIO */}
          <div className='w-full md:w-[65%] bg-surface-muted p-lg md:p-xl flex flex-col'>
            <div className='flex-1 space-y-lg overflow-y-auto pr-2 custom-scrollbar'>
              {/* SECCIÓN 1: MONTO Y DIVISA */}
              <div className='bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden'>
                <div className='px-lg py-md border-b border-border-subtle bg-surface-muted flex items-center gap-md'>
                  <div className='size-7 bg-primary/10 rounded-md flex items-center justify-center text-primary'>
                    <Coins size={16} aria-hidden='true' />
                  </div>
                  <h3 className='text-label-caps uppercase text-foreground'>
                    {t('purchasePaymentsMvp.registerModal.section.paymentInfo', 'Información del Pago')}
                  </h3>
                </div>
                <div className='p-lg space-y-lg'>
                  <div className='space-y-sm'>
                    <div className='flex flex-wrap items-center justify-between gap-sm'>
                      <Label htmlFor='purchase-amount' className={labelClass}>
                        {t('purchasePaymentsMvp.registerModal.amount.label', 'Monto a registrar')}
                      </Label>
                      <button
                        type='button'
                        onClick={() => order?.pendingAmount && setAmount(formatNumberWithDots(String(order.pendingAmount)))}
                        className='text-label-caps uppercase text-primary hover:underline cursor-pointer'
                      >
                        {t('purchasePaymentsMvp.registerModal.amount.payFull', 'Pago Total')}
                      </button>
                    </div>
                    <div className='relative'>
                      <div className='absolute left-md top-1/2 -translate-y-1/2 text-muted-foreground font-data-mono text-data-mono'>
                        {normalizeCurrencyCode(currencyCode) === 'PYG' ? '₲' : currencyCode}
                      </div>
                      <Input
                        id='purchase-amount'
                        type='text'
                        inputMode='numeric'
                        value={amount}
                        onChange={e => { setAmount(formatNumberWithDots(parseNumberWithDots(e.target.value))); if (amountError) setAmountError(null); }}
                        className='h-14 pl-xl rounded-input bg-surface-muted font-data-mono text-data-mono text-body-lg focus:bg-surface'
                      />
                    </div>
                    {amountError && <p className='text-body-md text-error'>{amountError}</p>}
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-lg'>
                    <div className='space-y-sm'>
                      <Label htmlFor='purchase-currency' className={labelClass}>
                        {t('purchasePaymentsMvp.registerModal.currency.label', 'Moneda')}
                      </Label>
                      <Select value={currencyCode} onValueChange={setCurrencyCode}>
                        <SelectTrigger id='purchase-currency' className='rounded-input border-border-subtle bg-surface-muted text-body-md-bold'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='bg-surface border-border-subtle shadow-fluent-8'>
                          {currencySelectorData.map(c => (
                            <SelectItem key={c.id} value={c.code} className='text-body-md'>{c.code} - {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-sm'>
                      <Label htmlFor='purchase-method' className={labelClass}>
                        {t('purchasePaymentsMvp.registerModal.method.label', 'Método de pago')}
                      </Label>
                      <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                        <SelectTrigger id='purchase-method' className='rounded-input border-border-subtle bg-surface-muted text-body-md-bold'>
                          <SelectValue placeholder={t('purchasePaymentsMvp.registerModal.method.placeholder', 'Seleccioná un método de pago')} />
                        </SelectTrigger>
                        <SelectContent className='bg-surface border-border-subtle shadow-fluent-8'>
                          {paymentMethodOptions.map(m => (
                            <SelectItem key={m.id} value={m.id} className='text-body-md'>{m.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {isForeign && (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-lg p-md bg-primary/5 rounded-md border border-primary/10'>
                      <div className='space-y-sm'>
                        <Label htmlFor='purchase-exchange-rate' className='text-label-caps uppercase text-primary/60'>
                          {t('purchasePaymentsMvp.registerModal.exchangeRate.label', 'Tipo de Cambio')}
                        </Label>
                        <Input
                          id='purchase-exchange-rate'
                          type='number'
                          step='any'
                          min='0'
                          value={exchangeRate}
                          onChange={e => setExchangeRate(e.target.value)}
                          placeholder='Ej: 7350'
                          required
                          className='rounded-input bg-surface border-primary/20 font-data-mono text-data-mono'
                        />
                      </div>
                      <div className='space-y-sm'>
                        <Label htmlFor='purchase-original-amount' className='text-label-caps uppercase text-primary/60'>
                          {t('purchasePaymentsMvp.registerModal.originalAmount.label', 'Monto Original ({currency})', { currency: currencyCode })}
                        </Label>
                        <Input
                          id='purchase-original-amount'
                          type='number'
                          step='any'
                          min='0'
                          value={originalAmount}
                          onChange={e => setOriginalAmount(e.target.value)}
                          placeholder={t('purchasePaymentsMvp.registerModal.originalAmount.placeholder', 'Monto en moneda extranjera')}
                          required
                          className='rounded-input bg-surface border-primary/20 font-data-mono text-data-mono'
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 2: REGISTRO Y CAJA */}
              <div className='bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden'>
                <div className='px-lg py-md border-b border-border-subtle bg-surface-muted flex items-center gap-md'>
                  <div className='size-7 bg-primary/10 rounded-md flex items-center justify-center text-primary'>
                    <Building size={16} aria-hidden='true' />
                  </div>
                  <h3 className='text-label-caps uppercase text-foreground'>
                    {t('purchasePaymentsMvp.registerModal.section.accounting', 'Registro Contable')}
                  </h3>
                </div>
                <div className='p-lg grid grid-cols-1 md:grid-cols-2 gap-lg'>
                  <div className='space-y-sm'>
                    <Label htmlFor='purchase-reference' className={labelClass}>
                      {t('purchasePaymentsMvp.registerModal.reference.label', 'Referencia')}
                    </Label>
                    <div className='relative'>
                      <Hash className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground' size={14} aria-hidden='true' />
                      <Input
                        id='purchase-reference'
                        value={reference}
                        onChange={e => setReference(e.target.value)}
                        placeholder={t('purchasePaymentsMvp.registerModal.reference.placeholder', 'Ej. número de transacción o comprobante')}
                        className='pl-9 rounded-input bg-surface-muted text-body-md-bold'
                      />
                    </div>
                  </div>
                  <div className='space-y-sm'>
                    <Label htmlFor='purchase-cash-register' className={labelClass}>
                      {t('purchasePaymentsMvp.registerModal.cashRegister.label', 'Caja')}
                    </Label>
                    <Select value={cashRegister} onValueChange={setCashRegister}>
                      <SelectTrigger id='purchase-cash-register' className='rounded-input border-border-subtle bg-surface-muted text-body-md-bold'>
                        <SelectValue placeholder={t('purchasePaymentsMvp.registerModal.cashRegister.placeholder', 'Seleccioná una caja')} />
                      </SelectTrigger>
                      <SelectContent className='bg-surface border-border-subtle shadow-fluent-8 min-w-[300px]'>
                        {cashRegisterOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            <div className='flex flex-col gap-xs py-xs'>
                              <span className='text-body-md-bold text-foreground'>{opt.label}</span>
                              {opt.balanceLabel && (
                                <span className='text-data-mono font-data-mono text-muted-foreground'>{opt.balanceLabel}</span>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {cashRegisterHint && (
                      <p className='flex items-start gap-xs text-label-caps uppercase text-warning mt-xs'>
                        <AlertCircle size={13} className='shrink-0' aria-hidden='true' />
                        <span>{cashRegisterHint}</span>
                      </p>
                    )}
                  </div>
                  <div className='md:col-span-2 space-y-sm'>
                    <Label htmlFor='purchase-notes' className={labelClass}>
                      {t('purchasePaymentsMvp.registerModal.notes.label', 'Notas')}
                    </Label>
                    <Textarea
                      id='purchase-notes'
                      value={notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                      placeholder={t('purchasePaymentsMvp.registerModal.notes.placeholder', 'Observaciones adicionales (opcional)')}
                      rows={2}
                      className='rounded-input bg-surface-muted border-border-subtle'
                    />
                  </div>
                </div>
              </div>

              {formError && (
                <div className='p-md bg-error-container text-on-error-container rounded-md flex items-center gap-md animate-in fade-in duration-150'>
                  <AlertCircle className='text-error shrink-0' size={20} aria-hidden='true' />
                  <span className='text-label-caps uppercase'>{formError}</span>
                </div>
              )}
            </div>

            <footer className='mt-lg flex flex-col sm:flex-row gap-md pt-lg border-t border-border-subtle'>
              <Button type='button' variant='outline' onClick={() => handleDialogChange(false)} className='sm:flex-1'>
                {t('purchasePaymentsMvp.registerModal.cancel', 'Cancelar')}
              </Button>
              <Button type='submit' disabled={isSubmitDisabled} className='sm:flex-[2]'>
                {isSubmitting ? (
                  <div className='flex items-center gap-sm'><Loader2 size={16} className='animate-spin' aria-hidden='true' /> {t('purchasePaymentsMvp.registerModal.loading', 'Registrando pago...')}</div>
                ) : (
                  <div className='flex items-center gap-sm'><CheckCircle2 size={16} aria-hidden='true' /> {t('purchasePaymentsMvp.registerModal.confirm', 'Registrar pago')}</div>
                )}
              </Button>
            </footer>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterPaymentModal
