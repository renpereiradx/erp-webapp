import { useI18n } from '@/lib/i18n'
import { formatPYG } from '@/utils/currencyUtils'
import { sumClientAgingTotals, type ClientAgingRow } from '@/domain/receivables/aging'

/**
 * Tabla detallada de antigüedad por cliente.
 * Migración FASE 3: .tsx + tokens + i18n (los totales ya viven en domain).
 */
interface AgingByClientTableProps {
  clientsData?: ClientAgingRow[]
}

const AgingByClientTable = ({ clientsData = [] }: AgingByClientTableProps) => {
  const { t } = useI18n()
  const safeData = Array.isArray(clientsData) ? clientsData : []
  const portfolioTotals = sumClientAgingTotals(safeData)

  return (
    <div className="bg-surface rounded-md border border-border-subtle shadow-whisper overflow-hidden flex flex-col flex-1 transition-shadow hover:shadow-fluent-8">
      <div className="px-md py-md border-b border-border-subtle bg-surface-muted">
        <h3 className="text-title-md text-foreground tracking-tight">
          {t('bi.receivables.aging.byClient.title', 'Desglose por Cliente', {})}
        </h3>
        <p className="text-label-caps uppercase text-on-surface-deep mt-0.5">
          {t('bi.receivables.aging.byClient.subtitle', 'Distribución de deuda por tramos de vencimiento', {})}
        </p>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-surface-muted text-label-caps uppercase text-on-surface-deep border-b border-border-subtle">
              <th className="px-md py-md">{t('bi.receivables.aging.byClient.col.client', 'Cliente', {})}</th>
              <th className="px-md py-md text-right">{t('bi.receivables.aging.byClient.col.current', 'Al Día', {})}</th>
              <th className="px-md py-md text-right">{t('bi.receivables.aging.byClient.col.days31_60', '31-60 Días', {})}</th>
              <th className="px-md py-md text-right">{t('bi.receivables.aging.byClient.col.days61_90', '61-90 Días', {})}</th>
              <th className="px-md py-md text-right">{t('bi.receivables.aging.byClient.col.over90', '+90 Días', {})}</th>
              <th className="px-md py-md text-right">{t('bi.receivables.aging.byClient.col.total', 'Saldo Total', {})}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {safeData.map((client, idx) => (
              <tr key={idx} className="hover:bg-surface-muted transition-colors duration-150">
                <td className="px-md py-md">
                  <div className="flex items-center gap-sm">
                    <div className="size-8 rounded-md bg-primary/10 text-primary flex items-center justify-center text-body-sm-bold border border-primary/5">
                      {client.client_name?.charAt(0) || 'C'}
                    </div>
                    <span className="text-body-md-bold text-foreground">{client.client_name}</span>
                  </div>
                </td>
                <td className="px-md py-md text-right font-data-mono text-data-mono text-success">
                  {formatPYG(client.current || 0)}
                </td>
                <td className={`px-md py-md text-right font-data-mono text-data-mono ${(client.days_31_60 ?? 0) > 0 ? 'text-warning' : 'text-on-surface-deep'}`}>
                  {formatPYG(client.days_31_60 || 0)}
                </td>
                <td className={`px-md py-md text-right font-data-mono text-data-mono ${(client.days_61_90 ?? 0) > 0 ? 'text-warning' : 'text-on-surface-deep'}`}>
                  {formatPYG(client.days_61_90 || 0)}
                </td>
                <td className={`px-md py-md text-right font-data-mono text-data-mono ${(client.over_90_days ?? 0) > 0 ? 'text-error' : 'text-on-surface-deep'}`}>
                  {formatPYG(client.over_90_days || 0)}
                </td>
                <td className="px-md py-md text-right font-data-mono text-data-mono text-foreground">
                  {formatPYG(client.total || 0)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-surface-muted border-t-2 border-border-subtle">
            <tr>
              <td className="px-md py-sm text-label-caps uppercase text-on-surface-deep">
                {t('bi.receivables.aging.byClient.totals', 'Totales de Cartera', {})}
              </td>
              <td className="px-md py-sm text-right font-data-mono text-data-mono text-success">
                {formatPYG(portfolioTotals.current)}
              </td>
              <td className="px-md py-sm text-right font-data-mono text-data-mono text-warning">
                {formatPYG(portfolioTotals.days_31_60)}
              </td>
              <td className="px-md py-sm text-right font-data-mono text-data-mono text-warning">
                {formatPYG(portfolioTotals.days_61_90)}
              </td>
              <td className="px-md py-sm text-right font-data-mono text-data-mono text-error">
                {formatPYG(portfolioTotals.over_90_days)}
              </td>
              <td className="px-md py-sm text-right font-data-mono text-data-mono text-primary">
                {formatPYG(portfolioTotals.total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

export default AgingByClientTable
