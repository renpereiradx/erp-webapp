import { useEffect, useState } from 'react'
import { Layers, Loader2, Plus, Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import GenericSkeletonList from '@/components/ui/GenericSkeletonList'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useI18n } from '@/lib/i18n'
import { useToast } from '@/hooks/useToast'
import { attributeService } from '@/services/attributeService'
import { codify } from '@/domain/shared/slugify'

interface CategoryAttributesManagerProps {
  categoryId: number
}

const DATA_TYPES = ['STRING', 'NUMBER', 'BOOLEAN', 'DATE', 'LIST', 'MULTI_SELECT'] as const
const OPTION_TYPES: string[] = ['LIST', 'MULTI_SELECT']

export function CategoryAttributesManager({ categoryId }: CategoryAttributesManagerProps) {
  const { t } = useI18n()
  const toast = useToast()
  const [attributes, setAttributes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [attributeToDelete, setAttributeToDelete] = useState<any | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [dataType, setDataType] = useState<string>('STRING')
  const [optionsStr, setOptionsStr] = useState('')
  const [isVariant, setIsVariant] = useState(false)

  const loadAttributes = async (ignore = false) => {
    try {
      const res = await attributeService.getCategoryAttributes(categoryId)
      if (!ignore) {
        setAttributes(Array.isArray(res) ? res : res?.data || [])
      }
    } catch (error) {
      if (!ignore) toast.error(t('categories.attributesPanel.toast.load_error'))
    } finally {
      if (!ignore) setLoading(false)
    }
  }

  useEffect(() => {
    let ignore = false
    loadAttributes(ignore)
    return () => {
      ignore = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId])

  const handleNameChange = (value: string) => {
    setName(value)
    // Auto-genera el código mientras no se haya editado manualmente.
    if (!code || code === codify(name).slice(0, -1)) {
      setCode(codify(value))
    }
  }

  const handleCreate = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error(t('categories.attributesPanel.toast.name_code_required'))
      return
    }

    let options: string[] = []
    if (OPTION_TYPES.includes(dataType)) {
      options = optionsStr.split(',').map((s) => s.trim()).filter(Boolean)
      if (options.length === 0) {
        toast.error(t('categories.attributesPanel.toast.options_required'))
        return
      }
    }

    setIsCreating(true)
    try {
      await attributeService.createDefinition({
        category_id: categoryId,
        name: name.trim(),
        code: code.trim(),
        data_type: dataType,
        options,
        is_filterable: true,
        is_visible: true,
        is_variant: isVariant,
      })
      toast.success(t('categories.attributesPanel.toast.created'))
      setName('')
      setCode('')
      setOptionsStr('')
      setDataType('STRING')
      setIsVariant(false)
      await loadAttributes()
    } catch (error: any) {
      toast.error(error?.message || t('categories.attributesPanel.toast.create_error'))
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async () => {
    if (!attributeToDelete) return
    try {
      await attributeService.deleteDefinition(attributeToDelete.id)
      toast.success(t('categories.attributesPanel.toast.deleted'))
      await loadAttributes()
    } catch (error: any) {
      toast.error(error?.message || t('categories.attributesPanel.toast.delete_error'))
    } finally {
      setAttributeToDelete(null)
    }
  }

  if (loading) {
    return <GenericSkeletonList count={2} data-testid="category-attributes-loading" />
  }

  return (
    <div className="space-y-md">
      {/* Atributos existentes */}
      <div className="space-y-sm">
        {attributes.length === 0 ? (
          <div className="p-md bg-surface-muted border border-border-subtle border-dashed rounded-md flex items-center justify-center text-body-sm text-on-surface-deep">
            {t('categories.attributesPanel.empty')}
          </div>
        ) : (
          <div className="grid gap-sm">
            {attributes.map((attr) => (
              <div
                key={attr.id}
                className="flex flex-col p-sm bg-surface border border-border-subtle rounded-md shadow-whisper"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-sm flex-wrap">
                    <span className="text-body-md-bold text-foreground">{attr.name}</span>
                    <Badge variant="secondary">{attr.data_type}</Badge>
                    {(attr.is_variant || attr.isVariant) ? (
                      <Badge variant="info">{t('categories.attributesPanel.variant')}</Badge>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setAttributeToDelete(attr)}
                    aria-label={t('categories.attributesPanel.delete.title')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-data-mono font-data-mono text-on-surface-deep mt-xs">
                  {t('categories.attributesPanel.code_label')} {attr.code}
                </div>
                {attr.options && attr.options.length > 0 ? (
                  <div className="text-body-sm text-on-surface-deep mt-xs">
                    {t('categories.attributesPanel.options_label')} {attr.options.join(', ')}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formulario inline de nuevo atributo */}
      <div className="p-md bg-surface-muted rounded-md border border-border-subtle space-y-md">
        <h4 className="text-label-caps uppercase text-foreground flex items-center gap-xs">
          <Layers className="w-4 h-4 text-primary" />
          {t('categories.attributesPanel.new_title')}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor={`attr-name-${categoryId}`} className="text-body-sm-bold text-foreground">
              {t('attributes.editor.name')}
            </Label>
            <Input
              id={`attr-name-${categoryId}`}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder={t('categories.attributesPanel.name_placeholder')}
            />
          </div>
          <div className="space-y-xs">
            <Label htmlFor={`attr-code-${categoryId}`} className="text-body-sm-bold text-foreground">
              {t('attributes.editor.code')}
            </Label>
            <Input
              id={`attr-code-${categoryId}`}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t('categories.attributesPanel.code_placeholder')}
              className="text-data-mono font-data-mono"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
          <div className="space-y-xs">
            <Label htmlFor={`attr-type-${categoryId}`} className="text-body-sm-bold text-foreground">
              {t('attributes.editor.type')}
            </Label>
            <Select value={dataType} onValueChange={setDataType}>
              <SelectTrigger id={`attr-type-${categoryId}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATA_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`categories.attributesPanel.data_type.${type}`, type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {OPTION_TYPES.includes(dataType) ? (
            <div className="space-y-xs">
              <Label htmlFor={`attr-options-${categoryId}`} className="text-body-sm-bold text-foreground">
                {t('categories.attributesPanel.options_label')}
              </Label>
              <Input
                id={`attr-options-${categoryId}`}
                value={optionsStr}
                onChange={(e) => setOptionsStr(e.target.value)}
                placeholder={t('categories.attributesPanel.options_placeholder')}
              />
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-sm">
          <Checkbox
            id={`attr-variant-${categoryId}`}
            checked={isVariant}
            onCheckedChange={(checked) => setIsVariant(checked === true)}
          />
          <Label
            htmlFor={`attr-variant-${categoryId}`}
            className="text-body-sm text-on-surface-deep select-none cursor-pointer font-normal"
          >
            {t('categories.attributesPanel.variant_hint')}
          </Label>
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? <Loader2 className="w-4 h-4 mr-xs animate-spin" /> : <Plus className="w-4 h-4 mr-xs" />}
          {t('categories.attributesPanel.create')}
        </Button>
      </div>

      <AlertDialog
        open={!!attributeToDelete}
        onOpenChange={(open) => {
          if (!open) setAttributeToDelete(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('categories.attributesPanel.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('categories.attributesPanel.delete.description', {
                name: attributeToDelete?.name ?? '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error hover:bg-error/90 text-on-error"
              onClick={handleDelete}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
