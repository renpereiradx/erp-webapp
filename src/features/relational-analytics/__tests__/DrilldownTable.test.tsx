/**
 * Tabla genérica de drill-down: formatos por descriptor (money/units/date),
 * moneda por fila (#4), aria-sort de los encabezados y empty dentro de la
 * tabla (la card no se desarma).
 */
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import DrilldownTable from '../components/DrilldownTable'
import type { DrilldownColumn } from '@/domain/relational-analytics/types'

vi.mock('@/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallbackOrVars?: string | Record<string, unknown>, maybeVars?: Record<string, unknown>) => {
      const fallback = typeof fallbackOrVars === 'string' ? fallbackOrVars : key
      const vars =
        (typeof fallbackOrVars === 'object' && fallbackOrVars !== null ? fallbackOrVars : maybeVars) ?? {}
      return fallback.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`))
    },
  }),
}))

interface Row {
  supplier_id: string
  supplier_name: string
  supplier_doc: string
  last_unit_price: number
  currency: string
  units: number
  purchases: number
  last_purchase_at: string
  base_unit?: string | null
}

const COLUMNS: DrilldownColumn<Row>[] = [
  { key: 'supplier_name', labelKey: 'col.name', labelFallback: 'Proveedor', format: 'text', align: 'left', sortable: true },
  { key: 'supplier_doc', labelKey: 'col.doc', labelFallback: 'Documento', format: 'text', align: 'left', mono: true, muted: true },
  { key: 'last_unit_price', labelKey: 'col.price', labelFallback: 'Último precio', format: 'money', align: 'right', sortable: true, currencyKey: 'currency' },
  { key: 'units', labelKey: 'col.units', labelFallback: 'Cantidad', format: 'units', align: 'right', sortable: true },
  { key: 'purchases', labelKey: 'col.purchases', labelFallback: 'Compras', format: 'number', align: 'right', sortable: true },
  { key: 'last_purchase_at', labelKey: 'col.last', labelFallback: 'Última compra', format: 'date', align: 'right', sortable: true },
]

const ROW: Row = {
  supplier_id: 'SUP-1',
  supplier_name: 'Distribuidora Sur',
  supplier_doc: '80012345-6',
  last_unit_price: 5000,
  currency: 'PYG',
  units: 40,
  purchases: 6,
  last_purchase_at: '2026-09-18T10:00:00Z',
  base_unit: 'kg',
}

describe('DrilldownTable', () => {
  it('formatea montos con la moneda de la fila, unidades con UOM y fechas', () => {
    render(
      <DrilldownTable
        columns={COLUMNS}
        rows={[ROW]}
        rowKey={(row) => row.supplier_id}
        sort='+last_unit_price'
        onSort={() => {}}
        emptyTitle='Sin proveedores'
        ariaLabel='Comparar proveedores'
      />,
    )

    expect(screen.getByText('Distribuidora Sur')).toBeTruthy()
    expect(screen.getByText('80012345-6')).toBeTruthy()
    expect(screen.getByText('Gs. 5.000')).toBeTruthy()
    expect(screen.getByText('40 kg')).toBeTruthy()
    expect(screen.getByText('6')).toBeTruthy()
    expect(screen.getByText(/\d{1,2}\/\d{1,2}\/\d{4}/)).toBeTruthy()
    expect(screen.getByRole('table', { name: 'Comparar proveedores' })).toBeTruthy()
  })

  it('marca aria-sort en el encabezado activo y dispara onSort al click', () => {
    const onSort = vi.fn()
    render(
      <DrilldownTable
        columns={COLUMNS}
        rows={[ROW]}
        rowKey={(row) => row.supplier_id}
        sort='+last_unit_price'
        onSort={onSort}
        emptyTitle='Sin proveedores'
        ariaLabel='Comparar proveedores'
      />,
    )

    const priceHeader = screen.getByRole('columnheader', { name: /Último precio/i })
    expect(priceHeader.getAttribute('aria-sort')).toBe('ascending')
    expect(screen.getByRole('columnheader', { name: /Cantidad/i }).getAttribute('aria-sort')).toBe('none')

    fireEvent.click(within(priceHeader).getByRole('button'))
    expect(onSort).toHaveBeenCalledWith('last_unit_price')
  })

  it('sin filas muestra el empty DENTRO de la tabla', () => {
    render(
      <DrilldownTable
        columns={COLUMNS}
        rows={[]}
        rowKey={(row) => row.supplier_id}
        sort='+last_unit_price'
        onSort={() => {}}
        emptyTitle='Sin proveedores para este producto'
        ariaLabel='Comparar proveedores'
      />,
    )

    expect(screen.getByText('Sin proveedores para este producto')).toBeTruthy()
    expect(screen.queryByText('Distribuidora Sur')).toBeNull()
  })

  it('colspan del empty cuenta la columna de acciones cuando hay rowMenu', () => {
    render(
      <DrilldownTable
        columns={COLUMNS}
        rows={[]}
        rowKey={(row) => row.supplier_id}
        sort='+last_unit_price'
        onSort={() => {}}
        emptyTitle='Sin proveedores'
        ariaLabel='Comparar proveedores'
        rowMenu={() => ({ title: 'x', actions: [] })}
      />,
    )

    const emptyCell = screen.getByText('Sin proveedores').closest('td') as HTMLTableCellElement
    expect(emptyCell.getAttribute('colspan')).toBe(String(COLUMNS.length + 1))
  })
})
