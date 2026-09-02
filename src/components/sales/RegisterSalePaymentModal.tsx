import {
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
import { toApiError } from '@/utils/ApiError'
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
import { Label } from '@/components/ui/label'
import { cashRegisterService } from '@/services/cashRegisterService'
import { CurrencyService } from '@/services/currencyService'
import { ExchangeRateService } from '@/services/exchangeRateService'
import { PaymentMethodService } from '@/services/paymentMethodService'
import {
  partitionOpenRegisters,
  resolveDefaultRegisterId,
} from '@/features/sales/registerSelection'
import { normalizeCurrencyCode, formatPYG } from '@/utils/currencyUtils'
import { round2, computeForeignDue } from '@/domain/sale/calculations/foreignPayment'

const DEFAULT_CURRENCY_CODE = 'PYG'

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

/**
 * Registro de cobro para ventas pendientes, alineado con la política de
 * "cobro en divisa" del SaleCheckoutWizard: el saldo de la venta se salda
 * SIEMPRE en la moneda del documento (base), y la divisa elegida describe
 * qué se recibió físicamente. Con divisa ≠ documento: la tasa se precarga y
 * es editable, el "Importe Entregado" se tipea en ESA divisa y su
 * equivalente en base se CALCULA (no se tipea). El vuelto se entrega en la
 * moneda del documento.
 */
const RegisterSalePaymentModal = ({ open, onOpenChange, sale, onSubmit }: RegisterSalePaymentModalProps) => {
  const { lang, t } = useI18n()

  const [amountReceived, setAmountReceived] = useState<string | number>('')
  const [amountToApply, setAmountToApply] = useState<string | number>('')
  const [exchangeRate, setExchangeRate] = useState<string | number>('')
  const [notes, setNotes] = useState<string>('')
  const [paymentMethodId, setPaymentMethodId] = useState<string>('')
  // Id (numérico como string) de la moneda de COBRO; default: la del documento.
  const [currencyId, setCurrencyId] = useState<string>('')
  const [cashRegisterId, setCashRegisterId] = useState<string>('')
  // Caja activa del operador según el backend ('' = sin caja activa).
  const [activeRegisterId, setActiveRegisterId] = useState<string>('')

  const userEditedAmountToApply = useRef<boolean>(false)

  const [, setAmountReceivedError] = useState<string | null>(null)
  const [, setAmountToApplyError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setSubmitting] = useState<boolean>(false)

  const [cashRegisters, setCashRegisters] = useState<any[]>([])
  const [isCashRegistersLoading, setCashRegistersLoading] = useState<boolean>(false)
  const [paymentMethods, setPaymentMethods] = useState<any[]>([])
  const [currencies, setCurrencies] = useState<any[]>([])

  // Moneda del documento (en la que está el saldo). Bajo la política actual
  // es la base, pero el cobro en divisa se compara contra la del documento.
  const docCurrencyCode = useMemo(
    () => normalizeCurrencyCode(sale?.currency || DEFAULT_CURRENCY_CODE),
    [sale?.currency],
  )

  const resolveDefaultCurrencyId = useCallback((list: any[]) => {
    const byCode = list.find(c => normalizeCurrencyCode(c.code || c.currency_code) === docCurrencyCode)
    return byCode ? String(byCode.id) : ''
  }, [docCurrencyCode])

  const resetForm = useCallback(() => {
    setAmountReceived('')
    setAmountToApply('')
    setExchangeRate('')
    setNotes('')
    setPaymentMethodId('')
    // '' = "sin elegir": el valor mostrado deriva al default de la venta
    // (ver currencyValue).
    setCurrencyId('')
    setCashRegisterId('')
    setAmountReceivedError(null)
    setAmountToApplyError(null)
    setFormError(null)
    setSubmitting(false)
    userEditedAmountToApply.current = false
  }, [])

  // Reset al abrir. Vía ref: resetForm cambia de identidad cuando cargan las
  // monedas y el efecto NO debe re-dispararse entonces (borraría lo tipeado).
  const resetFormRef = useRef(resetForm)
  resetFormRef.current = resetForm
  useEffect(() => { if (open) resetFormRef.current() }, [open])

  const handleDialogChange = nextOpen => {
    if (!nextOpen) resetForm()
    if (onOpenChange) onOpenChange(nextOpen)
  }

  const formatLocalizedCurrency = useCallback((value, code = 'PYG') => {
    const normalized = normalizeCurrencyCode(code)
    if (normalized === 'PYG') {
      return formatPYG(Number(value || 0));
    }
    const formatter = new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'es-PY', {
      style: 'currency', currency: normalized,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    return formatter.format(Number(value || 0))
  }, [lang])

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

      // Métodos de pago: solo se cargan; el default (método de la venta, o el
      // marcado como default) se DERIVA en render — ver effectivePaymentMethodId.
      const validMethods = Array.isArray(methods) ? methods : []
      setPaymentMethods(validMethods)

      const normalized = Array.isArray(currencyList) ? currencyList : []
      setCurrencies(normalized)

      const [allRegs, activeReg] = registersData
      // GET /cash-registers devuelve { data:[...], pagination } (wrapper), no un
      // array plano. Normalizar ambos shapes (defensivo, igual que el resto del
      // repo con `response.data || []`).
      const regList = Array.isArray(allRegs) ? allRegs : (allRegs?.data || [])
      // Regla de producto (features/sales/registerSelection.ts): solo se
      // ofrecen cajas ABIERTAS; las cerradas no se listan.
      const openRegs = regList
        .filter(cr => cr?.id !== undefined && cr?.id !== null)
        .map(cr => {
          const status = String(cr?.status || cr?.state || '').toUpperCase()
          const isOpen = status === 'OPEN' || status === 'ACTIVE' || status === 'ABIERTA' || cr?.is_open === true
          return { ...cr, is_open: isOpen, branchId: cr?.branch_id ?? null }
        })
        .filter(cr => cr.is_open)
      setCashRegisters(openRegs)
      const activeId = activeReg?.id ?? activeReg?.cash_register_id
      setActiveRegisterId(activeId != null ? String(activeId) : '')
    } catch (e) { console.error('Error loading modal data:', e) }
    finally { setCashRegistersLoading(false) }
  }, [])

  useEffect(() => { if (open) loadData() }, [loadData, open])

  // ─── Cobro en divisa: derivaciones ────────────────────────────────────────
  const selectedCurrency = useMemo(
    () => currencies.find(c => String(c.id) === String(currencyId)),
    [currencies, currencyId],
  )
  const selectedCurrencyCode = normalizeCurrencyCode(selectedCurrency?.code || selectedCurrency?.currency_code)
  // Cobro en divisa activo cuando la moneda elegida difiere de la del documento.
  const isForeign = !!selectedCurrency && selectedCurrencyCode !== docCurrencyCode
  const rate = useMemo(() => Number(exchangeRate) || 0, [exchangeRate])
  // En divisa el input admite decimales (number); en base mantiene el formato
  // con puntos de miles del input legado.
  const foreignReceived = useMemo(() => Number(amountReceived) || 0, [amountReceived])
  const baseNumericReceived = useMemo(() => (
    isForeign && rate > 0
      ? round2(foreignReceived * rate)
      : Number.parseFloat(parseNumberWithDots(amountReceived)) || 0
  ), [isForeign, rate, foreignReceived, amountReceived, parseNumberWithDots])
  const calculatedForeignDue = useMemo(
    () => (isForeign && rate > 0 ? computeForeignDue(getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 0, rate) : 0),
    [isForeign, rate, sale?.balance_due, sale?.currency],
  )

  // Precarga de la tasa al elegir una divisa distinta de la del documento.
  useEffect(() => {
    if (!isForeign || !selectedCurrency || exchangeRate) return
    let cancelled = false
    ExchangeRateService.getLatest(selectedCurrency.id)
      .then((r: any) => {
        if (cancelled || !r) return
        const value = r.rate_to_base ?? r.rate
        if (value) setExchangeRate(String(value))
      })
      .catch(() => { /* sin tasa cargada: el operador la tipea; sin tasa no se puede registrar */ })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isForeign, selectedCurrency?.id])

  // Con tasa disponible (precargada o tipeada), el monto a aplicar se
  // recalcula desde lo ya tipeado en la divisa — salvo que el operador lo haya
  // editado a mano.
  useEffect(() => {
    if (!isForeign || rate <= 0 || userEditedAmountToApply.current) return
    const balanceDue = getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 0
    const converted = round2(foreignReceived * rate)
    setAmountToApply(formatNumberWithDots(String(Math.round(Math.min(converted, balanceDue)))))
  }, [isForeign, rate, foreignReceived, sale?.balance_due, sale?.currency, formatNumberWithDots])

  const handleCurrencyChange = (code: string) => {
    if (String(code) === String(currencyId)) return
    // Se conserva lo tipeado: cambiar la divisa no borra el importe entregado.
    // El valor numérico se re-expresa en el formato del modo destino (miles
    // con puntos en la moneda del documento; plano con decimales en divisa).
    const nextCurrency = currencies.find(c => String(c.id) === String(code))
    const nextIsDoc = !nextCurrency
      || normalizeCurrencyCode(nextCurrency.code || nextCurrency.currency_code) === docCurrencyCode
    const numeric = parseNumberWithDots(String(amountReceived ?? ''))
    setAmountReceived(nextIsDoc ? formatNumberWithDots(numeric) : numeric)
    // La tasa depende de la divisa: se resetea y se precarga la de la nueva.
    setExchangeRate('')
    setCurrencyId(code)
  }

  const currencySelectorData = useMemo(() => {
    if (currencies.length) {
      return currencies.map(c => ({
        id: String(c.id),
        code: normalizeCurrencyCode(c.code || c.currency_code),
        name: c.currency_name || c.name,
      }))
    }
    // Sin catálogo cargado: opción única con la moneda de la venta (id no
    // vacío: Radix SelectItem no admite value='').
    return [{ id: docCurrencyCode, code: docCurrencyCode, name: docCurrencyCode }]
  }, [currencies, docCurrencyCode])

  // Valor efectivo del select de divisa: lo elegido por el operador, o el
  // default según los datos de la venta (moneda del documento; si no figura,
  // la moneda base del sistema).
  const currencyValue = useMemo(() => {
    if (currencyId) return currencyId
    const docMatch = resolveDefaultCurrencyId(currencies)
    if (docMatch) return docMatch
    if (currencies.length) {
      const base = currencies.find(c => c.is_base || c.is_base_currency) || currencies[0]
      return String(base.id)
    }
    return currencySelectorData[0]?.id || ''
  }, [currencyId, currencies, currencySelectorData, resolveDefaultCurrencyId])

  const paymentMethodOptions = useMemo(() => paymentMethods.map(m => {
    const id = String(m.id || m.payment_method_id)
    // Alineado con API v1.1: usar description y method_code
    const label = m.description || m.method_code || m.display_name || m.name || id
    return { id, label }
  }).filter(o => o.id !== 'undefined'), [paymentMethods])

  // Valor efectivo del select de método de pago, DERIVADO en render: la
  // elección del operador, o el default — el método registrado en la venta
  // (description/method_code); si no hay match, el marcado como default o el
  // primero. Mismo patrón que cashRegisterValue: evita el placeholder de
  // Radix cuando el dato llega después de montar el select.
  const effectivePaymentMethodId = useMemo(() => {
    if (paymentMethodId) return paymentMethodId
    if (paymentMethodOptions.length === 0) return ''
    const saleMethod = String(sale?.payment_method || '').trim().toUpperCase()
    let def = null
    if (saleMethod) {
      def = paymentMethodOptions.find(m => m.label.toUpperCase() === saleMethod)
        || paymentMethodOptions.find(m => {
          const l = m.label.toUpperCase()
          return l.includes(saleMethod) || saleMethod.includes(l)
        })
    }
    return (def || paymentMethodOptions[0]).id
  }, [paymentMethodId, paymentMethodOptions, sale?.payment_method])

  const validationErrors = useMemo(() => {
    const errors: { amountReceived: string | null, exchangeRate: string | null, amountToApply: string | null, hasErrors: boolean } = { amountReceived: null, exchangeRate: null, amountToApply: null, hasErrors: false }
    if (!sale) return errors

    // Cobro en divisa sin tasa: se bloquea el submit (el backend nunca debe
    // recibir un monto en divisa convertido con una tasa inexistente).
    if (isForeign && rate <= 0) {
      errors.exchangeRate = t('sales.registerPaymentModal.rateRequired', 'Cargá la tasa de cambio para cobrar en {currency}', { currency: selectedCurrencyCode })
      errors.hasErrors = true
    }

    const numericReceived = isForeign ? foreignReceived : Number.parseFloat(parseNumberWithDots(amountReceived))
    if (amountReceived !== '' && amountReceived !== undefined && amountReceived !== null) {
      if (!Number.isFinite(numericReceived) || numericReceived <= 0) {
        errors.amountReceived = t('sales.registerPaymentModal.amountInvalid', 'Monto inválido')
        errors.hasErrors = true
      }
    }

    if (amountToApply && amountReceived) {
      const numericToApply = Number.parseFloat(parseNumberWithDots(amountToApply))
      const balanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency)

      if (!Number.isFinite(numericToApply) || numericToApply <= 0) {
        errors.amountToApply = t('sales.registerPaymentModal.amountInvalid', 'Monto inválido')
        errors.hasErrors = true
      } else if (numericToApply > baseNumericReceived) {
        errors.amountToApply = t('sales.registerPaymentModal.amountExceedsReceived', 'Excede el recibido')
        errors.hasErrors = true
      } else if (balanceDue !== null && numericToApply > balanceDue) {
        errors.amountToApply = t('sales.registerPaymentModal.amountExceedsDebt', 'Excede la deuda')
        errors.hasErrors = true
      }
    }
    return errors
  }, [sale, amountReceived, amountToApply, isForeign, rate, foreignReceived, baseNumericReceived, selectedCurrencyCode, parseNumberWithDots, t])

  // Vuelto: SIEMPRE en la moneda del documento (recibido convertido a base
  // menos lo aplicado).
  const change = useMemo(() => (
    Math.max(0, baseNumericReceived - (Number.parseFloat(parseNumberWithDots(amountToApply)) || 0))
  ), [baseNumericReceived, amountToApply, parseNumberWithDots])

  const projectedBalance = useMemo(() => {
    if (!sale) return 0
    const balanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency) || 0
    const toApply = Number.parseFloat(parseNumberWithDots(amountToApply)) || 0
    return Math.max(0, balanceDue - toApply)
  }, [sale, amountToApply, parseNumberWithDots])

  const cashRegisterOptions = useMemo(() => {
    // Abiertas de la sucursal de la venta: seleccionables. Las de otra
    // sucursal se muestran deshabilitadas (el backend rechaza el pago con
    // ellas); las cerradas no se listan.
    const partition = partitionOpenRegisters(cashRegisters, sale?.branch_id ?? null)
    return [...partition.inBranch, ...partition.otherBranches].map(cr => ({
      value: String(cr.id),
      label: cr.name || cr.description || `Caja #${cr.id}`,
      selectable: partition.inBranch.includes(cr),
      balanceLabel: typeof cr.current_balance === 'number' ? formatLocalizedCurrency(cr.current_balance, cr.currency) : null,
      meta: cr.location || cr.branch_name || null
    }))
  }, [cashRegisters, sale?.branch_id, formatLocalizedCurrency])

  // Valor efectivo del select de caja, DERIVADO en render: la elección del
  // operador, o el default (caja activa del operador si pertenece a la
  // sucursal de la venta; si no, la primera abierta de esa sucursal).
  // Derivarlo —y no setearlo por efecto— evita que el trigger de Radix quede
  // en placeholder cuando los datos llegan después de montar el select.
  const cashRegisterValue = useMemo(() => {
    if (cashRegisterId) return cashRegisterId
    const { inBranch } = partitionOpenRegisters(cashRegisters, sale?.branch_id ?? null)
    const def = resolveDefaultRegisterId(inBranch, activeRegisterId || null) ?? inBranch[0]?.id ?? null
    return def != null ? String(def) : ''
  }, [cashRegisterId, cashRegisters, sale?.branch_id, activeRegisterId])

  const selectedCashRegisterOption = useMemo(
    () => cashRegisterOptions.find(o => o.value === cashRegisterValue) ?? null,
    [cashRegisterOptions, cashRegisterValue],
  )

  const hasSelectableRegisters = useMemo(
    () => cashRegisterOptions.some(o => o.selectable),
    [cashRegisterOptions],
  )

  // Caja opcional (alineado con el checkout): sin caja el pago se registra
  // igual; si no hay cajas abiertas —o no hay en la sucursal de la venta— se
  // explica qué pasa antes de intentar cobrar.
  const cashRegisterHint = useMemo(() => {
    if (isCashRegistersLoading) return ''
    if (cashRegisters.length === 0) {
      return t('sales.registerPaymentModal.cashRegister.empty', 'No hay cajas registradoras abiertas disponibles. El cobro se registrará sin caja vinculada.')
    }
    if (!hasSelectableRegisters) {
      return t('sales.registerPaymentModal.cashRegister.noBranchOpen', 'No hay cajas abiertas en la sucursal de esta venta. Abrí una caja en esa sucursal para vincularla al cobro.')
    }
    if (!cashRegisterValue) {
      return t('sales.registerPaymentModal.cashRegister.optionalHint', 'Sin caja seleccionada: el pago no quedará vinculado a una caja registradora.')
    }
    return ''
  }, [isCashRegistersLoading, cashRegisters.length, hasSelectableRegisters, cashRegisterValue, t])

  const isSubmitDisabled = !sale || isSubmitting || validationErrors.hasErrors || !amountReceived || !amountToApply || !effectivePaymentMethodId

  const handleSubmit = async event => {
    event.preventDefault()
    if (!sale) return
    // Defensa extra ante submit con divisa sin tasa (el botón ya está disabled).
    if (isForeign && rate <= 0) return
    const numericAmountToApply = Number.parseFloat(parseNumberWithDots(amountToApply)) || baseNumericReceived

    setSubmitting(true)
    try {
      const selectedMethod = paymentMethods.find(m => String(m.id || m.payment_method_id) === String(effectivePaymentMethodId))

      await onSubmit({
        sales_order_id: sale.id || sale.sale_id,
        // amount_received SIEMPRE en la moneda del documento: con cobro en
        // divisa es foreignReceived × tasa (convertido acá y re-validado por
        // el backend).
        amount_received: Number(baseNumericReceived.toFixed(2)),
        amount_to_apply: Number(numericAmountToApply.toFixed(2)),
        payment_method_id: Number(effectivePaymentMethodId),
        payment_method_name: selectedMethod ? (selectedMethod.name || selectedMethod.description || 'CASH').toUpperCase() : 'CASH',
        // Metadatos del cobro en divisa (auditoría; el saldo se salda en base).
        currency_id: isForeign && selectedCurrency ? Number(selectedCurrency.id) : undefined,
        exchange_rate: isForeign ? rate : undefined,
        original_amount: isForeign ? Number(foreignReceived.toFixed(2)) : undefined,
        cash_register_id: cashRegisterValue ? Number(cashRegisterValue) : undefined,
        payment_notes: notes.trim() || null,
      })
      resetForm()
      handleDialogChange(false)
    } catch (error: any) {
      const norm = toApiError(error)
      if (norm.code === 'CONFLICT') {
        // El backend explica el rechazo concreto (caja requerida, branch
        // mismatch, caja cerrada): su mensaje es más accionable que uno genérico.
        setFormError(norm.message || t('sales.errors.cashRegisterRequired', 'Necesitás una caja abierta para cobrar. Abrí una caja e intentá de nuevo.'))
      } else {
        setFormError(error?.message || t('sales.registerPaymentModal.submitError', 'Error al registrar'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const selectedMethodLabel = useMemo(
    () => paymentMethodOptions.find(m => m.id === effectivePaymentMethodId)?.label ?? null,
    [paymentMethodOptions, effectivePaymentMethodId],
  )

  // Labels explícitos para el trigger del select: Radix solo porta el texto del
  // ítem al trigger cuando el contenido llegó a montarse; con el valor seteado
  // por código y el dropdown cerrado, el trigger quedaría con el placeholder.
  const selectedCurrencyLabel = useMemo(() => {
    const c = currencySelectorData.find(x => String(x.id) === String(currencyValue))
    if (!c) return null
    return c.name && c.name !== c.code ? `${c.code} - ${c.name}` : c.code
  }, [currencySelectorData, currencyValue])

  const balanceDueLabel = useMemo(() => sale ? formatLocalizedCurrency(sale.balance_due, sale.currency) : null, [formatLocalizedCurrency, sale])

  const appliedPercent = Math.round(
    (Number.parseFloat(parseNumberWithDots(amountToApply)) || 0) / (getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 1) * 100
  )

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className='register-sale-payment-modal w-[95vw] lg:!w-[1100px] lg:!max-w-[calc(95vw-288px)] p-0 overflow-hidden border border-border-subtle shadow-fluent-16 rounded-xl bg-background'>
        <DialogTitle className='sr-only'>{t('sales.registerPaymentModal.dialogTitle', 'Registrar Cobro de Venta')}</DialogTitle>
        <DialogDescription className='sr-only'>{t('sales.registerPaymentModal.dialogDescription', 'Registre el cobro de la venta seleccionada.')}</DialogDescription>
        <form className='flex flex-col md:flex-row h-full max-h-[95vh] md:max-h-[90vh] overflow-hidden' onSubmit={handleSubmit}>
          {/* PANEL IZQUIERDO: RESUMEN OPERATIVO */}
          <div className='w-full md:w-[32%] bg-inverse-surface text-on-primary p-lg flex flex-col relative overflow-hidden border-r border-on-primary/10'>
            <div className='relative z-10 flex flex-col h-full'>
              <header className='mb-xl'>
                <div className='size-12 bg-primary rounded-md flex items-center justify-center text-on-primary mb-lg shadow-fluent-2'>
                  <Building size={24} />
                </div>
                <h2 className='text-headline-lg font-black tracking-tighter uppercase leading-none mb-md'>
                  {t('sales.registerPaymentModal.state', 'Estado de')} <br />
                  <span className='text-primary'>{t('sales.registerPaymentModal.collection', 'Cobro')}</span>
                </h2>
                <div className='inline-flex items-center gap-sm px-md py-xs bg-on-primary/5 border border-on-primary/10 rounded-full text-body-sm-bold text-on-primary/60 uppercase'>
                  <Receipt size={12} className='text-primary' /> {t('sales.registerPaymentModal.saleLabel', 'Venta #{id}', { id: sale?.id || sale?.sale_id || '---' })}
                </div>
              </header>

              {/* FLUJO DE SALDOS: Entrada -> Operación -> Salida */}
              <div className='flex-1 flex flex-col gap-lg'>
                {/* 1. Estado Actual */}
                <div className='relative pl-lg border-l-2 border-on-primary/10'>
                  <div className='absolute -left-[9px] top-0 size-4 rounded-full bg-inverse-surface border-2 border-on-primary/20' />
                  <p className='text-label-caps uppercase text-on-primary/40 mb-xs'>{t('sales.registerPaymentModal.initialBalance', 'Saldo Inicial')}</p>
                  <p className='text-headline-lg font-black text-on-primary font-data-mono text-data-mono'>{balanceDueLabel || formatLocalizedCurrency(0)}</p>
                </div>

                {/* 2. Operación (Barra de progreso integrada) */}
                <div className='bg-on-primary/5 backdrop-blur-md rounded-md p-lg border border-on-primary/10 shadow-fluent-2'>
                  <div className='flex justify-between items-center mb-md'>
                    <p className='text-label-caps uppercase text-primary'>{t('sales.registerPaymentModal.applyingPayment', 'Aplicando Pago')}</p>
                    <span className='text-body-sm-bold font-black text-on-primary bg-primary/20 px-sm py-0.5 rounded-full'>
                      {appliedPercent}%
                    </span>
                  </div>
                  <div className='h-2 bg-on-primary/5 rounded-full overflow-hidden mb-md'>
                    <div
                      className='h-full bg-primary transition-colors duration-150'
                      style={{ width: `${Math.min(100, appliedPercent)}%` }}
                    />
                  </div>
                  <div className='flex items-center gap-md'>
                    <div className='size-8 rounded-full bg-on-primary/10 flex items-center justify-center text-on-primary/60'>
                      <User size={14} />
                    </div>
                    <div className='min-w-0'>
                      <p className='text-label-caps uppercase text-on-primary/30'>{t('sales.registerPaymentModal.client', 'Cliente')}</p>
                      <p className='text-body-md-bold text-on-primary truncate'>{sale?.client_name || t('sales.registerPaymentModal.walkIn', 'Consumidor Final')}</p>
                    </div>
                  </div>
                </div>

                {/* 3. Resultado Final */}
                <div className='relative pl-lg border-l-2 border-primary/30'>
                  <div className='absolute -left-[9px] top-0 size-4 rounded-full bg-primary' />
                  <p className='text-label-caps uppercase text-primary mb-xs'>{t('sales.registerPaymentModal.newBalance', 'Nuevo Saldo')}</p>
                  <p className={cn(
                    "text-headline-lg font-black font-data-mono text-data-mono tracking-tighter",
                    projectedBalance <= 0 ? "text-success" : "text-on-primary"
                  )}>
                    {formatLocalizedCurrency(projectedBalance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* PANEL DERECHO: FORMULARIO ESTRUCTURADO */}
          <div className='w-full md:w-[68%] bg-surface-muted p-lg flex flex-col'>
            <div className='flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-lg'>

              {/* SECCIÓN 1: ORIGEN Y MONEDA (CARD) */}
              <div className='bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden'>
                <div className='px-lg py-md border-b border-border-subtle bg-surface-muted flex items-center gap-md'>
                  <div className='size-7 bg-primary/10 rounded-md flex items-center justify-center text-primary'>
                    <Coins size={16} />
                  </div>
                  <h3 className='text-label-caps uppercase text-foreground'>{t('sales.registerPaymentModal.fundsOrigin', 'Origen de Fondos')}</h3>
                </div>
                <div className='p-lg space-y-lg'>
                  <div className='grid grid-cols-1 md:grid-cols-12 gap-lg'>
                    {/* Monto Recibido - Principal (en la divisa de cobro) */}
                    <div className='md:col-span-7 space-y-sm'>
                      <div className='flex justify-between items-center gap-sm'>
                        <Label htmlFor='payment-amount-received' className='text-label-caps uppercase text-muted-foreground'>
                          {isForeign
                            ? t('sales.registerPaymentModal.amountReceivedForeign', 'Importe Entregado ({currency})', { currency: selectedCurrencyCode })
                            : t('sales.registerPaymentModal.amountReceived', 'Importe Entregado')}
                        </Label>
                        <button
                          type='button'
                          onClick={() => {
                            const balanceDue = getNormalizedBalanceDue(sale.balance_due, sale.currency)
                            if (balanceDue === null) return
                            if (isForeign && rate > 0) {
                              // En divisa: recibido = equivalente del saldo en la
                              // divisa; lo aplicado sigue siendo el saldo en base.
                              setAmountReceived(String(computeForeignDue(balanceDue, rate)))
                              setAmountToApply(formatNumberWithDots(String(balanceDue)))
                            } else {
                              setAmountReceived(formatNumberWithDots(String(balanceDue)))
                              setAmountToApply(formatNumberWithDots(String(balanceDue)))
                            }
                            userEditedAmountToApply.current = false
                          }}
                          className='text-label-caps uppercase text-primary hover:underline'
                        >
                          {t('sales.registerPaymentModal.coverFull', 'Cubrir Saldo Total')}
                        </button>
                      </div>
                      <div className='relative group'>
                        <div className='absolute left-md top-1/2 -translate-y-1/2 text-muted-foreground font-data-mono text-data-mono'>
                          {isForeign ? selectedCurrencyCode : '₲'}
                        </div>
                        <Input
                          id='payment-amount-received'
                          type={isForeign ? 'number' : 'text'}
                          inputMode={isForeign ? 'decimal' : 'numeric'}
                          step={isForeign ? '0.01' : undefined}
                          min='0'
                          state={validationErrors.amountReceived ? 'error' : ''}
                          value={amountReceived}
                          onChange={e => {
                            if (isForeign) {
                              const numeric = Number(e.target.value) || 0
                              setAmountReceived(e.target.value)
                              if (!userEditedAmountToApply.current) {
                                const balanceDue = getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 0
                                const converted = rate > 0 ? round2(numeric * rate) : 0
                                setAmountToApply(formatNumberWithDots(String(Math.round(Math.min(converted, balanceDue)))))
                              }
                              return
                            }
                            const val = formatNumberWithDots(parseNumberWithDots(e.target.value))
                            setAmountReceived(val)
                            if (!userEditedAmountToApply.current) {
                              const balanceDue = getNormalizedBalanceDue(sale?.balance_due, sale?.currency) || 0
                              const numeric = Number.parseFloat(parseNumberWithDots(val)) || 0
                              setAmountToApply(formatNumberWithDots(String(Math.round(Math.min(numeric, balanceDue)))))
                            }
                          }}
                          className='h-14 rounded-input pl-xl bg-surface-muted font-data-mono text-data-mono text-body-lg focus:bg-surface'
                        />
                      </div>
                      {validationErrors.amountReceived && (
                        <p className='text-body-md text-error'>{validationErrors.amountReceived}</p>
                      )}
                      {isForeign && (
                        <p className='text-body-sm-bold text-muted-foreground font-data-mono'>
                          {t('sales.registerPaymentModal.baseEquivalent', 'Equivale a {amount} (el saldo se salda en {base})', {
                            amount: formatLocalizedCurrency(baseNumericReceived, docCurrencyCode),
                            base: docCurrencyCode,
                          })}
                        </p>
                      )}
                    </div>

                    {/* Divisa de cobro */}
                    <div className='md:col-span-5 space-y-sm'>
                      <Label htmlFor='payment-currency' className='text-label-caps uppercase text-muted-foreground'>
                        {t('sales.registerPaymentModal.currencyLabel', 'Divisa de cobro')}
                      </Label>
                      <Select value={currencyValue} onValueChange={handleCurrencyChange}>
                        <SelectTrigger
                          id='payment-currency'
                          className='rounded-input border-border-subtle bg-surface-muted text-body-md-bold data-[placeholder]:text-muted-foreground'
                        >
                          <SelectValue placeholder={t('sales.registerPaymentModal.select', 'Seleccionar...')}>
                            {selectedCurrencyLabel}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className='bg-surface border-border-subtle shadow-fluent-8'>
                          {currencySelectorData.map(c => (
                            <SelectItem key={c.id || c.code} value={c.id || c.code} className='text-body-md py-sm'>{c.code} - {c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Tasa de cambio (solo divisa ≠ documento): precargada, editable; equivalente calculado */}
                  {isForeign && (
                    <div className='grid grid-cols-2 gap-lg p-md bg-primary/5 rounded-md border border-primary/10 animate-in fade-in zoom-in-95 duration-150'>
                      <div className='space-y-xs'>
                        <Label htmlFor='payment-exchange-rate' className='text-label-caps uppercase text-primary/60'>
                          {t('sales.registerPaymentModal.exchangeRate', 'Tasa de Cambio')}
                        </Label>
                        <Input
                          id='payment-exchange-rate'
                          type='number'
                          step='any'
                          min='0'
                          value={exchangeRate}
                          onChange={e => setExchangeRate(e.target.value)}
                          className='rounded-input bg-surface border-primary/20 font-data-mono text-data-mono'
                        />
                        <p className='text-body-sm-bold text-muted-foreground'>
                          {t('sales.registerPaymentModal.exchangeRateHint', '1 {currency} = ? {base}. Precargada del día; ajustala si tu cotización es otra.', {
                            currency: selectedCurrencyCode, base: docCurrencyCode,
                          })}
                        </p>
                        {validationErrors.exchangeRate && (
                          <p className='flex items-center gap-xs text-label-caps uppercase text-error'>
                            <AlertCircle size={13} className='shrink-0' />
                            <span>{validationErrors.exchangeRate}</span>
                          </p>
                        )}
                      </div>
                      <div className='space-y-xs'>
                        <label className='text-label-caps uppercase text-primary/60'>
                          {t('sales.registerPaymentModal.foreignDueLabel', 'A cobrar ({currency})', { currency: selectedCurrencyCode })}
                        </label>
                        <div className='h-10 flex items-center px-md rounded-md bg-surface border border-primary/20 font-data-mono text-data-mono text-primary'>
                          {calculatedForeignDue > 0
                            ? formatLocalizedCurrency(calculatedForeignDue, selectedCurrencyCode)
                            : t('sales.registerPaymentModal.ratePending', 'Cargá la tasa para ver el equivalente')}
                        </div>
                        <p className='text-body-sm-bold text-muted-foreground'>
                          {t('sales.registerPaymentModal.foreignDueHint', 'Equivalente del saldo calculado con la tasa. El vuelto se entrega en {base}.', { base: docCurrencyCode })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECCIÓN 2: REGISTRO Y CAJA (CARD) */}
              <div className='bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden'>
                <div className='px-lg py-md border-b border-border-subtle bg-surface-muted flex items-center gap-md'>
                  <div className='size-7 bg-primary/10 rounded-md flex items-center justify-center text-primary'>
                    <Building size={16} />
                  </div>
                  <h3 className='text-label-caps uppercase text-foreground'>{t('sales.registerPaymentModal.register', 'Registro Contable')}</h3>
                </div>
                <div className='p-lg grid grid-cols-1 md:grid-cols-2 gap-lg'>
                  <div className='space-y-sm'>
                    <Label htmlFor='payment-method' className='text-label-caps uppercase text-muted-foreground'>{t('sales.registerPaymentModal.paymentMethod', 'Método de Pago')}</Label>
                    <Select value={effectivePaymentMethodId} onValueChange={setPaymentMethodId}>
                      <SelectTrigger
                        id='payment-method'
                        className='rounded-input border-border-subtle bg-surface-muted text-body-md-bold data-[placeholder]:text-muted-foreground'
                      >
                        <SelectValue placeholder={t('sales.registerPaymentModal.select', 'Seleccionar...')}>
                          {selectedMethodLabel}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className='bg-surface border-border-subtle shadow-fluent-8'>
                        {paymentMethodOptions.map(m => (
                          <SelectItem key={m.id} value={m.id} className='text-body-md py-sm'>{m.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='space-y-sm'>
                    <Label htmlFor='payment-cash-register' className='text-label-caps uppercase text-muted-foreground'>{t('sales.registerPaymentModal.cashRegister', 'Caja Operativa')}</Label>
                    <Select value={cashRegisterValue} onValueChange={setCashRegisterId}>
                      <SelectTrigger
                        id='payment-cash-register'
                        className='rounded-input border-border-subtle bg-surface-muted text-body-md-bold data-[placeholder]:text-muted-foreground'
                      >
                        <SelectValue placeholder={t('sales.registerPaymentModal.cashRegister.placeholder', 'Seleccionar caja...')}>
                          {selectedCashRegisterOption ? (
                            <span className='flex min-w-0 items-center gap-sm'>
                              <span className='truncate'>{selectedCashRegisterOption.label}</span>
                              <span className={cn(
                                'shrink-0 text-body-sm-bold',
                                selectedCashRegisterOption.selectable ? 'text-success' : 'text-muted-foreground'
                              )}>
                                {selectedCashRegisterOption.selectable
                                  ? t('sales.registerPaymentModal.cashRegister.open', 'Abierta')
                                  : t('sales.registerPaymentModal.cashRegister.otherBranch', 'Otra sucursal')}
                              </span>
                            </span>
                          ) : null}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className='bg-surface border-border-subtle shadow-fluent-8 min-w-[300px]'>
                        {cashRegisterOptions.map(opt => (
                          <SelectItem key={opt.value} value={opt.value} disabled={!opt.selectable} className='py-sm'>
                            <div className='flex flex-col gap-xs pr-6'>
                              <div className='flex items-center gap-sm'>
                                <span className='text-body-md-bold text-foreground'>{opt.label}</span>
                                <span className={cn('text-body-sm-bold', opt.selectable ? 'text-success' : 'text-muted-foreground')}>
                                  {opt.selectable
                                    ? t('sales.registerPaymentModal.cashRegister.open', 'Abierta')
                                    : t('sales.registerPaymentModal.cashRegister.otherBranch', 'Otra sucursal')}
                                </span>
                              </div>
                              {(opt.balanceLabel || opt.meta) && (
                                <div className='flex items-center gap-sm'>
                                  {opt.balanceLabel && (
                                    <span className='text-data-mono font-data-mono text-muted-foreground'>{opt.balanceLabel}</span>
                                  )}
                                  {opt.meta && (
                                    <span className='text-body-sm text-muted-foreground'>{opt.meta}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {cashRegisterHint && (
                      <p className={cn(
                        'flex items-start gap-xs text-label-caps uppercase mt-xs',
                        !hasSelectableRegisters ? 'text-warning' : 'text-muted-foreground'
                      )}>
                        <AlertCircle size={13} className='mt-[1px] shrink-0' />
                        <span>{cashRegisterHint}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: RESULTADO Y APLICACIÓN (PROMINENTE) */}
              <div className='bg-surface rounded-md border border-primary/20 shadow-whisper overflow-hidden ring-1 ring-primary/5'>
                <div className='px-lg py-md border-b border-primary/10 bg-primary/5 flex items-center justify-between'>
                  <div className='flex items-center gap-md'>
                    <div className='size-7 bg-primary rounded-md flex items-center justify-center text-on-primary'>
                      <ArrowUpRight size={16} />
                    </div>
                    <h3 className='text-label-caps uppercase text-primary'>{t('sales.registerPaymentModal.summary', 'Resumen de Aplicación')}</h3>
                  </div>
                </div>
                <div className='p-lg grid grid-cols-1 md:grid-cols-2 gap-lg'>
                  <div className='space-y-sm'>
                    <Label htmlFor='payment-amount-to-apply' className='text-label-caps uppercase text-muted-foreground'>
                      {t('sales.registerPaymentModal.amountToApplyLabel', 'Monto a Aplicar a la Venta ({currency})', { currency: docCurrencyCode })}
                    </Label>
                    <Input
                      id='payment-amount-to-apply'
                      type='text'
                      inputMode='numeric'
                      state={validationErrors.amountToApply ? 'error' : ''}
                      value={amountToApply}
                      onChange={e => {
                        setAmountToApply(formatNumberWithDots(parseNumberWithDots(e.target.value)))
                        userEditedAmountToApply.current = true
                      }}
                      className='rounded-input bg-surface-muted font-data-mono text-data-mono text-body-lg focus:bg-surface'
                    />
                    {validationErrors.amountToApply && (
                      <p className='text-body-md text-error'>{validationErrors.amountToApply}</p>
                    )}
                  </div>
                  <div className='space-y-sm'>
                    <Label className='text-label-caps uppercase text-muted-foreground'>
                      {t('sales.registerPaymentModal.changeLabel', 'Vuelto a Entregar')}
                      {isForeign && (
                        <span className='ml-xs normal-case font-bold text-muted-foreground'>
                          {t('sales.registerPaymentModal.changeInDoc', '(en {base})', { base: docCurrencyCode })}
                        </span>
                      )}
                    </Label>
                    <div className='h-12 flex items-center px-md bg-success/10 text-success font-black rounded-md border border-success/20 text-xl font-data-mono text-data-mono'>
                      {formatLocalizedCurrency(change, sale?.currency)}
                    </div>
                  </div>
                </div>
              </div>

              {/* OBSERVACIONES */}
              <div className='space-y-xs px-xs'>
                <Label htmlFor='payment-notes' className='text-label-caps uppercase text-muted-foreground'>{t('sales.registerPaymentModal.notes.label', 'Notas del Operador')}</Label>
                <Textarea
                  id='payment-notes'
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={t('sales.registerPaymentModal.notes.placeholder', 'Detalles operativos del cobro...')}
                  rows={2}
                  className='rounded-input bg-surface border-border-subtle focus:ring-primary transition-colors duration-150'
                />
              </div>

              {formError && (
                <div className='p-md bg-error-container text-error rounded-md flex items-center gap-md animate-in fade-in duration-150'>
                  <AlertCircle className="text-error" size={20} />
                  <span className='text-label-caps uppercase tracking-tight'>{formError}</span>
                </div>
              )}
            </div>

            <footer className='mt-lg flex flex-col sm:flex-row gap-md pt-lg border-t border-border-subtle'>
              <Button
                type='button'
                variant='outline'
                onClick={() => handleDialogChange(false)}
                className='sm:flex-1'
              >
                {t('sales.registerPaymentModal.cancel', 'Cancelar')}
              </Button>
              <Button
                type='submit'
                disabled={isSubmitDisabled}
                className='sm:flex-2'
              >
                {isSubmitting ? (
                  <div className='flex items-center gap-sm'><Loader2 size={18} className='animate-spin' /> {t('sales.registerPaymentModal.loading', 'Procesando...')}</div>
                ) : (
                  <div className='flex items-center gap-sm'><CheckCircle2 size={18} /> {t('sales.cobros.action.payment', 'Registrar Cobro')}</div>
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
