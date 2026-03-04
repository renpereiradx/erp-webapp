/**
 * AvailableSlots Page - Refactored to Tailwind (Fluent 2.0)
 */

import React, { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Calendar as CalendarIcon,
  Clock,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Info,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n'
import useReservationStore from '@/store/useReservationStore'
import useProductStore from '@/store/useProductStore'

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

const AvailableSlots = ({ onReserveClick }) => {
  const { t } = useI18n()

  // Stores
  const { loading, fetchAvailableSchedules } = useReservationStore()
  const { products, fetchServiceCourts } = useProductStore()

  // Local State
  const [filters, setFilters] = useState({
    productId: 'all',
    date: new Date().toISOString().split('T')[0],
  })
  const [availableSlots, setAvailableSlots] = useState([])
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  // Load initial data
  useEffect(() => {
    const init = async () => {
      await fetchServiceCourts()
      setIsInitialLoading(false)
    }
    init()
  }, [fetchServiceCourts])

  const loadAvailableSlots = useCallback(async () => {
    if (filters.productId === 'all') {
      // In a real app, we might want to fetch for all products
      // For now, let's clear if all is selected or handle specifically
      setAvailableSlots([])
      return
    }

    try {
      const data = await fetchAvailableSchedules(filters.productId, filters.date)
      setAvailableSlots(data || [])
    } catch (error) {
      console.error('Error loading available slots:', error)
      setAvailableSlots([])
    }
  }, [filters, fetchAvailableSchedules])

  useEffect(() => {
    loadAvailableSlots()
  }, [loadAvailableSlots])

  // Get current product name
  const currentProductName = products.find(p => p.id == filters.productId)?.name || 'Seleccione un servicio'

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Search and Filters Header */}
      <section className="available-slots-header-container">
        <header className="flex flex-col gap-2 border-l-4 border-primary pl-6 py-2 mb-6">
          <h1 className="text-2xl font-black text-text-primary-light dark:text-text-primary-dark tracking-tighter uppercase leading-none font-display">
            Disponibilidad de Servicios
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs font-medium uppercase tracking-widest font-display">
            Consulte y reserve horarios en tiempo real
          </p>
        </header>

        <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-fluent-2 bg-white dark:bg-surface-dark overflow-hidden">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Servicio / Recurso</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <select
                    value={filters.productId}
                    onChange={e => setFilters(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full h-11 pl-10 pr-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">Seleccionar servicio...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block ml-1">Fecha de Consulta</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
                  <Input
                    type="date"
                    value={filters.date}
                    onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
                    className="h-11 pl-10 rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-semibold"
                  />
                </div>
              </div>

              <Button
                onClick={loadAvailableSlots}
                disabled={loading || filters.productId === 'all'}
                className="h-11 bg-primary hover:bg-primary-hover text-white font-black uppercase tracking-widest text-[10px] rounded-lg shadow-lg shadow-primary/20 transition-all active:scale-95"
              >
                {loading ? <RefreshCw size={16} className="animate-spin mr-2" /> : <Search size={16} className="mr-2" />}
                Ver Disponibilidad
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Slots Grid */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <Clock size={16} className="text-primary" />
            Horarios para {currentProductName}
          </h2>
          {availableSlots.length > 0 && (
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-none font-black px-3 py-1">
              {availableSlots.length} Disponibles
            </Badge>
          )}
        </div>

        {loading || isInitialLoading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-slate-900/20 rounded-2xl border border-slate-100 dark:border-slate-800">
            <RefreshCw className="w-10 h-10 animate-spin text-primary opacity-40" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Consultando agenda...</span>
          </div>
        ) : filters.productId === 'all' ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 px-6">
            <div className="size-16 bg-white dark:bg-surface-dark rounded-2xl flex items-center justify-center text-slate-300 dark:text-slate-700 mb-4 shadow-sm">
              <Layers size={32} />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Seleccione un servicio</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-[240px]">Debe elegir un producto o cancha para ver los horarios que tiene disponibles.</p>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 px-6">
            <div className="size-16 bg-white dark:bg-surface-dark rounded-2xl flex items-center justify-center text-amber-300 dark:text-amber-700 mb-4 shadow-sm">
              <Info size={32} />
            </div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sin disponibilidad</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-[240px]">No se encontraron horarios libres para este servicio en la fecha seleccionada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {availableSlots.map((slot, index) => (
              <Card 
                key={slot.id || `slot-${index}`}
                className="group relative overflow-hidden rounded-xl border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-fluent-8 hover:border-primary/40 transition-all duration-300 bg-white dark:bg-surface-dark"
              >
                <CardContent className="p-5 flex flex-col justify-between h-full min-h-[140px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Horario Libre</p>
                      <h3 className="text-xl font-black tabular-nums tracking-tighter text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </h3>
                    </div>
                    <div className="size-8 bg-green-500/10 rounded-lg flex items-center justify-center text-green-600">
                      <Clock size={16} />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-3">
                     <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                       {slot.product_name}
                     </div>
                     <Button
                      onClick={() => onReserveClick && onReserveClick(slot)}
                      className="bg-slate-900 dark:bg-slate-800 hover:bg-primary text-white font-black uppercase tracking-widest text-[9px] h-9 px-4 rounded-lg shadow-sm group-hover:shadow-md group-hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2"
                     >
                       Reservar
                       <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                     </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AvailableSlots
