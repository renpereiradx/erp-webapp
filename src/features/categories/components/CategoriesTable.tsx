import { Pencil, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    <div className="overflow-hidden rounded-md border border-border-subtle bg-surface shadow-whisper">
      <Table>
        <TableHeader>
          <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
            <TableHead className="text-label-caps uppercase text-on-surface-deep py-3 px-3">
              {t('categories.table.name')}
            </TableHead>
            <TableHead className="text-label-caps uppercase text-on-surface-deep py-3 px-3">
              {t('categories.table.description')}
            </TableHead>
            <TableHead className="text-label-caps uppercase text-on-surface-deep py-3 px-3">
              {t('categories.table.tax_rate')}
            </TableHead>
            <TableHead className="text-label-caps uppercase text-on-surface-deep py-3 px-3">
              {t('categories.table.status')}
            </TableHead>
            <TableHead className="text-label-caps uppercase text-on-surface-deep py-3 px-3 text-right">
              {t('categories.table.actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={5} className="py-xl text-center text-body-md text-on-surface-deep">
                {t('common.loading')}
              </TableCell>
            </TableRow>
          ) : categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-xl text-center text-body-md text-on-surface-deep">
                {emptyMessage ?? t('categories.management.empty')}
              </TableCell>
            </TableRow>
          ) : (
            categories.map((cat) => (
              <TableRow
                key={cat.id}
                className="hover:bg-surface-muted transition-colors duration-150 border-b border-border-subtle"
                data-testid={`category-row-${cat.id}`}
              >
                <TableCell className="py-3 px-3 text-body-md-bold text-foreground">{cat.name}</TableCell>
                <TableCell className="py-3 px-3 text-body-md text-on-surface-deep">
                  {cat.description || '-'}
                </TableCell>
                <TableCell className="py-3 px-3 text-data-mono font-data-mono text-primary">
                  {cat.default_tax_rate_id
                    ? t('categories.tax_rate.id', { id: cat.default_tax_rate_id })
                    : t('categories.tax_rate.general')}
                </TableCell>
                <TableCell className="py-3 px-3">
                  <Badge variant={cat.is_active !== false ? 'success' : 'secondary'}>
                    {cat.is_active !== false
                      ? t('categories.status.active')
                      : t('categories.status.inactive')}
                  </Badge>
                </TableCell>
                <TableCell className="py-3 px-3 text-right">
                  <div className="flex items-center justify-end gap-xs">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-on-surface-deep hover:text-primary transition-colors duration-150"
                      onClick={() => onEdit(cat)}
                      aria-label={t('categories.action.edit', { name: cat.name })}
                      data-testid={`category-edit-${cat.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-8 text-on-surface-deep hover:text-error transition-colors duration-150"
                      onClick={() => onDelete(cat)}
                      aria-label={t('categories.action.delete', { name: cat.name })}
                      data-testid={`category-delete-${cat.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
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
