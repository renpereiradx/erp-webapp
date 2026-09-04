import { useEffect, useState } from 'react'
import { Image, Info, Trash2, X } from 'lucide-react'

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
import { useI18n } from '@/lib/i18n'
import { slugify } from '@/domain/shared/slugify'

import type { Brand } from '../types/brand'

interface BrandDetailFormProps {
  brand: Brand | { id: 'new' } | null
  onSave: (data: Partial<Brand>) => void
  onCancel: () => void
  onDelete: (id: string) => void
}

export const BrandDetailForm: React.FC<BrandDetailFormProps> = ({
  brand,
  onSave,
  onCancel,
  onDelete,
}) => {
  const { t } = useI18n()
  const [formData, setFormData] = useState<Partial<Brand>>({})
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (brand) {
      if (brand.id === 'new') {
        setFormData({
          name: '',
          slug: '',
          description: '',
          logoUrl: '',
          isActive: true,
        })
      } else {
        setFormData(brand as Brand)
      }
    }
  }, [brand])

  if (!brand) return null

  const isNew = brand.id === 'new'

  const handleChange = (field: keyof Brand, value: string | boolean) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'name' && isNew) {
        // Auto-genera el slug solo en marcas nuevas
        next.slug = slugify(String(value))
      }
      return next
    })
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <section className="w-full bg-surface rounded-md shadow-whisper border-0 flex flex-col overflow-hidden">
      <div className="p-lg border-b border-border-subtle flex justify-between items-center">
        <h3 className="text-title-md text-foreground">{t('brands.form.title')}</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          aria-label={t('common.close')}
        >
          <X className="w-5 h-5" />
        </Button>
      </div>

      <div className="p-lg flex-1 flex flex-col gap-lg">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-md bg-surface-subtle border border-border-subtle flex items-center justify-center mb-sm overflow-hidden">
            {formData.logoUrl ? (
              <img src={formData.logoUrl} alt={t('brands.logo_alt')} className="w-full h-full object-cover" />
            ) : (
              <Image className="w-8 h-8 text-on-surface-deep" />
            )}
          </div>
          <span className="text-body-md-bold text-foreground">
            {formData.name || t('brands.form.no_name')}
          </span>
          {!isNew ? (
            <span className="text-data-mono font-data-mono text-body-sm text-on-surface-deep">
              ID: {brand.id}
            </span>
          ) : null}
        </div>

        {/* Campos */}
        <form id="brand-form" className="flex flex-col gap-md" onSubmit={handleSave}>
          <div className="space-y-xs">
            <Label htmlFor="brand-name" className="text-body-md-bold text-foreground">
              {t('brands.form.name')} <span className="text-error">*</span>
            </Label>
            <Input
              id="brand-name"
              required
              className="bg-surface"
              placeholder={t('brands.form.name_placeholder')}
              type="text"
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          <div className="space-y-xs">
            <Label htmlFor="brand-slug" className="text-body-md-bold text-foreground flex items-center">
              {t('brands.form.slug')}
              <span className="ml-xs cursor-help" title={t('brands.form.slug_hint')}>
                <Info className="w-3.5 h-3.5 text-on-surface-deep" />
              </span>
            </Label>
            <Input
              id="brand-slug"
              className={`text-data-mono font-data-mono ${!isNew ? 'bg-surface-muted text-on-surface-deep' : 'bg-surface'}`}
              disabled={!isNew}
              type="text"
              value={formData.slug || ''}
              onChange={(e) => handleChange('slug', e.target.value)}
            />
          </div>

          <div className="space-y-xs">
            <Label htmlFor="brand-logo" className="text-body-md-bold text-foreground">
              {t('brands.form.logo_url')}
            </Label>
            <Input
              id="brand-logo"
              className="text-data-mono font-data-mono"
              type="text"
              placeholder="https://"
              value={formData.logoUrl || ''}
              onChange={(e) => handleChange('logoUrl', e.target.value)}
            />
          </div>
        </form>
      </div>

      <div className="flex items-center justify-between p-lg border-t border-border-subtle">
        {!isNew ? (
          <Button
            type="button"
            variant="ghost"
            className="text-error hover:text-error"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-xs" />
            {t('brands.form.delete')}
          </Button>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-sm">
          <Button type="button" variant="secondary" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="primary" form="brand-form">
            {t('common.save')}
          </Button>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('brands.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('brands.delete.description', { name: formData.name ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-error hover:bg-error/90 text-on-error"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                onDelete(String(brand.id))
              }}
            >
              {t('brands.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}

export default BrandDetailForm
