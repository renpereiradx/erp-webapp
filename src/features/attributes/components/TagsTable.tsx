import { Tags } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import EmptyState from '@/components/ui/EmptyState'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useI18n } from '@/lib/i18n'

import type { Tag } from '../types'

interface TagsTableProps {
  tags: Tag[]
  selectedTag: Tag | null
  onSelectTag: (tag: Tag | null) => void
  loading?: boolean
}

/** Master del workspace de etiquetas (la búsqueda vive en la toolbar de la página). */
export function TagsTable({ tags, selectedTag, onSelectTag, loading }: TagsTableProps) {
  const { t } = useI18n()

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 p-lg flex flex-col">
      <div className="flex justify-between items-center mb-md">
        <h3 className="text-title-md text-foreground">{t('attributes.list.active_tags')}</h3>
      </div>

      {loading ? null : tags.length === 0 ? (
        <EmptyState
          icon={Tags}
          title={t('attributes.table.empty_tags')}
          description={t('attributes.table.empty_tags_description')}
        />
      ) : (
        <div className="overflow-x-auto">
          <div className="rounded-md bg-surface shadow-whisper overflow-hidden border border-border-subtle min-w-[560px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('attributes.table.name')}</TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('attributes.table.slug')}</TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('attributes.table.color')}</TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('attributes.table.icon')}</TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('attributes.table.type')}</TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('attributes.table.category')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tags.map((tag) => (
                  <TableRow
                    key={tag.id}
                    onClick={() => onSelectTag(tag)}
                    className={`cursor-pointer transition-colors duration-150 ${selectedTag?.id === tag.id ? 'bg-surface-muted' : 'hover:bg-surface-muted'}`}
                  >
                    <TableCell className="text-body-md text-foreground">{tag.name}</TableCell>
                    <TableCell className="text-data-mono font-data-mono text-on-surface-deep">{tag.slug}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-sm">
                        <div className="w-4 h-4 rounded-full border border-border-subtle" style={{ backgroundColor: tag.color }} />
                        <span className="text-data-mono font-data-mono text-on-surface-deep">{tag.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {/* Ícono de DATO: nombre Material Symbols almacenado en la etiqueta */}
                      <span className="material-symbols-outlined text-[18px] text-on-surface-deep">{tag.icon}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="info" className="text-label-caps uppercase">{tag.type}</Badge>
                    </TableCell>
                    <TableCell className="text-body-md text-on-surface-deep">{tag.category}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

export default TagsTable
