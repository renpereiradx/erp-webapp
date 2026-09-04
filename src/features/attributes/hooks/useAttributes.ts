import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { useI18n } from '@/lib/i18n'
import { attributeService } from '@/services/attributeService'
import { categoryService } from '@/services/categoryService'
import { tagService } from '@/services/tagService'

import type { Attribute, Tag } from '../types'
import { NEW_ID } from '../types'

const toArray = (res: unknown): any[] => {
  if (Array.isArray(res)) return res
  const data = (res as any)?.data
  return Array.isArray(data) ? data : []
}

/**
 * Estado y orquestación de la página Atributos y Etiquetas.
 * Mapea las definiciones del backend (snake_case) al modelo del feature (camelCase).
 */
export const useAttributes = () => {
  const { t } = useI18n()
  const [attributes, setAttributes] = useState<Attribute[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [searchAttrTerm, setSearchAttrTerm] = useState('')
  const [searchTagTerm, setSearchTagTerm] = useState('')

  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null)
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null)

  const fetchAttributes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const rawArray = toArray(await attributeService.getAllDefinitions())
      setAttributes(
        rawArray.map((item: any) => ({
          id: item.id,
          name: item.name,
          code: item.code,
          type: item.data_type || item.type || 'STRING',
          category: item.category_id || item.category || 'General',
          isRequired: item.is_required ?? item.isRequired ?? false,
          isFilterable: item.is_filterable ?? item.isFilterable ?? false,
          isVisible: item.is_visible ?? item.isVisible ?? true,
          isVariant: item.is_variant ?? item.isVariant ?? false,
          options: item.options || [],
        })),
      )

      const cats = await categoryService.getAll()
      setCategories(Array.isArray(cats) ? cats : [])
    } catch (err: any) {
      console.error('Error fetching attributes:', err)
      const message = err?.message || t('attributes.toast.load_error')
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }, [t])

  const fetchTags = useCallback(async () => {
    try {
      const rawArray = toArray(await tagService.getAll())
      setTags(
        rawArray.map((item: any) => ({
          id: item.id,
          name: item.name,
          slug: item.slug,
          color: item.color,
          icon: item.icon,
          type: item.tag_type || item.type || 'GENERAL',
          category: item.category_id || item.category || 'General',
        })),
      )
    } catch (err: any) {
      console.error('Error fetching tags:', err)
      toast.error(err?.message || t('attributes.toast.tags_load_error'))
    }
  }, [t])

  useEffect(() => {
    fetchAttributes()
    fetchTags()
  }, [fetchAttributes, fetchTags])

  const filteredAttributes = useMemo(() => {
    if (!searchAttrTerm) return attributes
    const lower = searchAttrTerm.toLowerCase()
    return attributes.filter(
      (a) => a.name?.toLowerCase().includes(lower) || a.code?.toLowerCase().includes(lower),
    )
  }, [attributes, searchAttrTerm])

  const filteredTags = useMemo(() => {
    if (!searchTagTerm) return tags
    const lower = searchTagTerm.toLowerCase()
    return tags.filter(
      (tg) => tg.name?.toLowerCase().includes(lower) || tg.slug?.toLowerCase().includes(lower),
    )
  }, [tags, searchTagTerm])

  const handleCreateNew = () => {
    setSelectedAttribute({
      id: NEW_ID,
      name: '',
      code: '',
      type: 'STRING',
      category: 'General',
      isRequired: false,
      isFilterable: false,
      isVisible: true,
      isVariant: false,
      options: [],
    })
  }

  const handleCreateNewTag = () => {
    setSelectedTag({
      id: NEW_ID,
      name: '',
      slug: '',
      color: '#137fec',
      icon: 'local_offer',
      type: 'GENERAL',
      category: 'General',
    })
  }

  const handleSaveAttribute = async (attr: Partial<Attribute>) => {
    try {
      setLoading(true)

      const payload = {
        name: attr.name,
        code: attr.code,
        data_type: attr.type,
        category_id: attr.category !== 'General' && Number.isFinite(Number(attr.category))
          ? Number(attr.category)
          : null,
        category: attr.category, // retrocompatibilidad con backend legacy
        is_required: attr.isRequired,
        is_filterable: attr.isFilterable,
        is_visible: attr.isVisible,
        is_variant: attr.isVariant,
        options: attr.options,
      }

      if (selectedAttribute?.id === NEW_ID) {
        await attributeService.createDefinition(payload)
        toast.success(t('attributes.toast.created'))
      } else {
        await attributeService.updateDefinition(selectedAttribute!.id, payload)
        toast.success(t('attributes.toast.updated'))
      }
      await fetchAttributes()
      setSelectedAttribute(null)
    } catch (err: any) {
      console.error('Error saving attribute:', err)
      toast.error(err?.response?.data?.error || err?.response?.data?.message || err?.message || t('attributes.toast.save_error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAttribute = async (id: string | number) => {
    try {
      setLoading(true)
      await attributeService.deleteDefinition(Number(id))
      toast.success(t('attributes.toast.deleted'))
      setSelectedAttribute(null)
      await fetchAttributes()
    } catch (err: any) {
      console.error('Error deleting attribute:', err)
      toast.error(err?.response?.data?.message || err?.message || t('attributes.toast.delete_error'))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveTag = async (tag: Partial<Tag>) => {
    try {
      setLoading(true)

      const payload = {
        name: tag.name ?? '',
        color: tag.color,
        icon: tag.icon,
        tag_type: tag.type,
        category_id: tag.category && Number.isFinite(Number(tag.category))
          ? Number(tag.category)
          : null,
      }

      if (selectedTag?.id === NEW_ID) {
        await tagService.create(payload)
        toast.success(t('attributes.tag.toast.created'))
      } else {
        await tagService.update(Number(selectedTag!.id), payload)
        toast.success(t('attributes.tag.toast.updated'))
      }
      await fetchTags()
      setSelectedTag(null)
    } catch (err: any) {
      console.error('Error saving tag:', err)
      toast.error(err?.response?.data?.error || err?.response?.data?.message || err?.message || t('attributes.tag.toast.save_error'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTag = async (id: string | number) => {
    try {
      setLoading(true)
      await tagService.delete(Number(id))
      toast.success(t('attributes.tag.toast.deleted'))
      setSelectedTag(null)
      await fetchTags()
    } catch (err: any) {
      console.error('Error deleting tag:', err)
      toast.error(err?.response?.data?.message || err?.message || t('attributes.tag.toast.delete_error'))
    } finally {
      setLoading(false)
    }
  }

  return {
    attributes,
    tags,
    filteredAttributes,
    filteredTags,
    searchAttrTerm,
    setSearchAttrTerm,
    searchTagTerm,
    setSearchTagTerm,
    selectedAttribute,
    setSelectedAttribute,
    selectedTag,
    setSelectedTag,
    categories,
    loading,
    error,
    handleCreateNew,
    handleCreateNewTag,
    handleSaveAttribute,
    handleDeleteAttribute,
    handleSaveTag,
    handleDeleteTag,
    refetch: fetchAttributes,
    fetchTags,
  }
}

export type UseAttributesReturn = ReturnType<typeof useAttributes>
