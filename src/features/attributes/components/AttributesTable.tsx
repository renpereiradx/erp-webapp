import { Check, ListChecks, X } from 'lucide-react'

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

import type { Attribute } from '../types'

interface AttributesTableProps {
  attributes: Attribute[]
  selectedAttribute: Attribute | null
  onSelectAttribute: (attr: Attribute | null) => void
  loading?: boolean
}

/** Master del workspace de atributos: listado registrado (la búsqueda vive en la toolbar de la página). */
export function AttributesTable({
  attributes,
  selectedAttribute,
  onSelectAttribute,
  loading,
}: AttributesTableProps) {
  const { t } = useI18n()

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 p-lg flex flex-col">
      <div className="flex justify-between items-center mb-md">
        <h3 className="text-title-md text-foreground">{t('attributes.list.registered')}</h3>
      </div>

      {loading ? null : attributes.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={t('attributes.table.empty')}
          description={t('attributes.table.empty_description')}
        />
      ) : (
        <div className="overflow-x-auto">
          <div className="rounded-md bg-surface shadow-whisper overflow-hidden border border-border-subtle min-w-[560px]">
            <Table>
              <TableHeader>
                <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('attributes.table.name')}</TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('attributes.table.code')}</TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('attributes.table.type')}</TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep text-center">{t('attributes.table.required_short')}</TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep text-center">{t('attributes.table.filterable_short')}</TableHead>
                  <TableHead className="text-label-caps uppercase text-on-surface-deep">{t('attributes.table.variant')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attributes.map((attr) => (
                  <TableRow
                    key={attr.id}
                    onClick={() => onSelectAttribute(attr)}
                    className={`cursor-pointer transition-colors duration-150 ${selectedAttribute?.id === attr.id ? 'bg-surface-muted' : 'hover:bg-surface-muted'}`}
                  >
                    <TableCell className="text-body-md text-foreground">{attr.name}</TableCell>
                    <TableCell className="text-data-mono font-data-mono text-on-surface-deep">{attr.code}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-label-caps uppercase">{attr.type}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {attr.isRequired
                        ? <Check className="w-4 h-4 text-primary inline-block" aria-label={t('attributes.editor.required')} />
                        : <X className="w-4 h-4 text-divider inline-block" aria-label={t('attributes.editor.required')} />}
                    </TableCell>
                    <TableCell className="text-center">
                      {attr.isFilterable
                        ? <Check className="w-4 h-4 text-primary inline-block" aria-label={t('attributes.editor.filterable')} />
                        : <X className="w-4 h-4 text-divider inline-block" aria-label={t('attributes.editor.filterable')} />}
                    </TableCell>
                    <TableCell>
                      {attr.isVariant ? (
                        <Badge variant="success" className="text-label-caps uppercase">{t('attributes.table.variant')}</Badge>
                      ) : null}
                    </TableCell>
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

export default AttributesTable
