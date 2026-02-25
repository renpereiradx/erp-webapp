import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
    <aside className='overdue-accounts__sidebar'>
      {/* Ranking de Deudores */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between border-b pb-3 mb-4'>
          <CardTitle className='mb-0'>Principales Deudores</CardTitle>
          <Button variant='ghost' size='icon'>
            <span className='material-symbols-outlined'>more_horiz</span>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='flex items-center justify-center py-8'>
              <div className='w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin'></div>
            </div>
          ) : debtors.length === 0 ? (
            <div className='text-center py-8 text-tertiary'>
              <span className='material-symbols-outlined text-3xl mb-2'>
                inbox
              </span>
              <p className='text-sm'>Sin deudores pendientes</p>
            </div>
          ) : (
            <div className='debtor-list'>
              {debtors.map((debtor, i) => {
                const widthPercent = Math.round(
                  (debtor.total_pending / maxAmount) * 100,
                )
                return (
                  <div key={debtor.client_id} className='debtor-list__item'>
                    <div className='debtor-list__info'>
                      <span className='debtor-list__name'>
                        {i + 1}. {debtor.client_name}
                      </span>
                      <span className='debtor-list__amount'>
                        {formatPYG(debtor.total_pending, { compact: true })}
                      </span>
                    </div>
                    <div className='debtor-list__track'>
                      <div
                        className='debtor-list__fill'
                        style={{
                          width: `${widthPercent}%`,
                          backgroundColor: getColorByBehavior(
                            debtor.payment_behavior,
                            i,
                          ),
                        }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          <Button variant='link' block className='mt-5'>
            Ver Ranking Completo
          </Button>
        </CardContent>
      </Card>
    </aside>
  )
}

export default OverdueSidebar
