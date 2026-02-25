import React from 'react'

// Formatear moneda en Guaraníes (sin decimales)
const formatGs = amount => {
  return `₲ ${Math.round(amount).toLocaleString('es-PY')}`
}

/**
 * KPI Grid: Cards for DPO, % Overdue and Critical Risk.
 * 100% STITCH FIDELITY - RESPONSIVE
 */
const AgingKpiGrid = ({ kpis }) => {
  if (!kpis) return null

  return (
    <section className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8'>
      {/* DPO Card */}
      <div className='bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden'>
        <div className='flex justify-between items-start'>
          <div className='min-w-0'>
            <p className='text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate'>
              DPO (Días Promedio de Pago)
            </p>
            <h3 className='text-2xl md:text-4xl font-bold mt-2 text-slate-900 dark:text-white'>
              42 Días
            </h3>
            <div className='flex flex-wrap items-center gap-2 mt-2'>
              <span className='flex items-center text-[#28a745] text-xs md:text-sm font-bold'>
                <span className='material-icons-round text-sm'>
                  trending_up
                </span>{' '}
                2.4%
              </span>
              <span className='text-[10px] md:text-xs text-slate-400 font-medium'>
                vs. mes ant. (41 d)
              </span>
            </div>
          </div>
          <div className='bg-[#137fec1a] p-2 md:p-3 rounded-lg flex-shrink-0'>
            <span className='material-icons-round text-[#137fec] text-xl md:text-2xl'>
              schedule
            </span>
          </div>
        </div>
        <div className='mt-6 h-10 md:h-12 w-full flex items-end gap-1'>
          {[40, 55, 45, 70, 60, 85, 100].map((h, i) => (
            <div
              key={i}
              className={`flex-1 ${i === 6 ? 'bg-[#137fec]' : 'bg-[#137fec33]'} rounded-t`}
              style={{ height: `${h}%` }}
            ></div>
          ))}
        </div>
      </div>

      {/* % Overdue Card */}
      <div className='bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden'>
        <div className='flex justify-between items-start'>
          <div className='min-w-0'>
            <p className='text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate'>
              % de Deuda Vencida
            </p>
            <h3 className='text-2xl md:text-4xl font-bold mt-2 text-slate-900 dark:text-white'>
              15.4%
            </h3>
            <div className='flex flex-wrap items-center gap-2 mt-2'>
              <span className='flex items-center text-[#dc3545] text-xs md:text-sm font-bold'>
                <span className='material-icons-round text-sm'>
                  trending_up
                </span>{' '}
                1.2%
              </span>
              <span className='text-[10px] md:text-xs text-slate-400 font-medium'>
                Obj: &lt; 10%
              </span>
            </div>
          </div>
          <div className='bg-[#fd7e141a] p-2 md:p-3 rounded-lg flex-shrink-0'>
            <span className='material-icons-round text-[#fd7e14] text-xl md:text-2xl'>
              error_outline
            </span>
          </div>
        </div>
        <div className='absolute right-4 md:right-6 bottom-4 md:bottom-6 w-12 h-12 md:w-16 md:h-16 border-[4px] md:border-[6px] border-slate-100 dark:border-slate-800 rounded-full flex items-center justify-center'>
          <div
            className='absolute top-0 left-0 w-full h-full border-[4px] md:border-[6px] border-[#fd7e14] rounded-full'
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)' }}
          ></div>
          <span className='text-[8px] md:text-[10px] font-bold text-[#fd7e14]'>
            ALTO
          </span>
        </div>
      </div>

      {/* Critical Risk Card */}
      <div className='bg-white dark:bg-slate-900 p-5 md:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden md:col-span-2 lg:col-span-1'>
        <div className='flex justify-between items-start'>
          <div className='min-w-0'>
            <p className='text-xs md:text-sm font-semibold text-slate-500 dark:text-slate-400 truncate'>
              Monto en Riesgo Crítico
            </p>
            <h3 className='text-2xl md:text-4xl font-bold mt-2 text-[#dc3545]'>
              {kpis?.criticalRisk ? formatGs(kpis.criticalRisk.value) : '₲ 0'}
            </h3>
            <div className='flex flex-wrap items-center gap-2 mt-2'>
              <span className='flex items-center text-[#28a745] text-xs md:text-sm font-bold'>
                <span className='material-icons-round text-sm'>
                  trending_down
                </span>{' '}
                {formatGs(12000)}
              </span>
              <span className='text-[10px] md:text-xs text-slate-400 font-medium'>
                en recuperación
              </span>
            </div>
          </div>
          <div className='bg-[#dc35451a] p-2 md:p-3 rounded-lg flex-shrink-0'>
            <span className='material-icons-round text-[#dc3545] text-xl md:text-2xl'>
              report_problem
            </span>
          </div>
        </div>
        <div className='mt-6 md:mt-8 flex items-center gap-2'>
          <span className='text-[8px] md:text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded uppercase'>
            {kpis?.criticalRisk?.clientsCount || 0} CLIENTES
          </span>
          <div className='flex -space-x-2 overflow-hidden'>
            {['JD', 'AC', 'ML'].map((init, i) => (
              <div
                key={i}
                className='inline-block h-5 w-5 md:h-6 md:w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-300 flex items-center justify-center text-[7px] md:text-[8px] font-bold text-slate-700'
              >
                {init}
              </div>
            ))}
            <div className='h-5 w-5 md:h-6 md:w-6 rounded-full ring-2 ring-white dark:ring-slate-900 bg-slate-800 flex items-center justify-center text-[7px] md:text-[8px] font-bold text-white'>
              +5
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AgingKpiGrid
