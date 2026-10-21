import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  TABLE_CELL,
  TABLE_CELL_DENSE,
  TABLE_HEADER,
  TABLE_HEADER_DENSE,
  TABLE_NUM,
  TABLE_NUM_DENSE,
} from './styles'

export interface ReceivablesColumn<Row> {
  key: string
  header: ReactNode
  align?: 'left' | 'right'
  /** Fuerza mono aunque la columna no sea numérica (ids, fechas). */
  mono?: boolean
  className?: string
  /** `aria-sort` del `<th>` cuando la columna ordena server-side. */
  ariaSort?: 'ascending' | 'descending' | 'none'
  render: (row: Row, index: number) => ReactNode
}

interface ReceivablesTableProps<Row> {
  columns: Array<ReceivablesColumn<Row>>
  rows: Row[]
  rowKey: (row: Row) => string
  /** Estado vacío: se renderiza FUERA de la tabla (thead ancho en mobile). */
  empty: ReactNode
  minWidthClass?: string
  /** Padding reducido para tablas de muchas columnas. */
  dense?: boolean
  testId?: string
  /** Descripción accesible de la tabla (sr-only `<caption>`). */
  caption?: string
}

/**
 * Tabla de datos de Cuentas por Cobrar. Sin fetch ni cálculo: columnas y filas
 * llegan resueltas por la página o los componentes de sección. Muestra el
 * hint de scroll solo cuando la tabla realmente desborda su contenedor.
 */
export const ReceivablesTable = <Row,>({
  columns,
  rows,
  rowKey,
  empty,
  minWidthClass = 'min-w-[760px]',
  dense = false,
  testId,
  caption,
}: ReceivablesTableProps<Row>) => {
  const { t } = useI18n()
  const headerClass = dense ? TABLE_HEADER_DENSE : TABLE_HEADER
  const cellClass = dense ? TABLE_CELL_DENSE : TABLE_CELL
  const numClass = dense ? TABLE_NUM_DENSE : TABLE_NUM
  const tableRef = useRef<HTMLTableElement>(null)
  const [overflowing, setOverflowing] = useState(false)

  useEffect(() => {
    const table = tableRef.current
    const box = table?.parentElement
    if (!table || !box) return
    const check = () => setOverflowing(box.scrollWidth > box.clientWidth + 1)
    check()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(check)
    observer.observe(box)
    observer.observe(table)
    return () => observer.disconnect()
  }, [rows.length, columns.length])

  if (rows.length === 0) {
    return (
      <div className="px-md py-xl" data-testid={testId ? `${testId}-empty` : undefined}>
        {empty}
      </div>
    )
  }

  return (
    <div>
      {overflowing ? (
        <p className={`mb-xs ${dense ? 'px-sm' : 'px-md'} text-body-sm text-on-surface-deep`}>
          {t('receivables.common.scrollHint', 'Deslizá la tabla para ver todas las columnas.')}
        </p>
      ) : null}
      <Table ref={tableRef} className={minWidthClass} data-testid={testId}>
        {caption ? <caption className="sr-only">{caption}</caption> : null}
        <TableHeader className="bg-surface-muted">
          <TableRow className="border-0 hover:bg-surface-muted">
            {columns.map((column) => (
              <TableHead
                key={column.key}
                aria-sort={column.ariaSort}
                className={`${headerClass} ${column.align === 'right' ? 'text-right' : ''} ${column.className ?? ''}`}
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow
              key={rowKey(row)}
              className="border-0 transition-colors duration-150 hover:bg-surface-muted"
            >
              {columns.map((column) => {
                const numeric = column.align === 'right'
                return (
                  <TableCell
                    key={column.key}
                    className={`${numeric ? numClass : cellClass} ${column.mono ? 'font-data-mono text-data-mono' : ''} ${column.className ?? ''}`}
                  >
                    {column.render(row, index)}
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

export default ReceivablesTable
