import { ArrowDown, ArrowUp, ArrowUpDown, Inbox } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { TableEmptyState } from '@/components/ui/TableEmptyState'
import {
  formatDrilldownCount,
  formatDrilldownDate,
  formatDrilldownMoney,
  formatDrilldownUnits,
} from '@/domain/relational-analytics/normalize'
import { parseSortParam } from '@/domain/relational-analytics/sort'
import type { DrilldownColumn } from '@/domain/relational-analytics/types'
import DrilldownRowMenu from './DrilldownRowMenu'
import type { DrilldownRowMenu as DrilldownRowMenuModel } from '../types'

type RowRecord = Record<string, unknown>

interface DrilldownTableProps<Row> {
  columns: readonly DrilldownColumn<Row>[]
  rows: Row[]
  rowKey: (row: Row) => string
  sort: string
  onSort: (field: string) => void
  /** menú por fila (pivotes + copiar); ausente → sin columna de acciones */
  rowMenu?: (row: Row) => DrilldownRowMenuModel
  emptyTitle: string
  /** etiqueta accesible de la tabla (mismo título de la página) */
  ariaLabel: string
  testId?: string
}

const cellValue = (row: unknown, key: string): unknown =>
  (row as RowRecord)[key] ?? null

const renderCell = <Row,>(row: Row, column: DrilldownColumn<Row>, dateLocale: string): string => {
  const value = cellValue(row, column.key)
  switch (column.format) {
    case 'money': {
      const currency = column.currencyKey
        ? (cellValue(row, column.currencyKey) as string | null | undefined)
        : undefined
      return formatDrilldownMoney(value as number | null | undefined, currency)
    }
    case 'units': {
      const baseUnit = cellValue(row, 'base_unit')
      return formatDrilldownUnits(
        value as number | null | undefined,
        typeof baseUnit === 'string' ? baseUnit : null,
      )
    }
    case 'number':
      return formatDrilldownCount(value as number | null | undefined)
    case 'date':
      return formatDrilldownDate(typeof value === 'string' ? value : null, dateLocale)
    default: {
      if (typeof value !== 'string') return '—'
      const trimmed = value.trim()
      return trimmed || '—'
    }
  }
}

/**
 * Tabla genérica de un drill-down: encabezados ordenables según la whitelist
 * del BE, celdas formateadas por el descriptor de columna y empty state
 * DENTRO de la tabla (DESIGN §6.3: la card no se desarma).
 */
export function DrilldownTable<Row>({
  columns,
  rows,
  rowKey,
  sort,
  onSort,
  rowMenu,
  emptyTitle,
  ariaLabel,
  testId = 'drilldown-table',
}: DrilldownTableProps<Row>) {
  const { t, lang } = useI18n()
  const dateLocale = lang === 'en' ? 'en-US' : 'es-PY'
  const active = parseSortParam(sort)
  const columnCount = columns.length + (rowMenu ? 1 : 0)

  return (
    <div className="overflow-x-auto">
      <Table aria-label={ariaLabel} data-testid={testId} className="text-body-md">
        <TableHeader className="bg-surface-muted">
          <TableRow className="border-divider hover:bg-surface-muted">
            {columns.map((column) => {
              const isActiveSort = Boolean(column.sortable) && active.field === column.key
              const SortIcon = !column.sortable
                ? null
                : isActiveSort
                  ? active.dir === 'ASC'
                    ? ArrowUp
                    : ArrowDown
                  : ArrowUpDown
              const label = t(column.labelKey, column.labelFallback)
              return (
                <TableHead
                  key={column.key}
                  aria-sort={
                    column.sortable
                      ? isActiveSort
                        ? active.dir === 'ASC'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                  className={cn(
                    'px-md py-md text-label-caps uppercase text-on-surface-deep',
                    column.align === 'right' && 'text-right',
                  )}
                >
                  {column.sortable && onSort ? (
                    <button
                      type="button"
                      onClick={() => onSort(column.key)}
                      className={cn(
                        'inline-flex items-center gap-xs whitespace-nowrap rounded-xs uppercase transition-colors duration-150 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                        isActiveSort && 'text-primary',
                      )}
                      aria-label={`${label} — ${t(
                        'relationalAnalytics.table.sortToggle',
                        'alternar orden',
                      )}`}
                    >
                      {label}
                      {SortIcon ? <SortIcon className="size-3" aria-hidden="true" /> : null}
                    </button>
                  ) : (
                    <span className="whitespace-nowrap">{label}</span>
                  )}
                </TableHead>
              )
            })}
            {rowMenu ? (
              <TableHead className="px-md py-md text-right">
                <span className="sr-only">
                  {t('relationalAnalytics.table.actions', 'Acciones')}
                </span>
              </TableHead>
            ) : null}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={rowKey(row)}
              className="border-divider transition-colors duration-150 hover:bg-surface-muted"
            >
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  className={cn(
                    'px-md py-md',
                    column.align === 'right' && 'text-right',
                    column.mono && 'font-data-mono',
                    column.muted ? 'text-on-surface-deep' : 'text-foreground',
                  )}
                >
                  {renderCell(row, column, dateLocale)}
                </TableCell>
              ))}
              {rowMenu ? (
                <TableCell className="px-md py-md text-right">
                  <DrilldownRowMenu menu={rowMenu(row)} />
                </TableCell>
              ) : null}
            </TableRow>
          ))}
          {rows.length === 0 ? (
            <TableRow className="border-0 hover:bg-transparent">
              <TableCell colSpan={columnCount} className="px-md py-xl">
                <TableEmptyState
                  icon={Inbox}
                  title={emptyTitle}
                  description={t(
                    'relationalAnalytics.table.emptyHint',
                    'Ajustá los filtros o el rango de fechas.',
                  )}
                />
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}

export default DrilldownTable
