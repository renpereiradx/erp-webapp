import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { formatPYG } from '@/utils/currencyUtils';
import { formatDrilldownDate } from '@/domain/relational-analytics/normalize';
import type { DrilldownColumn } from '@/domain/relational-analytics/types';
import { parseSortParam } from '@/domain/relational-analytics/sort';

interface DrilldownTableProps<Row> {
  columns: readonly DrilldownColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  sort?: string;
  onSort?: (field: string) => void;
  emptyKey: string;
  emptyFallback: string;
}

const renderCell = <Row,>(row: Row, col: DrilldownColumn<Row>) => {
  const value = row[col.key];
  switch (col.format) {
    case 'money':
      return formatPYG(Number(value ?? 0));
    case 'units':
      return `${Number(value ?? 0).toLocaleString()} uds.`;
    case 'number':
      return Number(value ?? 0).toLocaleString();
    case 'date':
      return formatDrilldownDate(value as string | null | undefined);
    default:
      return (value as string) || '—';
  }
};

/** Tabla genérica de drill-down: encabezados ordenables + estados de fila. */
function DrilldownTable<Row>({ columns, rows, rowKey, sort, onSort, emptyKey, emptyFallback }: DrilldownTableProps<Row>) {
  const { t } = useI18n();
  const active = parseSortParam(sort ?? '');

  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-surface shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse" data-testid="drilldown-table">
          <thead className="bg-surface-muted text-on-surface-deep uppercase text-[10px] font-black tracking-widest border-b border-border-subtle">
            <tr>
              {columns.map((col) => {
                const isActiveSort = col.sortable && active.field === col.key;
                const SortIcon = !col.sortable
                  ? null
                  : isActiveSort
                    ? active.dir === 'ASC'
                      ? ArrowUp
                      : ArrowDown
                    : ArrowUpDown;
                return (
                  <th key={col.key} className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''}`}>
                    {col.sortable && onSort ? (
                      <button
                        type="button"
                        onClick={() => onSort(col.key)}
                        className={`inline-flex items-center gap-1 uppercase tracking-widest transition-colors hover:text-primary ${isActiveSort ? 'text-primary' : ''}`}
                        aria-label={`${t(col.labelKey, col.labelFallback)} — ${t('bi.relational.sort.toggle', 'alternar orden')}`}
                      >
                        {t(col.labelKey, col.labelFallback)}
                        {SortIcon ? <SortIcon size={12} aria-hidden="true" /> : null}
                      </button>
                    ) : (
                      t(col.labelKey, col.labelFallback)
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-surface-muted transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''} ${
                      col.format === 'money' ? 'font-black font-mono text-primary' : ''
                    } ${col.format === 'number' || col.format === 'units' ? 'font-mono font-bold text-on-surface-deep' : ''}`}
                  >
                    {renderCell(row, col)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-8 text-center text-on-surface-deep font-medium italic text-xs uppercase tracking-widest"
                >
                  {t(emptyKey, emptyFallback)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DrilldownTable;
