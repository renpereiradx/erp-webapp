import { useState, useMemo, useEffect, useCallback } from 'react';
import { attributeService } from '../services/attributeService';
import { categoryService } from '../services/categoryService';
import { tagService } from '../services/tagService';
import { Attribute } from '../types/attribute';
import { Tag } from '../types/tag';
import { mockTags } from '../data/mockData';
import { toast } from 'sonner';

export const useAttributes = () => {
  const [attributes, setAttributes] = useState<Attribute[]>([]);
  const [tags, setTags] = useState<Tag[]>(mockTags);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [searchAttrTerm, setSearchAttrTerm] = useState('');
  const [searchTagTerm, setSearchTagTerm] = useState('');
  
  const [selectedAttribute, setSelectedAttribute] = useState<Attribute | null>(null);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);

  const fetchAttributes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await attributeService.getAllDefinitions();
      const rawArray = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
      
      const mapped = rawArray.map((item: any) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        type: item.data_type || item.type || 'STRING',
        category: item.category_id || item.category || 'General',
        isRequired: item.is_required ?? item.isRequired ?? false,
        isFilterable: item.is_filterable ?? item.isFilterable ?? false,
        isVisible: item.is_visible ?? item.isVisible ?? true,
        isVariant: item.is_variant ?? item.isVariant ?? false,
        options: item.options || []
      }));
      setAttributes(mapped);
      
      const cats = await categoryService.getAll();
      setCategories(Array.isArray(cats) ? cats : []);
    } catch (err: any) {
      console.error('Error fetching attributes:', err);
      toast.error('Error al cargar atributos desde la API');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const res = await tagService.getAll();
      const rawArray = Array.isArray(res) ? res : (res?.data && Array.isArray(res.data) ? res.data : []);
      const mapped = rawArray.map((item: any) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        color: item.color,
        icon: item.icon,
        type: item.tag_type || item.type || 'GENERAL',
        category: item.category_id || item.category || 'General'
      }));
      setTags(mapped);
    } catch (err: any) {
      console.error('Error fetching tags:', err);
      toast.error('Error al cargar etiquetas desde la API');
    }
  }, []);

  useEffect(() => {
    fetchAttributes();
    fetchTags();
  }, [fetchAttributes, fetchTags]);

  const filteredAttributes = useMemo(() => {
    if (!searchAttrTerm) return attributes;
    const lower = searchAttrTerm.toLowerCase();
    return attributes.filter(
      (a) => a.name?.toLowerCase().includes(lower) || a.code?.toLowerCase().includes(lower)
    );
  }, [attributes, searchAttrTerm]);

  const filteredTags = useMemo(() => {
    if (!searchTagTerm) return tags;
    const lower = searchTagTerm.toLowerCase();
    return tags.filter(
      (t) => t.name?.toLowerCase().includes(lower) || t.slug?.toLowerCase().includes(lower)
    );
  }, [tags, searchTagTerm]);

  const handleCreateNew = () => {
    setSelectedAttribute({
      id: 'new',
      name: '',
      code: '',
      type: 'STRING',
      category: 'General',
      isRequired: false,
      isFilterable: false,
      isVisible: true,
      isVariant: false,
      options: []
    } as any);
  };

  const handleCreateNewTag = () => {
    setSelectedTag({
      id: 'new',
      name: '',
      slug: '',
      color: '#137fec',
      icon: 'local_offer',
      type: 'GENERAL',
      category: 'General'
    } as any);
  };

  const handleSaveAttribute = async (attr: Partial<Attribute>) => {
    try {
      setLoading(true);
      
      const payload = {
        name: attr.name,
        code: attr.code,
        data_type: attr.type,
        category_id: attr.category !== 'General' && attr.category !== 'Apariencia' && attr.category !== 'Especificaciones' ? Number(attr.category) : null,
        category: attr.category, // Mantenemos category por retrocompatibilidad
        is_required: attr.isRequired,
        is_filterable: attr.isFilterable,
        is_visible: attr.isVisible,
        is_variant: attr.isVariant,
        options: attr.options
      };

      if (selectedAttribute?.id === 'new') {
        await attributeService.createDefinition(payload);
        toast.success('Atributo creado exitosamente');
        await fetchAttributes();
        setSelectedAttribute(null);
      } else {
        await attributeService.updateDefinition(selectedAttribute!.id, payload);
        toast.success('Atributo actualizado exitosamente');
        await fetchAttributes();
        setSelectedAttribute(null);
      }
    } catch (err: any) {
      console.error('Error saving attribute:', err);
      toast.error(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error al guardar atributo');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAttribute = async (id: string | number) => {
    try {
      setLoading(true);
      await attributeService.deleteDefinition(Number(id));
      toast.success('Atributo eliminado exitosamente');
      setSelectedAttribute(null);
      await fetchAttributes();
    } catch (err: any) {
      console.error('Error deleting attribute:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Error al eliminar atributo');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTag = async (tag: Partial<Tag>) => {
    try {
      setLoading(true);
      
      const payload = {
        name: tag.name,
        slug: tag.slug,
        color: tag.color,
        icon: tag.icon,
        tag_type: tag.type,
        category_id: tag.category && !['General', 'Campañas', 'Logística', 'Inventario', 'Catálogo'].includes(tag.category as string) ? Number(tag.category) : null,
      };

      if (selectedTag?.id === 'new') {
        await tagService.create(payload);
        toast.success('Etiqueta creada exitosamente');
        await fetchTags();
        setSelectedTag(null);
      } else {
        await tagService.update(Number(selectedTag!.id), payload);
        toast.success('Etiqueta actualizada exitosamente');
        await fetchTags();
        setSelectedTag(null);
      }
    } catch (err: any) {
      console.error('Error saving tag:', err);
      toast.error(err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error al guardar etiqueta');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTag = async (id: string | number) => {
    try {
      setLoading(true);
      await tagService.delete(Number(id));
      toast.success('Etiqueta eliminada exitosamente');
      setSelectedTag(null);
      await fetchTags();
    } catch (err: any) {
      console.error('Error deleting tag:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Error al eliminar etiqueta');
    } finally {
      setLoading(false);
    }
  };

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
    handleCreateNew,
    handleCreateNewTag,
    handleSaveAttribute,
    handleDeleteAttribute,
    handleSaveTag,
    handleDeleteTag,
    fetchAttributes,
    fetchTags
  };
};
