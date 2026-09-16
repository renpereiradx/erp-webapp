import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import auditService from '@/services/bi/auditService'

const DONUT_COLORS = ['#0078D4', '#455f89', '#107c10', '#d83b01', '#964400']

const buildCurvePath = (values, width, height) => {
  if (!values.length) return ''
  const max = Math.max(...values, 1)
  const step = values.length > 1 ? width / (values.length - 1) : width
  return values
    .map((v, i) => {
      const x = i * step
      const y = height - (v / max) * (height - 10) - 5
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
}

export default function AuditDashboard() {
  const [period, setPeriod] = useState('month')
  const [data, setData] = useState(null)
  const [trends, setTrends] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const securityAlerts = Array.isArray(data?.security_alerts) ? data.security_alerts : []
  const actionsByCategory = Array.isArray(data?.actions_by_category) ? data.actions_by_category : []
  const topUsers = Array.isArray(data?.top_users) ? data.top_users : []
  const kpis = data?.kpis || null
  const totalLogs = Number(kpis?.total_actions || 0)
  const successRate = Number(kpis?.success_rate || 0)
  const uniqueUsers = Number(kpis?.unique_users || 0)

  useEffect(() => {
    fetchSummary()
  }, [period])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      setError(null)
      const [summaryRes, trendsRes] = await Promise.all([
        auditService.getSummary(period),
        auditService.getTrends(period).catch(() => null),
      ])
      // El endpoint responde el envelope {success, data} — el payload vive en .data
      setData(summaryRes?.data ?? summaryRes)
      setTrends(Array.isArray(trendsRes?.data) ? trendsRes.data : [])
    } catch (err) {
      console.error('Error fetching audit summary:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Curva real: total de acciones por día desde /audit/trends
  const trendPaths = useMemo(() => {
    const ok = trends.filter((t) => t && (t.total_actions != null || t.successful != null))
    const totals = ok.map((t) => Number(t.total_actions || 0))
    const failed = ok.map((t) => Number(t.failed || 0))
    return {
      labels: ok.map((t) => t.label || ''),
      total: buildCurvePath(totals, 400, 150),
      failed: buildCurvePath(failed, 400, 150),
      hasData: ok.some((t) => Number(t.total_actions || 0) > 0),
    }
  }, [trends])

  // Donut real: segmentos desde actions_by_category (percentage real)
  const donutSegments = useMemo(() => {
    let offset = 0
    return actionsByCategory.slice(0, 5).map((item, idx) => {
      const pct = Number(item.percentage || 0)
      const seg = { color: DONUT_COLORS[idx % DONUT_COLORS.length], pct, offset }
      offset += pct
      return seg
    })
  }, [actionsByCategory])

  if (loading) {
    return (
      <div className='flex justify-center items-center h-64 text-on-surface-deep'>
        Cargando dashboard...
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex flex-col items-center justify-center h-64 gap-4'>
        <p className='text-foreground text-sm font-bold'>No se pudo cargar el dashboard de auditoría.</p>
        <button
          onClick={fetchSummary}
          className='px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl bg-primary text-on-primary hover:bg-primary-container transition-all'
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (!data) {
    return <div className='text-error'>Error al cargar los datos.</div>
  }

  return (
    <div className='flex flex-col gap-8 animate-in fade-in duration-500 font-inter'>
      {/* Header */}
      <div className='flex flex-wrap items-end justify-between gap-4'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-foreground text-3xl font-black leading-tight tracking-tight'>
            Dashboard de Auditoría
          </h1>
          <p className='text-on-surface-deep text-sm font-medium'>
            Control total de trazabilidad y eventos de seguridad del sistema.
          </p>
        </div>
        <div className='flex h-11 items-center rounded-lg bg-surface-muted p-1.5 shadow-inner'>
          {['hoy', 'semana', 'mes', 'ano'].map(p => (
            <label
              key={p}
              className={`flex cursor-pointer h-full items-center justify-center rounded-lg px-4 transition-all text-xs font-bold uppercase tracking-wider ${
                (p === 'mes' && period === 'month') ||
                (p === 'hoy' && period === 'today') ||
                (p === 'semana' && period === 'week') ||
                (p === 'ano' && period === 'year')
                  ? 'bg-surface shadow-sm text-primary'
                  : 'text-on-surface-deep hover:text-foreground'
              }`}
            >
              <span className='capitalize'>{p}</span>
              <input
                className='hidden'
                name='period'
                type='radio'
                value={p}
                checked={
                  period === (p === 'ano' ? 'year' : p === 'mes' ? 'month' : p)
                }
                onChange={() =>
                  setPeriod(p === 'ano' ? 'year' : p === 'mes' ? 'month' : p)
                }
              />
            </label>
          ))}
        </div>
      </div>

      {/* Fila de KPIs (fuente real: kpis del endpoint dashboard) */}
      <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='bg-surface p-6 rounded-lg shadow-sm border border-border-subtle flex items-center gap-4 transition-all hover:shadow-md'>
          <div className='flex items-center justify-center size-12 rounded-lg bg-primary/10 text-primary'>
            <span className='material-symbols-outlined text-2xl'>history</span>
          </div>
          <div>
            <p className='text-on-surface-deep text-xs font-semibold uppercase tracking-wide'>
              Total de Acciones
            </p>
            <p className='text-2xl font-bold text-foreground'>
              {totalLogs.toLocaleString('es-PY')}
            </p>
          </div>
        </div>

        <div className='bg-surface p-6 rounded-lg shadow-sm border border-border-subtle flex items-center gap-4'>
          <div className='flex items-center justify-center size-12 rounded-lg bg-success/10 text-success'>
            <span className='material-symbols-outlined text-2xl'>verified</span>
          </div>
          <div>
            <p className='text-on-surface-deep text-xs font-semibold uppercase tracking-wide'>
              Tasa de Éxito
            </p>
            <p className='text-2xl font-bold text-foreground'>
              {totalLogs > 0 ? `${successRate}%` : 'n/d'}
            </p>
            {totalLogs > 0 && (
              <p className={`text-[11px] font-bold flex items-center gap-0.5 ${successRate >= 95 ? 'text-success' : 'text-warning'}`}>
                <span className='material-symbols-outlined text-sm'>
                  {successRate >= 95 ? 'check' : 'warning'}
                </span>{' '}
                {successRate >= 95 ? 'Óptimo' : 'Revisar fallos'}
              </p>
            )}
          </div>
        </div>

        <div className='bg-surface p-6 rounded-lg shadow-sm border border-border-subtle flex items-center gap-4'>
          <div className='flex items-center justify-center size-12 rounded-lg bg-secondary/10 text-secondary'>
            <span className='material-symbols-outlined text-2xl'>person</span>
          </div>
          <div>
            <p className='text-on-surface-deep text-xs font-semibold uppercase tracking-wide'>
              Usuarios Únicos
            </p>
            <p className='text-2xl font-bold text-foreground'>{uniqueUsers}</p>
          </div>
        </div>

        <div className='bg-surface p-6 rounded-lg shadow-sm border border-error/20 flex items-center gap-4'>
          <div className='flex items-center justify-center size-12 rounded-lg bg-error-container text-on-error-container'>
            <span className='material-symbols-outlined text-2xl'>report</span>
          </div>
          <div>
            <p className='text-on-surface-deep text-xs font-semibold uppercase tracking-wide'>
              Alertas de Seguridad
            </p>
            <p className='text-2xl font-bold text-foreground'>
              {securityAlerts.length}
            </p>
            {securityAlerts.length > 0 && (
              <p className='text-error text-[11px] font-bold flex items-center gap-0.5'>
                <span className='material-symbols-outlined text-sm'>warning</span>{' '}
                Requiere atención
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Fila de Gráficos */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='bg-surface p-6 rounded-lg shadow-sm border border-border-subtle'>
          <div className='flex justify-between items-center mb-6'>
            <h3 className='text-lg font-bold text-foreground'>
              Tendencias de Actividad
            </h3>
            <div className='flex gap-4'>
              <div className='flex items-center gap-1.5'>
                <span className='size-2 rounded-full bg-primary'></span>
                <span className='text-[10px] font-bold text-on-surface-deep uppercase'>
                  Total
                </span>
              </div>
              <div className='flex items-center gap-1.5'>
                <span className='size-2 rounded-full bg-warning'></span>
                <span className='text-[10px] font-bold text-on-surface-deep uppercase'>
                  Fallidas
                </span>
              </div>
            </div>
          </div>
          {trendPaths.hasData ? (
            <div className='h-64 flex flex-col justify-end'>
              <svg
                className='w-full h-full'
                preserveAspectRatio='none'
                viewBox='0 0 400 150'
              >
                <path
                  d={trendPaths.failed}
                  fill='none'
                  className='stroke-warning'
                  strokeDasharray='4'
                  strokeWidth='2'
                ></path>
                <path
                  d={trendPaths.total}
                  fill='none'
                  className='stroke-primary'
                  strokeWidth='3'
                ></path>
              </svg>
              <div className='flex justify-between mt-4 text-[10px] font-bold text-on-surface-deep uppercase tracking-tighter'>
                {trendPaths.labels.slice(0, 7).map((label, idx) => (
                  <span key={idx}>{label}</span>
                ))}
              </div>
            </div>
          ) : (
            <div className='h-64 flex flex-col items-center justify-center gap-2'>
              <span className='material-symbols-outlined text-3xl text-on-surface-deep'>show_chart</span>
              <p className='text-sm font-bold text-on-surface-deep'>Sin actividad registrada en el período.</p>
            </div>
          )}
        </div>

        <div className='bg-surface p-6 rounded-lg shadow-sm border border-border-subtle'>
          <h3 className='text-lg font-bold text-foreground mb-6'>
            Acciones por Categoría
          </h3>
          {totalLogs > 0 && donutSegments.length > 0 ? (
            <div className='flex items-center justify-around h-64'>
              <div className='relative flex items-center justify-center size-48'>
                <svg className='size-full -rotate-90' viewBox='0 0 36 36'>
                  <circle
                    className='stroke-border-subtle'
                    cx='18'
                    cy='18'
                    fill='none'
                    r='16'
                    strokeWidth='4'
                  ></circle>
                  {donutSegments.map((seg, idx) => (
                    <circle
                      key={idx}
                      cx='18'
                      cy='18'
                      fill='none'
                      r='16'
                      stroke={seg.color}
                      strokeDasharray={`${(seg.pct / 100) * 100.5} ${100.5 - (seg.pct / 100) * 100.5}`}
                      strokeDashoffset={`-${(seg.offset / 100) * 100.5}`}
                      strokeWidth='4'
                    ></circle>
                  ))}
                </svg>
                <div className='absolute inset-0 flex flex-col items-center justify-center'>
                  <span className='text-2xl font-black text-foreground'>{totalLogs.toLocaleString('es-PY')}</span>
                  <span className='text-[10px] font-bold text-on-surface-deep uppercase'>
                    Acciones
                  </span>
                </div>
              </div>
              <div className='flex flex-col gap-3'>
                {donutSegments.map((seg, idx) => (
                  <div key={actionsByCategory[idx].category} className='flex items-center gap-3'>
                    <span
                      className='size-3 rounded-sm'
                      style={{ backgroundColor: seg.color }}
                    ></span>
                    <div className='flex flex-col'>
                      <span className='text-xs font-bold text-foreground uppercase tracking-tighter'>
                        {actionsByCategory[idx].category}
                      </span>
                      <span className='text-[10px] text-on-surface-deep font-bold'>
                        {seg.pct}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className='h-64 flex flex-col items-center justify-center gap-2'>
              <span className='material-symbols-outlined text-3xl text-on-surface-deep'>donut_small</span>
              <p className='text-sm font-bold text-on-surface-deep'>Sin datos de categorías en el período.</p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row */}
      <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
        <div className='xl:col-span-2 bg-surface rounded-lg shadow-sm border border-border-subtle overflow-hidden'>
          <div className='p-6 border-b border-border-subtle'>
            <h3 className='text-lg font-bold text-foreground'>
              Top Usuarios Activos
            </h3>
          </div>
          <div className='overflow-x-auto'>
            <table className='w-full text-left'>
              <thead className='bg-surface-muted text-on-surface-deep text-[11px] font-bold uppercase tracking-wider'>
                <tr>
                  <th className='px-6 py-4'>Usuario</th>
                  <th className='px-6 py-4 text-center'>Acciones Totales</th>
                  <th className='px-6 py-4 text-center'>% Éxito</th>
                  <th className='px-6 py-4'></th>
                </tr>
              </thead>
              <tbody className='divide-y divide-border-subtle'>
                {topUsers.map(user => {
                  const totalUserActions = Number(user.total_actions || 0)
                  const successfulUserActions = Number(
                    user.successful_actions || 0,
                  )
                  const successPercent =
                    totalUserActions > 0
                      ? (successfulUserActions / totalUserActions) * 100
                      : 0
                  const username = user?.username || 'N/A'
                  const avatarLetter = username.charAt(0) || 'N'

                  return (
                    <tr
                      key={user.user_id}
                      className='hover:bg-surface-muted transition-colors'
                    >
                      <td className='px-6 py-4'>
                        <div className='flex items-center gap-3'>
                          <div className='size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs border border-primary/20 uppercase'>
                            {avatarLetter}
                          </div>
                          <Link
                            to={`/auditoria/usuarios/${user.user_id}`}
                            className='text-sm font-semibold text-foreground hover:text-primary'
                          >
                            {username}
                          </Link>
                        </div>
                      </td>
                      <td className='px-6 py-4 text-center font-bold text-sm font-mono text-foreground'>
                        {totalUserActions.toLocaleString('es-PY')}
                      </td>
                      <td className='px-6 py-4'>
                        <div className='flex items-center justify-center gap-3'>
                          <div className='w-20 h-1.5 bg-surface-subtle rounded-full overflow-hidden'>
                            <div
                              className='h-full bg-success'
                              style={{ width: `${successPercent}%` }}
                            ></div>
                          </div>
                          <span className='text-xs font-bold text-foreground'>
                            {successPercent.toFixed(1)}%
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4'></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className='bg-surface rounded-lg shadow-sm border border-border-subtle flex flex-col overflow-hidden'>
          <div className='p-6 border-b border-border-subtle flex justify-between items-center'>
            <h3 className='text-lg font-bold text-foreground'>
              Alertas Recientes
            </h3>
            <span className='flex items-center justify-center size-5 bg-error-container text-on-error-container text-[10px] font-black rounded-full'>
              {securityAlerts.length}
            </span>
          </div>
          <div className='flex-1 space-y-4 p-4 overflow-y-auto max-h-[450px]'>
            {securityAlerts.map((alert, idx) => (
              <div
                key={idx}
                className='p-3 rounded-lg bg-error-container/50 border-l-4 border-error'
              >
                <div className='flex justify-between items-start mb-1'>
                  <span className='text-[9px] font-black uppercase text-on-error-container tracking-widest bg-error-container px-1.5 py-0.5 rounded'>
                    {alert.severity}
                  </span>
                  {alert.occurred_at && (
                    <span className='text-[10px] text-on-surface-deep font-medium'>
                      {new Date(alert.occurred_at).toLocaleString('es-PY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className='text-sm font-bold text-foreground mb-1 leading-snug'>
                  {alert.message}
                </p>
                <p className='text-[11px] text-on-surface-deep uppercase font-bold tracking-tighter'>
                  ID: {alert.user_id} &middot; {alert.ip_address}
                </p>
              </div>
            ))}
          </div>
          <div className='p-4 border-t border-border-subtle text-center'>
            <Link
              to='/auditoria/logs'
              className='text-on-surface-deep text-xs font-bold hover:text-primary transition-colors flex items-center justify-center gap-1 w-full uppercase tracking-widest'
            >
              Explorar historial completo{' '}
              <span className='material-symbols-outlined text-sm'>
                arrow_forward
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
