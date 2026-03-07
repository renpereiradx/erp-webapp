/**
 * AvailableSlots Page - Refactored to Tailwind (Fluent 2.0)
 */

import React, { useState, useEffect, useCallback } from 'react'
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
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 font-sans">
      {/* Search and Filters Header */}
      <section className="available-slots-header-container">
        <header className="flex flex-col gap-2 border-l-4 border-primary pl-6 py-2 mb-6">
          <h1 className="text-2xl font-semibold text-text-primary-light dark:text-text-primary-dark tracking-tight uppercase leading-none">
            Disponibilidad de Servicios
          </h1>
          <p className="text-text-secondary-light dark:text-text-secondary-dark text-xs font-medium uppercase tracking-widest">
            Consulte y reserve horarios en tiempo real
          </p>
        </header>

        <Card className="rounded-xl border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow bg-white dark:bg-surface-dark overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 block ml-1">Servicio / Recurso</label>
                <div className="relative">
                  <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">layers</span>
                  <select
                    value={filters.productId}
                    onChange={e => setFilters(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full h-10 pl-10 pr-10 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-md text-sm font-medium focus:ring-1 focus:ring-primary outline-none appearance-none cursor-pointer"
                  >
                    <option value="all">Seleccionar servicio...</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <span className="material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 block ml-1">Fecha de Consulta</label>
                <div className="relative">
                  <span className="material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">calendar_today</span>
                  <Input
                    type="date"
                    value={filters.date}
                    onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
                    className="h-10 pl-10 rounded-md border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 font-medium"
                  />
                </div>
              </div>

              <Button
                onClick={loadAvailableSlots}
                disabled={loading || filters.productId === 'all'}
                className="h-10 bg-primary hover:bg-primary-hover text-white font-semibold uppercase tracking-widest text-[11px] rounded-md shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {loading ? <span className="material-icons-round text-[18px] animate-spin">refresh</span> : <span className="material-icons-round text-[18px]">search</span>}
                Ver Disponibilidad
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Slots Grid */}
      <div className="flex flex-col gap-4 mt-2">
        <div className="flex items-center justify-between px-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <span className="material-icons-round text-primary text-[18px]">schedule</span>
            Horarios para {currentProductName}
          </h2>
          {availableSlots.length > 0 && (
            <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 font-semibold px-2 py-0.5 rounded-md">
              {availableSlots.length} Disponibles
            </Badge>
          )}
        </div>

        {loading || isInitialLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-4 bg-white/50 dark:bg-slate-900/20 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="material-icons-round text-[40px] animate-spin text-primary opacity-40">refresh</span>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Consultando agenda...</span>
          </div>
        ) : filters.productId === 'all' ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-6">
            <div className="size-14 bg-white dark:bg-surface-dark rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-sm border border-slate-100 dark:border-slate-800">
              <span className="material-icons-round text-[28px]">layers</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Seleccione un servicio</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-[240px]">Debe elegir un producto o cancha para ver los horarios disponibles.</p>
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 px-6">
            <div className="size-14 bg-white dark:bg-surface-dark rounded-xl flex items-center justify-center text-amber-500 dark:text-amber-600 mb-4 shadow-sm border border-slate-100 dark:border-slate-800">
              <span className="material-icons-round text-[28px]">info</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">Sin disponibilidad</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-[240px]">No se encontraron horarios libres para este servicio en la fecha seleccionada.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {availableSlots.map((slot, index) => (
              <Card 
                key={slot.id || `slot-${index}`}
                className="group relative overflow-hidden rounded-lg border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-primary/40 transition-all duration-300 bg-white dark:bg-surface-dark"
              >
                <CardContent className="p-4 flex flex-col justify-between h-full min-h-[120px]">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Horario Libre</p>
                      <h3 className="text-lg font-mono font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                        {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                      </h3>
                    </div>
                    <div className="size-7 bg-green-50 dark:bg-green-900/20 rounded-md flex items-center justify-center text-green-600 dark:text-green-500 border border-green-100 dark:border-green-800">
                      <span className="material-icons-round text-[16px]">schedule</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                     <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate pr-2">
                       {slot.product_name}
                     </div>
                     <Button
                      onClick={() => onReserveClick && onReserveClick(slot)}
                      className="bg-slate-100 dark:bg-slate-800 hover:bg-primary text-slate-700 dark:text-slate-300 hover:text-white font-semibold uppercase tracking-widest text-[10px] h-8 px-3 rounded-md transition-all active:scale-95 flex items-center gap-1 shrink-0"
                     >
                       Reservar
                       <span className="material-icons-round text-[14px] group-hover:translate-x-0.5 transition-transform">chevron_right</span>
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
