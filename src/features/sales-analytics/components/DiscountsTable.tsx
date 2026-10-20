import { Percent } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import {
  formatCount,
  formatIsoDate,
  formatMoney,
  formatPercent,
} from '@/domain/sales-analytics/format'
import type { DiscountLine } from '@/types/bi'
import { AnalyticsTable, type AnalyticsColumn } from './AnalyticsTable'

/**
 * Líneas con descuento del rango. `unit_price_original`/`unit_price` son
 * precios UNITARIOS y `discount_amount` es el descuento de la LÍNEA: se
 * muestran por separado y nunca se multiplica para "reconstruir" totales (fue
 * el origen de la fila incoherente de la auditoría).
 *
 * El contrato no trae `product_name` (la vista solo guarda product_id), así que
 * el id viaja como sublínea de la venta. El % de descuento (nullable) va como
 * sublínea del descuento para que la tabla entre sin recortes en desktop.
 */
export const DiscountsTable = ({ lines }: { lines: DiscountLine[] }) => {
  const { t, lang } = useI18n()

  const columns: Array<AnalyticsColumn<DiscountLine>> = [
    {
      key: 'sale',
      header: t('salesAnalytics.discounts.columns.sale', 'Venta'),
      render: (row) => (
        <div>
          <p className="whitespace-nowrap font-data-mono text-data-mono text-foreground">
            {row.sale_id}
          </p>
          <p className="whitespace-nowrap text-body-sm text-on-surface-deep">
            {t('salesAnalytics.discounts.columns.productHint', 'Producto: {id}', {
              id: row.product_id,
            })}
          </p>
        </div>
      ),
    },
    {
      key: 'date',
      mono: true,
      header: t('salesAnalytics.discounts.columns.date', 'Fecha'),
      render: (row) => (
        <span className="whitespace-nowrap">{formatIsoDate(row.sale_date, lang)}</span>
      ),
    },
    {
      key: 'quantity',
      align: 'right',
      header: t('salesAnalytics.discounts.columns.quantity', 'Cantidad'),
      render: (row) => formatCount(row.quantity, 2),
    },
    {
      key: 'original',
      align: 'right',
      header: t('salesAnalytics.discounts.columns.original', 'Precio lista (unit.)'),
      render: (row) => formatMoney(row.unit_price_original),
    },
    {
      key: 'final',
      align: 'right',
      header: t('salesAnalytics.discounts.columns.final', 'Precio final (unit.)'),
      render: (row) => formatMoney(row.unit_price),
    },
    {
      key: 'discount',
      align: 'right',
      header: t('salesAnalytics.discounts.columns.discount', 'Descuento (línea)'),
      render: (row) => (
        <div>
          <p>{formatMoney(row.discount_amount)}</p>
          <p className="text-body-sm text-on-surface-deep">
            {t('salesAnalytics.discounts.columns.percentHint', 'Desc.: {value}', {
              value:
                row.discount_percent === null || row.discount_percent === undefined
                  ? '—'
                  : formatPercent(row.discount_percent),
            })}
          </p>
        </div>
      ),
    },
    {
      key: 'reason',
      header: t('salesAnalytics.discounts.columns.reason', 'Motivo'),
      render: (row) => (
        <span className="text-body-sm" title={row.discount_reason || undefined}>
          {row.discount_reason || '—'}
        </span>
      ),
    },
    {
      key: 'appliedBy',
      header: t('salesAnalytics.discounts.columns.appliedBy', 'Aplicado por'),
      render: (row) => (
        <span>{row.applied_by_name || '—'}</span>
      ),
    },
  ]

  return (
    <div>
      <AnalyticsTable
        columns={columns}
        rows={lines}
        rowKey={(row) => `${row.sale_id}-${row.product_id}-${row.variant_id ?? 'base'}`}
        minWidthClass="min-w-[1000px]"
        testId="discounts-table"
        empty={
          <TableEmptyState
            icon={Percent}
            title={t('salesAnalytics.discounts.empty', 'Sin descuentos en el período')}
            description={t(
              'salesAnalytics.discounts.emptyHint',
              'Probá con otro rango de fechas.',
            )}
          />
        }
      />
      {lines.length > 0 ? (
        <p className="border-t border-divider px-md py-sm text-body-sm text-on-surface-deep">
          {t(
            'salesAnalytics.discounts.unitHint',
            'Los precios son unitarios; el descuento corresponde a la línea completa.',
          )}
        </p>
      ) : null}
    </div>
  )
}

export default DiscountsTable
