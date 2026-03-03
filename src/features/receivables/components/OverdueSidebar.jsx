import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'
import { receivablesService } from '@/services/receivablesService'

/**
 * Obtiene el color según el comportamiento de pago
 */
const getColorByBehavior = (behavior, index) => {
  switch (behavior) {
    case 'POOR':
      return '#ef4444' // rojo
    case 'REGULAR':
      return '#f59e0b' // naranja
    case 'GOOD':
      return '#3b82f6' // azul
    case 'EXCELLENT':
      return '#22c55e' // verde
    default:
      // Colores por posición si no hay behavior
      return index < 2 ? '#ef4444' : index < 4 ? '#f59e0b' : '#3b82f6'
  }
}

/**
 * Sidebar con ranking de principales deudores.
 * Conecta con GET /receivables/top-debtors
 */
const OverdueSidebar = () => {
  const { t } = useI18n()
  const [debtors, setDebtors] = useState([])
  const [loading, setLoading] = useState(true)
  const [maxAmount, setMaxAmount] = useState(0)

  useEffect(() => {
    const loadDebtors = async () => {
      try {
        const response = await receivablesService.getTopDebtors(5)
        const data = response.data || response || []

        // Encontrar el monto máximo para calcular porcentajes
        const max = Math.max(...data.map(d => d.total_pending || 0), 1)
        setMaxAmount(max)
        setDebtors(data)
      } catch (error) {
        console.error('Error loading top debtors:', error)
        setDebtors([])
      } finally {
        setLoading(false)
      }
    }

    loadDebtors()
  }, [])

  return (
    <>
      {/* 1. Task Summary Widget */}
      <div className="bg-white dark:bg-[#1A2633] p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white">{t('receivables.overdue.sidebar.tasks_today', 'Tareas de Hoy')}</h3>
          <button className="text-primary text-xs font-medium hover:underline">{t('receivables.overdue.sidebar.view_calendar', 'Ver Calendario')}</button>
        </div>
        <div className="flex items-center justify-center py-4 relative">
          {/* Donut chart approximation using CSS conic-gradient */}
          <div className="size-32 rounded-full flex items-center justify-center" style={{ background: 'conic-gradient(#137fec 50%, #f1f5f9 0)' }}>
            <div className="size-24 bg-white dark:bg-[#1A2633] rounded-full flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-900 dark:text-white">28</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('common.completed', 'Completadas')}</p>
            <p className="font-bold text-primary text-lg">14</p>
          </div>
          <div className="text-center p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{t('common.pending', 'Pendientes')}</p>
            <p className="font-bold text-slate-900 dark:text-white text-lg">14</p>
          </div>
        </div>
        <button className="w-full mt-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg text-sm font-semibold transition-colors">
          {t('receivables.overdue.sidebar.start_calling', 'Iniciar Sesión de Llamadas')}
        </button>
      </div>

      {/* 2. Top Debtors Widget */}
      <div className="bg-white dark:bg-[#1A2633] p-5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 dark:text-white">{t('receivables.overdue.sidebar.top_debtors', 'Principales Deudores')}</h3>
          <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <span className="material-symbols-outlined !text-xl">more_horiz</span>
          </button>
        </div>
        <div className="flex flex-col gap-5">
          {loading ? (
            <div className='flex items-center justify-center py-6'>
              <RefreshCw className='size-6 animate-spin text-primary opacity-50' />
            </div>
          ) : debtors.length === 0 ? (
            <div className='text-center py-6 text-sm text-slate-500'>
              {t('receivables.overdue.sidebar.no_debtors', 'Sin deudores pendientes')}
            </div>
          ) : (
            debtors.slice(0, 4).map((debtor, i) => {
              const widthPercent = Math.round((debtor.total_pending / maxAmount) * 100);
              // Asignar colores como en Stitch
              const progressColor = i === 0 ? 'bg-red-500' : i === 1 ? 'bg-amber-500' : 'bg-primary';
              
              return (
                <div key={debtor.client_id} className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate pr-2 max-w-[70%]">
                      {i + 1}. {debtor.client_name}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatPYG(debtor.total_pending, { compact: true })}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className={`${progressColor} h-full rounded-full transition-all duration-1000`} style={{ width: `${widthPercent}%` }}></div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        <a className="mt-5 text-center text-sm text-primary font-medium hover:underline cursor-pointer">
          {t('receivables.overdue.sidebar.full_ranking', 'Ver Ranking Completo')}
        </a>
      </div>

      {/* 3. Ad/Promo or Tip */}
      <div className="bg-gradient-to-br from-primary to-blue-600 rounded-lg p-5 text-white shadow-lg shadow-blue-200 dark:shadow-none relative overflow-hidden group cursor-pointer mt-auto">
        <div className="absolute -right-4 -top-4 size-24 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all"></div>
        <div className="relative z-10">
          <div className="size-10 bg-white/20 rounded-lg flex items-center justify-center mb-3 backdrop-blur-sm">
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <h4 className="font-bold text-lg mb-1">{t('receivables.overdue.promo.title', 'Insights de IA')}</h4>
          <p className="text-blue-100 text-sm mb-3">
            {t('receivables.overdue.promo.body', 'Optimiza tu estrategia de cobranza con analítica predictiva.')}
          </p>
          <button className="text-xs font-bold bg-white text-primary px-3 py-1.5 rounded shadow-sm hover:bg-blue-50 transition-colors">
            {t('receivables.overdue.promo.button', 'Probar Beta')}
          </button>
        </div>
      </div>
    </>
  )
}

export default OverdueSidebar
