import React from 'react'

// Formatear moneda en Guaraníes (sin decimales)
const formatGs = amount => {
  return `₲ ${Math.round(amount).toLocaleString('es-PY')}`
}

/**
 * Main Data Grid: Analytical Breakdown per Client (Receivables).
 * 100% STITCH FIDELITY - RESPONSIVE OPTIMIZED
 */
const AgingBreakdownTable = ({
  clients,
  totals,
  searchTerm,
  setSearchTerm,
}) => {
  const getRiskBadge = risk => {
    switch (risk) {
      case 'Mínimo':
        return (
          <span className='px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#28a7451a] text-[#28a745] uppercase whitespace-nowrap'>
            Mínimo
          </span>
        )
      case 'Moderado':
        return (
          <span className='px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#ffc1071a] text-[#ffc107] uppercase whitespace-nowrap'>
            Moderado
          </span>
        )
      case 'Crítico':
        return (
          <span className='px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#dc35451a] text-[#dc3545] uppercase whitespace-nowrap'>
            Crítico
          </span>
        )
      default:
        return (
          <span className='px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 uppercase whitespace-nowrap'>
            {risk}
          </span>
        )
    }
  }

  return (
    <section className='bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-10'>
      {/* Toolbar - Responsive stack */}
      <div className='px-4 md:px-8 py-4 md:py-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 dark:bg-slate-800/20 gap-4'>
        <h2 className='text-base md:text-lg font-bold flex items-center gap-2'>
          <span className='material-icons-round text-[#137fec]'>list_alt</span>
          Desglose por Cliente
        </h2>
        <div className='flex items-center gap-3 w-full sm:w-auto'>
          <div className='relative flex-1 sm:flex-none'>
            <span className='material-icons-round absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg'>
              search
            </span>
            <input
              className='pl-10 pr-4 py-2 text-xs md:text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded w-full sm:w-64 md:w-80 focus:ring-[#137fec] focus:border-[#137fec] outline-none'
              placeholder='Buscar...'
              type='text'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className='hidden xs:flex border border-slate-200 dark:border-slate-700 rounded overflow-hidden flex-shrink-0'>
            <button className='px-2 md:px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'>
              <span className='material-icons-round text-sm'>view_list</span>
            </button>
            <button className='px-2 md:px-3 py-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors'>
              <span className='material-icons-round text-sm'>grid_view</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table - Optimized horizontal scroll */}
      <div className='overflow-x-auto custom-scrollbar'>
        <table className='w-full text-left border-collapse min-w-[1000px]'>
          <thead>
            <tr className='bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider'>
              <th className='px-4 md:px-8 py-4 sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-b border-slate-200 dark:border-slate-700'>
                Cliente
              </th>
              <th className='px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-right'>
                Corriente
              </th>
              <th className='px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-right'>
                31-60 D
              </th>
              <th className='px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-right'>
                61-90 D
              </th>
              <th className='px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-right'>
                +90 D
              </th>
              <th className='px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-right'>
                Total
              </th>
              <th className='px-4 py-4 border-b border-slate-200 dark:border-slate-700 text-center'>
                Riesgo
              </th>
              <th className='px-4 md:px-8 py-4 border-b border-slate-200 dark:border-slate-700 text-right'>
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className='divide-y divide-slate-100 dark:divide-slate-800 text-sm'>
            {clients.map((c, idx) => {
              const isCritical = c.risk === 'Crítico'
              return (
                <tr
                  key={idx}
                  className={
                    isCritical
                      ? 'bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/40 transition-colors'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors'
                  }
                >
                  <td
                    className={`px-4 md:px-8 py-4 sticky left-0 font-semibold text-slate-700 dark:text-slate-200 border-r border-slate-100 dark:border-slate-800 ${isCritical ? 'bg-[#fef2f2] dark:bg-[#1a1010]' : 'bg-white dark:bg-slate-900'}`}
                  >
                    {c.name}
                  </td>
                  <td className='px-4 py-4 text-right font-medium text-[#28a745] whitespace-nowrap'>
                    {formatGs(c.corriente)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-medium whitespace-nowrap ${c.v31_60 > 0 ? 'text-[#ffc107]' : ''}`}
                  >
                    {formatGs(c.v31_60)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-medium whitespace-nowrap ${c.v61_90 > 0 ? 'text-[#fd7e14]' : ''}`}
                  >
                    {formatGs(c.v61_90)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-medium whitespace-nowrap ${c.v91plus > 0 ? 'text-[#dc3545]' : ''}`}
                  >
                    {formatGs(c.v91plus)}
                  </td>
                  <td
                    className={`px-4 py-4 text-right font-bold whitespace-nowrap ${isCritical ? 'text-[#dc3545]' : 'text-slate-900 dark:text-white'}`}
                  >
                    {formatGs(c.total)}
                  </td>
                  <td className='px-4 py-4 text-center'>
                    {getRiskBadge(c.risk)}
                  </td>
                  <td className='px-4 md:px-8 py-4 text-right'>
                    <button className='text-[#137fec] hover:bg-[#137fec0d] p-1 rounded transition-colors'>
                      <span className='material-icons-round text-lg'>
                        more_horiz
                      </span>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className='bg-slate-100 dark:bg-slate-800/80 font-bold border-t border-slate-200 dark:border-slate-700'>
            <tr>
              <td className='px-4 md:px-8 py-4 sticky left-0 bg-slate-100 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 text-[10px] uppercase tracking-wider'>
                TOTALES
              </td>
              <td className='px-4 py-4 text-right text-xs whitespace-nowrap'>
                {formatGs(totals.corriente)}
              </td>
              <td className='px-4 py-4 text-right text-xs whitespace-nowrap'>
                {formatGs(totals.v31_60)}
              </td>
              <td className='px-4 py-4 text-right text-xs whitespace-nowrap'>
                {formatGs(totals.v61_90)}
              </td>
              <td className='px-4 py-4 text-right text-xs whitespace-nowrap'>
                {formatGs(totals.v91plus)}
              </td>
              <td className='px-4 py-4 text-right text-[#137fec] text-base whitespace-nowrap'>
                {formatGs(totals.total)}
              </td>
              <td className='px-4 py-4'></td>
              <td className='px-4 md:px-8 py-4'></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Pagination Footer - Responsive layout */}
      <div className='px-4 md:px-8 py-4 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center bg-white dark:bg-slate-900 gap-4'>
        <p className='text-xs md:text-sm text-slate-500 font-medium'>
          Mostrando {clients.length} de {clients.length} clientes
        </p>
        <div className='flex items-center gap-2'>
          <button
            className='p-2 border border-slate-200 dark:border-slate-700 rounded disabled:opacity-50 transition-opacity'
            disabled
          >
            <span className='material-icons-round text-sm'>chevron_left</span>
          </button>
          <div className='flex items-center gap-1'>
            <button className='px-2.5 md:px-3 py-1 bg-[#137fec] text-white rounded text-xs md:text-sm font-bold shadow-sm'>
              1
            </button>
            <button className='px-2.5 md:px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs md:text-sm font-medium transition-colors'>
              2
            </button>
            <button className='px-2.5 md:px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs md:text-sm font-medium transition-colors'>
              3
            </button>
            <span className='px-1 text-slate-400 font-medium text-xs'>...</span>
            <button className='hidden xs:block px-2.5 md:px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-xs md:text-sm font-medium transition-colors'>
              15
            </button>
          </div>
          <button className='p-2 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-50 transition-colors'>
            <span className='material-icons-round text-sm'>chevron_right</span>
          </button>
        </div>
      </div>
    </section>
  )
}

export default AgingBreakdownTable
