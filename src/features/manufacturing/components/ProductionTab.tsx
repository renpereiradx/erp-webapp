/**
 * Pestaña Producción (PLAN_UNITS_V2 F6.2; replanteo UI/UX 2026-10-17):
 * el alta vive en RegisterProductionModal (abierta desde la toolbar) y los
 * datos quedan arriba — una sola tabla full-width §6.3 que fusiona resumen
 * de producción + rentabilidad (misma dimensión producto; antes eran dos
 * cards de 6 columnas en mitades de pantalla), seguida de los últimos lotes.
 */

import { useMemo, useState } from 'react'
import { Factory, Plus } from 'lucide-react'
import { useI18n } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import ErrorState from '@/components/ui/ErrorState'
import { formatCurrency, formatNumber } from '@/utils/currencyUtils'
import { useProduction } from '../hooks/useManufacturing'
import type { ProductionSummaryRow, ProfitabilityRow } from '../types'
import { RegisterProductionModal } from './RegisterProductionModal'

/** Fila única por producto: métricas de producción + economics de rentabilidad. */
interface MergedProductionRow {
  product_id: string
  product_name: string
  total_batches: number
  total_produced: number
  total_production_cost: number
  avg_cost_per_unit: number
  current_stock: number
  profit: ProfitabilityRow | null
}

/**
 * Une ambos reportes por product_id. Rentabilidad puede traer productos sin
 * lotes ni stock (vista con LEFT JOIN sobre precios): se agregan al final en
 * vez de perderlos.
 */
function mergeProductionData(
  summary: ProductionSummaryRow[],
  profitability: ProfitabilityRow[],
): MergedProductionRow[] {
  const byId = new Map<string, MergedProductionRow>()
  for (const s of summary) {
    byId.set(s.product_id, {
      product_id: s.product_id,
      product_name: s.product_name,
      total_batches: s.total_batches,
      total_produced: s.total_produced,
      total_production_cost: s.total_production_cost,
      avg_cost_per_unit: s.avg_cost_per_unit,
      current_stock: s.current_stock,
      profit: null,
    })
  }
  for (const p of profitability) {
    const existing = byId.get(p.product_id)
    if (existing) {
      existing.profit = p
    } else {
      byId.set(p.product_id, {
        product_id: p.product_id,
        product_name: p.product_name,
        total_batches: 0,
        total_produced: p.total_produced,
        total_production_cost: p.total_production_cost,
        avg_cost_per_unit: p.avg_production_cost_per_unit,
        current_stock: p.current_stock,
        profit: p,
      })
    }
  }
  return [...byId.values()]
}

export function ProductionTab() {
  const { t } = useI18n()
  const { data, loading, error, refetch } = useProduction()
  const [modalOpen, setModalOpen] = useState(false)

  const rows = useMemo(
    () => mergeProductionData(data.summary, data.profitability),
    [data.summary, data.profitability],
  )

  return (
    <div className="space-y-xl">
      {loading && <GenericSkeletonList count={5} data-testid="production-skeleton" />}
      {error && <ErrorState message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          {/* Resumen de producción + rentabilidad (tabla fusionada full-width) */}
          <section className="bg-surface rounded-md shadow-whisper border-0 overflow-hidden">
            <div className="px-lg py-md bg-surface-muted border-b border-divider flex items-center justify-between gap-md">
              <div>
                <h2 className="text-title-md text-foreground">
                  {t('manufacturing.production.summary_title')}
                </h2>
                <p className="text-body-sm text-on-surface-deep mt-0.5">
                  {t('manufacturing.production.summary_subtitle')}
                </p>
              </div>
              <Button variant="primary" onClick={() => setModalOpen(true)} data-testid='production-new'>
                <Plus size={16} />
                {t('manufacturing.production.submit')}
              </Button>
            </div>
            <Table className="min-w-[960px]">
              <TableHeader className="bg-surface-muted">
                <TableRow className="hover:bg-surface-muted border-0">
                  {[
                    'summary_col_product',
                    'summary_col_batches',
                    'summary_col_produced',
                    'summary_col_cost',
                    'summary_col_avg',
                    'profit_col_price',
                    'profit_col_margin',
                    'profit_col_pct',
                    'summary_col_stock',
                  ].map((key, i) => (
                    <TableHead
                      key={key}
                      className={
                        'text-label-caps uppercase text-on-surface-deep px-md py-md' +
                        (i > 0 ? ' text-right' : '')
                      }
                    >
                      {t(`manufacturing.production.${key}`)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell colSpan={9} className="py-xl">
                      <div className="flex flex-col items-center justify-center gap-sm text-on-surface-deep">
                        <div className="size-16 rounded-full bg-surface-muted flex items-center justify-center">
                          <Factory size={28} strokeWidth={1.5} className="text-outline-fg" aria-hidden="true" />
                        </div>
                        <p className="text-body-md-bold text-foreground">
                          {t('manufacturing.production.summary_empty')}
                        </p>
                        <p className="text-body-sm text-on-surface-deep">
                          {t('manufacturing.production.summary_empty_hint')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  rows.map((r) => (
                    <TableRow key={r.product_id} className="hover:bg-surface-muted transition-colors duration-150">
                      <TableCell className="text-body-md text-foreground px-md">
                        {r.product_name}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {formatNumber(r.total_batches, 0)}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {formatNumber(r.total_produced)}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {formatCurrency(r.total_production_cost)}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {formatCurrency(r.avg_cost_per_unit)}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {r.profit ? formatCurrency(r.profit.sale_price_per_unit) : '—'}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {r.profit ? formatCurrency(r.profit.profit_margin_per_unit) : '—'}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {r.profit?.profit_margin_percentage != null
                          ? `${formatNumber(r.profit.profit_margin_percentage, 1)}%`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {formatNumber(r.current_stock)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>

          {/* Últimos lotes */}
          <section className="bg-surface rounded-md shadow-whisper border-0 overflow-hidden">
            <div className="px-lg py-md bg-surface-muted border-b border-divider">
              <h2 className="text-title-md text-foreground">
                {t('manufacturing.production.batches_title')}
              </h2>
            </div>
            <Table className="min-w-[720px]">
              <TableHeader className="bg-surface-muted">
                <TableRow className="hover:bg-surface-muted border-0">
                  {[
                    'batches_col_date',
                    'batches_col_code',
                    'batches_col_product',
                    'batches_col_qty',
                    'batches_col_cost',
                    'batches_col_cost_unit',
                  ].map((key) => (
                    <TableHead
                      key={key}
                      className={
                        'text-label-caps uppercase text-on-surface-deep px-md py-md' +
                        (key !== 'batches_col_date' &&
                        key !== 'batches_col_code' &&
                        key !== 'batches_col_product'
                          ? ' text-right'
                          : '')
                      }
                    >
                      {t(`manufacturing.production.${key}`)}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.batches.length === 0 ? (
                  <TableRow className="hover:bg-transparent border-0">
                    <TableCell colSpan={6} className="py-xl">
                      <div className="flex flex-col items-center justify-center gap-sm text-on-surface-deep">
                        <div className="size-16 rounded-full bg-surface-muted flex items-center justify-center">
                          <Factory size={28} strokeWidth={1.5} className="text-outline-fg" aria-hidden="true" />
                        </div>
                        <p className="text-body-md-bold text-foreground">
                          {t('manufacturing.production.batches_empty')}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.batches.map((b) => (
                    <TableRow key={b.id} className="hover:bg-surface-muted transition-colors duration-150">
                      <TableCell className="text-data-mono font-data-mono px-md">
                        {new Date(b.production_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono px-md">
                        {b.batch_code ?? '—'}
                      </TableCell>
                      <TableCell className="text-body-md text-foreground px-md">
                        {b.product_name ?? b.product_id}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {formatNumber(b.quantity_produced)}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {b.production_cost != null ? formatCurrency(b.production_cost) : '—'}
                      </TableCell>
                      <TableCell className="text-data-mono font-data-mono text-right px-md">
                        {b.cost_per_unit != null ? formatCurrency(b.cost_per_unit) : '—'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </section>
        </>
      )}

      <RegisterProductionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={refetch}
      />
    </div>
  )
}

export default ProductionTab
