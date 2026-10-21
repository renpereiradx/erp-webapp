import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import type { ForecastSeriesRow } from '@/domain/forecast/sales'
import { ForecastBadge } from './ForecastBadges'
import { ForecastTable, type ForecastColumn } from './ForecastTable'

interface ForecastSeriesTableProps {
  rows: ForecastSeriesRow[]
  empty: ReactNode
  testId?: string
  /** Historial no tiene bandas: se ocultan las columnas de límites. */
  showBounds?: boolean
  ariaLabel?: string
}

/**
 * Tabla de una serie temporal (ventas/ingresos): histórico y proyección en el
 * mismo eje, con los límites absolutos que calcula el BE. Sin gráfico
 * fabricado: cada fila es un bucket real del payload.
 */
export const ForecastSeriesTable = ({
  rows,
  empty,
  testId,
  showBounds = true,
  ariaLabel,
}: ForecastSeriesTableProps) => {
  const { t } = useI18n()

  const columns: Array<ForecastColumn<ForecastSeriesRow>> = [
    {
      key: 'period',
      header: t('forecast.common.period', 'Período'),
      render: (row) => <span className="font-data-mono text-data-mono">{row.label}</span>,
    },
    {
      key: 'kind',
      header: t('forecast.common.type', 'Tipo'),
      render: (row) => (
        <ForecastBadge tone={row.kind === 'forecast' ? 'primary' : 'neutral'}>
          {row.kind === 'forecast'
            ? t('forecast.common.projection', 'Proyección')
            : t('forecast.common.history', 'Histórico')}
        </ForecastBadge>
      ),
    },
    {
      key: 'value',
      header: t('forecast.common.value', 'Valor'),
      align: 'right',
      render: (row) => row.valueLabel,
    },
  ]

  if (showBounds) {
    columns.push(
      {
        key: 'lower',
        header: t('forecast.common.lower', 'Límite inferior'),
        align: 'right',
        render: (row) => row.lowerLabel,
      },
      {
        key: 'upper',
        header: t('forecast.common.upper', 'Límite superior'),
        align: 'right',
        render: (row) => row.upperLabel,
      },
    )
  }

  return (
    <ForecastTable
      columns={columns}
      rows={rows}
      rowKey={(row) => row.key}
      empty={empty}
      testId={testId}
      ariaLabel={ariaLabel}
      minWidthClass={showBounds ? 'min-w-[680px]' : 'min-w-[420px]'}
    />
  )
}

export default ForecastSeriesTable
