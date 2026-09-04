import { useEffect, useState } from 'react'
import { Tags, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import EmptyState from '@/components/ui/EmptyState'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { slugify } from '@/domain/shared/slugify'

import type { Tag } from '../types'
import { NEW_ID } from '../types'
import { IconPickerModal } from './IconPickerModal'

interface TagEditorProps {
  selectedTag: Tag | null
  onSelectTag: (tag: Tag | null) => void
  categories?: any[]
  onSaveTag?: (tag: Partial<Tag>) => void
  onDeleteTag?: (id: string | number) => void
  loading?: boolean
}

const GENERAL_CATEGORY = 'General'
const DEFAULT_TAG_COLOR = '#137fec'
const DEFAULT_TAG_ICON = 'local_offer'

/** Categorías fijas de etiquetas: solo etiqueta visible, no se envían como category_id. */
const FIXED_TAG_CATEGORIES = [
  { value: 'Campañas', key: 'attributes.tag.category.campaigns' },
  { value: 'Logística', key: 'attributes.tag.category.logistics' },
  { value: 'Inventario', key: 'attributes.tag.category.inventory' },
  { value: 'Catálogo', key: 'attributes.tag.category.catalog' },
] as const

/** Detail del workspace de etiquetas: ficha de edición o invitación a seleccionar. */
export function TagEditor({
  selectedTag,
  onSelectTag,
  categories = [],
  onSaveTag,
  onDeleteTag,
  loading,
}: TagEditorProps) {
  const { t } = useI18n()
  const [formData, setFormData] = useState<Partial<Tag>>({})
  const [isIconPickerOpen, setIsIconPickerOpen] = useState(false)

  useEffect(() => {
    if (selectedTag) {
      setFormData(selectedTag)
    }
  }, [selectedTag])

  const handleChange = (field: keyof Tag, value: any) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value }
      if (field === 'name' && (!prev.slug || prev.id === NEW_ID)) {
        newData.slug = slugify(String(value))
      }
      return newData
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (onSaveTag) {
      const payload = { ...formData }
      if (payload.id === NEW_ID) {
        delete payload.id
      }
      onSaveTag(payload)
    }
  }

  const isNew = selectedTag?.id === NEW_ID
  const isExisting = !!selectedTag && !isNew

  if (!selectedTag) {
    return (
      <div className="bg-surface rounded-md shadow-whisper border-0 p-lg h-full">
        <EmptyState
          icon={Tags}
          title={t('attributes.editor.empty_tag_title')}
          description={t('attributes.editor.empty_tag_description')}
        />
      </div>
    )
  }

  return (
    <div className="bg-surface rounded-md shadow-whisper border-0 p-lg flex flex-col">
      <div className="flex justify-between items-center mb-md border-b border-border-subtle pb-sm">
        <h3 className="text-title-md text-foreground">
          {isNew ? t('attributes.editor.title_new_tag') : t('attributes.editor.title_tag')}
        </h3>
        {isExisting ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDeleteTag && onDeleteTag(selectedTag!.id)}
            disabled={loading}
            aria-label={t('attributes.action.delete_tag')}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
        ) : null}
      </div>

      <form onSubmit={handleSave} className="flex-1 space-y-md">
        <div className="space-y-xs">
          <Label htmlFor="tag-name" className="text-body-md-bold text-foreground">{t('attributes.editor.name')}</Label>
          <Input
            id="tag-name"
            type="text"
            placeholder={t('attributes.editor.name_placeholder_tag')}
            value={formData.name || ''}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            disabled={loading}
          />
        </div>
        <div className="space-y-xs">
          <Label htmlFor="tag-slug" className="text-body-md-bold text-foreground">{t('attributes.editor.slug')}</Label>
          <Input
            id="tag-slug"
            type="text"
            readOnly
            placeholder="black-friday"
            className="bg-surface-muted text-data-mono font-data-mono text-on-surface-deep"
            value={formData.slug || ''}
          />
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor="tag-color" className="text-body-md-bold text-foreground">{t('attributes.editor.color')}</Label>
            <div className="flex items-center gap-sm">
              <input
                id="tag-color"
                type="color"
                className="w-10 h-10 rounded-input border border-border-subtle p-0 cursor-pointer bg-surface"
                value={formData.color || DEFAULT_TAG_COLOR}
                onChange={(e) => handleChange('color', e.target.value)}
              />
              <Input
                className="text-data-mono font-data-mono"
                type="text"
                value={formData.color || DEFAULT_TAG_COLOR}
                onChange={(e) => handleChange('color', e.target.value)}
                aria-label={t('attributes.editor.color')}
              />
            </div>
          </div>
          <div className="space-y-xs">
            <Label htmlFor="tag-icon" className="text-body-md-bold text-foreground">{t('attributes.editor.icon')}</Label>
            <div className="flex gap-sm">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="w-10 h-10 shrink-0"
                onClick={() => setIsIconPickerOpen(true)}
                aria-label={t('attributes.editor.icon_pick')}
                title={t('attributes.editor.icon_pick')}
              >
                {/* Ícono de DATO: nombre Material Symbols almacenado en la etiqueta */}
                <span className="material-symbols-outlined text-[20px]">{formData.icon || DEFAULT_TAG_ICON}</span>
              </Button>
              <Input
                id="tag-icon"
                type="text"
                readOnly
                className="text-data-mono font-data-mono cursor-pointer"
                value={formData.icon || DEFAULT_TAG_ICON}
                onClick={() => setIsIconPickerOpen(true)}
                placeholder={t('attributes.editor.icon_placeholder')}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor="tag-type" className="text-body-md-bold text-foreground">{t('attributes.table.type')}</Label>
            <Select
              value={formData.type || 'GENERAL'}
              onValueChange={(v) => handleChange('type', v)}
            >
              <SelectTrigger id="tag-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">GENERAL</SelectItem>
                <SelectItem value="PROMOTION">PROMOTION</SelectItem>
                <SelectItem value="STATUS">STATUS</SelectItem>
                <SelectItem value="SEASON">SEASON</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-xs">
            <Label htmlFor="tag-category" className="text-body-md-bold text-foreground">{t('attributes.table.category')}</Label>
            <Select
              value={formData.category || GENERAL_CATEGORY}
              onValueChange={(v) => handleChange('category', v)}
            >
              <SelectTrigger id="tag-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={GENERAL_CATEGORY}>{t('attributes.editor.category_general')}</SelectItem>
                <SelectGroup>
                  <SelectLabel>{t('attributes.tag.fixed_categories')}</SelectLabel>
                  {FIXED_TAG_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>{t(cat.key, cat.value)}</SelectItem>
                  ))}
                </SelectGroup>
                {categories.length > 0 ? (
                  <SelectGroup>
                    <SelectLabel>{t('attributes.editor.categories_product')}</SelectLabel>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                    ))}
                  </SelectGroup>
                ) : null}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-md border-t border-border-subtle flex justify-end gap-sm">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onSelectTag(null)}
            disabled={loading}
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isNew ? t('attributes.action.create_tag') : t('common.save')}
          </Button>
        </div>
      </form>

      <IconPickerModal
        isOpen={isIconPickerOpen}
        onClose={() => setIsIconPickerOpen(false)}
        onSelect={(icon) => handleChange('icon', icon)}
        selectedIcon={formData.icon || DEFAULT_TAG_ICON}
      />
    </div>
  )
}

export default TagEditor
