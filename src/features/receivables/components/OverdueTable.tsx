import { useNavigate } from 'react-router-dom'
import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'
import type { OverdueAccount } from '../types'

/**
 * Tabla de cuentas vencidas.
 * Migración FASE 3: .tsx + tokens + honestidad (criterio H7): fuera la
 * búsqueda disabled, los filtros muertos, los checkboxes sin estado, la
 * paginación con total falso ("de 142") y los botones de acción sin
 * handler. Sin fallback 'client_001': sin clientId no navega.
 */
interface OverdueTableProps {
  accounts?: OverdueAccount[]
}

const OverdueTable = ({ accounts = [] }: OverdueTableProps) => {
  const { t } = useI18n()
  const navigate = useNavigate()
  const safeAccounts = Array.isArray(accounts) ? accounts : []

  return (
    <div className="flex flex-col gap-md w-full">
      {/* Contenedor de la Tabla */}
      <div className="bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden flex flex-col transition-shadow hover:shadow-fluent-8">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-muted border-b border-border-subtle">
                <th className="px-md py-md text-label-caps uppercase text-on-surface-deep">
                  {t('bi.receivables.overdue.col.client', 'Cliente / Factura', {})}
                </th>
                <th className="px-md py-md text-label-caps uppercase text-on-surface-deep text-right">
                  {t('bi.receivables.overdue.col.amount', 'Monto', {})}
                </th>
                <th className="px-md py-md text-label-caps uppercase text-on-surface-deep text-center whitespace-nowrap">
                  {t('bi.receivables.overdue.col.days', 'Días Venc.', {})}
                </th>
                <th className="px-md py-md text-label-caps uppercase text-on-surface-deep">
                  {t('bi.receivables.overdue.col.priority', 'Prioridad', {})}
                </th>
                <th className="px-md py-md text-label-caps uppercase text-on-surface-deep">
                  {t('bi.receivables.overdue.col.lastContact', 'Últ. Contacto', {})}
                </th>
                <th className="px-md py-md text-label-caps uppercase text-on-surface-deep text-right">
                  {t('bi.receivables.overdue.col.nextAction', 'Próxima Acción', {})}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {safeAccounts.map((acc, idx) => {
                const isHigh = acc.priority === 'High'
                const isMedium = acc.priority === 'Medium'

                const priorityLabel = isHigh
                  ? t('bi.receivables.overdue.priority.high', 'Crítica', {})
                  : isMedium
                    ? t('bi.receivables.overdue.priority.medium', 'Media', {})
                    : t('bi.receivables.overdue.priority.low', 'Baja', {})

                return (
                  <tr
                    key={acc.id || idx}
                    className="hover:bg-surface-muted transition-colors duration-150"
                  >
                    <td className="px-md py-md">
                      <div className="flex items-center gap-sm">
                        <div className="size-9 rounded-md flex items-center justify-center text-body-sm-bold bg-primary/10 text-primary border border-primary/5">
                          {acc.code}
                        </div>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => {
                              if (acc.clientId) navigate(`/receivables/client-profile/${acc.clientId}`)
                            }}
                            className="text-body-md-bold text-foreground hover:text-primary hover:underline transition-colors text-left"
                          >
                            {acc.client}
                          </button>
                          <span className="text-body-sm-bold font-data-mono text-data-mono text-on-surface-deep">
                            {acc.id ?? '—'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-md py-md text-right">
                      <p className="font-data-mono text-data-mono text-foreground">{formatPYG(acc.amount ?? 0)}</p>
                    </td>
                    <td className="px-md py-md text-center">
                      <span
                        className={`inline-flex items-center px-sm py-0.5 rounded-xs text-body-sm-bold uppercase ${
                          isHigh ? 'text-error bg-error/10' : isMedium ? 'text-warning bg-warning/10' : 'text-success bg-success/10'
                        }`}
                      >
                        {acc.days}
                      </span>
                    </td>
                    <td className="px-md py-md">
                      <div
                        className={`flex items-center gap-xs px-sm py-xs rounded-sm border w-fit ${
                          isHigh
                            ? 'border-error/20 text-error'
                            : isMedium
                              ? 'border-warning/20 text-warning'
                              : 'border-success/20 text-success'
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${isHigh ? 'bg-error animate-pulse' : isMedium ? 'bg-warning' : 'bg-success'}`}
                          aria-hidden="true"
                        />
                        <span className="text-body-sm-bold uppercase">{priorityLabel}</span>
                      </div>
                    </td>
                    <td className="px-md py-md">
                      <div className="flex flex-col leading-tight">
                        <span className="text-body-md-bold text-foreground">{acc.lastContact}</span>
                        <span className="text-label-caps uppercase text-on-surface-deep">{acc.contactVia}</span>
                      </div>
                    </td>
                    <td className="px-md py-md text-right">
                      <span className="text-body-sm-bold text-on-surface-deep">{acc.nextAction}</span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {safeAccounts.length === 0 && (
          <p className="p-xl text-center text-on-surface-deep text-body-md italic">
            {t('bi.receivables.overdue.empty', 'No hay cuentas vencidas', {})}
          </p>
        )}

        {/* Conteo real (el legacy mostraba "de 142 resultados" fijo) */}
        <div className="px-md py-sm border-t border-border-subtle bg-surface-muted">
          <span className="text-label-caps uppercase text-on-surface-deep">
            {t('bi.receivables.overdue.showing', 'Mostrando {n} cuentas', { n: safeAccounts.length })}
          </span>
        </div>
      </div>
    </div>
  )
}

export default OverdueTable
