/**
 * RegisterCashMovement - Página para registrar movimientos manuales de efectivo
 * Sigue patrón MVP y Fluent Design System 2.0
 */

import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { cashRegisterService } from '@/services/cashRegisterService'
import { telemetry } from '@/utils/telemetry'
import SegmentedControl from '@/components/ui/SegmentedControl'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { CashRegister } from '@/store/useCashRegisterStore'
import { 
  ArrowUp, 
  ArrowDown, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Save,
  Plus,
  Wallet
} from 'lucide-react'

type MovementType = 'INCOME' | 'EXPENSE' | 'ADJUSTMENT'

interface FormData {
  movementType: MovementType;
  cashRegisterId: number | null;
  concept: string;
  amount: string;
  notes: string;
}

const RegisterCashMovement: React.FC = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') as MovementType
  const validInitialType: MovementType = ['INCOME', 'EXPENSE', 'ADJUSTMENT'].includes(initialType)
    ? initialType
    : 'INCOME'

  // Form state
  const [formData, setFormData] = useState<FormData>({
    movementType: validInitialType,
    cashRegisterId: null,
    concept: '',
    amount: '',
    notes: '',
  })

  // UI state
  const [activeCashRegister, setActiveCashRegister] = useState<CashRegister | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingCashRegister, setLoadingCashRegister] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Predefined concepts
  const concepts: Record<MovementType, string[]> = {
    INCOME: [
      'Depósito inicial',
      'Cobro de deuda',
      'Venta directa',
      'Donación',
      'Ingreso varios',
      'Otro',
    ],
    EXPENSE: [
      'Retiro de efectivo',
      'Pago a proveedor',
      'Gastos menores',
      'Servicios',
      'Egreso varios',
      'Otro',
    ],
    ADJUSTMENT: [
      'Ajuste por diferencia',
      'Corrección de error',
      'Ajuste de inventario',
      'Otro',
    ],
  }

  // UI configuration
  const MOVEMENT_CONFIG: Record<MovementType, any> = {
    INCOME: {
      title: 'Registrar Ingreso',
      description: 'Entrada de dinero a la caja operativa',
      colorClass: 'text-success bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800',
      icon: <ArrowDown className="text-success w-7 h-7" />,
    },
    EXPENSE: {
      title: 'Registrar Egreso',
      description: 'Salida de dinero para gastos o retiros',
      colorClass: 'text-error bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800',
      icon: <ArrowUp className="text-error w-7 h-7" />,
    },
    ADJUSTMENT: {
      title: 'Registrar Ajuste',
      description: 'Corrección manual del balance de sistema',
      colorClass: 'text-info bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800',
      icon: <Settings className="text-info w-7 h-7" />,
    },
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingCashRegister(true)
        const cashRegister = await cashRegisterService.getActiveCashRegister()
        if (cashRegister) {
          setActiveCashRegister(cashRegister)
          setFormData(prev => ({ ...prev, cashRegisterId: cashRegister.id }))
        } else {
          setError(t('cashMovement.error.noActiveCashRegister', 'No hay caja registradora activa.'))
        }
      } catch (err) {
        setError(t('cashMovement.error.loadingCashRegister', 'Error al cargar la caja registradora'))
      } finally {
        setLoadingCashRegister(false)
      }
    }
    loadData()
  }, [t])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError(null)
    if (success) setSuccess(false)
  }

  const validateForm = () => {
    if (!formData.cashRegisterId) return setError('Debe seleccionar una caja'), false
    if (!formData.concept.trim()) return setError('Debe indicar un concepto'), false
    const amount = parseFloat(formData.amount)
    if (isNaN(amount) || amount <= 0) return setError('El monto debe ser mayor a 0'), false
    return true
  }

  const handleSubmit = async (shouldReset = false) => {
    if (!validateForm()) return
    setLoading(true)
    setError(null)
    try {
      const amount = parseFloat(formData.amount)
      await cashRegisterService.registerMovement(formData.cashRegisterId as number, {
        movement_type: formData.movementType,
        amount: amount,
        concept: formData.concept.trim(),
        notes: formData.notes?.trim() || null,
      })
      telemetry.record('cash_movement.registered', { movement_type: formData.movementType, amount })
      setSuccess(true)
      if (shouldReset) {
        setFormData({ ...formData, concept: '', amount: '', notes: '' })
        const cr = await cashRegisterService.getActiveCashRegister()
        if (cr) setActiveCashRegister(cr)
      } else {
        setTimeout(() => navigate('/movimientos-caja'), 1200)
      }
    } catch (err: any) {
      setError(err.message || 'Error al registrar el movimiento')
    } finally {
      setLoading(false)
    }
  }

  if (loadingCashRegister) return (
    <div className='flex items-center justify-center min-h-[60vh]'>
      <RefreshCw className="text-primary animate-spin w-12 h-12" />
    </div>
  )

  const config = MOVEMENT_CONFIG[formData.movementType]

  return (
    <div className='flex flex-col gap-8 animate-in fade-in duration-500 font-display bg-background-light dark:bg-background-dark min-h-full p-2'>
      {/* Header section with breadcrumb-like navigation */}
      <div className='flex flex-col md:flex-row md:items-center justify-between gap-6'>
        <div className='flex flex-col gap-3'>
          <button 
            onClick={() => navigate('/movimientos-caja')}
            className='flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors w-fit'
          >
            <ChevronLeft className='w-3.5 h-3.5' /> Volver a Movimientos
          </button>
          <div className='flex items-center gap-5 border-l-4 border-primary pl-5 py-1'>
            <div className={`size-14 rounded-2xl flex items-center justify-center shadow-fluent-8 border ${config.colorClass}`}>
              {config.icon}
            </div>
            <div>
              <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase leading-none'>{config.title}</h1>
              <p className='text-text-secondary text-sm font-medium mt-1.5'>{config.description}</p>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Button variant='ghost' onClick={() => navigate('/movimientos-caja')} disabled={loading} className="h-11 font-black uppercase tracking-widest text-[10px] text-text-secondary">
            Cancelar
          </Button>
          <Button variant='outline' onClick={() => handleSubmit(true)} disabled={loading || !activeCashRegister} className="h-11 px-6 font-black uppercase tracking-widest text-[10px] rounded-xl border-border-subtle bg-white dark:bg-slate-900">
            <Plus className='w-4 h-4 mr-2' /> Guardar y Nuevo
          </Button>
          <Button onClick={() => handleSubmit(false)} disabled={loading || !activeCashRegister} className="h-11 px-10 font-black uppercase tracking-widest text-[11px] rounded-xl shadow-fluent-8 bg-primary hover:bg-primary-hover text-white transition-all active:scale-95">
            {loading ? <RefreshCw className="animate-spin mr-2 w-4 h-4" /> : <Save className="mr-2 w-4 h-4" />}
            {loading ? 'Guardando...' : 'Confirmar Registro'}
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-10 items-start'>
        {/* Main Form Card */}
        <div className='lg:col-span-8'>
          <Card className='border-none rounded-3xl shadow-fluent-2 bg-white dark:bg-slate-900 overflow-hidden'>
            <CardContent className='p-10 space-y-10'>
              <div className='space-y-4'>
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Clase de Transacción</Label>
                <SegmentedControl
                  options={[
                    { value: 'INCOME', label: 'Ingreso (+)' },
                    { value: 'EXPENSE', label: 'Egreso (-)' },
                    { value: 'ADJUSTMENT', label: 'Ajuste (±)' },
                  ]}
                  value={formData.movementType}
                  onChange={(v) => handleInputChange('movementType', v)}
                  className='h-14 p-1.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-border-subtle/50'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-10'>
                <div className='space-y-4'>
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Concepto Operativo</Label>
                  <div className='relative group'>
                    <select
                      value={formData.concept}
                      onChange={e => handleInputChange('concept', e.target.value)}
                      className='w-full h-14 pl-5 pr-12 bg-slate-50 dark:bg-slate-950 border border-border-subtle rounded-2xl text-sm font-black uppercase tracking-tight focus:ring-4 focus:ring-primary/5 outline-none appearance-none cursor-pointer transition-all hover:border-primary/30'
                      required
                    >
                      <option value='' disabled>Seleccione un motivo...</option>
                      {concepts[formData.movementType].map(concept => (
                        <option key={concept} value={concept}>{concept}</option>
                      ))}
                    </select>
                    <ChevronRight className='absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 rotate-90 pointer-events-none group-hover:text-primary transition-colors w-5 h-5' />
                  </div>
                </div>

                <div className='space-y-4'>
                  <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Monto de la Operación</Label>
                  <div className='relative'>
                    <span className='absolute inset-y-0 left-0 pl-5 flex items-center text-slate-400 font-black text-xl'>₲</span>
                    <Input
                      type='number'
                      value={formData.amount}
                      onChange={e => handleInputChange('amount', e.target.value)}
                      placeholder='0.00'
                      className='h-14 pl-12 font-mono font-black text-2xl border-border-subtle rounded-2xl bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-primary/5'
                      required
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <Label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 ml-1">Memoria / Observaciones (Opcional)</Label>
                <Textarea
                  value={formData.notes}
                  onChange={e => handleInputChange('notes', e.target.value)}
                  placeholder="Describa detalles específicos para auditoría futura..."
                  rows={5}
                  className='resize-none rounded-3xl border-border-subtle bg-slate-50 dark:bg-slate-950 focus:ring-4 focus:ring-primary/5 p-6 font-medium text-text-main'
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status & Help Sidebar */}
        <div className='lg:col-span-4 space-y-8'>
          <Card className='border-none rounded-3xl shadow-fluent-2 bg-white dark:bg-slate-900 overflow-hidden'>
            <div className='bg-primary p-8 text-white relative overflow-hidden'>
              <div className='absolute -right-6 -top-6 size-32 bg-white/10 rounded-full blur-3xl'></div>
              <p className='text-[10px] font-black uppercase tracking-[0.3em] text-white/60 mb-2'>Estado de Caja</p>
              <h3 className='text-xl font-black tracking-tighter uppercase leading-tight'>{activeCashRegister?.name || 'Sin Caja'}</h3>
              <div className='mt-8 flex justify-between items-end'>
                <div className='space-y-1'>
                  <p className='text-[9px] font-bold uppercase tracking-widest text-white/50'>Balance Actual</p>
                  <p className='text-3xl font-black font-mono tracking-tighter'>₲ {activeCashRegister?.current_balance?.toLocaleString() || '0'}</p>
                </div>
                <div className='size-12 rounded-2xl bg-white/20 flex items-center justify-center border border-white/20 backdrop-blur-md'>
                  <Wallet className='text-white w-6 h-6' />
                </div>
              </div>
            </div>
            <CardContent className='p-8 space-y-6'>
              <div className='flex items-start gap-4'>
                <div className='size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0'><CheckCircle2 className='w-4 h-4' /></div>
                <div>
                  <p className='text-xs font-black uppercase tracking-tight text-text-main'>Trazabilidad Total</p>
                  <p className='text-[11px] text-text-secondary mt-1 font-medium'>Cada movimiento queda registrado con usuario, fecha y hora exacta.</p>
                </div>
              </div>
              <div className='flex items-start gap-4'>
                <div className='size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 flex-shrink-0'><Settings className='w-4 h-4' /></div>
                <div>
                  <p className='text-xs font-black uppercase tracking-tight text-text-main'>Impacto Inmediato</p>
                  <p className='text-[11px] text-text-secondary mt-1 font-medium'>El balance se actualiza en tiempo real al confirmar el registro.</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback messages inside Sidebar */}
          {(success || error) && (
            <div className={`p-6 rounded-3xl border-2 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500 ${
              success ? 'bg-green-50 border-green-100 text-green-800' : 'bg-red-50 border-red-100 text-red-800'
            }`}>
              <div className='flex items-center gap-3'>
                {success ? <CheckCircle2 className="text-success" /> : <AlertCircle className="text-error" />}
                <p className='text-sm font-black uppercase tracking-tight'>
                  {success ? 'Operación Exitosa' : 'Error de Registro'}
                </p>
              </div>
              <p className='text-xs font-medium leading-relaxed'>
                {success ? 'El movimiento ha sido procesado correctamente en el sistema central.' : error}
              </p>
              {success && (
                <div className='h-1.5 w-full bg-green-200/50 rounded-full overflow-hidden'>
                  <div className='h-full bg-green-500 animate-[progress_1.2s_linear]'></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default RegisterCashMovement
