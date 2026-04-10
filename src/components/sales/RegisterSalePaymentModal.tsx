import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  Receipt, 
  Coins, 
  ArrowUpRight,
  User,
  Building,
} from 'lucide-react'
import { cn } from '@/lib/utils'

import { useI18n } from '@/lib/i18n'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
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
import { normalizeCurrencyCode, formatPYG } from '@/utils/currencyUtils'

const DEFAULT_CURRENCY_CODE = 'PYG'
const CASH_REGISTER_NONE_VALUE = '__none__'

const getNormalizedBalanceDue = (balanceDue: any, currency: any) => {
  if (balanceDue === null || balanceDue === undefined) return null
  const raw = Number(balanceDue)
  if (!Number.isFinite(raw)) return null
  const code = normalizeCurrencyCode(currency)
  if (code === 'PYG') return Math.round(raw)
  return Math.round(raw * 100) / 100
}

interface RegisterSalePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: any;
  onSubmit: (data: any) => Promise<void>;
}

const RegisterSalePaymentModal = ({ open, onOpenChange, sale, onSubmit }: RegisterSalePaymentModalProps) => {
  const { lang } = useI18n()

  const [amountReceived, setAmountReceived] = useState<string | number>('')
  const [amountToApply, setAmountToApply] = useState<string | number>('')
  const [exchangeRate, setExchangeRate] = useState<string | number>('')
  const [originalAmount, setOriginalAmount] = useState<string | number>('')
  const [notes, setNotes] = useState<string>('')
  const [paymentMethodId, setPaymentMethodId] = useState<string>('')
  const [currencyCode, setCurrencyCode] = useState<string>((sale?.currency || DEFAULT_CURRENCY_CODE).toUpperCase())
  const [cashRegisterId, setCashRegisterId] = useState<string>('')

  const userEditedAmountToApply = useRef<boolean>(false)

  const [amountReceivedError, setAmountReceivedError] = useState<string | null>(null)
  const [amountToApplyError, setAmountToApplyError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState<boolean>(false)

  const [cashRegisters, setCashRegisters] = useState<any[]>([])
  const [isCashRegistersLoading, setCashRegistersLoading] = useState<boolean>(false)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])

  const resetForm = useCallback(() => {
    setAmountReceived('')
    setAmountToApply('')
    setExchangeRate('')
    setOriginalAmount('')
    setNotes('')
    setPaymentMethodId('')
    setCurrencyCode((sale?.currency || DEFAULT_CURRENCY_CODE).toUpperCase())
    setCashRegisterId('')
    setAmountReceivedError(null)
    setAmountToApplyError(null)
    setFormError(null)
    setSubmitting(false)
    userEditedAmountToApply.current = false
  }, [sale?.currency])

  useEffect(() => { if (open) resetForm() }, [open, resetForm])

  const handleDialogChange = nextOpen => {
    if (!nextOpen) resetForm()
    if (onOpenChange) onOpenChange(nextOpen)
  }

  const formatLocalizedCurrency = useCallback((value, currencyCode = 'PYG') => {
    const code = normalizeCurrencyCode(currencyCode || sale?.currency)
    if (code === 'PYG') {
      return formatPYG(Number(value || 0));
    }
    const formatter = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
      style: 'currency', currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return formatter.format(Number(value || 0))
  }, [lang, sale?.currency])

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

  const loadData = useCallback(async () => {
    setCashRegistersLoading(true)
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
      const openRegs = Array.isArray(allRegs) ? allRegs.filter(cr => {
        const s = (cr?.status || cr?.state || '').toUpperCase()
        return s === 'OPEN' || s === 'ACTIVE'
      }) : []
      setCashRegisters(openRegs)
      if (activeReg?.id) setCashRegisterId(c => c || String(activeReg.id))
    } catch (e) { console.error('Error loading modal data:', e) }
    finally { setCashRegistersLoading(false) }
  }, [])

  useEffect(() => { if (open) loadData() }, [loadData, open])

  const currencySelectorData = useMemo(() => {
    if (currencies.length) return currencies.map(c => ({ id: c.currency_code, code: c.currency_code, name: c.currency_name, currency_id: c.id }))
    const fb = (sale?.currency || DEFAULT_CURRENCY_CODE).toUpperCase()
    return [{ id: fb, code: fb, name: fb, currency_id: null }]
  }, [currencies, sale?.currency])

  const paymentMethodOptions = useMemo(() => paymentMethods.map(m => {
    const id = String(m.id || m.payment_method_id)
    // Alineado con API v1.1: usar description y method_code
    const label = m.description || m.method_code || m.display_name || m.name || id
    return { id, label }
  }).filter(o => o.id !== 'undefined'), [paymentMethods])

  const validationErrors = useMemo(() => {
    const errors: { amountReceived: string | null, amountToApply: string | null, hasErrors: boolean } = { amountReceived: null, amountToApply: null, hasErrors: false }
    if (!sale) return errors

    if (amountReceived) {
      const numericReceived = Number.parseFloat(parseNumberWithDots(amountReceived))
      if (!Number.isFinite(numericReceived) || numericReceived <= 0) {
        errors.amountReceived = 'Monto inválido'
        errors.hasErrors = true
      }
    }

    if (amountToApply && amountReceived) {
      const numericReceived = Number.parseFloat(parseNumberWithDots(amountReceived))
      const numericToApply = Number.parseFloat(parseNumberWithDots(amountToApply))
      const balanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency)

      if (!Number.isFinite(numericToApply) || numericToApply <= 0) {
        errors.amountToApply = 'Monto inválido'
        errors.hasErrors = true
      } else if (numericToApply > numericReceived) {
        errors.amountToApply = 'Excede el recibido'
        errors.hasErrors = true
      } else if (balanceDue !== null && numericToApply > balanceDue) {
        errors.amountToApply = 'Excede la deuda'
        errors.hasErrors = true
      }
    }
    return errors
  }, [amountReceived, amountToApply, sale, parseNumberWithDots])

  const change = useMemo(() => {
    const received = Number.parseFloat(parseNumberWithDots(amountReceived)) || 0
    const toApply = Number.parseFloat(parseNumberWithDots(amountToApply)) || 0
    return Math.max(0, received - toApply)
  }, [amountReceived, amountToApply, parseNumberWithDots])

  const projectedBalance = useMemo(() => {
    if (!sale) return 0
    const balanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency) || 0
    const toApply = Number.parseFloat(parseNumberWithDots(amountToApply)) || 0
    return Math.max(0, balanceDue - toApply)
  }, [sale, amountToApply, parseNumberWithDots])

  const cashRegisterOptions = useMemo(() => cashRegisters.map(cr => ({
    value: String(cr.id),
    label: cr.name || cr.description || `Caja #${cr.id}`,
    balanceLabel: typeof cr.current_balance === 'number' ? formatLocalizedCurrency(cr.current_balance, cr.currency) : null,
    meta: cr.location || cr.branch_name || null
  })), [cashRegisters, formatLocalizedCurrency])

  const isSubmitDisabled = !sale || isSubmitting || isCashRegistersLoading || validationErrors.hasErrors || !amountReceived || !amountToApply || !paymentMethodId

  const handleSubmit = async event => {
    event.preventDefault()
    if (!sale) return
    const numericAmountReceived = Number.parseFloat(parseNumberWithDots(amountReceived))
    const numericAmountToApply = Number.parseFloat(parseNumberWithDots(amountToApply)) || numericAmountReceived
    
    setSubmitting(true)
    try {
      const selectedCurrency = currencySelectorData.find(c => c.code === String(currencyCode).toUpperCase())
      
      await onSubmit({
        sales_order_id: sale.id || sale.sale_id,
        amount_received: Number(numericAmountReceived.toFixed(2)),
        amount_to_apply: Number(numericAmountToApply.toFixed(2)),
        payment_method_id: Number(paymentMethodId),
        currency_id: selectedCurrency ? selectedCurrency.currency_id : undefined,
        exchange_rate: exchangeRate ? Number(exchangeRate) : undefined,
        original_amount: originalAmount ? Number(originalAmount) : undefined,
        cash_register_id: cashRegisterId ? Number(cashRegisterId) : undefined,
        payment_notes: notes.trim() || null,
      })
      resetForm()
      handleDialogChange(false)
    } catch (error) {
      setFormError(error?.message || 'Error al registrar')
    } finally {
      setSubmitting(false)
    }
  }

  const balanceDueLabel = useMemo(() => sale ? formatLocalizedCurrency(sale.balance_due, sale.currency) : null, [formatLocalizedCurrency, sale])

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className='register-sale-payment-modal w-[95vw] lg:!w-[1100px] lg:!max-w-[calc(95vw-288px)] p-0 overflow-hidden border border-border-subtle shadow-fluent-16 rounded-xl bg-surface'>
        <DialogTitle className='sr-only'>Registrar Cobro de Venta</DialogTitle>
        <DialogDescription className='sr-only'>Registre el cobro de la venta seleccionada.</DialogDescription>
        <form className='flex flex-col md:flex-row h-full max-h-[95vh] md:max-h-[90vh] overflow-hidden' onSubmit={handleSubmit}>
          {/* PANEL IZQUIERDO: RESUMEN OPERATIVO */}
          <div className='w-full md:w-[32%] bg-[#001a33] text-white p-8 md:p-10 flex flex-col relative overflow-hidden border-r border-white/5'>
            {/* Elementos decorativos Fluent */}
            <div className='absolute -top-24 -right-24 size-64 bg-primary/10 rounded-full blur-3xl opacity-50' />
            <div className='absolute -bottom-24 -left-24 size-64 bg-primary/5 rounded-full blur-3xl opacity-30' />
            
            <div className='relative z-10 flex flex-col h-full'>
              <header className='mb-12'>
                <div className='size-12 bg-primary rounded-xl flex items-center justify-center text-white mb-6 shadow-lg shadow-primary/30'>
                  <Building size={24} />
                </div>
                <h2 className='text-3xl font-black tracking-tighter uppercase leading-[0.85] mb-3'>
                  Estado de <br />
                  <span className='text-primary'>Cobro</span>
                </h2>
                <div className='inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-white/50 font-black text-[9px] uppercase tracking-widest'>
                  <Receipt size={12} className='text-primary' /> Venta #{sale?.id || sale?.sale_id || '---'}
                </div>
              </header>

              {/* FLUJO DE SALDOS: Entrada -> Operación -> Salida */}
              <div className='flex-1 flex flex-col gap-8'>
                {/* 1. Estado Actual */}
                <div className='relative pl-6 border-l-2 border-white/10'>
                  <div className='absolute -left-[9px] top-0 size-4 rounded-full bg-[#001a33] border-2 border-white/20' />
                  <p className='text-[10px] font-black uppercase tracking-widest text-white/40 mb-1'>Saldo Inicial</p>
                  <p className='text-2xl font-black text-white tabular-nums font-mono'>{balanceDueLabel || formatLocalizedCurrency(0)}</p>
                </div>

                {/* 2. Operación (Barra de progreso integrada) */}
                <div className='bg-white/5 backdrop-blur-md rounded-xl p-6 border border-white/10 shadow-fluent-2'>
                  <div className='flex justify-between items-center mb-4'>
                    <p className='text-[10px] font-black uppercase tracking-widest text-primary'>Aplicando Pago</p>
                    <span className='text-xs font-black text-white bg-primary/20 px-2 py-0.5 rounded'>
                      {Math.round((Number.parseFloat(parseNumberWithDots(amountToApply)) || 0) / (getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 1) * 100)}%
                    </span>
                  </div>
                  <div className='h-2 bg-white/5 rounded-full overflow-hidden mb-4'>
                    <div 
                      className='h-full bg-primary shadow-[0_0_12px_rgba(19,127,236,0.5)] transition-all duration-1000' 
                      style={{ width: `${Math.min(100, Math.round((Number.parseFloat(parseNumberWithDots(amountToApply)) || 0) / (getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 1) * 100))}%` }}
                    />
                  </div>
                  <div className='flex items-center gap-3'>
                    <div className='size-8 rounded-full bg-white/10 flex items-center justify-center text-white/60'>
                      <User size={14} />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-[9px] font-black uppercase text-white/30 truncate'>Cliente</p>
                      <p className='text-xs font-bold text-white truncate'>{sale?.client_name || 'Consumidor Final'}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Resultado Final */}
                <div className='relative pl-6 border-l-2 border-primary/30'>
                  <div className='absolute -left-[9px] top-0 size-4 rounded-full bg-primary shadow-[0_0_8px_rgba(19,127,236,0.5)]' />
                  <p className='text-[10px] font-black uppercase tracking-widest text-primary mb-1'>Nuevo Saldo</p>
                  <p className={cn(
                    "text-3xl font-black tabular-nums transition-colors font-mono tracking-tighter",
                    projectedBalance <= 0 ? "text-success" : "text-white"
                  )}>
                    {formatLocalizedCurrency(projectedBalance)}
                  </p>
                </div>
              </div>

              <footer className='mt-12 pt-8 border-t border-white/5 hidden md:block opacity-30'>
                <p className='text-[9px] uppercase font-black tracking-[0.2em] leading-relaxed'>
                  SISTEMA DE GESTIÓN OPERATIVA <br /> FLUENT ERP v2.0
                </p>
              </footer>
            </div>
          </div>

          {/* PANEL DERECHO: FORMULARIO ESTRUCTURADO */}
          <div className='w-full md:w-[68%] bg-[#f8fafc] p-6 md:p-10 flex flex-col'>
            <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6'>
              
              {/* SECCIÓN 1: ORIGEN Y MONEDA (CARD) */}
              <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
                <div className='px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3'>
                  <div className='size-7 bg-primary/10 rounded flex items-center justify-center text-primary'>
                    <Coins size={16} />
                  </div>
                  <h3 className='text-[11px] font-black uppercase text-slate-500 tracking-widest'>Origen de Fondos</h3>
                </div>
                <div className='p-6 space-y-6'>
                  <div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
                    {/* Monto Recibido - Principal */}
                    <div className='md:col-span-7 space-y-2'>
                      <div className='flex justify-between items-center'>
                        <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>Importe Entregado</label>
                        <button 
                          type='button' 
                          onClick={() => {
                            const balanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency)
                            if (balanceDue !== null) {
                              setAmountReceived(formatNumberWithDots(String(balanceDue)))
                              setAmountToApply(formatNumberWithDots(String(balanceDue)))
                              userEditedAmountToApply.current = false
                            }
                          }}
                          className='text-[9px] font-black uppercase text-primary hover:underline'
                        >
                          Cubrir Saldo Total
                        </button>
                      </div>
                      <div className='relative group'>
                        <div className='absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 font-black text-xl font-mono'>₲</div>
                        <Input
                          type='text'
                          inputMode='numeric'
                          value={amountReceived}
                          onChange={e => {
                            const val = formatNumberWithDots(parseNumberWithDots(e.target.value))
                            setAmountReceived(val)
                            if (!userEditedAmountToApply.current) {
                              const balanceDue = getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 0
                              const numeric = Number.parseFloat(parseNumberWithDots(val)) || 0
                              setAmountToApply(formatNumberWithDots(String(Math.round(Math.min(numeric, balanceDue)))))
                            }
                          }}
                          className='h-14 pl-12 rounded-lg bg-slate-50/50 border-slate-200 font-black font-mono text-2xl focus:ring-primary focus:bg-white transition-all shadow-inner'
                        />
                      </div>
                    </div>

                    {/* Divisa */}
                    <div className='md:col-span-5 space-y-2'>
                      <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>Divisa</label>
                      <Select value={currencyCode} onValueChange={setCurrencyCode}>
                        <SelectTrigger className='h-14 rounded-lg bg-slate-50/50 border-slate-200 font-bold text-sm'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className='rounded-xl border-slate-200 shadow-fluent-16'>
                          {currencySelectorData.map(c => (
                            <SelectItem key={c.id} value={c.code} className='font-bold text-xs uppercase py-3'>{c.code} - {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Configuración de Cambio (Solo si divisa != base) */}
                  {normalizeCurrencyCode(currencyCode) !== normalizeCurrencyCode(sale?.currency || DEFAULT_CURRENCY_CODE) && (
                    <div className='grid grid-cols-2 gap-6 p-5 bg-primary/5 rounded-lg border border-primary/10 animate-in fade-in zoom-in-95 duration-300'>
                      <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-primary/60 tracking-widest'>Tasa de Cambio</label>
                        <Input 
                          type='number' 
                          step='any' 
                          value={exchangeRate} 
                          onChange={e => setExchangeRate(e.target.value)} 
                          className='h-10 rounded-md bg-white border-primary/20 font-mono font-black text-primary' 
                        />
                      </div>
                      <div className='space-y-1.5'>
                        <label className='text-[9px] font-black uppercase text-primary/60 tracking-widest'>Equivalente ({currencyCode})</label>
                        <Input 
                          type='number' 
                          step='any' 
                          value={originalAmount} 
                          onChange={e => setOriginalAmount(e.target.value)} 
                          className='h-10 rounded-md bg-white border-primary/20 font-mono font-black text-primary' 
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 2: REGISTRO Y CAJA (CARD) */}
              <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
                <div className='px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3'>
                  <div className='size-7 bg-primary/10 rounded flex items-center justify-center text-primary'>
                    <Building size={16} />
                  </div>
                  <h3 className='text-[11px] font-black uppercase text-slate-500 tracking-widest'>Registro Contable</h3>
                </div>
                <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>Método de Pago</label>
                    <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
                      <SelectTrigger className='h-12 rounded-lg bg-slate-50/50 border-slate-200 font-bold text-sm'>
                        <SelectValue placeholder='Seleccionar...' />
                      </SelectTrigger>
                      <SelectContent className='rounded-xl border-slate-200 shadow-fluent-16'>
                        {paymentMethodOptions.map(m => (
                          <SelectItem key={m.id} value={m.id} className='font-bold text-xs uppercase py-3'>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-2'>
                    <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>Caja Operativa</label>
                    <Select value={cashRegisterId || CASH_REGISTER_NONE_VALUE} onValueChange={v => setCashRegisterId(v === CASH_REGISTER_NONE_VALUE ? '' : v)}>
                      <SelectTrigger className='h-12 rounded-lg bg-slate-50/50 border-slate-200 font-bold text-sm'>
                        <SelectValue placeholder='Seleccionar caja...' />
                      </SelectTrigger>
                      <SelectContent className='rounded-xl border-slate-200 shadow-fluent-16 min-w-[300px]'>
                        <SelectItem value={CASH_REGISTER_NONE_VALUE} className='font-black text-[10px] uppercase text-slate-400 py-4'>Sin Caja</SelectItem>
                        {cashRegisterOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} className='py-4 border-b border-slate-50 last:border-none'>
                            <div className='flex flex-col gap-1'>
                              <span className='font-black text-[11px] uppercase text-text-main'>{opt.label}</span>
                              <div className='text-[10px] font-bold text-text-secondary font-mono bg-slate-100 px-2 py-0.5 rounded-md w-fit'>{opt.balanceLabel}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: RESULTADO Y APLICACIÓN (PROMINENTE) */}
              <div className='bg-white rounded-xl border border-primary/20 shadow-md overflow-hidden ring-1 ring-primary/5'>
                <div className='px-6 py-4 border-b border-primary/10 bg-primary/5 flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='size-7 bg-primary rounded flex items-center justify-center text-white'>
                      <ArrowUpRight size={16} />
                    </div>
                    <h3 className='text-[11px] font-black uppercase text-primary tracking-widest'>Resumen de Aplicación</h3>
                  </div>
                </div>
                <div className='p-6 grid grid-cols-1 md:grid-cols-2 gap-8'>
                  <div className='space-y-2'>
                    <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>Monto a Aplicar a la Venta</label>
                    <Input
                      type='text'
                      inputMode='numeric'
                      value={amountToApply}
                      onChange={e => {
                        setAmountToApply(formatNumberWithDots(parseNumberWithDots(e.target.value)))
                        userEditedAmountToApply.current = true
                      }}
                      className='h-12 rounded-lg bg-slate-50 border-slate-200 font-black font-mono text-xl focus:ring-primary focus:bg-white'
                    />
                  </div>
                  <div className='space-y-2'>
                    <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>Vuelto a Entregar</label>
                    <div className='h-12 flex items-center px-5 bg-green-50 text-success font-black rounded-lg border border-green-100 text-xl tabular-nums font-mono shadow-inner'>
                      {formatLocalizedCurrency(change, sale?.currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* OBSERVACIONES */}
              <div className='space-y-2 px-1'>
                <label className='text-[10px] font-black uppercase text-slate-400 tracking-widest'>Notas del Operador</label>
                <Textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder='Detalles operativos del cobro...'
                  rows={2}
                  className='rounded-xl bg-white border-slate-200 text-sm p-4 resize-none font-medium focus:ring-primary transition-all'
                />
              </div>

              {formError && (
                <div className='p-5 bg-error/5 border border-error/20 rounded-xl flex items-center gap-4 animate-in shake duration-500'>
                  <AlertCircle className="text-error" size={20} />
                  <span className='text-[11px] font-black uppercase text-error tracking-tight'>{formError}</span>
                </div>
              )}
            </div>

            <footer className='mt-10 flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-200'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleDialogChange(false)}
                className='h-12 rounded-lg border-slate-200 text-slate-600 font-black uppercase text-xs tracking-widest hover:bg-slate-50 transition-all sm:flex-1'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSubmitDisabled}
                className='h-12 rounded-lg bg-primary hover:bg-primary-hover text-white font-black uppercase text-xs tracking-widest shadow-md transition-all active:scale-[0.98] sm:flex-[2]'
              >
                {isSubmitting ? (
                  <div className='flex items-center gap-2'><Loader2 size={18} className='animate-spin' /> Procesando...</div>
                ) : (
                  <div className='flex items-center gap-2'><CheckCircle2 size={18} /> Registrar Cobro</div>
                )}
              </Button>
            </footer>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default RegisterSalePaymentModal
