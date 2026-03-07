/**
 * SchedulesNew Page - Refactored to Tailwind (Fluent 2.0)
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  DialogDescription,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/useToast'
import { useI18n } from '@/lib/i18n'
import ToastContainer from '@/components/ui/ToastContainer'

// Stores
import useScheduleStore from '@/store/useScheduleStore'
import useProductStore from '@/store/useProductStore'

const formatDate = date => date.toISOString().split('T')[0]

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
  const options = { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' };
  const startTime = new Date(start).toLocaleTimeString('es-ES', options)
  const endTime = new Date(end).toLocaleTimeString('es-ES', options)
  return `${startTime} - ${endTime}`
}

const formatTime = isoString => {
  if (!isoString) return '--:--'
  try {
    if (isoString.includes('T')) {
      const date = new Date(isoString)
      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'UTC',
      })
    }
    return isoString.slice(0, 5)
  } catch (e) {
    return '--:--'
  }
}

const SchedulesNew = () => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { toasts, removeToast, success: showSuccess, error: showError } = useToast()

  // Stores
  const {
    generateTodaySchedules,
    generateTomorrowSchedules,
    generateSchedulesForDate,
  } = useScheduleStore()

  const { products, fetchServiceCourts } = useProductStore()

  // Local State
  const [filters, setFilters] = useState({
    date: formatDate(new Date()),
    productId: 'all',
    status: 'all',
  })

  const [schedules, setSchedules] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState({})
  const [activeTab, setActiveTab] = useState('schedules')

  // Custom Range Modal
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false)
  const [customRange, setCustomRange] = useState({
    targetDate: formatDate(new Date()),
    startHour: 6,
    endHour: 23,
    selectedProducts: [],
  })

  // Explorer State
  const [explorerFilters, setExplorerFilters] = useState({
    date: formatDate(new Date()),
    productId: 'all',
  })
  const [explorerSchedules, setExplorerSchedules] = useState([])
  const [explorerLoading, setExplorerLoading] = useState(false)

  // Data Loading
  const loadSchedules = useCallback(async () => {
    setIsLoading(true)
    try {
      const { scheduleService } = await import('@/services/scheduleService')
      const todayStr = formatDate(new Date())
      let result

      if (filters.date === todayStr && filters.productId === 'all' && filters.status === 'all') {
        result = await scheduleService.getTodaySchedules()
      } else {
        if (filters.productId !== 'all') {
          result = await scheduleService.getAvailableSchedules(filters.productId, filters.date)
        } else {
          result = await scheduleService.getAvailableSchedulesAll({
            date: filters.date,
            limit: 100,
          })
        }
      }

      let loadedSchedules = result?.schedules || (Array.isArray(result) ? result : result?.data || [])

      if (filters.status !== 'all') {
        const isAvailable = filters.status === 'available'
        loadedSchedules = loadedSchedules.filter(s => s.is_available === isAvailable)
      }

      setSchedules(loadedSchedules)
    } catch (error) {
      console.error('Error loading schedules:', error)
      setSchedules([])
    } finally {
      setIsLoading(false)
    }
  }, [filters])

  const loadExplorerSchedules = useCallback(async () => {
    setExplorerLoading(true)
    try {
      const { scheduleService } = await import('@/services/scheduleService')
      let result
      let loadedSchedules = []

      if (explorerFilters.productId && explorerFilters.productId !== 'all') {
        try {
          result = await scheduleService.getAllSchedulesByProductAndDate(
            explorerFilters.productId,
            explorerFilters.date
          )
        } catch (e) {
          result = await scheduleService.getAvailableSchedules(
            explorerFilters.productId,
            explorerFilters.date
          )
        }
      } else {
        result = await scheduleService.getAvailableSchedulesAll({
          date: explorerFilters.date,
          limit: 100,
        })
      }

      if (Array.isArray(result)) {
        loadedSchedules = result
      } else if (result && Array.isArray(result.data)) {
        loadedSchedules = result.data
      } else if (result && Array.isArray(result.schedules)) {
        loadedSchedules = result.schedules
      }

      setExplorerSchedules(loadedSchedules)
    } catch (error) {
      console.error('Error loading explorer schedules:', error)
      setExplorerSchedules([])
    } finally {
      setExplorerLoading(false)
    }
  }, [explorerFilters])

  useEffect(() => {
    if (products.length === 0) fetchServiceCourts()
  }, [products.length, fetchServiceCourts])

  useEffect(() => {
    loadSchedules()
  }, [loadSchedules])

  useEffect(() => {
    if (activeTab === 'details') loadExplorerSchedules()
  }, [activeTab, loadExplorerSchedules])

  // Handlers
  const handleGenerateToday = async () => {
    setActionLoading(prev => ({ ...prev, today: true }))
    try {
      const res = await generateTodaySchedules()
      if (res.success) {
        showSuccess('Horarios de hoy generados')
        if (filters.date === formatDate(new Date())) loadSchedules()
      }
    } catch (error) {
      showError('Error al generar horarios')
    } finally {
      setActionLoading(prev => ({ ...prev, today: false }))
    }
  }

  const handleGenerateTomorrow = async () => {
    setActionLoading(prev => ({ ...prev, tomorrow: true }))
    try {
      const res = await generateTomorrowSchedules()
      if (res.success) {
        showSuccess('Horarios de mañana generados')
        const tomorrow = new Date(Date.now() + 86400000)
        if (filters.date === formatDate(tomorrow)) loadSchedules()
      }
    } catch (error) {
      showError('Error al generar horarios')
    } finally {
      setActionLoading(prev => ({ ...prev, tomorrow: false }))
    }
  }

  const handleCustomGenerate = async () => {
    setActionLoading(prev => ({ ...prev, custom: true }))
    try {
      const res = await generateSchedulesForDate(customRange.targetDate, {
        startHour: customRange.startHour,
        endHour: customRange.endHour,
        productIds: customRange.selectedProducts.length > 0 ? customRange.selectedProducts : undefined
      })
      if (res.success) {
        showSuccess('Horarios generados exitosamente')
        setIsCustomModalOpen(false)
        if (filters.date === customRange.targetDate) loadSchedules()
      }
    } catch (error) {
      showError('Error en generación personalizada')
    } finally {
      setActionLoading(prev => ({ ...prev, custom: false }))
    }
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-sans">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-6 py-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/gestion-reservas')}
            className="rounded-full hover:bg-primary/10 text-primary"
          >
            <span className="material-icons-round text-[20px]">arrow_back</span>
          </Button>
          <h1 className="text-3xl font-semibold text-text-primary-light dark:text-text-primary-dark tracking-tight uppercase">
            {t('schedules.title', 'Gestión de Horarios')}
          </h1>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-md mb-6 w-fit h-auto flex gap-1">
          <TabsTrigger 
            value="schedules" 
            className="rounded-md px-4 py-2 font-semibold uppercase text-xs tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-surface-dark data-[state=active]:shadow-sm transition-all"
          >
            Tablero de Gestión
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="rounded-md px-4 py-2 font-semibold uppercase text-xs tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-surface-dark data-[state=active]:shadow-sm transition-all"
          >
            Explorador Visual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="m-0 space-y-6">
          {/* Toolbar Card */}
          <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white dark:bg-surface-dark">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col lg:flex-row justify-between gap-6">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 block ml-1">Producto / Cancha</label>
                    <div className="relative">
                      <select
                        value={filters.productId}
                        onChange={e => setFilters(prev => ({ ...prev, productId: e.target.value }))}
                        className="w-full h-10 pl-4 pr-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                      >
                        <option value="all">Todas las canchas</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 block ml-1">Fecha de Operación</label>
                    <div className="relative">
                      <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">calendar_today</span>
                      <Input
                        type="date"
                        value={filters.date}
                        onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
                        className="h-10 pl-10 rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 block ml-1">Filtrar por Estado</label>
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-md h-10">
                      {['all', 'available', 'reserved'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilters(prev => ({ ...prev, status: s }))}
                          className={`flex-1 rounded-sm text-xs font-semibold uppercase tracking-wider transition-all ${
                            filters.status === s 
                              ? 'bg-white dark:bg-slate-700 shadow-sm text-primary' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {s === 'all' ? 'Todos' : s === 'available' ? 'Libres' : 'Ocupados'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-stretch gap-3 min-w-fit">
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleGenerateToday}
                      disabled={actionLoading.today}
                      className="bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest text-[10px] h-9 px-4 rounded-md shadow-sm flex items-center justify-center gap-2"
                    >
                      {actionLoading.today ? <span className="material-icons-round text-[16px] animate-spin">refresh</span> : <span className="material-icons-round text-[16px]">schedule</span>}
                      Generar Hoy
                    </Button>
                    <Button
                      onClick={handleGenerateTomorrow}
                      disabled={actionLoading.tomorrow}
                      variant="outline"
                      className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-widest text-[10px] h-9 px-4 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center gap-2"
                    >
                      {actionLoading.tomorrow ? <span className="material-icons-round text-[16px] animate-spin">refresh</span> : <span className="material-icons-round text-[16px]">calendar_month</span>}
                      Generar Mañana
                    </Button>
                  </div>
                  <Button
                    onClick={() => setIsCustomModalOpen(true)}
                    className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-semibold uppercase tracking-widest text-[11px] h-auto py-2 px-4 rounded-md shadow-sm flex-1 flex items-center justify-center gap-2"
                  >
                    <span className="material-icons-round text-[18px]">settings</span>
                    Rango Especial
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Container */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
             <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Cancha / Producto</th>
                      <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Horario</th>
                      <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Estado</th>
                      <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">Asignado a</th>
                      <th className="py-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500 text-right w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {isLoading ? (
                      <tr>
                        <td colSpan="5" className="py-12">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <span className="material-icons-round text-[32px] animate-spin text-primary">refresh</span>
                            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sincronizando horarios...</span>
                          </div>
                        </td>
                      </tr>
                    ) : schedules.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-16">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="size-12 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3 border border-slate-200 dark:border-slate-700">
                              <span className="material-icons-round text-[24px]">search</span>
                            </div>
                            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Sin resultados</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">No hay horarios generados para esta fecha o criterios.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      schedules.map((schedule, index) => (
                        <tr key={schedule.id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="py-2 px-3">
                            <span className="font-semibold text-slate-900 dark:text-white text-sm">{schedule.product_name || 'Producto'}</span>
                          </td>
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{formatDisplayDate(schedule.start_time)}</span>
                               <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-medium px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 tabular-nums">
                                 {formatTimeRange(schedule.start_time, schedule.end_time)}
                               </Badge>
                            </div>
                          </td>
                          <td className="py-2 px-3">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-widest border ${
                              schedule.is_available 
                                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' 
                                : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
                            }`}>
                              <div className="size-1.5 rounded-full bg-current"></div>
                              {schedule.is_available ? 'Disponible' : 'Reservado'}
                            </div>
                          </td>
                          <td className="py-2 px-3 text-sm font-medium text-slate-600 dark:text-slate-400">
                             {schedule.is_available ? '-' : schedule.user_name || 'Cliente'}
                          </td>
                          <td className="py-2 px-3 text-right">
                             <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="size-7 rounded-md hover:bg-primary/10 hover:text-primary">
                                  <span className="material-icons-round text-[16px]">edit</span>
                                </Button>
                                <Button variant="ghost" size="icon" className="size-7 rounded-md hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30">
                                  <span className="material-icons-round text-[16px]">close</span>
                                </Button>
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="m-0 space-y-6">
           <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-surface-dark p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                 <div className="space-y-1">
                   <h2 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark tracking-tight uppercase">Explorador de Disponibilidad</h2>
                   <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-widest">Vista en tiempo real de cuadrícula</p>
                 </div>
                 <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="flex-1 md:w-48 relative">
                       <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">calendar_today</span>
                       <Input 
                        type="date" 
                        value={explorerFilters.date} 
                        onChange={e => setExplorerFilters(prev => ({ ...prev, date: e.target.value }))}
                        className="h-9 pl-10 rounded-md border-slate-200 dark:border-slate-700 font-medium"
                       />
                    </div>
                    <div className="relative">
                      <select
                        value={explorerFilters.productId}
                        onChange={e => setExplorerFilters(prev => ({ ...prev, productId: e.target.value }))}
                        className="h-9 pl-3 pr-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md text-xs font-semibold focus:ring-1 focus:ring-primary outline-none appearance-none"
                      >
                        <option value="all">Todas las canchas</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      <span className="material-icons-round absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[16px] pointer-events-none">expand_more</span>
                    </div>
                 </div>
              </div>

              {explorerLoading ? (
                 <div className="py-20 flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-900/20 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="material-icons-round text-[32px] animate-spin text-primary opacity-50">refresh</span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Escaneando celdas...</span>
                 </div>
              ) : explorerSchedules.length === 0 ? (
                 <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <span className="material-icons-round text-[48px] text-slate-300 dark:text-slate-600 mb-3">calendar_month</span>
                    <p className="text-sm font-semibold uppercase tracking-tight text-slate-500">Sin datos para mostrar</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {explorerSchedules.map((schedule, index) => (
                      <article 
                        key={schedule.id || `explorer-${index}`}
                        className={`group relative p-4 rounded-lg border transition-all duration-300 flex flex-col justify-between h-32 ${
                          schedule.is_available 
                            ? 'bg-white dark:bg-surface-dark border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary/40' 
                            : 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-80'
                        }`}
                      >
                         <div className="flex justify-between items-start mb-3">
                            <h3 className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[120px]">
                              {schedule.product_name || 'Cancha'}
                            </h3>
                            <Badge className={`text-[9px] font-semibold px-2 py-0.5 rounded-sm border ${
                              schedule.is_available 
                                ? 'bg-green-50 border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400' 
                                : 'bg-slate-100 border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                            }`}>
                              {schedule.is_available ? 'LIBRE' : 'OCUPADO'}
                            </Badge>
                         </div>
                         
                         <div className="flex flex-col gap-1 mb-3">
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                               <span className="material-icons-round text-[14px]">schedule</span>
                               <span className="text-sm font-mono font-semibold tabular-nums tracking-tight text-slate-700 dark:text-slate-300">
                                 {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                               </span>
                            </div>
                         </div>

                         <div className="mt-auto">
                            <Button 
                              className={`w-full h-8 rounded-md font-semibold uppercase tracking-widest text-[10px] shadow-sm transition-all ${
                                schedule.is_available 
                                  ? 'bg-primary text-white hover:bg-primary-hover active:scale-95' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                              }`}
                              disabled={!schedule.is_available}
                            >
                              {schedule.is_available ? 'Reservar' : 'No disponible'}
                            </Button>
                         </div>
                      </article>
                    ))}
                 </div>
              )}
           </Card>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <Dialog open={isCustomModalOpen} onOpenChange={setIsCustomModalOpen}>
        <DialogContent className="rounded-xl border-slate-200 dark:border-slate-800 shadow-md max-w-lg p-6 font-sans">
          <DialogHeader className="gap-2 text-left mb-4">
            <div className="size-12 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-600 dark:text-slate-300 mb-1 border border-slate-200 dark:border-slate-700">
              <span className="material-icons-round text-[24px]">settings</span>
            </div>
            <DialogTitle className="text-xl font-semibold tracking-tight">Generación Personalizada</DialogTitle>
            <DialogDescription className="text-sm text-slate-500">Configure parámetros específicos para generar horarios de servicios.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            <div className="space-y-2">
               <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 ml-1">Fecha de Destino</label>
               <div className="relative">
                 <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">calendar_today</span>
                 <Input
                  type="date"
                  value={customRange.targetDate}
                  onChange={e => setCustomRange(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="h-10 pl-10 rounded-md bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 font-medium"
                />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 ml-1">Apertura</label>
                  <div className="relative">
                    <select
                      value={customRange.startHour}
                      onChange={e => setCustomRange(prev => ({ ...prev, startHour: parseInt(e.target.value) }))}
                      className="w-full h-10 pl-3 pr-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium focus:ring-1 focus:ring-primary outline-none appearance-none"
                    >
                      {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
                    </select>
                    <span className="material-icons-round absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                  </div>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 ml-1">Cierre</label>
                  <div className="relative">
                    <select
                      value={customRange.endHour}
                      onChange={e => setCustomRange(prev => ({ ...prev, endHour: parseInt(e.target.value) }))}
                      className="w-full h-10 pl-3 pr-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium focus:ring-1 focus:ring-primary outline-none appearance-none"
                    >
                      {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
                    </select>
                    <span className="material-icons-round absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                  </div>
               </div>
            </div>
          </div>

          <DialogFooter className="mt-6 sm:justify-between items-center flex-row gap-3">
            <Button variant="ghost" onClick={() => setIsCustomModalOpen(false)} className="font-medium text-xs h-10 flex-1 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
              Descartar
            </Button>
            <Button 
              onClick={handleCustomGenerate} 
              disabled={actionLoading.custom}
              className="bg-primary hover:bg-primary-hover text-white font-semibold text-xs h-10 rounded-md px-6 shadow-sm flex-1 flex items-center justify-center gap-2"
            >
              {actionLoading.custom ? <span className="material-icons-round text-[16px] animate-spin">refresh</span> : <span className="material-icons-round text-[16px]">check_circle</span>}
              Generar Ahora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  )
}

export default SchedulesNew