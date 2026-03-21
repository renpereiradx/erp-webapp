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
import { useToast } from '@/hooks/useToast'
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
  const { error: showError } = useToast()

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
    // Alineado con API v1.1: usar description y method_code
    const label = m.description || m.method_code || m.display_name || m.name || id
    return { id, label }
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
    if (!Number.isFinite(num) || num <= 0) { 
      setAmountError('Monto requerido')
      showError('Por favor ingresa un monto válido mayor a cero')
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
        currencyId: selectedCurrency ? selectedCurrency.currency_id : undefined,
        exchange_rate: exchangeRate ? Number(exchangeRate) : undefined,
        original_amount: originalAmount ? Number(originalAmount) : undefined,
        reference: reference.trim() || null,
        cashRegisterId: (cashRegister && cashRegister !== CASH_REGISTER_NONE_VALUE) ? Number(cashRegister) : undefined,
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
              <header className='mb-10'>
                <div className='size-12 bg-primary/20 rounded-xl flex items-center justify-center text-primary mb-6 ring-1 ring-primary/40 shadow-fluent-8'><Building size={24} /></div>
                <h2 className='text-2xl font-black tracking-tighter uppercase leading-none mb-2'>Registrar Pago <br /><span className='text-primary font-black'>Proveedor</span></h2>
                <div className='flex items-center gap-2 text-white/50 font-black text-[10px] uppercase tracking-widest'><Receipt size={14} className='text-primary' /> Factura #{order?.id || '---'}</div>
              </header>

              <div className='space-y-6 flex-1'>
                <div className='bg-white/5 backdrop-blur-md rounded-xl p-5 border border-white/10'>
                  <div className='flex items-center gap-4 mb-1'>
                    <div className='size-10 bg-white/10 rounded-lg flex items-center justify-center text-white/60 ring-1 ring-white/10 shadow-fluent-2'><User size={18} /></div>
                    <div><p className='text-[9px] font-black uppercase tracking-widest text-white/50 mb-1'>Proveedor</p><p className='text-sm font-bold text-white truncate max-w-[180px]'>{order?.supplierName || 'Empresa'}</p></div>
                  </div>
                </div>

                <div className='space-y-6'>
                  <div>
                    <div className='flex justify-between items-end mb-2'><p className='text-[9px] font-black uppercase tracking-widest text-white/50'>Deuda Pendiente</p><p className='text-2xl font-black text-white tabular-nums font-mono'>{pendingLabel || '0 ₲'}</p></div>
                    <div className='h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner'><div className='h-full bg-primary transition-all duration-1000' style={{ width: `${paymentPercentage}%` }} /></div>
                    <div className='mt-2 text-[9px] font-black uppercase tracking-widest text-primary text-right'>{paymentPercentage}% Cubierto</div>
                  </div>

                  <div className='p-5 bg-primary/10 rounded-xl border border-primary/20 backdrop-blur-sm'>
                    <div className='flex items-center gap-4'>
                      <div className='size-8 bg-primary rounded-lg flex items-center justify-center text-white shadow-fluent-2'><ArrowUpRight size={16} /></div>
                      <div><p className='text-[9px] font-black uppercase tracking-widest text-white/50 mb-1'>Saldo Proyectado</p><p className={cn("text-xl font-black tabular-nums transition-colors font-mono", projectedBalance === 0 ? "text-green-400" : "text-white")}>{formatLocalizedCurrency(projectedBalance, order?.currency)}</p></div>
                    </div>
                  </div>
                </div>
              </div>
              <footer className='mt-10 pt-6 border-t border-white/5 hidden md:block'><p className='text-[9px] text-white/30 uppercase font-black tracking-widest leading-relaxed'>* Verifique los datos de tesorería antes de confirmar.</p></footer>
            </div>
          </div>

          {/* PANEL DERECHO: FORMULARIO */}
          <div className='w-full md:w-[65%] bg-white dark:bg-slate-900 p-6 md:p-12 flex flex-col'>
            <div className='flex-1 space-y-8 md:space-y-12 overflow-y-auto pr-1 md:pr-2 scrollbar-thin'>
              <section className='space-y-8'>
                <div className='flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4'><div className='size-8 bg-slate-50 dark:bg-slate-800 rounded-md flex items-center justify-center text-slate-500'><Coins size={18} /></div><h3 className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]'>Información del Pago</h3></div>

                <div className='space-y-8'>
                  <div className='space-y-3'>
                    <div className='flex flex-wrap items-center justify-between gap-3 px-1'><label htmlFor='purchase-amount' className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]'>Monto a Pagar</label><button type='button' onClick={() => setAmount(formatNumberWithDots(String(getNormalizedPendingAmount(order?.pendingAmount, order?.currency))))} className='text-[9px] font-black uppercase tracking-widest text-primary hover:text-primary-hover hover:bg-primary/10 px-3 py-1.5 bg-primary/5 rounded-md transition-all'>Liquidar Saldo</button></div>
                    <div className='relative'><div className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-xl font-mono uppercase'>₲</div><Input id='purchase-amount' type='text' inputMode='numeric' value={amount} onChange={e => { setAmount(formatNumberWithDots(parseNumberWithDots(e.target.value))); if (amountError) setAmountError(null); }} className='h-12 pl-12 rounded-xl bg-white border-border-subtle font-black font-mono text-xl focus:ring-4 focus:ring-primary/10 transition-all' /></div>
                    {amountError && <p className='text-[10px] font-black uppercase tracking-widest text-error ml-1'>{amountError}</p>}
                  </div>

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'>
                      <label className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1'>Divisa de la Operación</label>
                      <Select value={currencyCode} onValueChange={setCurrencyCode}>
                        <SelectTrigger className='h-11 rounded-xl bg-white dark:bg-slate-800 border-border-subtle font-bold text-sm'><SelectValue /></SelectTrigger>
                        <SelectContent className='rounded-xl border-border-subtle shadow-fluent-16'>
                          {currencySelectorData.map(c => (<SelectItem key={c.id} value={c.code} className='font-bold text-xs uppercase tracking-wider'>{c.code} - {c.name}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className='space-y-2'>
                      <label className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1'>Método de Pago</label>
                      <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                        <SelectTrigger className='h-11 rounded-xl bg-white dark:bg-slate-800 border-border-subtle font-bold text-sm'><SelectValue placeholder='Seleccionar...' /></SelectTrigger>
                        <SelectContent className='rounded-xl border-border-subtle shadow-fluent-16'>
                          {paymentMethodOptions.map(m => (<SelectItem key={m.id} value={m.id} className='font-bold text-xs uppercase tracking-wider'>{m.label}</SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {normalizeCurrencyCode(currencyCode) !== normalizeCurrencyCode(order?.currency || DEFAULT_CURRENCY_CODE) && (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-xl border border-border-subtle shadow-inner'>
                      <div className='space-y-2'>
                        <label className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1'>Tipo de Cambio</label>
                        <Input type='number' step='any' min='0' value={exchangeRate} onChange={e => setExchangeRate(e.target.value)} placeholder='Ej: 7350' className='h-11 rounded-xl bg-white border-border-subtle font-mono font-black' required />
                      </div>
                      <div className='space-y-2'>
                        <label className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1'>Monto Original ({currencyCode})</label>
                        <Input type='number' step='any' min='0' value={originalAmount} onChange={e => setOriginalAmount(e.target.value)} placeholder='Monto en moneda extranjera' className='h-11 rounded-xl bg-white border-border-subtle font-mono font-black' required />
                      </div>
                    </div>
                  )}

                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='space-y-2'><label htmlFor='purchase-reference' className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1'>N° Referencia / Comprobante</label><div className='relative'><Hash className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={14} /><Input id='purchase-reference' value={reference} onChange={e => setReference(e.target.value)} placeholder='Opcional...' className='h-11 pl-9 rounded-xl bg-white border-border-subtle font-bold text-sm' /></div></div>
                    <div className='space-y-2'>
                      <label className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1'>Caja Registradora</label>
                      <Select value={cashRegister} onValueChange={setCashRegister}>
                        <SelectTrigger className='h-11 rounded-xl bg-white dark:bg-slate-800 border-border-subtle font-bold text-sm'><SelectValue placeholder='Seleccionar...' /></SelectTrigger>
                        <SelectContent className='rounded-xl border-border-subtle shadow-fluent-16 min-w-[300px]'>
                          <SelectItem value={CASH_REGISTER_NONE_VALUE} className='font-black text-[10px] uppercase tracking-widest text-slate-400 py-3'>Sin Caja Asignada</SelectItem>
                          {cashRegisterOptions.map(opt => (<SelectItem key={opt.value} value={opt.value} className='py-4 border-b border-slate-50 last:border-none'><div className='flex flex-col gap-1'><span className='font-black text-[11px] uppercase tracking-tight'>{opt.label}</span><div className='flex items-center gap-2 text-[10px] font-bold text-text-secondary font-mono'>{opt.balanceLabel}</div></div></SelectItem>))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className='space-y-2 pt-4'><label htmlFor='purchase-notes' className='text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] px-1'>Observaciones Internas</label><Textarea id='purchase-notes' value={notes} onChange={e => setNotes(e.target.value)} placeholder='Detalles operativos...' rows={2} className='rounded-xl bg-white border-border-subtle text-sm p-4 resize-none font-medium' /></div>
                </div>
              </section>
              {formError && (<div className='p-5 bg-error/5 border border-error/20 rounded-xl flex items-center gap-4'><AlertCircle className="text-error" size={20} /><span className='text-[10px] font-black uppercase tracking-widest text-error leading-relaxed'>{formError}</span></div>)}
            </div>

            <footer className='mt-10 flex flex-col sm:flex-row gap-4 pt-10 border-t border-border-subtle'>
              <Button type='button' variant='outline' onClick={() => handleDialogChange(false)} className='w-full sm:flex-1 h-12 rounded-xl font-black uppercase text-[10px] tracking-widest border-border-subtle hover:bg-slate-50 transition-all'>Cancelar</Button>
              <Button type='submit' disabled={isSubmitDisabled} className='w-full sm:flex-[2] h-12 rounded-xl bg-primary hover:bg-primary-hover text-white font-black uppercase text-[10px] tracking-widest shadow-fluent-8 transition-all active:scale-[0.98]'>{isSubmitting ? (<div className='flex items-center gap-2'><Loader2 size={16} className='animate-spin' /> Procesando...</div>) : (<div className='flex items-center gap-2'><CheckCircle2 size={16} /> Registrar Pago</div>)}</Button>
            </footer>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterPaymentModal
