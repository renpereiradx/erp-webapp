import { useMemo, useState, type ReactNode } from 'react'
import { useI18n } from '@/lib/i18n'
import SegmentedControl from '@/components/ui/SegmentedControl'
import TablePagination from '@/components/ui/TablePagination'
import { formatCount, formatMoney, formatPercent, paginateRows } from '@/domain/inventory-analytics/format'
import { ABC_CLASSES, type AbcClass } from '@/domain/inventory-analytics/abc'
import { INVENTORY_ABC_PAGE_SIZE } from '@/domain/inventory-analytics/constants'
import type { ABCProduct } from '@/types/bi'
import { InventoryTable, type InventoryColumn } from './InventoryTable'

const CLASS_LABEL_KEYS: Record<AbcClass, string> = {
  A: 'inventoryAnalytics.abc.classA',
  B: 'inventoryAnalytics.abc.classB',
  C: 'inventoryAnalytics.abc.classC',
}

const CLASS_FALLBACKS: Record<AbcClass, string> = {
  A: 'Clase A',
  B: 'Clase B',
  C: 'Clase C',
}

interface AbcExplorerProps {
  classA: ABCProduct[]
  classB: ABCProduct[]
  classC: ABCProduct[]
  empty: ReactNode
  testId?: string
}

/**
 * Explorador ABC por clase con paginación client-side (el endpoint devuelve la
 * clasificación completa, sin page/page_size). No muestra `turnover_rate`: el
 * SELECT del repo no lo calcula y viaja en 0.
 */
export const AbcExplorer = ({
  classA,
  classB,
  classC,
  empty,
  testId = 'abc-explorer',
}: AbcExplorerProps) => {
  const { t } = useI18n()
  // La selección se recuerda junto a la firma de conteos: si el período
  // cambia (firma distinta) cae a la primera clase con productos, sin un
  // efecto que sincronice estado derivado (React docs / vercel-react rule
  // `rerender-derived-state-no-effect`).
  const [selection, setSelection] = useState<{ signature: string; abcClass: AbcClass } | null>(
    null,
  )
  const [page, setPage] = useState(1)

  const byClass = useMemo(
    () => ({ A: classA, B: classB, C: classC }) as Record<AbcClass, ABCProduct[]>,
    [classA, classB, classC],
  )
  const firstNonEmpty =
    ABC_CLASSES.find((candidate) => (byClass[candidate]?.length ?? 0) > 0) ?? 'A'
  const countsSignature = `${byClass.A.length}-${byClass.B.length}-${byClass.C.length}`
  const abcClass =
    selection?.signature === countsSignature ? selection.abcClass : firstNonEmpty

  const rows = byClass[abcClass] ?? []
  const slice = paginateRows(rows, page, INVENTORY_ABC_PAGE_SIZE)

  const options = ABC_CLASSES.map((value) => ({
    value,
    label: t('inventoryAnalytics.abc.classTab', '{label} · {count}', {
      label: t(CLASS_LABEL_KEYS[value], CLASS_FALLBACKS[value]),
      count: formatCount(byClass[value]?.length ?? 0),
    }),
  }))

  const columns: Array<InventoryColumn<ABCProduct>> = [
    {
      key: 'rank',
      header: '#',
      align: 'right',
      render: (row) => formatCount(row.rank),
    },
    {
      key: 'product',
      header: t('inventoryAnalytics.abc.tableColumns.product', 'Producto'),
      render: (row) => (
        <div className="min-w-0">
          <p className="text-body-md-bold text-foreground">{row.product_name}</p>
          <p className="font-data-mono text-body-sm text-on-surface-deep">{row.sku}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: t('inventoryAnalytics.abc.tableColumns.category', 'Categoría'),
      render: (row) => row.category_name,
    },
    {
      key: 'sales',
      header: t('inventoryAnalytics.abc.tableColumns.sales', 'Ventas'),
      align: 'right',
      render: (row) => formatMoney(row.total_sales),
    },
    {
      key: 'share',
      header: t('inventoryAnalytics.abc.tableColumns.share', '% ventas'),
      align: 'right',
      render: (row) => formatPercent(row.sales_percentage),
    },
    {
      key: 'cumulative',
      header: t('inventoryAnalytics.abc.tableColumns.cumulative', '% acumulado'),
      align: 'right',
      render: (row) => formatPercent(row.cumulative_pct),
    },
    {
      key: 'units',
      header: t('inventoryAnalytics.abc.tableColumns.units', 'Vendidas'),
      align: 'right',
      render: (row) => formatCount(row.units_sold, 2),
    },
    {
      key: 'stock',
      header: t('inventoryAnalytics.abc.tableColumns.stock', 'Stock'),
      align: 'right',
      render: (row) => formatCount(row.current_stock),
    },
    {
      key: 'stockValue',
      header: t('inventoryAnalytics.abc.tableColumns.stockValue', 'Valor stock (costo)'),
      align: 'right',
      render: (row) => formatMoney(row.stock_value),
    },
  ]

  return (
    <div data-testid={testId}>
      <SegmentedControl
        options={options}
        value={abcClass}
        onChange={(next: string) => {
          setSelection({ signature: countsSignature, abcClass: next as AbcClass })
          setPage(1)
        }}
        aria-label={t('inventoryAnalytics.abc.title', 'Clasificación ABC')}
        size="small"
        className="mb-md"
      />
      <InventoryTable
        columns={columns}
        rows={slice.rows}
        rowKey={(row) => row.product_id}
        empty={empty}
        minWidthClass="min-w-[960px]"
        testId="abc-class-table"
      />
      {slice.totalItems > 0 ? (
        <TablePagination
          page={slice.page}
          totalPages={slice.totalPages}
          totalItems={slice.totalItems}
          onPageChange={setPage}
        />
      ) : null}
    </div>
  )
}

export default AbcExplorer
