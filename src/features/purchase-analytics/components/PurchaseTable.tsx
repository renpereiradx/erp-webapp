import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TABLE_CELL, TABLE_HEADER, TABLE_NUM } from './styles'

export interface PurchaseColumn<Row> {
  key: string
  header: ReactNode
  align?: 'left' | 'right'
  /** Fuerza mono aunque la columna no sea numérica (IDs, fechas). */
  mono?: boolean
  className?: string
  /** `aria-sort` del `<th>` cuando la columna ordena server-side. */
  ariaSort?: 'ascending' | 'descending' | 'none'
  render: (row: Row) => ReactNode
}

interface PurchaseTableProps<Row> {
  columns: Array<PurchaseColumn<Row>>
  rows: Row[]
  rowKey: (row: Row) => string
  /** Estado vacío, renderizado FUERA de la tabla (el thead fija min-width). */
  empty: ReactNode
  minWidthClass?: string
  testId?: string
}

/**
 * Tabla de datos de Analítica de Compras. Sin fetch ni cálculo: columnas y
 * filas llegan resueltas. El sort es server-side; la columna activa llega con
 * `ariaSort` ya resuelto.
 */
export const PurchaseTable = <Row,>({
  columns,
  rows,
  rowKey,
  empty,
  minWidthClass = 'min-w-[720px]',
  testId,
}: PurchaseTableProps<Row>) => {
  const { t } = useI18n()

  // Empty fuera de la tabla: con muchas columnas el thead fija un ancho mínimo
  // que en mobile deja el empty centrado fuera del viewport.
  if (rows.length === 0) {
    return (
      <div className="px-md py-xl" data-testid={testId ? `${testId}-empty` : undefined}>
        {empty}
      </div>
    )
  }

  return (
    <div>
      <p className="mb-xs px-md text-body-sm text-on-surface-deep lg:hidden">
        {t('purchaseAnalytics.table.scrollHint', 'Deslizá la tabla para ver todas las columnas.')}
      </p>
      <Table className={minWidthClass} data-testid={testId}>
        <TableHeader className="bg-surface-muted">
          <TableRow className="border-0 hover:bg-surface-muted">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                aria-sort={column.ariaSort}
                className={`${TABLE_HEADER} ${column.align === 'right' ? 'text-right' : ''} ${column.className ?? ''}`}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={rowKey(row)}
              className="border-0 transition-colors duration-150 hover:bg-surface-muted"
            >
              {columns.map((column) => {
                const numeric = column.align === 'right'
                return (
                  <TableCell
                    key={column.key}
                    className={`${numeric ? TABLE_NUM : TABLE_CELL} ${column.mono ? 'font-data-mono text-data-mono' : ''} ${column.className ?? ''}`}
                  >
                    {column.render(row)}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default PurchaseTable
