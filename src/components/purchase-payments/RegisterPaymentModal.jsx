import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Loader2,
  Wallet,
  Receipt,
  ArrowRight,
  Coins,
  Banknote,
  ArrowUpRight,
  User,
  Hash,
  ChevronRight,
  CreditCard,
  Building
} from 'lucide-react'

import { useI18n } from '@/lib/i18n'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { calculateCashRegisterBalance } from '@/utils/cashRegisterUtils'
import { normalizeCurrencyCode, formatPYG } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'

const DEFAULT_CURRENCY_CODE = 'PYG'
const CASH_REGISTER_NONE_VALUE = '__none__'

const getNormalizedPendingAmount = (pendingAmount, currencyCode) => {
  if (pendingAmount === null || pendingAmount === undefined) return null
  const raw = Number(pendingAmount)
  if (!Number.isFinite(raw)) return null
  const code = normalizeCurrencyCode(currencyCode)
  if (code === 'PYG') return Math.round(raw)
  return Math.round(raw * 100) / 100
}

const RegisterPaymentModal = ({ open, onOpenChange, order, onSubmit }) => {
  const { t, lang } = useI18n()

  const [amount, setAmount] = useState('')
  const [exchangeRate, setExchangeRate] = useState('')
  const [originalAmount, setOriginalAmount] = useState('')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [currencyCode, setCurrencyCode] = useState((order?.currency || DEFAULT_CURRENCY_CODE).toUpperCase())
  const [cashRegister, setCashRegister] = useState('')
  const [amountError, setAmountError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setSubmitting] = useState(false)
  const [cashRegisters, setCashRegisters] = useState([])
  const [isCashRegistersLoading, setCashRegistersLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [currencies, setCurrencies] = useState([])

  const formatNumberWithDots = useCallback(value => {
    if (!value) return ''
    const numericValue = value.toString().replace(/\D/g, '')
    if (!numericValue) return ''
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }, [])

  const parseNumberWithDots = useCallback(value => {
    if (!value) return ''
    return value.toString().replace(/\./g, '')
  }, [])

  const resetForm = useCallback(() => {
    setAmount(''); setExchangeRate(''); setOriginalAmount(''); setReference(''); setNotes(''); setPaymentMethodId('');
    setCurrencyCode((order?.currency || DEFAULT_CURRENCY_CODE).toUpperCase());
    setCashRegister(''); setAmountError(null); setFormError(null); setSubmitting(false);
  }, [order?.currency])

  useEffect(() => { if (open) resetForm() }, [open, resetForm])

  const handleDialogChange = nextOpen => {
    if (!nextOpen) resetForm()
    if (onOpenChange) onOpenChange(nextOpen)
  }

  const formatLocalizedCurrency = useCallback((value, currencyCode = 'PYG') => {
    const code = normalizeCurrencyCode(currencyCode)
    if (code === 'PYG') {
      return formatPYG(Number(value || 0));
    }
    const formatter = new Intl.NumberFormat('es-PY', {
      style: 'currency', currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return formatter.format(Number(value || 0))
  }, [])

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

      const validMethods = Array.isArray(methods) ? methods : (methods?.data || [])
      setPaymentMethods(validMethods)
      if (validMethods.length > 0) {
        const def = validMethods.find(m => m.is_default) || validMethods[0]
        setPaymentMethodId(curr => curr || String(def.id || def.payment_method_id))
      }

      setCurrencies(Array.isArray(currencyList) ? currencyList : [])
      
      const [allRegs, activeReg] = registersData
      const openRegs = Array.isArray(allRegs) ? allRegs.filter(cr => (cr?.status || cr?.state || '').toUpperCase() === 'OPEN') : []
      setCashRegisters(openRegs)
      if (activeReg?.id) setCashRegister(c => c || String(activeReg.id))
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
    return { id, label: m.display_name || m.name || m.method_name || id }
  }).filter(o => o.id !== 'undefined'), [paymentMethods])

  const cashRegisterOptions = useMemo(() => cashRegisters.map(cr => ({
    value: String(cr.id),
    label: cr.name || `Caja #${cr.id}`,
    balanceLabel: typeof cr.current_balance === 'number' ? formatLocalizedCurrency(cr.current_balance, cr.currency) : null
  })), [cashRegisters, formatLocalizedCurrency])

  const isSubmitDisabled = !order || isSubmitting || !paymentMethodId || !currencyCode || !!amountError || !amount

  const handleSubmit = async event => {
    event.preventDefault()
    if (!order) return
    const num = Number.parseFloat(parseNumberWithDots(amount))
    if (!Number.isFinite(num) || num <= 0) { setAmountError('Monto requerido'); return }
    
    setSubmitting(true)
    try {
      const selectedCurrency = currencySelectorData.find(c => c.code === String(currencyCode).toUpperCase())
      
      await onSubmit({
        orderId: order.id, 
        amount: Number(num.toFixed(2)),
        paymentMethodId: Number(paymentMethodId),
        currencyCode: String(currencyCode).toUpperCase(),
        currencyId: selectedCurrency ? selectedCurrency.currency_id : undefined,
        exchange_rate: exchangeRate ? Number(exchangeRate) : undefined,
        original_amount: originalAmount ? Number(originalAmount) : undefined,
        reference: reference.trim() || null,
        cashRegisterId: cashRegister ? Number(cashRegister) : undefined,
        notes: notes.trim() || null,
      })
      resetForm(); handleDialogChange(false)
    } catch (e) { setFormError(e?.message || 'Error al registrar') } finally { setSubmitting(false) }
  }

  const paymentPercentage = useMemo(() => !order || !order.pendingAmount ? 0 : Math.min(100, Math.round((numericAmount / Number(order.pendingAmount)) * 100)), [order, numericAmount])

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className='register-payment-modal w-[95vw] lg:!w-[1150px] lg:!max-w-[calc(95vw-288px)] p-0 overflow-hidden border border-slate-200 shadow-xl rounded-xl'>
        <DialogTitle className='sr-only'>Registrar Pago Proveedor</DialogTitle>
        <DialogDescription className='sr-only'>Registre el pago a un proveedor para la factura correspondiente.</DialogDescription>
        <form onSubmit={handleSubmit} className='flex flex-col md:flex-row h-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto md:overflow-hidden'>
          {/* PANEL IZQUIERDO: RESUMEN */}
          <div className='w-full md:w-[35%] bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 text-white p-6 md:p-10 flex flex-col relative overflow-hidden'>
            <div className='relative z-10 flex flex-col h-full'>
              <header className='mb-6'>
                <div className='size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary mb-4 ring-1 ring-primary/40'><Building size={20} /></div>
                <h2 className='text-xl md:text-2xl font-bold tracking-tight leading-tight mb-1.5'>Registrar Pago <br /><span className='text-primary'>Proveedor</span></h2>
                <div className='flex items-center gap-2 text-white/70 font-medium text-xs'><Receipt size={14} className='text-primary' /> Factura #{order?.id || '---'}</div>
              </header>

              <div className='space-y-4 md:space-y-6 flex-1'>
                <div className='bg-white/5 backdrop-blur-md rounded-lg p-4 md:p-5 border border-white/10'>
                  <div className='flex items-center gap-3 md:gap-4 mb-1'>
                    <div className='size-9 md:size-10 bg-white/10 rounded-md flex items-center justify-center text-white/60 ring-1 ring-white/10'><User size={18} /></div>
                    <div><p className='text-xs font-medium text-white/70 mb-0.5'>Proveedor</p><p className='text-sm font-semibold text-white truncate max-w-[180px]'>{order?.supplierName || 'Empresa'}</p></div>
                  </div>
                </div>

                <div className='space-y-4 md:space-y-5'>
                  <div>
                    <div className='flex justify-between items-end mb-1'><p className='text-xs font-medium text-white/70'>Deuda Pendiente</p><p className='text-xl md:text-2xl font-bold text-white tabular-nums'>{pendingLabel || '0 PYG'}</p></div>
                    <div className='h-1.5 bg-slate-800 rounded-full overflow-hidden'><div className='h-full bg-primary transition-all duration-700' style={{ width: `${paymentPercentage}%` }} /></div>
                    <div className='mt-1.5 text-xs font-medium text-primary text-right'>{paymentPercentage}% Cubierto</div>
                  </div>

                  <div className='p-4 md:p-5 bg-primary/5 rounded-lg border border-primary/10 backdrop-blur-sm'>
                    <div className='flex items-center gap-3 md:gap-4'>
                      <div className='size-7 md:size-8 bg-primary rounded-md flex items-center justify-center text-white'><ArrowUpRight size={16} /></div>
                      <div><p className='text-xs font-medium text-white/70 leading-none mb-1'>Saldo Proyectado</p><p className={cn("text-base md:text-lg font-bold tabular-nums transition-colors leading-none", projectedBalance === 0 ? "text-green-400" : "text-white")}>{formatLocalizedCurrency(projectedBalance, order?.currency)}</p></div>
                    </div>
                  </div>
                </div>
              </div>
              <footer className='mt-6 pt-4 border-t border-white/5 hidden md:block'><p className='text-xs text-white/50 italic'>* Verifique los datos de tesorería antes de confirmar.</p></footer>
            </div>
          </div>

          {/* PANEL DERECHO: FORMULARIO */}
          <div className='w-full md:w-[65%] bg-white dark:bg-slate-900 p-6 md:p-12 flex flex-col'>
            <div className='flex-1 space-y-6 md:space-y-10 overflow-y-auto pr-1 md:pr-2 scrollbar-thin'>
              <section className='space-y-6 md:space-y-8'>
                <div className='flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4'><div className='size-8 bg-slate-50 dark:bg-slate-800 rounded-md flex items-center justify-center text-slate-500'><Coins size={18} /></div><h3 className='text-sm font-semibold text-slate-700'>Información del Pago</h3></div>

                <div className='space-y-6 md:space-y-8'>
                  <div className='space-y-3'>
                    <div className='flex flex-wrap items-center gap-3 md:gap-6 px-1'><label htmlFor='purchase-amount' className='text-sm font-medium text-slate-700'>Monto a Pagar</label><button type='button' onClick={() => setAmount(formatNumberWithDots(String(getNormalizedPendingAmount(order?.pendingAmount, order?.currency))))} className='text-xs font-medium text-primary hover:text-primary-hover hover:bg-primary/10 px-2 md:px-3 py-1 bg-primary/5 rounded-md transition-all'>Cobrar todo el saldo</button></div>
                    <div className='relative'><div className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg'>₲</div><Input id='purchase-amount' type='text' inputMode='numeric' value={amount} onChange={e => { setAmount(formatNumberWithDots(parseNumberWithDots(e.target.value))); if (amountError) setAmountError(null); }} className='h-10 pl-11 rounded-md bg-white border-slate-400 font-medium text-base focus:ring-2 focus:ring-primary/20' /></div>
                    {amountError && <p className='text-xs font-medium text-rose-500 ml-1'>{amountError}</p>}
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8'>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-slate-700 px-1'>Divisa de la Operación</label>
                      <Select value={currencyCode} onValueChange={setCurrencyCode}>
                        <SelectTrigger className='h-10 rounded-md bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-700 text-sm font-medium w-full'><SelectValue /></SelectTrigger>
                        <SelectContent className='!bg-white dark:!bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-[9999] rounded-md'>
                          {currencySelectorData.map(c => (<SelectItem key={c.id} value={c.code} className='text-sm font-medium py-2 hover:!bg-slate-50 dark:hover:!bg-slate-800'>{c.code} - {c.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-slate-700 px-1'>Método de Pago</label>
                      <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                        <SelectTrigger className='h-10 rounded-md bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-700 text-sm font-medium w-full'><SelectValue placeholder='Seleccionar...' /></SelectTrigger>
                        <SelectContent className='!bg-white dark:!bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-[9999] rounded-md'>
                          {paymentMethodOptions.map(m => (<SelectItem key={m.id} value={m.id} className='text-sm font-medium py-2 hover:!bg-slate-50 dark:hover:!bg-slate-800'>{m.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {currencyCode !== (order?.currency || DEFAULT_CURRENCY_CODE).toUpperCase() && (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 p-4 bg-slate-50 rounded-md border border-slate-200'>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-slate-700 px-1'>Tipo de Cambio</label>
                        <Input type='number' step='any' min='0' value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} placeholder='Ej: 7350' className='h-10 rounded-md bg-white border-slate-400 text-sm' required />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-sm font-medium text-slate-700 px-1'>Monto Original ({currencyCode})</label>
                        <Input type='number' step='any' min='0' value={originalAmount} onChange={e => setOriginalAmount(e.target.value)} placeholder='Monto en moneda extranjera' className='h-10 rounded-md bg-white border-slate-400 text-sm' required />
                      </div>
                    </div>
                  )}

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8'>
                    <div className='space-y-2'><label htmlFor='purchase-reference' className='text-sm font-medium text-slate-700 px-1'>N° Referencia / Comprobante</label><div className='relative'><Hash className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={14} /><Input id='purchase-reference' value={reference} onChange={e => setReference(e.target.value)} placeholder='Opcional...' className='h-10 pl-9 rounded-md bg-white border-slate-400 text-sm' /></div></div>
                    <div className='space-y-2'>
                      <label className='text-sm font-medium text-slate-700 px-1'>Caja Registradora</label>
                      <Select value={cashRegister} onValueChange={setCashRegister}>
                        <SelectTrigger className='h-10 rounded-md bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-700 text-sm font-medium w-full'><SelectValue placeholder='Seleccionar...' /></SelectTrigger>
                        <SelectContent className='!bg-white dark:!bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-[9999] min-w-[280px] max-w-[90vw] rounded-md'>
                          <SelectItem value={CASH_REGISTER_NONE_VALUE} className='font-medium text-sm py-2 hover:!bg-slate-50 dark:hover:!bg-slate-800'>Sin Caja Asignada</SelectItem>
                          {cashRegisterOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className='py-3 border-b border-slate-50 dark:border-slate-800 last:border-none hover:!bg-slate-50 dark:hover:!bg-slate-800'><div className='flex flex-col gap-0.5'><span className='font-medium text-sm'>{opt.label}</span><div className='flex items-center gap-2 text-xs font-medium text-slate-500'>{opt.balanceLabel}</div></div></SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className='space-y-2'><label htmlFor='purchase-notes' className='text-sm font-medium text-slate-700 px-1'>Observaciones Internas</label><Textarea id='purchase-notes' value={notes} onChange={e => setNotes(e.target.value)} placeholder='Añadir notas...' rows={2} className='rounded-md bg-white border-slate-400 text-sm p-3 md:p-4 resize-none' /></div>
                </div>
              </section>
              {formError && (<div className='p-4 bg-rose-50 border border-rose-100 rounded-md text-rose-600 text-sm font-medium flex items-center gap-3'><AlertCircle size={16} /><span>{formError}</span></div>)}
            </div>

            <footer className='mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 md:gap-4 pt-6 md:pt-8 border-t border-slate-200 dark:border-slate-800'>
              <Button type='button' variant='outline' onClick={() => handleDialogChange(false)} className='w-full sm:flex-1 h-10 rounded-md font-medium text-sm border-slate-400 hover:bg-slate-50 transition-all'>Cancelar</Button>
              <Button type='submit' disabled={isSubmitDisabled} className='w-full sm:flex-[2] h-10 rounded-md bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-all active:scale-[0.98]'>{isSubmitting ? (<div className='flex items-center gap-2'><Loader2 size={16} className='animate-spin' /> Procesando...</div>) : (<div className='flex items-center gap-2'><CheckCircle2 size={16} /> Registrar Pago</div>)}</Button>
            </footer>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterPaymentModal
