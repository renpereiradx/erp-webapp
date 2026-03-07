import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
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
  Building
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
import { calculateCashRegisterBalance } from '@/utils/cashRegisterUtils'
import { normalizeCurrencyCode } from '@/utils/currencyUtils'

const CASH_REGISTER_NONE_VALUE = '__none__'

const getNormalizedBalanceDue = (balanceDue, currency) => {
  if (balanceDue === null || balanceDue === undefined) return null
  const raw = Number(balanceDue)
  if (!Number.isFinite(raw)) return null
  const code = normalizeCurrencyCode(currency)
  if (code === 'PYG') return Math.round(raw)
  return Math.round(raw * 100) / 100
}

const RegisterSalePaymentModal = ({ open, onOpenChange, sale, onSubmit }) => {
  const { t, lang } = useI18n()

  const [amountReceived, setAmountReceived] = useState('')
  const [amountToApply, setAmountToApply] = useState('')
  const [notes, setNotes] = useState('')
  const [cashRegisterId, setCashRegisterId] = useState('')

  const userEditedAmountToApply = useRef(false)

  const [amountReceivedError, setAmountReceivedError] = useState(null)
  const [amountToApplyError, setAmountToApplyError] = useState(null)
  const [formError, setFormError] = useState(null)
  const [isSubmitting, setSubmitting] = useState(false)

  const [cashRegisters, setCashRegisters] = useState([])
  const [isCashRegistersLoading, setCashRegistersLoading] = useState(false)

  const resetForm = useCallback(() => {
    setAmountReceived('')
    setAmountToApply('')
    setNotes('')
    setCashRegisterId('')
    setAmountReceivedError(null)
    setAmountToApplyError(null)
    setFormError(null)
    setSubmitting(false)
    userEditedAmountToApply.current = false
  }, [])

  useEffect(() => { if (open) resetForm() }, [open, resetForm])

  const handleDialogChange = nextOpen => {
    if (!nextOpen) resetForm()
    if (onOpenChange) onOpenChange(nextOpen)
  }

  const formatter = useMemo(() => {
    const locale = lang === 'en' ? 'en-US' : 'es-PY'
    const code = normalizeCurrencyCode(sale?.currency)
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: code === 'PYG' ? 0 : 2,
      maximumFractionDigits: code === 'PYG' ? 0 : 2,
    })
  }, [lang, sale?.currency])

  const formatLocalizedCurrency = useCallback(
    value => formatter.format(Number(value || 0)),
    [formatter]
  )

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

  const validationErrors = useMemo(() => {
    const errors = { amountReceived: null, amountToApply: null, hasErrors: false }
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

  const loadCashRegisters = useCallback(async () => {
    setCashRegistersLoading(true)
    try {
      const [allCashRegisters, activeCashRegister] = await Promise.all([
        cashRegisterService.getCashRegisters().catch(() => []),
        cashRegisterService.getActiveCashRegister().catch(() => null),
      ])
      const openCashRegisters = Array.isArray(allCashRegisters) ? allCashRegisters.filter(cr => {
        const s = (cr?.status || cr?.state || '').toUpperCase()
        return s === 'OPEN' || s === 'ACTIVE'
      }) : []
      const cashRegistersWithBalance = await Promise.all(openCashRegisters.map(async cr => {
        if (typeof cr.current_balance === 'number' && cr.current_balance > 0) return cr
        try {
          const movs = await cashRegisterService.getMovements(cr.id)
          return calculateCashRegisterBalance(cr, movs)
        } catch { return cr }
      }))
      setCashRegisters(cashRegistersWithBalance)
      const preferredId = activeCashRegister?.id || cashRegistersWithBalance[0]?.id || null
      if (preferredId) setCashRegisterId(c => c || String(preferredId))
    } catch (error) {
      console.error('Error loading cash registers', error)
    } finally {
      setCashRegistersLoading(false)
    }
  }, [])

  useEffect(() => { if (open) loadCashRegisters() }, [loadCashRegisters, open])

  const cashRegisterOptions = useMemo(() => cashRegisters.map(cr => ({
    value: String(cr.id),
    label: cr.name || cr.description || `Caja #${cr.id}`,
    balanceLabel: typeof cr.current_balance === 'number' ? formatLocalizedCurrency(cr.current_balance) : null,
    meta: cr.location || cr.branch_name || null
  })), [cashRegisters, formatLocalizedCurrency])

  const isSubmitDisabled = !sale || isSubmitting || isCashRegistersLoading || validationErrors.hasErrors || !amountReceived || !amountToApply

  const handleSubmit = async event => {
    event.preventDefault()
    if (!sale) return
    const numericAmountReceived = Number.parseFloat(parseNumberWithDots(amountReceived))
    const numericAmountToApply = Number.parseFloat(parseNumberWithDots(amountToApply)) || numericAmountReceived
    
    setSubmitting(true)
    try {
      await onSubmit({
        sales_order_id: sale.id || sale.sale_id,
        amount_received: Number(numericAmountReceived.toFixed(2)),
        amount_to_apply: Number(numericAmountToApply.toFixed(2)),
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

  const balanceDueLabel = useMemo(() => sale ? formatLocalizedCurrency(sale.balance_due) : null, [formatLocalizedCurrency, sale])

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className='register-sale-payment-modal w-[95vw] lg:!w-[1150px] lg:!max-w-[calc(95vw-288px)] p-0 overflow-hidden border border-slate-200 shadow-xl rounded-xl'>
        <DialogTitle className='sr-only'>Registrar Cobro de Venta</DialogTitle>
        <DialogDescription className='sr-only'>Registre el cobro de la venta seleccionada.</DialogDescription>
        <form className='flex flex-col md:flex-row h-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto md:overflow-hidden' onSubmit={handleSubmit}>
          {/* PANEL IZQUIERDO: RESUMEN */}
          <div className='w-full md:w-[35%] bg-slate-900 border-b md:border-b-0 md:border-r border-slate-800 text-white p-6 md:p-10 flex flex-col relative overflow-hidden'>
            <div className='relative z-10 flex flex-col h-full'>
              <header className='mb-6'>
                <div className='size-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary mb-4 ring-1 ring-primary/40'>
                  <Building size={20} />
                </div>
                <h2 className='text-xl md:text-2xl font-bold tracking-tight leading-tight mb-1.5'>
                  Registrar Cobro <br />
                  <span className='text-primary'>de Venta</span>
                </h2>
                <div className='flex items-center gap-2 text-white/70 font-medium text-xs'>
                  <Receipt size={14} className='text-primary' /> Venta #{sale?.id || sale?.sale_id || '---'}
                </div>
              </header>

              <div className='space-y-4 md:space-y-6 flex-1'>
                <div className='bg-white/5 backdrop-blur-md rounded-lg p-4 md:p-5 border border-white/10'>
                  <div className='flex items-center gap-3 md:gap-4 mb-1'>
                    <div className='size-9 md:size-10 bg-white/10 rounded-md flex items-center justify-center text-white/60 ring-1 ring-white/10'>
                      <User size={18} />
                    </div>
                    <div>
                      <p className='text-xs font-medium text-white/70 mb-0.5'>Cliente</p>
                      <p className='text-sm font-semibold text-white truncate max-w-[180px]'>{sale?.client_name || 'Consumidor Final'}</p>
                    </div>
                  </div>
                </div>

                <div className='space-y-4 md:space-y-5'>
                  <div>
                    <div className='flex justify-between items-end mb-1'>
                      <p className='text-xs font-medium text-white/70'>Saldo Pendiente</p>
                      <p className='text-xl md:text-2xl font-bold text-white tabular-nums'>{balanceDueLabel || formatLocalizedCurrency(0)}</p>
                    </div>
                    <div className='h-1.5 bg-slate-800 rounded-full overflow-hidden'>
                      <div 
                        className='h-full bg-primary transition-all duration-700' 
                        style={{ width: `${Math.round((Number.parseFloat(parseNumberWithDots(amountToApply)) || 0) / (getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 1) * 100)}%` }}
                      />
                    </div>
                    <div className='mt-1.5 text-xs font-medium text-primary text-right'>
                      {Math.round((Number.parseFloat(parseNumberWithDots(amountToApply)) || 0) / (getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 1) * 100)}% Aplicado
                    </div>
                  </div>

                  <div className='p-4 md:p-5 bg-primary/5 rounded-lg border border-primary/10 backdrop-blur-sm'>
                    <div className='flex items-center gap-3 md:gap-4'>
                      <div className='size-7 md:size-8 bg-primary rounded-md flex items-center justify-center text-white'>
                        <ArrowUpRight size={16} />
                      </div>
                      <div>
                        <p className='text-xs font-medium text-white/70 leading-none mb-1'>Nuevo Saldo</p>
                        <p className={cn(
                          "text-base md:text-lg font-bold tabular-nums transition-colors leading-none",
                          projectedBalance === 0 ? "text-green-400" : "text-white"
                        )}>
                          {formatLocalizedCurrency(projectedBalance)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <footer className='mt-6 pt-4 border-t border-white/5 hidden md:block'>
                <p className='text-xs text-white/50 italic'>
                  * Verifique los datos del cobro antes de confirmar la transacción.
                </p>
              </footer>
            </div>
          </div>

          {/* PANEL DERECHO: FORMULARIO */}
          <div className='w-full md:w-[65%] bg-white dark:bg-slate-900 p-6 md:p-12 flex flex-col'>
            <div className='flex-1 space-y-6 md:space-y-10 overflow-y-auto pr-1 md:pr-2 scrollbar-thin'>
              <section className='space-y-6 md:space-y-8'>
                <div className='flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4'>
                  <div className='size-8 bg-slate-50 dark:bg-slate-800 rounded-md flex items-center justify-center text-slate-500'>
                    <Coins size={18} />
                  </div>
                  <h3 className='text-sm font-semibold text-slate-700'>Información del Cobro</h3>
                </div>

                {/* Monto Recibido con botón al lado */}
                <div className='space-y-3'>
                  <div className='flex flex-wrap items-center gap-3 md:gap-6 px-1'>
                    <label className='text-sm font-medium text-slate-700'>Monto Recibido</label>
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
                      className='text-xs font-medium text-primary hover:text-primary-hover hover:bg-primary/10 px-2 md:px-3 py-1 bg-primary/5 rounded-md transition-all'
                    >
                      Cobrar todo el saldo
                    </button>
                  </div>
                  <div className='relative group'>
                    <div className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg'>₲</div>
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
                      className='h-10 md:h-11 pl-9 rounded-md bg-white border-slate-400 font-medium text-base focus:ring-2 focus:ring-primary/20'
                    />
                  </div>
                  {amountReceivedError && <p className='text-xs font-medium text-rose-500 ml-1'>{amountReceivedError}</p>}
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 pt-2'>
                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-slate-700 px-1'>Monto a Aplicar</label>
                    <Input
                      type='text'
                      inputMode='numeric'
                      value={amountToApply}
                      onChange={e => {
                        setAmountToApply(formatNumberWithDots(parseNumberWithDots(e.target.value)))
                        userEditedAmountToApply.current = true
                      }}
                      className='h-10 md:h-11 rounded-md bg-white border-slate-400 font-medium text-base'
                    />
                    {amountToApplyError && <p className='text-xs font-medium text-rose-500 ml-1'>{amountToApplyError}</p>}
                  </div>

                  <div className='space-y-2'>
                    <label className='text-sm font-medium text-slate-700 px-1'>Vuelto / Saldo a favor</label>
                    <div className='h-10 md:h-11 flex items-center px-4 bg-primary/5 text-primary font-bold rounded-md border border-primary/10 text-sm md:text-base tabular-nums'>
                      {formatLocalizedCurrency(change)}
                    </div>
                  </div>
                </div>

                {/* Caja Registradora */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium text-slate-700 px-1'>Caja de Cobro</label>
                  <Select value={cashRegisterId || CASH_REGISTER_NONE_VALUE} onValueChange={v => setCashRegisterId(v === CASH_REGISTER_NONE_VALUE ? '' : v)}>
                    <SelectTrigger className='h-10 rounded-md bg-white dark:bg-slate-800 border-slate-400 dark:border-slate-700 text-sm font-medium w-full'>
                      <SelectValue placeholder='Seleccionar caja...' />
                    </SelectTrigger>
                    <SelectContent className='!bg-white dark:!bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl z-[9999] min-w-[280px] max-w-[90vw] rounded-md'>
                      <SelectItem value={CASH_REGISTER_NONE_VALUE} className='font-medium text-sm py-2 hover:!bg-slate-50 dark:hover:!bg-slate-800'>Sin Caja Asignada</SelectItem>
                      {cashRegisterOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value} className='py-3 border-b border-slate-50 dark:border-slate-800 last:border-none hover:!bg-slate-50 dark:hover:!bg-slate-800 cursor-pointer'>
                          <div className='flex flex-col gap-0.5'>
                            <span className='font-medium text-sm'>{opt.label}</span>
                            <div className='flex items-center gap-2 text-xs font-medium text-slate-500'>{opt.balanceLabel}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2 pt-2'>
                  <label className='text-sm font-medium text-slate-700 px-1'>Observaciones Internas</label>
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder='Detalles...'
                    rows={2}
                    className='rounded-md bg-white border-slate-400 text-sm p-3 md:p-4 resize-none'
                  />
                </div>
              </section>

              {formError && (
                <div className='p-4 bg-rose-50 border border-rose-100 rounded-md text-rose-600 text-sm font-medium flex items-center gap-3'>
                  <AlertCircle size={16} />
                  <span>{formError}</span>
                </div>
              )}
            </div>

            <footer className='mt-6 md:mt-8 flex flex-col sm:flex-row gap-3 md:gap-4 pt-6 md:pt-8 border-t border-slate-200 dark:border-slate-800'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleDialogChange(false)}
                className='w-full sm:flex-1 h-10 rounded-md font-medium text-sm border-slate-400 hover:bg-slate-50 transition-all'
              >
                Cancelar
              </Button>
              <Button
                type='submit'
                disabled={isSubmitDisabled}
                className='w-full sm:flex-[2] h-10 rounded-md bg-primary hover:bg-primary-hover text-white font-medium text-sm transition-all active:scale-[0.98]'
              >
                {isSubmitting ? (
                  <div className='flex items-center gap-2'><Loader2 size={16} className='animate-spin' /> Procesando...</div>
                ) : (
                  <div className='flex items-center gap-2'><CheckCircle2 size={16} /> Registrar Cobro</div>
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
