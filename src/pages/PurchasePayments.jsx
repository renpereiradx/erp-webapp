/**
 * PurchasePayments Page - Refactored to Tailwind (Fluent 2.0)
 * Optimized for Mobile and Tablet - Unified with Sales style
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  RefreshCw,
  Download,
  PlusCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowLeft,
  Calendar,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  CircleDollarSign,
  Building,
  User,
  Eye,
  Receipt
} from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import RegisterPaymentModal from '@/components/purchase-payments/RegisterPaymentModal'
import DataState from '@/components/ui/DataState'
import ToastContainer from '@/components/ui/ToastContainer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectItem,
} from '@/components/ui/select'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import usePurchasePaymentsMvpStore from '@/store/usePurchasePaymentsMvpStore'
import { useToast } from '@/hooks/useToast'
import { normalizeCurrencyCode, formatPYG } from '@/utils/currencyUtils'
import { cn } from '@/lib/utils'

const currencyFormatter = (lang, currency) => {
  const code = normalizeCurrencyCode(currency)
  if (code === 'PYG') {
    return { format: (val) => formatPYG(val) }
  }
  return new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

const dateFormatterFactory = lang =>
  new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-PY', {
    dateStyle: 'medium',
  })

const normalizeOrderForModal = order => {
  if (!order) return null
  const pendingAmount = order.pendingAmount ?? null
  return {
    id: order.id,
    pendingAmount: pendingAmount !== null ? Number.parseFloat(pendingAmount) : null,
    currency: order.currency || 'PYG',
    supplierName: order.supplier?.name || '',
    supplierId: order.supplier?.id ?? null,
    priority: order.priority ?? null,
  }
}

const PurchasePaymentsPage = () => {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { 
    toasts, 
    removeToast, 
    info: showInfo, 
    success: showSuccess, 
    error: showError,
    errorFrom 
  } = useToast()

  const [isRegisterModalOpen, setRegisterModalOpen] = useState(false)
  const [modalOrder, setModalOrder] = useState(null)

  const {
    orders, filters, meta, loading, error, fetchOrders, setFilter, resetFilters, processPayment
  } = usePurchasePaymentsMvpStore()

  // Manejar carga inicial con feedback
  useEffect(() => { 
    fetchOrders().catch(err => {
      errorFrom(err, { fallback: 'No se pudieron cargar las órdenes de pago' })
    }) 
  }, [fetchOrders, errorFrom])

  const dateFormatter = useMemo(() => dateFormatterFactory(lang), [lang])
  const formatCurrency = (val, cur) => currencyFormatter(lang, cur).format(val || 0)

  const handleRefresh = async () => { 
    try {
      showInfo('Actualizando listado...')
      await fetchOrders()
      showSuccess('Listado actualizado')
    } catch (err) {
      errorFrom(err, { fallback: 'Error al actualizar el listado' })
    }
  }

  const handleReset = () => { 
    resetFilters()
    fetchOrders() 
    showInfo('Filtros reiniciados')
  }

  const handleRegisterPayment = order => {
    setModalOrder(normalizeOrderForModal(order))
    setRegisterModalOpen(true)
  }

  const handlePaymentSubmit = async (paymentData) => {
    try {
      await processPayment({
        orderId: paymentData.orderId,
        amount: paymentData.amount,
        payment_method_id: paymentData.paymentMethodId,
        currency_code: paymentData.currencyCode,
        currency_id: paymentData.currencyId,
        exchange_rate: paymentData.exchange_rate,
        original_amount: paymentData.original_amount,
        reference: paymentData.reference,
        cash_register_id: paymentData.cashRegisterId,
        notes: paymentData.notes
      })
      setRegisterModalOpen(false)
      showSuccess('Pago registrado exitosamente')
      await fetchOrders()
    } catch (err) {
      console.error('Payment processing error:', err)
      errorFrom(err, { fallback: 'No se pudo procesar el pago' })
      throw err // Mantener el error para que el modal no se cierre prematuramente si es necesario
    }
  }

  const getStatusBadge = status => {
    const s = status?.toLowerCase()
    switch (s) {
      case 'completed': case 'paid': case 'pagado':
        return <Badge className="bg-green-100 text-success border-green-200 uppercase font-black text-[9px] px-2.5 py-1 rounded-full"><span className='size-1.5 rounded-full bg-success mr-1.5'></span>Pagado</Badge>
      case 'partial': case 'parcial':
        return <Badge className="bg-blue-100 text-info border-blue-200 uppercase font-black text-[9px] px-2.5 py-1 rounded-full">Parcial</Badge>
      case 'overdue': case 'vencido':
        return <Badge className="bg-red-100 text-error border-red-200 uppercase font-black text-[9px] px-2.5 py-1 rounded-full">Vencido</Badge>
      default:
        return <Badge className="bg-slate-100 text-text-secondary border-slate-200 uppercase font-black text-[9px] px-2.5 py-1 rounded-full">Pendiente</Badge>
    }
  }

  return (
    <div className='flex flex-col gap-6 animate-in fade-in duration-500 font-display'>
      {/* Header Section */}
      <div className='flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-l-4 border-primary pl-6 py-2'>
        <div className='flex items-center gap-4'>
          <div className='size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-fluent-2'>
            <Receipt size={28} />
          </div>
          <div>
            <h1 className='text-3xl font-black text-text-main tracking-tighter uppercase leading-none'>Pagos a Proveedores</h1>
            <p className='text-text-secondary text-sm font-medium mt-1'>
              Gestión de saldos y vencimientos de facturas de compra
            </p>
          </div>
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button variant='outline' onClick={handleRefresh} disabled={loading} className='h-10 px-4 border-border-subtle font-black uppercase text-[10px] tracking-widest'>
            <RefreshCw size={14} className={cn("mr-2", loading && "animate-spin")} /> {loading ? 'Cargando...' : 'Actualizar'}
          </Button>
          <Button variant='outline' className='h-10 px-4 border-border-subtle font-black uppercase text-[10px] tracking-widest'>
            <Download size={14} className='mr-2' /> Reporte
          </Button>
        </div>
      </div>

      <div className='space-y-6'>
        {/* Filters Toolbar */}
        <div className='bg-white dark:bg-surface-dark p-4 rounded-xl border border-border-subtle shadow-fluent-2 flex flex-col md:flex-row md:items-center justify-between gap-4'>
          <div className='flex-1 max-md relative'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 text-slate-400' size={18} />
            <Input
              className='pl-10 h-10 border-border-subtle rounded-full bg-slate-50 focus:bg-white transition-all font-bold text-xs uppercase tracking-wider'
              placeholder='Buscar por proveedor o N° orden...'
              value={filters.searchTerm || ''}
              onChange={e => setFilter('searchTerm', e.target.value)}
            />
          </div>
          
          <div className='flex items-center gap-2'>
            <Select value={filters.status || 'ALL'} onValueChange={val => setFilter('status', val)}>
              <SelectTrigger className='h-10 w-[160px] rounded-lg border-border-subtle font-bold text-xs uppercase'>
                <SelectValue placeholder='Estado' />
              </SelectTrigger>
              <SelectContent className='rounded-xl border-border-subtle shadow-fluent-16'>
                <SelectItem value='ALL' className='font-bold text-xs uppercase'>Todos los estados</SelectItem>
                <SelectItem value='PENDING' className='font-bold text-xs uppercase text-warning'>Pendientes</SelectItem>
                <SelectItem value='PARTIAL' className='font-bold text-xs uppercase text-info'>Parciales</SelectItem>
                <SelectItem value='PAID' className='font-bold text-xs uppercase text-success'>Pagados</SelectItem>
              </SelectContent>
            </Select>
            <Button variant='ghost' size='icon' onClick={handleReset} className='size-10 text-slate-400 hover:text-primary rounded'><Filter size={20} /></Button>
          </div>
        </div>

        {/* Content Section */}
        {error ? (
          <DataState variant='error' title='Error de conexión' message={error} onRetry={fetchOrders} />
        ) : loading && orders.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-32 gap-4'><Loader2 className='w-12 h-12 animate-spin text-primary opacity-20' /><p className='text-[10px] font-black uppercase tracking-widest text-slate-400 tracking-[0.3em]'>Cargando Órdenes...</p></div>
        ) : orders.length === 0 ? (
          <DataState variant='empty' title='Sin resultados' message='No se encontraron órdenes de compra que coincidan con los filtros.' onRetry={handleReset} />
        ) : (
          <div className='space-y-6'>
            {/* Desktop Table View */}
            <div className='hidden lg:block overflow-hidden rounded-xl border border-border-subtle bg-white dark:bg-surface-dark shadow-fluent-2'>
              <Table>
                <TableHeader className='bg-slate-50/80 dark:bg-slate-800/50'>
                  <TableRow>
                    <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-6'>Orden / Fecha</TableHead>
                    <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-400'>Proveedor</TableHead>
                    <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right'>Total</TableHead>
                    <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right'>Saldo</TableHead>
                    <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-400'>Estado</TableHead>
                    <TableHead className='text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right px-6'>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className='divide-y divide-border-subtle'>
                  {orders.map(order => (
                    <TableRow key={order.id} className='hover:bg-slate-50 transition-colors group border-b border-border-subtle'>
                      <TableCell className='py-4 px-6'>
                        <div className='flex flex-col'>
                          <span className='font-black text-primary font-mono'>#{order.id}</span>
                          <span className='text-[10px] font-bold text-slate-400 uppercase mt-0.5'>{dateFormatter.format(new Date(order.issue_date || Date.now()))}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <div className='size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 ring-1 ring-border-subtle shadow-sm'><Building size={14} /></div>
                          <span className='font-bold text-sm text-text-main'>{order.supplier?.name || '---'}</span>
                        </div>
                      </TableCell>
                      <TableCell className='text-right font-bold text-text-secondary tabular-nums font-mono'>{formatCurrency(order.total_amount, order.currency)}</TableCell>
                      <TableCell className='text-right font-black text-text-main tabular-nums font-mono'>{formatCurrency(order.pendingAmount, order.currency)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell className='text-right px-6'>
                        <div className='flex justify-end gap-2'>
                          <Button variant='ghost' size='icon' onClick={() => navigate(`/pagos-compras/${order.id}`)} className='size-8 text-text-secondary hover:text-primary rounded'><Eye size={18} /></Button>
                          {['pending', 'partial', 'vencido'].includes(order.status?.toLowerCase()) && (
                            <Button variant='ghost' size='icon' onClick={() => handleRegisterPayment(order)} className='size-8 text-text-secondary hover:text-success rounded'><CheckCircle2 size={18} /></Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className='lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4'>
              {orders.map(order => (
                <Card key={order.id} className='rounded-xl border-border-subtle shadow-fluent-2 overflow-hidden hover:shadow-fluent-8 transition-all cursor-pointer' onClick={() => navigate(`/pagos-compras/${order.id}`)}>
                  <CardContent className='p-5 space-y-4'>
                    <div className='flex justify-between items-start'>
                      <div className='flex items-center gap-3'>
                        <div className='size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-sm'><Receipt size={20} /></div>
                        <div>
                          <p className='font-black text-primary font-mono uppercase leading-none mb-1'>#{order.id}</p>
                          <p className='text-[10px] font-bold text-slate-400 uppercase tracking-widest'>{dateFormatter.format(new Date(order.issue_date || Date.now()))}</p>
                        </div>
                      </div>
                      {getStatusBadge(order.status)}
                    </div>
                    
                    <div className='space-y-1'><p className='text-[9px] font-black uppercase text-slate-400 tracking-widest'>Proveedor</p><p className='font-bold text-sm text-text-main line-clamp-1'>{order.supplier?.name || '---'}</p></div>
                    
                    <div className='grid grid-cols-2 gap-4 pt-2 border-t border-slate-100'>
                      <div><p className='text-[9px] font-black uppercase text-slate-400 tracking-widest'>Total Orden</p><p className='font-bold text-sm tabular-nums font-mono'>{formatCurrency(order.total_amount, order.currency)}</p></div>
                      <div className='text-right'><p className='text-[9px] font-black uppercase text-primary tracking-widest'>Saldo Pendiente</p><p className='font-black text-primary tabular-nums font-mono'>{formatCurrency(order.pendingAmount, order.currency)}</p></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <RegisterPaymentModal open={isRegisterModalOpen} onOpenChange={setRegisterModalOpen} order={modalOrder} onSubmit={handlePaymentSubmit} />
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}

export default PurchasePaymentsPage
