import { Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/lib/i18n'

import type { Category } from '../types'

interface CategoriesTableProps {
  categories: Category[]
  loading?: boolean
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  emptyMessage?: string
}

export default function CategoriesTable({
  categories,
  loading = false,
  onEdit,
  onDelete,
  emptyMessage,
}: CategoriesTableProps) {
  const { t } = useI18n()
  return (
    <div className="overflow-hidden rounded-xl border border-border-subtle bg-white dark:bg-surface-dark shadow-fluent-2">
      <Table>
        <TableHeader className="bg-slate-50/80 dark:bg-slate-800/50">
          <TableRow>
            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-3">
              {t('categories.table.name')}
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-3">
              {t('categories.table.description')}
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-3">
              {t('categories.table.tax_rate')}
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-3">
              {t('categories.table.status')}
            </TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 py-4 px-3 text-right">
              {t('categories.table.actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-12 text-center text-slate-400 font-black uppercase tracking-widest text-xs"
              >
                {t('common.loading')}
              </TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-12 text-center text-text-secondary font-bold italic"
              >
                {emptyMessage ?? t('categories.management.empty')}
              </TableCell>
            </TableRow>
          ) : (
            categories.map(cat => (
              <TableRow
                key={cat.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors border-b border-border-subtle"
                data-testid={`category-row-${cat.id}`}
              >
                <TableCell className="py-4 px-3 font-bold text-text-main">{cat.name}</TableCell>
                <TableCell className="py-4 px-3 text-xs font-medium text-text-secondary">
                  {cat.description || '-'}
                </TableCell>
                <TableCell className="py-4 px-3 font-mono font-black text-xs text-primary">
                  {cat.default_tax_rate_id
                    ? t('categories.tax_rate.id', { id: cat.default_tax_rate_id })
                    : t('categories.tax_rate.general')}
                </TableCell>
                <TableCell className="py-4 px-3">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                      cat.is_active !== false
                        ? 'bg-green-50 border-green-200 text-success'
                        : 'bg-slate-100 border-slate-200 text-text-secondary'
                    }`}
                  >
                    {cat.is_active !== false ? t('categories.status.active') : t('categories.status.inactive')}
                  </span>
                </TableCell>
                <TableCell className="py-4 px-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-text-secondary hover:text-primary transition-colors rounded"
                      onClick={() => onEdit(cat)}
                      aria-label={t('categories.action.edit', { name: cat.name })}
                      data-testid={`category-edit-${cat.id}`}
                    >
                      <Pencil size={18} />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-text-secondary hover:text-error transition-colors rounded"
                      onClick={() => onDelete(cat)}
                      aria-label={t('categories.action.delete', { name: cat.name })}
                      data-testid={`category-delete-${cat.id}`}
                    >
                      <Trash2 size={18} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
