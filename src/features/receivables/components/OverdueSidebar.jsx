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
    <aside className='flex flex-col gap-8 w-full xl:w-[400px]'>
      {/* Ranking de Deudores */}
      <div className='bg-surface rounded-xl border border-border-subtle shadow-fluent-2 flex flex-col overflow-hidden'>
        <div className='px-6 py-4 border-b border-border-subtle bg-slate-50/50 flex items-center justify-between'>
          <h3 className='text-sm font-black text-text-main uppercase tracking-tight'>Principales Deudores</h3>
          <Button variant='ghost' size='icon' className="size-8 rounded-full text-text-secondary">
            <span className='material-symbols-outlined text-[18px]'>more_horiz</span>
          </Button>
        </div>
        <div className='p-6'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <RefreshCw className='size-8 animate-spin text-primary opacity-50' />
            </div>
          ) : debtors.length === 0 ? (
            <div className='text-center py-12'>
              <p className='text-[10px] font-black uppercase tracking-widest text-text-secondary opacity-60'>Sin deudores pendientes</p>
            </div>
          ) : (
            <div className='space-y-6'>
              {debtors.map((debtor, i) => {
                const widthPercent = Math.round(
                  (debtor.total_pending / maxAmount) * 100,
                )
                const behaviorColor = getColorByBehavior(debtor.payment_behavior, i);
                return (
                  <div key={debtor.client_id} className='space-y-3 group cursor-pointer'>
                    <div className='flex justify-between items-end'>
                      <span className='text-xs font-black text-text-main uppercase tracking-tight group-hover:text-primary transition-colors'>
                        {i + 1}. {debtor.client_name}
                      </span>
                      <span className='text-sm font-black text-text-main'>
                        {formatPYG(debtor.total_pending, { compact: true })}
                      </span>
                    </div>
                    <div className='h-1.5 w-full bg-slate-100 rounded-full overflow-hidden'>
                      <div
                        className='h-full rounded-full transition-all duration-1000'
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: behaviorColor,
                        }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <Button variant='ghost' className='w-full mt-6 h-11 text-[11px] font-black uppercase tracking-widest text-primary hover:bg-blue-50 border border-transparent hover:border-blue-100'>
            Ver Ranking Completo
          </Button>
        </div>
      </div>
    </aside>
  )
}

export default OverdueSidebar
