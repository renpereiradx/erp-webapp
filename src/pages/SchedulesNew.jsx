/**
 * SchedulesNew Page - Refactored to Tailwind (Fluent 2.0)
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar as CalendarIcon,
  MoreHorizontal,
  Edit,
  X,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw,
  ArrowLeft,
  CalendarDays,
  Settings2,
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-primary pl-6 py-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/gestion-reservas')}
            className="rounded-full hover:bg-primary/10 text-primary"
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tighter uppercase font-display">
            {t('schedules.title', 'Gestión de Horarios')}
          </h1>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6 w-fit h-auto flex gap-1">
          <TabsTrigger 
            value="schedules" 
            className="rounded-lg px-6 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-surface-dark data-[state=active]:shadow-sm transition-all"
          >
            Tablero de Gestión
          </TabsTrigger>
          <TabsTrigger 
            value="details" 
            className="rounded-lg px-6 py-2.5 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-surface-dark data-[state=active]:shadow-sm transition-all"
          >
            Explorador Visual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedules" className="m-0 space-y-6">
          {/* Toolbar Card */}
          <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-fluent-2 overflow-hidden bg-white dark:bg-surface-dark">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row justify-between gap-8">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Producto / Cancha</label>
                    <div className="relative">
                      <select
                        value={filters.productId}
                        onChange={e => setFilters(prev => ({ ...prev, productId: e.target.value }))}
                        className="w-full h-11 pl-4 pr-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                      >
                        <option value="all">Todas las canchas</option>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Fecha de Operación</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                      <Input
                        type="date"
                        value={filters.date}
                        onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
                        className="h-11 pl-10 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Filtrar por Estado</label>
                    <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-lg h-11">
                      {['all', 'available', 'reserved'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setFilters(prev => ({ ...prev, status: s }))}
                          className={`flex-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
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
                      className="bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-lg shadow-md shadow-primary/20"
                    >
                      {actionLoading.today ? <RefreshCw size={14} className="animate-spin mr-2" /> : <Clock size={14} className="mr-2" />}
                      Generar Hoy
                    </Button>
                    <Button
                      onClick={handleGenerateTomorrow}
                      disabled={actionLoading.tomorrow}
                      variant="outline"
                      className="border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-black uppercase tracking-widest text-[10px] h-10 px-6 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      {actionLoading.tomorrow ? <RefreshCw size={14} className="animate-spin mr-2" /> : <CalendarDays size={14} className="mr-2" />}
                      Generar Mañana
                    </Button>
                  </div>
                  <Button
                    onClick={() => setIsCustomModalOpen(true)}
                    className="bg-slate-900 dark:bg-slate-700 hover:bg-black dark:hover:bg-slate-600 text-white font-black uppercase tracking-widest text-[10px] h-auto py-4 px-6 rounded-lg shadow-lg flex-1"
                  >
                    <Settings2 size={16} className="mr-2" />
                    Rango Especial
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Table Container */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-fluent-shadow overflow-hidden">
             <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500">Cancha / Producto</th>
                      <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500">Horario</th>
                      <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500">Estado</th>
                      <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500">Asignado a</th>
                      <th className="py-4 px-6 text-[11px] font-black uppercase tracking-widest text-slate-500 text-right w-24">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {isLoading ? (
                      <tr>
                        <td colSpan="5" className="py-20">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Sincronizando horarios...</span>
                          </div>
                        </td>
                      </tr>
                    ) : schedules.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-24">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="size-16 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
                              <Search size={32} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sin resultados</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">No hay horarios generados para esta fecha o criterios.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      schedules.map((schedule, index) => (
                        <tr key={schedule.id || index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{schedule.product_name || 'Producto'}</span>
                          </td>
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-2">
                               <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{formatDisplayDate(schedule.start_time)}</span>
                               <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-2 py-0.5 rounded border-none tabular-nums">
                                 {formatTimeRange(schedule.start_time, schedule.end_time)}
                               </Badge>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                              schedule.is_available 
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                              <div className="size-1.5 rounded-full bg-current"></div>
                              {schedule.is_available ? 'Disponible' : 'Reservado'}
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm font-medium text-slate-500 dark:text-slate-500">
                             {schedule.is_available ? '-' : schedule.user_name || 'Cliente'}
                          </td>
                          <td className="py-4 px-6 text-right">
                             <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-primary/10 hover:text-primary">
                                  <Edit size={16} />
                                </Button>
                                <Button variant="ghost" size="icon" className="size-8 rounded-lg hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30">
                                  <X size={16} />
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
           <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                 <div className="space-y-1">
                   <h2 className="text-xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tight uppercase">Explorador de Disponibilidad</h2>
                   <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-widest">Vista en tiempo real de cuadrícula</p>
                 </div>
                 <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="flex-1 md:w-48">
                       <Input 
                        type="date" 
                        value={explorerFilters.date} 
                        onChange={e => setExplorerFilters(prev => ({ ...prev, date: e.target.value }))}
                        className="h-10 rounded-lg"
                       />
                    </div>
                    <select
                      value={explorerFilters.productId}
                      onChange={e => setExplorerFilters(prev => ({ ...prev, productId: e.target.value }))}
                      className="h-10 px-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
                    >
                      <option value="all">Todas las canchas</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                 </div>
              </div>

              {explorerLoading ? (
                 <div className="py-32 flex flex-col items-center justify-center gap-4">
                    <RefreshCw className="w-10 h-10 animate-spin text-primary opacity-30" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Escaneando celdas...</span>
                 </div>
              ) : explorerSchedules.length === 0 ? (
                 <div className="py-32 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                    <CalendarDays className="size-16 text-slate-200 dark:text-slate-800 mb-4" />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-400">Sin datos para mostrar</p>
                 </div>
              ) : (
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {explorerSchedules.map((schedule, index) => (
                      <article 
                        key={schedule.id || `explorer-${index}`}
                        className={`group relative p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between h-44 ${
                          schedule.is_available 
                            ? 'bg-white dark:bg-surface-dark border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-fluent-8 hover:border-primary/30' 
                            : 'bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-80'
                        }`}
                      >
                         <div className="flex justify-between items-start mb-4">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate max-w-[150px]">
                              {schedule.product_name || 'Cancha'}
                            </h3>
                            <Badge className={`text-[9px] font-black px-2 py-0.5 rounded border-none shadow-none ${
                              schedule.is_available 
                                ? 'bg-green-500/10 text-green-600' 
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                            }`}>
                              {schedule.is_available ? 'LIBRE' : 'OCUPADO'}
                            </Badge>
                         </div>
                         
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                               <Clock size={14} />
                               <span className="text-lg font-black tabular-nums tracking-tight text-slate-700 dark:text-slate-300">
                                 {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                               </span>
                            </div>
                         </div>

                         <div className="mt-4">
                            <Button 
                              className={`w-full h-10 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-none border-none transition-all ${
                                schedule.is_available 
                                  ? 'bg-primary text-white hover:bg-primary-hover active:scale-95' 
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
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
        <DialogContent className="rounded-3xl border-none shadow-fluent-16 max-w-lg p-8">
          <DialogHeader className="gap-2 text-left mb-6">
            <div className="size-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white mb-2">
              <Settings2 size={30} />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">Generación Personalizada</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">Configure parámetros específicos para generar horarios de servicios.</DialogDescription>
          </DialogHeader>

          <div className="space-y-8 py-4">
            <div className="space-y-2">
               <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Fecha de Destino</label>
               <div className="relative">
                 <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                 <Input
                  type="date"
                  value={customRange.targetDate}
                  onChange={e => setCustomRange(prev => ({ ...prev, targetDate: e.target.value }))}
                  className="h-12 pl-12 rounded-xl bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 font-semibold"
                />
               </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Apertura</label>
                  <select
                    value={customRange.startHour}
                    onChange={e => setCustomRange(prev => ({ ...prev, startHour: parseInt(e.target.value) }))}
                    className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black focus:ring-2 focus:ring-primary outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Cierre</label>
                  <select
                    value={customRange.endHour}
                    onChange={e => setCustomRange(prev => ({ ...prev, endHour: parseInt(e.target.value) }))}
                    className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black focus:ring-2 focus:ring-primary outline-none"
                  >
                    {Array.from({ length: 24 }, (_, i) => <option key={i} value={i}>{i}:00</option>)}
                  </select>
               </div>
            </div>
          </div>

          <DialogFooter className="mt-10 sm:justify-between items-center flex-row gap-4">
            <Button variant="ghost" onClick={() => setIsCustomModalOpen(false)} className="font-bold uppercase tracking-widest text-xs h-12 flex-1">
              Descartar
            </Button>
            <Button 
              onClick={handleCustomGenerate} 
              disabled={actionLoading.custom}
              className="bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-[0.2em] text-xs h-12 rounded-xl px-10 shadow-lg shadow-primary/20 flex-1"
            >
              {actionLoading.custom ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
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
