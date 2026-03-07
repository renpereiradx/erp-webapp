import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'

/**
 * ReservationsAndSchedules Component
 * Refactored to Tailwind CSS following Fluent 2.0 Design System.
 * Provides a high-level navigation entry for Reservations and Schedules management.
 */
const ReservationsAndSchedules = () => {
  const navigate = useNavigate()
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500 max-w-7xl mx-auto py-4 font-sans">
      {/* Header Section */}
      <header className="flex flex-col gap-2 border-l-4 border-primary pl-6 py-2">
        <h1 className="text-3xl md:text-4xl font-semibold text-text-primary-light dark:text-text-primary-dark tracking-tight leading-none">
          {t('reservations.title', 'Gestión de Reservas y Horarios')}
        </h1>
        <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm md:text-base">
          {t('reservations.subtitle', 'Seleccione una acción para administrar su establecimiento y servicios')}
        </p>
      </header>

      {/* Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4">
        {/* Reservations Card */}
        <div 
          className="group relative flex flex-col justify-between p-8 md:p-10 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-500 cursor-pointer overflow-hidden min-h-[400px]"
          onClick={() => navigate('/reservas')}
        >
          {/* Subtle Background Pattern (Icon) */}
          <div className="absolute top-0 right-0 p-8 text-primary/5 group-hover:text-primary/10 transition-colors pointer-events-none transform group-hover:scale-110 group-hover:rotate-12 duration-700">
            <span className="material-icons-round text-[180px]">calendar_month</span>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="size-16 bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary shadow-sm border border-primary/5 group-hover:scale-110 transition-transform duration-500">
              <span className="material-icons-round text-[36px]">calendar_month</span>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-text-primary-light dark:text-text-primary-dark tracking-tight">
                {t('reservations.cards.reservations.title', 'Reservas')}
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-base md:text-lg leading-relaxed max-w-md">
                {t('reservations.cards.reservations.description', 'Gestione las citas de sus clientes en tiempo real. Vea disponibilidad, administre servicios y coordine cancelaciones de manera eficiente.')}
              </p>
            </div>
          </div>
          
          <div className="mt-12 relative z-10">
            <button
              className="w-full h-14 bg-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
              onClick={e => {
                e.stopPropagation()
                navigate('/reservas')
              }}
            >
              {t('reservations.cards.reservations.button', 'Gestionar Reservas')}
              <span className="material-icons-round text-[20px] group-hover/btn:translate-x-1 transition-transform">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Schedules Card */}
        <div 
          className="group relative flex flex-col justify-between p-8 md:p-10 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-500 cursor-pointer overflow-hidden min-h-[400px]"
          onClick={() => navigate('/horarios')}
        >
          {/* Subtle Background Pattern (Icon) */}
          <div className="absolute top-0 right-0 p-8 text-blue-500/5 group-hover:text-blue-500/10 transition-colors pointer-events-none transform group-hover:scale-110 group-hover:rotate-12 duration-700">
            <span className="material-icons-round text-[180px]">schedule</span>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="size-16 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm border border-blue-100 dark:border-blue-800 group-hover:scale-110 transition-transform duration-500">
              <span className="material-icons-round text-[36px]">schedule</span>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-semibold text-text-primary-light dark:text-text-primary-dark tracking-tight">
                {t('reservations.cards.schedules.title', 'Horarios')}
              </h2>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-base md:text-lg leading-relaxed max-w-md">
                {t('reservations.cards.schedules.description', 'Configure turnos de trabajo, horarios de apertura y cierres especiales. Administre excepciones para festivos y ajuste la capacidad de servicio.')}
              </p>
            </div>
          </div>
          
          <div className="mt-12 relative z-10">
            <button
              className="w-full h-14 bg-primary text-white text-sm font-semibold rounded-lg shadow-sm hover:bg-primary-hover active:scale-[0.98] transition-all flex items-center justify-center gap-2 group/btn"
              onClick={e => {
                e.stopPropagation()
                navigate('/horarios')
              }}
            >
              {t('reservations.cards.schedules.button', 'Gestionar Horarios')}
              <span className="material-icons-round text-[20px] group-hover/btn:translate-x-1 transition-transform">chevron_right</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ReservationsAndSchedules
