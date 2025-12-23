/**
 * Página de Gestión de Reservas - MVP
 * Implementación siguiendo GUIA_MVP_DESARROLLO.md y FLUENT_DESIGN_SYSTEM.md
 *
 * Funcionalidades:
 * - Header con navegación
 * - Sistema de tabs (Radix UI)
 * - Tab "Reservas": Listado, filtros, búsqueda, paginación
 * - Estados: Loading, Error, Empty (DataState)
 * - Integración con useReservationStore
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  Search,
  ChevronDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

  // Estados del store
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
  const { searchResults: clients } = useClientStore()

  // Estados locales para filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProduct, setSelectedProduct] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')

  // Filtros de fecha - por defecto últimos 30 días
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

  // Estados de paginación
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Estados del modal
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingReservation, setEditingReservation] = useState(null)
  const [initialReservationData, setInitialReservationData] = useState(null)

  // Estados para el explorador de horarios disponibles
  const [showScheduleExplorer, setShowScheduleExplorer] = useState(false)

  // Estados para cancelación de reservas
  const [cancellingReservation, setCancellingReservation] = useState(null)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  // Estados para confirmación de reservas
  const [confirmingReservation, setConfirmingReservation] = useState(null)
  const [showConfirmConfirm, setShowConfirmConfirm] = useState(false)

  // Cargar datos al montar (solo una vez con fechas por defecto)
  useEffect(() => {
    fetchReservations({
      startDate: dateRange.startDate,
      endDate: dateRange.endDate,
    })
    fetchProducts()
    // Note: Clients are loaded on-demand via search, not pre-loaded
  }, [fetchReservations, fetchProducts])

  // Filtrado local de reservas
  const filteredReservations = useMemo(() => {
    return reservations.filter(reservation => {
      // Filtro por búsqueda (nombre de cliente)
      const clientName = reservation.client_name || ''
      const matchesSearch = clientName
        .toLowerCase()
        .includes(searchTerm.toLowerCase())

      // Filtro por producto
      const matchesProduct =
        selectedProduct === 'all' ||
        reservation.product_id === parseInt(selectedProduct)

      // Filtro por estado
      const matchesStatus =
        selectedStatus === 'all' ||
        reservation.status?.toLowerCase() === selectedStatus.toLowerCase()

      return matchesSearch && matchesProduct && matchesStatus
    })
  }, [reservations, searchTerm, selectedProduct, selectedStatus])

  // Paginación local
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedReservations = filteredReservations.slice(startIndex, endIndex)

  // Resetear página al cambiar filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, selectedProduct, selectedStatus])

  // Handlers
  const handleBack = () => {
    navigate('/gestion-reservas')
  }

  const handleCreateReservation = () => {
    // En lugar de abrir el modal, mostrar el explorador de horarios
    setShowScheduleExplorer(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingReservation(null)
    setInitialReservationData(null)
    // Volver a mostrar el explorador de horarios
    setShowScheduleExplorer(true)
  }

  const handleModalSuccess = () => {
    // Refresh reservations list after creating/updating
    fetchReservations()
    // Cerrar explorador y volver a lista de reservas
    setShowScheduleExplorer(false)
    // Mostrar notificación de éxito
    showSuccess('Reserva creada exitosamente')
  }

  const handleReserveSlot = slotData => {
    // Cuando el usuario hace clic en "Reservar" en un slot
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
        // Refrescar lista de reservas
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

  const handleCancelCancel = () => {
    setShowCancelConfirm(false)
    setCancellingReservation(null)
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
        // Refrescar lista de reservas
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

  const handleCancelConfirmDialog = () => {
    setShowConfirmConfirm(false)
    setConfirmingReservation(null)
  }

  const getStatusBadgeClass = status => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower === 'confirmed' || statusLower === 'confirmada') {
      return 'status-badge--confirmed'
    }
    if (statusLower === 'pending' || statusLower === 'pendiente') {
      return 'status-badge--pending'
    }
    if (statusLower === 'cancelled' || statusLower === 'cancelada') {
      return 'status-badge--cancelled'
    }
    return ''
  }

  const getStatusLabel = status => {
    const statusLower = status?.toLowerCase() || ''
    if (statusLower === 'confirmed') return t('booking.status.confirmed')
    if (statusLower === 'pending') return t('booking.status.pending')
    if (statusLower === 'cancelled') return t('booking.status.cancelled')
    if (statusLower === 'completed') return t('booking.status.completed')
    return status || '-'
  }

  const formatDuration = duration => {
    if (!duration) return '-'
    // La duración viene en horas desde la API
    return `${Math.round(parseFloat(duration))} hrs`
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

  // Estados de UI
  if (loading && reservations.length === 0) {
    return (
      <div className='booking-management-page'>
        <DataState variant='loading' skeletonVariant='list' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='booking-management-page'>
        <DataState
          variant='error'
          title={t('booking.error.title')}
          message={error}
          onRetry={handleRetry}
        />
      </div>
    )
  }

  return (
    <div className='booking-management-page'>
      {showScheduleExplorer ? (
        /* Vista del Explorador de Horarios Disponibles */
        <div className='schedule-explorer-wrapper'>
          {/* Componente de Horarios Disponibles con botón integrado */}
          <div className='available-slots-with-back'>
            <div className='flex items-center gap-3 mb-6'>
              <Button
                variant='ghost'
                size='icon'
                onClick={() => setShowScheduleExplorer(false)}
                className='w-10 h-10'
              >
                <ChevronLeft className='w-6 h-6' />
              </Button>
              <h1 className='text-3xl font-bold'>
                Consultar Horarios Disponibles
              </h1>
            </div>
            <div style={{ '--hide-available-slots-header': 'true' }}>
              <style>{`
                .available-slots-with-back .available-slots__header {
                  display: none;
                }
              `}</style>
              <AvailableSlots onReserveClick={handleReserveSlot} />
            </div>
          </div>
        </div>
      ) : (
        /* Vista normal de la página */
        <>
          {/* Header con navegación */}
          <header className='booking-management-page__header'>
            <div className='booking-management-page__header-left'>
              <button
                className='booking-management-page__back-button'
                onClick={handleBack}
                aria-label={t('booking.action.back')}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className='booking-management-page__title'>
                {t('booking.title')}
              </h1>
            </div>

            <div className='booking-management-page__header-actions'>
              <Button
                className='btn btn--primary'
                onClick={handleCreateReservation}
              >
                <Plus size={20} />
                {t('booking.action.create')}
              </Button>
            </div>
          </header>

          {/* Tabs */}
          <Tabs
            defaultValue='reservations'
            className='booking-management-page__tabs'
          >
            <TabsList style={{ display: 'none' }}>
              <TabsTrigger value='reservations'>
                {t('booking.tab.reservations')}
              </TabsTrigger>
              {/* Tabs adicionales para futuro */}
              {/* <TabsTrigger value="dashboard">
            {t('booking.tab.dashboard')}
          </TabsTrigger> */}
            </TabsList>

            {/* Tab: Reservas */}
            <TabsContent
              value='reservations'
              className='booking-management-page__tab-content'
            >
              {/* Barra de filtros - Sección 1: Filtros de API (Fechas) */}
              <div className='filters-bar' style={{ marginBottom: '12px' }}>
                <div className='filters-bar__filters' style={{ gap: '12px' }}>
                  {/* Filtro: Fecha Inicio */}
                  <div className='filter-date-group'>
                    <label className='filter-date-label'>Desde</label>
                    <Input
                      type='date'
                      value={dateRange.startDate}
                      onChange={e =>
                        setDateRange(prev => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className='filter-button'
                      aria-label='Fecha inicio'
                    />
                  </div>

                  {/* Filtro: Fecha Fin */}
                  <div className='filter-date-group'>
                    <label className='filter-date-label'>Hasta</label>
                    <Input
                      type='date'
                      value={dateRange.endDate}
                      onChange={e =>
                        setDateRange(prev => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className='filter-button'
                      aria-label='Fecha fin'
                    />
                  </div>

                  {/* Botón Buscar */}
                  <Button
                    className='btn btn--secondary'
                    onClick={() =>
                      fetchReservations({
                        startDate: dateRange.startDate,
                        endDate: dateRange.endDate,
                      })
                    }
                    style={{ marginTop: '24px' }}
                  >
                    <Search size={20} />
                    Buscar
                  </Button>
                </div>
              </div>

              {/* Barra de filtros - Sección 2: Filtros Locales */}
              <div className='filters-bar'>
                <div className='filters-bar__filters'>
                  {/* Filtro: Producto */}
                  <select
                    className='filter-button'
                    value={selectedProduct}
                    onChange={e => setSelectedProduct(e.target.value)}
                    aria-label={t('booking.filter.product')}
                  >
                    <option key='all' value='all'>
                      {t('booking.filter.all_products')}
                    </option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>

                  {/* Filtro: Estado */}
                  <select
                    className='filter-button'
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    aria-label={t('booking.filter.status')}
                  >
                    <option key='all' value='all'>
                      {t('booking.filter.all_statuses')}
                    </option>
                    <option key='confirmed' value='confirmed'>
                      {t('booking.status.confirmed')}
                    </option>
                    <option key='pending' value='pending'>
                      {t('booking.status.pending')}
                    </option>
                    <option key='cancelled' value='cancelled'>
                      {t('booking.status.cancelled')}
                    </option>
                  </select>
                </div>

                {/* Búsqueda */}
                <div className='filters-bar__search'>
                  <div className='search-input'>
                    <Search className='search-input__icon' size={20} />
                    <input
                      type='text'
                      className='search-input__field'
                      placeholder={t('booking.search.placeholder')}
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      aria-label={t('booking.search.placeholder')}
                    />
                  </div>
                </div>
              </div>

              {/* Tabla de reservas */}
              <div style={{ minHeight: '400px' }}>
                {filteredReservations.length === 0 ? (
                  <div
                    className='flex items-center justify-center'
                    style={{ minHeight: '400px' }}
                  >
                    {searchTerm ||
                    selectedProduct !== 'all' ||
                    selectedStatus !== 'all' ? (
                      <DataState
                        variant='empty'
                        title={t('booking.empty.no_results')}
                        message={t('booking.empty.message')}
                      />
                    ) : (
                      <div className='text-center'>
                        <h3 className='text-lg font-semibold mb-2'>
                          Sin reservas
                        </h3>
                        <p className='text-muted-foreground'>
                          No hay reservas en el rango de fechas seleccionado
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className='reservations-table'>
                      <div className='reservations-table__wrapper'>
                        <table
                          className='reservations-table__table'
                          role='table'
                        >
                          <thead className='reservations-table__thead'>
                            <tr>
                              <th
                                className='reservations-table__th'
                                scope='col'
                              >
                                {t('booking.table.product')}
                              </th>
                              <th
                                className='reservations-table__th'
                                scope='col'
                              >
                                {t('booking.table.client')}
                              </th>
                              <th
                                className='reservations-table__th'
                                scope='col'
                              >
                                {t('booking.table.user')}
                              </th>
                              <th
                                className='reservations-table__th'
                                scope='col'
                              >
                                {t('booking.table.created_date')}
                              </th>
                              <th
                                className='reservations-table__th'
                                scope='col'
                              >
                                {t('booking.table.status')}
                              </th>
                              <th
                                className='reservations-table__th'
                                scope='col'
                              >
                                {t('booking.table.duration')}
                              </th>
                              <th
                                className='reservations-table__th reservations-table__th--right'
                                scope='col'
                              >
                                {t('booking.table.total')}
                              </th>
                              <th
                                className='reservations-table__th reservations-table__th--center'
                                scope='col'
                              >
                                {t('booking.table.actions')}
                              </th>
                            </tr>
                          </thead>
                          <tbody className='reservations-table__tbody'>
                            {paginatedReservations.map(reservation => (
                              <tr
                                key={reservation.id || reservation.reserve_id}
                                className='reservations-table__tr'
                              >
                                <td className='reservations-table__td reservations-table__td--product'>
                                  {reservation.product_name || '-'}
                                </td>
                                <td className='reservations-table__td reservations-table__td--secondary'>
                                  {reservation.client_name || '-'}
                                </td>
                                <td className='reservations-table__td reservations-table__td--secondary'>
                                  {reservation.user_email ||
                                    reservation.created_by ||
                                    '-'}
                                </td>
                                <td className='reservations-table__td reservations-table__td--secondary'>
                                  {formatDateTime(
                                    reservation.reserve_date ||
                                      reservation.created_at
                                  )}
                                </td>
                                <td className='reservations-table__td'>
                                  <div
                                    className={`status-badge ${getStatusBadgeClass(
                                      reservation.status
                                    )}`}
                                  >
                                    <span className='status-badge__dot'></span>
                                    {getStatusLabel(reservation.status)}
                                  </div>
                                </td>
                                <td className='reservations-table__td reservations-table__td--secondary'>
                                  {formatDuration(reservation.duration)}
                                </td>
                                <td className='reservations-table__td reservations-table__td--right'>
                                  {formatCurrency(reservation.total_amount)}
                                </td>
                                <td className='reservations-table__td reservations-table__td--center'>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <button
                                        className='actions-menu-button'
                                        aria-label={t('booking.table.actions')}
                                        title={t('booking.table.actions')}
                                      >
                                        <MoreVertical size={20} />
                                      </button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align='end'>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleConfirmClick(reservation)
                                        }
                                        disabled={
                                          reservation.status?.toLowerCase() ===
                                            'confirmed' ||
                                          reservation.status?.toLowerCase() ===
                                            'confirmada' ||
                                          reservation.status?.toLowerCase() ===
                                            'cancelled' ||
                                          reservation.status?.toLowerCase() ===
                                            'cancelada'
                                        }
                                        className='dropdown-menu__item--success'
                                      >
                                        <Check size={16} />
                                        Confirmar Reserva
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleCancelClick(reservation)
                                        }
                                        disabled={
                                          reservation.status?.toLowerCase() ===
                                            'cancelled' ||
                                          reservation.status?.toLowerCase() ===
                                            'cancelada'
                                        }
                                        className='dropdown-menu__item--danger'
                                      >
                                        <X size={16} />
                                        Cancelar Reserva
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div className='pagination'>
                        <div className='pagination__info'>
                          {t('booking.pagination.showing')}{' '}
                          <span className='pagination__info-highlight'>
                            {startIndex + 1}
                            {t('booking.pagination.to')}
                            {Math.min(endIndex, filteredReservations.length)}
                          </span>{' '}
                          {t('booking.pagination.of')}{' '}
                          <span className='pagination__info-highlight'>
                            {filteredReservations.length}
                          </span>
                        </div>

                        <div className='pagination__controls'>
                          <button
                            className='pagination__button'
                            onClick={() =>
                              setCurrentPage(prev => Math.max(1, prev - 1))
                            }
                            disabled={currentPage === 1}
                            aria-label={t('booking.pagination.previous')}
                          >
                            <ChevronLeft size={16} />
                          </button>

                          {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                          ).map(page => (
                            <button
                              key={page}
                              className={`pagination__button ${
                                page === currentPage
                                  ? 'pagination__button--active'
                                  : ''
                              }`}
                              onClick={() => setCurrentPage(page)}
                              aria-label={`Página ${page}`}
                              aria-current={
                                page === currentPage ? 'page' : undefined
                              }
                            >
                              {page}
                            </button>
                          ))}

                          <button
                            className='pagination__button'
                            onClick={() =>
                              setCurrentPage(prev =>
                                Math.min(totalPages, prev + 1)
                              )
                            }
                            disabled={currentPage === totalPages}
                            aria-label={t('booking.pagination.next')}
                          >
                            <ChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Modal de crear/editar reserva */}
      <BookingFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
        editingReservation={editingReservation}
        initialData={initialReservationData}
      />

      {/* Modal de confirmación de cancelación */}
      <Dialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <DialogContent className='booking-cancel-dialog'>
          <DialogHeader>
            <DialogTitle>Confirmar Cancelación</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea cancelar la reserva?
            </DialogDescription>
          </DialogHeader>
          {cancellingReservation && (
            <div className='booking-management-page__reservation-details'>
              <p>
                <strong>Producto:</strong> {cancellingReservation.product_name}
              </p>
              <p>
                <strong>Cliente:</strong> {cancellingReservation.client_name}
              </p>
              <p>
                <strong>Fecha:</strong>{' '}
                {formatDateTime(cancellingReservation.start_time)}
              </p>
            </div>
          )}
          <DialogFooter style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={handleCancelCancel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '120px',
                padding: '8px 16px',
                backgroundColor: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                color: '#111827',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e5e7eb'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f3f4f6'
              }}
            >
              No, volver
            </button>
            <button
              onClick={handleConfirmCancel}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '120px',
                padding: '8px 16px',
                backgroundColor: '#dc2626',
                border: '1px solid #dc2626',
                borderRadius: '6px',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#b91c1c'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#dc2626'
              }}
            >
              Sí, cancelar reserva
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de confirmación para confirmar reserva */}
      <Dialog open={showConfirmConfirm} onOpenChange={setShowConfirmConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reserva</DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea confirmar la reserva?
            </DialogDescription>
          </DialogHeader>
          {confirmingReservation && (
            <div className='booking-management-page__reservation-details'>
              <p>
                <strong>Producto:</strong> {confirmingReservation.product_name}
              </p>
              <p>
                <strong>Cliente:</strong> {confirmingReservation.client_name}
              </p>
              <p>
                <strong>Fecha:</strong>{' '}
                {formatDateTime(confirmingReservation.start_time)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant='ghost' onClick={handleCancelConfirmDialog}>
              No, volver
            </Button>
            <Button className='btn btn--primary' onClick={handleConfirmConfirm}>
              Sí, confirmar reserva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}

export default BookingManagement
