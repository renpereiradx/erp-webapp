import type { ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TABLE_CELL, TABLE_HEADER, TABLE_NUM } from './styles'

export interface AnalyticsColumn<Row> {
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

interface AnalyticsTableProps<Row> {
  columns: Array<AnalyticsColumn<Row>>
  rows: Row[]
  rowKey: (row: Row) => string
  /** Estado vacío como fila `colSpan` (la card sigue armada). */
  empty: ReactNode
  minWidthClass?: string
  testId?: string
}

/**
 * Tabla de datos de Analítica de Ventas. Sin fetch ni cálculo: columnas y
 * filas llegan resueltas. La usan productos, clientes, vendedores, categorías,
 * comparativa y descuentos.
 */
export const AnalyticsTable = <Row,>({
  columns,
  rows,
  rowKey,
  empty,
  minWidthClass = 'min-w-[720px]',
  testId,
}: AnalyticsTableProps<Row>) => {
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
        {t('salesAnalytics.table.scrollHint', 'Deslizá la tabla para ver todas las columnas.')}
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

export default AnalyticsTable
