/**
 * BookingManagement Page - Refactored to Tailwind (Fluent 2.0)
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import DataState from '@/components/ui/DataState'
import BookingFormModal from '@/components/BookingFormModal'
import AvailableSlots from '@/pages/AvailableSlots'
import ToastContainer from '@/components/ui/ToastContainer'
import { useI18n } from '@/lib/i18n'
import useReservationStore from '@/store/useReservationStore'
import useProductStore from '@/store/useProductStore'
import useClientStore from '@/store/useClientStore'
import { useToast } from '@/hooks/useToast'

const BookingManagement = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { toasts, removeToast, success: showSuccess } = useToast()

  // Store States
  const {
    reservations,
    loading,
    error,
    fetchReservations,
    clearError,
    cancelReservation,
    confirmReservation,
  } = useReservationStore()

  const { products, fetchProducts } = useProductStore()

  // Local States for Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Date Filters - Default last 30 days
  const getDefaultDates = () => {
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: today.toISOString().split('T')[0],
    }
  }

  const [dateRange, setDateRange] = useState(getDefaultDates())

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState(null)
  const [initialReservationData, setInitialReservationData] = useState(null)

  // Schedule Explorer State
  const [showScheduleExplorer, setShowScheduleExplorer] = useState(false)

  // Confirmation States
  const [cancellingReservation, setCancellingReservation] = useState(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [confirmingReservation, setConfirmingReservation] = useState(null)
  const [showConfirmConfirm, setShowConfirmConfirm] = useState(false)

  // Load initial data
  useEffect(() => {
    fetchReservations({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    })
    fetchProducts()
  }, [fetchReservations, fetchProducts])

  // Local filtering
  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      const clientName = reservation.client_name || ''
      const matchesSearch = clientName
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      const matchesProduct =
        selectedProduct === 'all' ||
        reservation.product_id === parseInt(selectedProduct)

      const matchesStatus =
        selectedStatus === 'all' ||
        reservation.status?.toLowerCase() === selectedStatus.toLowerCase()

      return matchesSearch && matchesProduct && matchesStatus
    })
  }, [reservations, searchTerm, selectedProduct, selectedStatus])

  // Local Pagination
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex)

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedProduct, selectedStatus])

  // Handlers
  const handleBack = () => {
    navigate('/gestion-reservas')
  }

  const handleCreateReservation = () => {
    setShowScheduleExplorer(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingReservation(null)
    setInitialReservationData(null)
    setShowScheduleExplorer(true)
  }

  const handleModalSuccess = () => {
    fetchReservations()
    setShowScheduleExplorer(false)
    showSuccess('Reserva creada exitosamente')
  }

  const handleReserveSlot = slotData => {
    setInitialReservationData(slotData)
    setShowScheduleExplorer(false)
    setIsModalOpen(true)
  }

  const handleRetry = () => {
    clearError()
    fetchReservations()
  }

  const handleCancelClick = reservation => {
    setCancellingReservation(reservation)
    setShowCancelConfirm(true)
  }

  const handleConfirmCancel = async () => {
    if (!cancellingReservation) return

    try {
      const result = await cancelReservation(
        cancellingReservation.id || cancellingReservation.reserve_id
      )
      if (result && result.success) {
        showSuccess('Reserva cancelada exitosamente')
        fetchReservations({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })
      }
    } catch (error) {
      console.error('Error al cancelar reserva:', error)
    } finally {
      setShowCancelConfirm(false)
      setCancellingReservation(null)
    }
  }

  const handleConfirmClick = reservation => {
    setConfirmingReservation(reservation)
    setShowConfirmConfirm(true)
  }

  const handleConfirmConfirm = async () => {
    if (!confirmingReservation) return

    try {
      const result = await confirmReservation(
        confirmingReservation.id || confirmingReservation.reserve_id
      )
      if (result && result.success) {
        showSuccess('Reserva confirmada exitosamente')
        fetchReservations({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })
      }
    } catch (error) {
      console.error('Error al confirmar reserva:', error)
    } finally {
      setShowConfirmConfirm(false)
      setConfirmingReservation(null)
    }
  }

  const getStatusBadgeClass = status => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower === 'confirmed' || statusLower === 'confirmada') {
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    }
    if (statusLower === 'pending' || statusLower === 'pendiente') {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    }
    if (statusLower === 'cancelled' || statusLower === 'cancelada') {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    }
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
  }

  const formatCurrency = amount => {
    if (!amount) return '-'
    return new Intl.NumberFormat('es-PY', {
      style: 'currency',
      currency: 'PYG',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDateTime = dateString => {
    if (!dateString) return '-'
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat('es-PY', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    } catch {
      return dateString
    }
  }

  if (loading && reservations.length === 0) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-sans">
        <DataState variant="loading" skeletonVariant="list" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-sans">
        <DataState
          variant="error"
          title={t('booking.error.title')}
          message={error}
          onRetry={handleRetry}
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-sans">
      {showScheduleExplorer ? (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowScheduleExplorer(false)}
              className="rounded-full shadow-sm"
            >
              <span className="material-icons-round text-[20px]">chevron_left</span>
            </Button>
            <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark tracking-tight uppercase">
              Consultar Horarios Disponibles
            </h1>
          </div>
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             <div style={{ '--hide-available-slots-header': 'true' }}>
              <style>{`
                .available-slots-header-container {
                  display: none;
                }
              `}</style>
              <AvailableSlots onReserveClick={handleReserveSlot} />
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-6 py-2">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleBack}
                className="rounded-full hover:bg-primary/10 text-primary"
              >
                <span className="material-icons-round text-[20px]">arrow_back</span>
              </Button>
              <h1 className="text-3xl font-semibold text-text-primary-light dark:text-text-primary-dark tracking-tight uppercase">
                {t('booking.title', 'Listado de Reservas')}
              </h1>
            </div>

            <Button
              onClick={handleCreateReservation}
              className="bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest px-6 py-5 rounded-md shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <span className="material-icons-round text-[20px]">add</span>
              {t('booking.action.create', 'Nueva Reserva')}
            </Button>
          </header>

          {/* Filters Bar */}
          <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-surface-dark">
            <CardContent className="p-6 flex flex-col gap-6">
              {/* API Filters (Dates) */}
              <div className="grid grid-cols-1 md:grid-cols-3 items-end gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Desde</label>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="h-10 rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Hasta</label>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="h-10 rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                  />
                </div>
                <Button
                  variant="secondary"
                  onClick={() => fetchReservations({ startDate: dateRange.startDate, endDate: dateRange.endDate })}
                  className="h-10 font-semibold uppercase tracking-widest text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-2 rounded-md"
                >
                  <span className="material-icons-round text-[18px]">search</span>
                  Actualizar Lista
                </Button>
              </div>

              {/* Local Filters */}
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                   <div className="relative w-full sm:w-64">
                    <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                    <input
                      type="text"
                      className="w-full h-10 pl-10 pr-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md text-sm focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder={t('booking.search.placeholder', 'Buscar por cliente...')}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <div className="relative min-w-[160px]">
                    <select
                      className="w-full h-10 pl-4 pr-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                      value={selectedProduct}
                      onChange={e => setSelectedProduct(e.target.value)}
                    >
                      <option value="all">{t('booking.filter.all_products', 'Todos los servicios')}</option>
                      {products.map(product => (
                        <option key={product.id} value={product.id}>{product.name}</option>
                      ))}
                    </select>
                    <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                  </div>

                  <div className="relative min-w-[160px]">
                    <select
                      className="w-full h-10 pl-4 pr-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                      value={selectedStatus}
                      onChange={e => setSelectedStatus(e.target.value)}
                    >
                      <option value="all">{t('booking.filter.all_statuses', 'Todos los estados')}</option>
                      <option value="confirmed">{t('booking.status.confirmed', 'Confirmada')}</option>
                      <option value="pending">{t('booking.status.pending', 'Pendiente')}</option>
                      <option value="cancelled">{t('booking.status.cancelled', 'Cancelada')}</option>
                    </select>
                    <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">expand_more</span>
                  </div>
                </div>

                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full">
                  {filteredReservations.length} Resultados
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Container */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             {filteredReservations.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="size-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <span className="material-icons-round text-[32px]">calendar_today</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Sin reservas</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-xs max-w-xs mx-auto mt-1">No hay reservas registradas con los filtros actuales en el sistema.</p>
               </div>
             ) : (
               <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                  <table className="w-full text-left border-collapse min-w-[1000px]">
                    <thead>
                      <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Servicio</th>
                        <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Cliente</th>
                        <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Usuario</th>
                        <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Fecha/Hora</th>
                        <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Estado</th>
                        <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Duración</th>
                        <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 text-right">Total</th>
                        <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 text-center w-16"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {paginatedReservations.map(reservation => (
                        <tr key={reservation.id || reservation.reserve_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-3">
                              <div className="size-8 bg-primary/10 rounded-md flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <span className="material-icons-round text-[16px]">calendar_today</span>
                              </div>
                              <span className="font-semibold text-slate-900 dark:text-white text-sm">{reservation.product_name || '-'}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                            {reservation.client_name || '-'}
                          </td>
                          <td className="py-2 px-3 text-xs text-slate-500 dark:text-slate-500">
                            {reservation.user_email || reservation.created_by || '-'}
                          </td>
                          <td className="py-2 px-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                            {formatDateTime(reservation.reserve_date || reservation.created_at)}
                          </td>
                          <td className="py-2 px-3">
                             <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border ${getStatusBadgeClass(reservation.status)}`}>
                                <div className="size-1.5 rounded-full bg-current"></div>
                                {reservation.status || '-'}
                             </div>
                          </td>
                          <td className="py-2 px-3 text-sm text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                            {Math.round(parseFloat(reservation.duration || 0))} hrs
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                            {formatCurrency(reservation.total_amount)}
                          </td>
                          <td className="py-2 px-3 text-center">
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="size-8 rounded-md text-slate-400 hover:text-primary transition-colors">
                                    <span className="material-icons-round text-[18px]">more_vert</span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 p-1.5 rounded-xl border-slate-200 dark:border-slate-800 shadow-md">
                                  <DropdownMenuItem 
                                    onClick={() => handleConfirmClick(reservation)}
                                    disabled={['confirmed', 'confirmada', 'cancelled', 'cancelada'].includes(reservation.status?.toLowerCase())}
                                    className="gap-2 py-2 font-medium rounded-md focus:bg-green-50 focus:text-green-600 dark:focus:bg-green-900/30 cursor-pointer"
                                  >
                                    <span className="material-icons-round text-[18px]">check</span> Confirmar Reserva
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleCancelClick(reservation)}
                                    disabled={['cancelled', 'cancelada'].includes(reservation.status?.toLowerCase())}
                                    className="gap-2 py-2 font-medium rounded-md focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-900/30 cursor-pointer text-red-600"
                                  >
                                    <span className="material-icons-round text-[18px]">close</span> Cancelar Reserva
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             )}

             {/* Pagination */}
             {totalPages > 1 && (
                <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-[11px] font-medium text-slate-500">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, filteredReservations.length)} de {filteredReservations.length}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 rounded-md border-slate-200 dark:border-slate-700"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <span className="material-icons-round text-[18px]">chevron_left</span>
                    </Button>
                    
                    <div className="flex items-center gap-1 px-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <Button
                          key={page}
                          variant={page === currentPage ? "default" : "ghost"}
                          className={`size-8 rounded-md font-medium text-sm ${page === currentPage ? 'bg-primary shadow-sm text-white' : 'text-slate-500'}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8 rounded-md border-slate-200 dark:border-slate-700"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <span className="material-icons-round text-[18px]">chevron_right</span>
                    </Button>
                  </div>
                </div>
             )}
          </div>
        </>
      )}

      {/* Modal Section */}
      <BookingFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingReservation={editingReservation}
        initialData={initialReservationData}
      />

      {/* Confirmation Dialogs */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-md max-w-md font-sans">
          <DialogHeader className="gap-2">
            <div className="size-12 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 mb-2 border border-red-100 dark:border-red-800">
              <span className="material-icons-round text-[24px]">close</span>
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight">Confirmar Cancelación</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">¿Está seguro que desea cancelar esta reserva? Esta acción no se puede deshacer.</DialogDescription>
          </DialogHeader>
          {cancellingReservation && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-md space-y-1 border border-slate-100 dark:border-slate-800">
              <p className="text-sm"><strong className="font-semibold">Servicio:</strong> {cancellingReservation.product_name}</p>
              <p className="text-sm"><strong className="font-semibold">Cliente:</strong> {cancellingReservation.client_name}</p>
              <p className="text-sm"><strong className="font-semibold">Fecha:</strong> {formatDateTime(cancellingReservation.start_time || cancellingReservation.reserve_date)}</p>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => setShowCancelConfirm(false)} className="font-medium text-xs">No, volver</Button>
            <Button onClick={handleConfirmCancel} className="bg-red-600 hover:bg-red-700 text-white font-medium text-xs rounded-md px-4 shadow-sm">Sí, cancelar reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showConfirmConfirm} onOpenChange={setShowConfirmConfirm}>
        <DialogContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-md max-w-md font-sans">
          <DialogHeader className="gap-2">
            <div className="size-12 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center text-green-600 mb-2 border border-green-100 dark:border-green-800">
              <span className="material-icons-round text-[24px]">check</span>
            </div>
            <DialogTitle className="text-lg font-semibold tracking-tight">Confirmar Reserva</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">¿Está seguro que desea confirmar esta reserva ahora?</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="ghost" onClick={() => setShowConfirmConfirm(false)} className="font-medium text-xs">No, volver</Button>
            <Button onClick={handleConfirmConfirm} className="bg-green-600 hover:bg-green-700 text-white font-medium text-xs rounded-md px-4 shadow-sm">Sí, confirmar reserva</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}

export default BookingManagement
