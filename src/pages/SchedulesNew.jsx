/**
 * Nueva Página de Gestión de Horarios (SchedulesNew)
 * Vista de Gestión (Tabla + Herramientas) siguiendo el diseño de admin_schedule_code.html
 */

import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  MoreHorizontal,
  Edit,
  X,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/useToast'
import { useI18n } from '@/lib/i18n'
// import { useThemeStyles } from '@/hooks/useThemeStyles';

// Stores
import useScheduleStore from '@/store/useScheduleStore'
import useProductStore from '@/store/useProductStore'

// --- Helpers ---
const formatDate = date => {
  return date.toISOString().split('T')[0]
}

const formatDisplayDate = dateStr => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

const formatTimeRange = (start, end) => {
  const startTime = new Date(start).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
  const endTime = new Date(end).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  })
  return `${startTime} - ${endTime}`
}

const SchedulesNew = () => {
  const { t } = useI18n()
  // const { styles } = useThemeStyles();

  // --- Stores ---
  const {
    generateTodaySchedules,
    generateTomorrowSchedules,
    generateSchedulesForDateWithCustomRange,
  } = useScheduleStore()

  const { products, fetchServiceCourts } = useProductStore()

  // --- Local State ---
  const [filters, setFilters] = useState({
    date: formatDate(new Date()),
    productId: 'all',
    status: 'all', // 'all', 'available', 'reserved'
  })

  const [schedules, setSchedules] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})

  // Modal de Rango Personalizado
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
  const [customRange, setCustomRange] = useState({
    targetDate: formatDate(new Date()),
    startHour: 6,
    endHour: 23,
    selectedProducts: [],
  })

  // Tabs State
  const [activeTab, setActiveTab] = useState('schedules')

  // --- Data Loading ---
  const loadSchedules = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const scheduleService = (await import('@/services/scheduleService'))
        .scheduleService

      // Usar endpoint optimizado si es hoy, o general para otros días
      const todayStr = formatDate(new Date())
      let result

      if (filters.date === todayStr && filters.productId === 'all') {
        result = await scheduleService.getTodaySchedules()
      } else {
        // Si hay filtro de producto, usamos getAvailableSchedules (específico) o filtramos en cliente
        if (filters.productId !== 'all') {
          result = await scheduleService.getAvailableSchedules(
            filters.productId,
            filters.date
          )
          // Normalizar respuesta si es array directo
          if (Array.isArray(result)) {
            result = { schedules: result, count: result.length }
          }
        } else {
          result = await scheduleService.getAvailableSchedulesAll({
            date: filters.date,
            limit: 100,
          })
        }
      }

      let loadedSchedules =
        result?.schedules || (Array.isArray(result) ? result : [])

      // Filtrar por estado en cliente si es necesario
      if (filters.status !== 'all') {
        const isAvailable = filters.status === 'available'
        loadedSchedules = loadedSchedules.filter(
          s => s.is_available === isAvailable
        )
      }

      setSchedules(loadedSchedules)
    } catch (error) {
      console.error('Error loading schedules:', error)
      setSchedules([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  // --- Effects ---
  useEffect(() => {
    if (products.length === 0) {
      fetchServiceCourts()
    }
  }, [products.length, fetchServiceCourts])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  // --- Handlers ---
  const handleGenerateToday = async () => {
    setActionLoading(prev => ({ ...prev, today: true }))
    try {
      await generateTodaySchedules()
      if (filters.date === formatDate(new Date())) {
        loadSchedules()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(prev => ({ ...prev, today: false }))
    }
  }

  const handleGenerateTomorrow = async () => {
    setActionLoading(prev => ({ ...prev, tomorrow: true }))
    try {
      await generateTomorrowSchedules()
      // Si el usuario está viendo mañana, recargar
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      if (filters.date === formatDate(tomorrow)) {
        loadSchedules()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(prev => ({ ...prev, tomorrow: false }))
    }
  }

  const handleCustomGenerate = async () => {
    setActionLoading(prev => ({ ...prev, custom: true }))
    try {
      const productIds =
        customRange.selectedProducts.length > 0
          ? customRange.selectedProducts
          : null
      await generateSchedulesForDateWithCustomRange(
        customRange.targetDate,
        customRange.startHour,
        customRange.endHour,
        productIds
      )
      setIsCustomModalOpen(false)
      if (filters.date === customRange.targetDate) {
        loadSchedules()
      }
    } catch (error) {
      console.error(error)
    } finally {
      setActionLoading(prev => ({ ...prev, custom: false }))
    }
  }

  return (
    <div className='schedules-new'>
      {/* Header */}
      <header className='schedules-new__header'>
        <div className='schedules-new__title-group'>
          <Link to='/gestion-reservas' className='schedules-new__back-link'>
            <ArrowLeft />
          </Link>
          <h1 className='schedules-new__title'>
            {t('schedules.title', 'Horarios')}
          </h1>
        </div>
      </header>

      {/* Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='schedules-new__tabs'>
          <TabsTrigger value='schedules' className='schedules-new__tab'>
            Gestión de Horarios
          </TabsTrigger>
          <TabsTrigger value='details' className='schedules-new__tab'>
            Detalles
          </TabsTrigger>
        </TabsList>

        <TabsContent value='schedules' className='mt-0'>
          {/* Toolbar (Filters + Actions) */}
          <div className='schedules-new__toolbar'>
            {/* Filters */}
            <div className='schedules-new__filters'>
              <div className='filter-group'>
                <label htmlFor='product-filter'>Producto</label>
                <select
                  id='product-filter'
                  value={filters.productId}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      productId: e.target.value,
                    }))
                  }
                  className='form-select'
                >
                  <option value='all'>Todas las canchas</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className='filter-group'>
                <label htmlFor='date-filter'>Fecha</label>
                <Input
                  id='date-filter'
                  type='date'
                  value={filters.date}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, date: e.target.value }))
                  }
                  className='form-input'
                />
              </div>

              <div className='filter-group filter-group--status'>
                <label>Estado</label>
                <div className='status-toggles'>
                  <button
                    className={`status-toggle ${
                      filters.status === 'all' ? 'active' : ''
                    }`}
                    onClick={() =>
                      setFilters(prev => ({ ...prev, status: 'all' }))
                    }
                  >
                    Todos
                  </button>
                  <button
                    className={`status-toggle ${
                      filters.status === 'available' ? 'active' : ''
                    }`}
                    onClick={() =>
                      setFilters(prev => ({ ...prev, status: 'available' }))
                    }
                  >
                    Disponible
                  </button>
                  <button
                    className={`status-toggle ${
                      filters.status === 'reserved' ? 'active' : ''
                    }`}
                    onClick={() =>
                      setFilters(prev => ({ ...prev, status: 'reserved' }))
                    }
                  >
                    Reservado
                  </button>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className='schedules-new__actions'>
              <button
                onClick={handleGenerateToday}
                disabled={actionLoading.today}
                className='btn btn--primary'
              >
                {actionLoading.today && (
                  <RefreshCw className='schedules-new__btn-icon schedules-new__icon-spin' />
                )}
                Generar para Hoy
              </button>
              <button
                onClick={handleGenerateTomorrow}
                disabled={actionLoading.tomorrow}
                className='btn btn--subtle'
              >
                {actionLoading.tomorrow && (
                  <RefreshCw className='schedules-new__btn-icon schedules-new__icon-spin' />
                )}
                Generar para Mañana
              </button>
              <button
                onClick={() => setIsCustomModalOpen(true)}
                className='btn btn--secondary'
              >
                Generar Rango Personalizado
              </button>
            </div>
          </div>

          {/* Data Table */}
          <div className='schedules-new__table-container'>
            <table className='schedules-table'>
              <thead>
                <tr>
                  <th>Producto</th>
                  <th>Fecha y Hora</th>
                  <th>Estado</th>
                  <th>Usuario</th>
                  <th className='text-right'>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan='5' className='text-center py-8'>
                      <div className='flex justify-center items-center gap-2'>
                        <RefreshCw className='w-5 h-5 animate-spin text-primary' />
                        <span>Cargando horarios...</span>
                      </div>
                    </td>
                  </tr>
                ) : schedules.length === 0 ? (
                  <tr>
                    <td colSpan='5' className='text-center py-16'>
                      <div className='flex flex-col items-center gap-2 text-muted-foreground'>
                        <Search className='w-12 h-12 opacity-20' />
                        <p className='font-semibold'>
                          No se encontraron horarios
                        </p>
                        <p className='text-sm'>
                          Pruebe a cambiar los filtros o genere nuevos horarios.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  schedules.map((schedule, index) => (
                    <tr key={schedule.id || index}>
                      <td className='font-medium'>
                        {schedule.product_name || 'Producto Desconocido'}
                      </td>
                      <td>
                        {formatDisplayDate(schedule.start_time)},{' '}
                        {formatTimeRange(
                          schedule.start_time,
                          schedule.end_time
                        )}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            schedule.is_available
                              ? 'status-available'
                              : 'status-reserved'
                          }`}
                        >
                          <span className='dot'></span>
                          {schedule.is_available ? 'Disponible' : 'Reservado'}
                        </span>
                      </td>
                      <td>
                        {schedule.is_available
                          ? 'N/A'
                          : schedule.user_name || 'Usuario'}
                      </td>
                      <td className='text-right'>
                        <div className='flex justify-end gap-1'>
                          {schedule.is_available ? (
                            <button
                              className='schedules-new__table-btn'
                              title='Opciones'
                            >
                              <MoreHorizontal className='schedules-new__table-icon' />
                            </button>
                          ) : (
                            <>
                              <button
                                className='schedules-new__table-btn'
                                title='Editar'
                              >
                                <Edit className='schedules-new__table-icon' />
                              </button>
                              <button
                                className='schedules-new__table-btn schedules-new__table-btn--destructive'
                                title='Eliminar'
                              >
                                <X className='schedules-new__table-icon' />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value='details'>
          <div className='p-8 text-center text-muted-foreground'>
            <p>Seleccione un horario para ver los detalles.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Custom Range Modal */}
      <Dialog open={isCustomModalOpen} onOpenChange={setIsCustomModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generar Rango Personalizado</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <label>Fecha Objetivo</label>
              <Input
                type='date'
                value={customRange.targetDate}
                onChange={e =>
                  setCustomRange(prev => ({
                    ...prev,
                    targetDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='grid gap-2'>
                <label>Hora Inicio</label>
                <select
                  className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                  value={customRange.startHour}
                  onChange={e =>
                    setCustomRange(prev => ({
                      ...prev,
                      startHour: parseInt(e.target.value),
                    }))
                  }
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i}:00
                    </option>
                  ))}
                </select>
              </div>
              <div className='grid gap-2'>
                <label>Hora Fin</label>
                <select
                  className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                  value={customRange.endHour}
                  onChange={e =>
                    setCustomRange(prev => ({
                      ...prev,
                      endHour: parseInt(e.target.value),
                    }))
                  }
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>
                      {i}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsCustomModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCustomGenerate}
              disabled={actionLoading.custom}
            >
              {actionLoading.custom && (
                <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
              )}
              Generar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default SchedulesNew
