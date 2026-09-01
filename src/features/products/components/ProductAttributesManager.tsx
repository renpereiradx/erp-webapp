import { useState, useEffect } from 'react';
import { Save, RefreshCw, Layers, Plus, X, Info } from 'lucide-react';
import { attributeService } from '@/services/attributeService';
import { categoryService } from '@/services/categoryService';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ProductAttributesManagerProps {
  productId: string;
  categoryId?: string | number;
}

export function ProductAttributesManager({ productId, categoryId }: ProductAttributesManagerProps) {
  const { t } = useI18n();
  const [attributesDef, setAttributesDef] = useState<any[]>([]);
  const [productValues, setProductValues] = useState<Record<string, any>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // New Definition State
  const [isCreatingDef, setIsCreatingDef] = useState(false);
  const [newDefName, setNewDefName] = useState('');
  const [newDefType, setNewDefType] = useState('STRING');
  const [newDefCategory, setNewDefCategory] = useState('General');
  const [newDefValue, setNewDefValue] = useState('');
  const [newDefOptions, setNewDefOptions] = useState<string[]>([]);
  const [creatingDefLoader, setCreatingDefLoader] = useState(false);
  const [apiCategories, setApiCategories] = useState<any[]>([]);

  useEffect(() => {
    if (categoryId) {
      setNewDefCategory(String(categoryId));
    } else {
      setNewDefCategory('General');
    }
  }, [categoryId, isCreatingDef]);

  useEffect(() => {
    categoryService.getAll()
      .then((cats: any) => {
        setApiCategories(Array.isArray(cats) ? cats : (cats?.data || []));
      })
      .catch(err => {
        console.error("Error al cargar categorías de la API en la ficha técnica:", err);
      });
  }, []);

  const toast = useToast();

  const loadData = async (ignore: boolean = false) => {
    setLoading(true);
    try {
      let currentVals;
      if (productId) {
        currentVals = await attributeService.getProductAttributes(productId);
      } else {
        currentVals = { data: [] }; // No product values yet
      }

      // Traer TODAS las definiciones para poder filtrar localmente los globales y los de la categoría
      const allDefs = await attributeService.getAllDefinitions();
      const allDefsArray = Array.isArray(allDefs) ? allDefs : (allDefs?.data || []);

      // Filtramos los globales (category_id es null) y los de la categoría actual
      const applicableDefs = allDefsArray.filter((d: any) => d.category_id == null || d.category_id == categoryId);


      if (!ignore) {
        const valsArray = Array.isArray(currentVals) ? currentVals : (currentVals?.data || []);

        setAttributesDef(applicableDefs.filter((d: any) => !d.is_variant && !d.isVariant));

        const valMap: Record<string, any> = {};
        valsArray.forEach(v => {
          if (v.value_text !== null && v.value_text !== undefined) valMap[v.attribute_id] = v.value_text;
          else if (v.value_number !== null && v.value_number !== undefined) valMap[v.attribute_id] = v.value_number;
          else if (v.value_boolean !== null && v.value_boolean !== undefined) valMap[v.attribute_id] = v.value_boolean;
          else if (v.value_date !== null && v.value_date !== undefined) valMap[v.attribute_id] = v.value_date;
        });
        setProductValues(valMap);
      }
    } catch (err) {
      if (!ignore) {
        console.error("Error loading attributes", err);
        toast.error(t('products.attributes.error.load'));
      }
    } finally {
      if (!ignore) setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    if (!productId && !categoryId) return;
    loadData(ignore);
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, categoryId]);

  const handleChange = (attributeId: number, value: any) => {
    setProductValues(prev => ({ ...prev, [attributeId]: value }));
  };

  const handleSave = async (attr: any) => {
    if (!productId) {
      toast.error(t('products.attributes.save_first_text'));
      return;
    }
    setSavingId(attr.id || attr.attribute_id);
    try {
      const payload: any = {};
      const val = productValues[attr.id || attr.attribute_id];

      if (attr.data_type === 'STRING' || attr.data_type === 'LIST') payload.value_text = val;
      else if (attr.data_type === 'NUMBER') payload.value_number = val ? Number(val) : null;
      else if (attr.data_type === 'BOOLEAN') payload.value_boolean = val === 'true' || val === true;
      else if (attr.data_type === 'DATE') payload.value_date = val;

      await attributeService.assignProductAttribute(productId, attr.id || attr.attribute_id, payload);
      toast.success(t('products.attributes.saved', { name: attr.name }));
    } catch (err) {
      console.error(err);
      toast.error(t('products.attributes.error.save', { name: attr.name }));
    } finally {
      setSavingId(null);
    }
  };

  const handleCreateDefinition = async () => {
    if (!newDefName.trim()) return;

    setCreatingDefLoader(true);
    try {
      const code = newDefName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

      const isSystemCategory = newDefCategory === 'General';
      const catIdPayload = isSystemCategory ? null : Number(newDefCategory);

      const res: any = await attributeService.createDefinition({
        category_id: catIdPayload,
        category: isSystemCategory ? newDefCategory : undefined,
        name: newDefName.trim(),
        code: code,
        data_type: newDefType,
        is_visible: true,
        is_filterable: true,
        is_variant: false,
        options: newDefType === 'LIST' ? newDefOptions.filter(o => o.trim() !== '') : undefined
      });

      const createdAttr = res.data || res;
      const createdAttrId = createdAttr?.id || createdAttr?.attribute_id;

      if (productId && createdAttrId && newDefValue.trim() !== '') {
        const payload: any = {};
        if (newDefType === 'STRING' || newDefType === 'LIST') payload.value_text = newDefValue.trim();
        else if (newDefType === 'NUMBER') payload.value_number = Number(newDefValue);
        else if (newDefType === 'BOOLEAN') payload.value_boolean = newDefValue === 'true';
        else if (newDefType === 'DATE') payload.value_date = newDefValue;

        await attributeService.assignProductAttribute(productId, createdAttrId, payload);
      }

      toast.success(t('products.attributes.created'));
      setIsCreatingDef(false);
      setNewDefName('');
      setNewDefType('STRING');
      setNewDefValue('');
      setNewDefOptions([]);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || t('products.attributes.error.create'));
    } finally {
      setCreatingDefLoader(false);
    }
  };

  if (loading && attributesDef.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-md" aria-busy="true">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (!productId) {
    return (
      <div className="p-lg text-center border border-dashed border-border-subtle rounded-md bg-surface">
        <Layers className="mx-auto text-on-surface-deep mb-md" size={24} />
        <h3 className="text-title-md text-foreground mb-xs">{t('products.variants.save_first_title')}</h3>
        <p className="text-body-md text-on-surface-deep">{t('products.attributes.save_first_text')}</p>
      </div>
    );
  }

  if (!categoryId) {
    return (
      <div className="p-md text-center bg-warning/10 border border-dashed border-warning/30 rounded-md">
        <Layers className="mx-auto mb-sm opacity-50 text-warning" size={24} />
        <p className="text-body-md-bold text-warning">{t('products.attributes.no_category_title')}</p>
        <p className="text-body-md text-warning mt-xs">{t('products.attributes.no_category_text')}</p>
      </div>
    );
  }

  const attrLabelClass = 'text-label-caps uppercase text-on-surface-deep';

  return (
    <div className="space-y-md">
      <div className="bg-primary-fixed text-on-primary-fixed rounded-md p-sm flex justify-between items-start gap-md">
        <p className="text-body-md flex items-start gap-sm">
          <Info className="w-4 h-4 mt-0.5 shrink-0" />
          {t('products.attributes.info')}
        </p>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="shrink-0 rounded-button"
          onClick={(e) => {
            e.preventDefault();
            setIsCreatingDef(!isCreatingDef);
          }}
        >
          {isCreatingDef ? <X className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
          {isCreatingDef ? t('products.modal.action.cancel') : t('products.attributes.action.new')}
        </Button>
      </div>

      {isCreatingDef && (
        <div className="p-md bg-surface-muted border border-primary/20 rounded-md mb-md space-y-md animate-in slide-in-from-top-2 duration-150">
          <h4 className="text-label-caps uppercase text-primary flex items-center gap-xs pb-sm border-b border-border-subtle">
            <Plus className="w-4 h-4" /> {t('products.attributes.new_title')}
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
            <div className="space-y-xs">
              <Label htmlFor="attr-def-name" className={attrLabelClass}>{t('products.attributes.field.name')}</Label>
              <Input
                id="attr-def-name"
                placeholder={t('products.attributes.field.name_placeholder')}
                value={newDefName}
                onChange={e => setNewDefName(e.target.value)}
              />
            </div>

            <div className="space-y-xs">
              <Label htmlFor="attr-def-type" className={attrLabelClass}>{t('products.attributes.field.type')}</Label>
              <Select value={newDefType} onValueChange={v => { setNewDefType(v); setNewDefValue(''); }}>
                <SelectTrigger id="attr-def-type" className="rounded-input" aria-label={t('products.attributes.field.type')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md shadow-fluent-8">
                  <SelectItem value="STRING" className="text-body-md">{t('products.attributes.field.type.STRING')}</SelectItem>
                  <SelectItem value="NUMBER" className="text-body-md">{t('products.attributes.field.type.NUMBER')}</SelectItem>
                  <SelectItem value="BOOLEAN" className="text-body-md">{t('products.attributes.field.type.BOOLEAN')}</SelectItem>
                  <SelectItem value="DATE" className="text-body-md">{t('products.attributes.field.type.DATE')}</SelectItem>
                  <SelectItem value="LIST" className="text-body-md">{t('products.attributes.field.type.LIST')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-xs">
              <Label htmlFor="attr-def-group" className={attrLabelClass}>{t('products.attributes.field.group')}</Label>
              <Select value={newDefCategory} onValueChange={v => setNewDefCategory(v)}>
                <SelectTrigger id="attr-def-group" className="rounded-input" aria-label={t('products.attributes.field.group')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md shadow-fluent-8 max-h-64">
                  <SelectGroup>
                    <SelectLabel className={attrLabelClass}>{t('products.attributes.field.group.system')}</SelectLabel>
                    <SelectItem value="General" className="text-body-md">
                      {t('products.attributes.field.group.general')}
                    </SelectItem>
                  </SelectGroup>
                  {apiCategories.length > 0 && (
                    <SelectGroup>
                      <SelectLabel className={attrLabelClass}>{t('products.attributes.field.group.product')}</SelectLabel>
                      {apiCategories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id.toString()} className="text-body-md">
                          {c.name} {Number(c.id) === Number(categoryId) ? t('products.attributes.field.group.current') : ''}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {newDefType === 'LIST' && (
            <div className="bg-surface rounded-md border border-border-subtle p-md space-y-sm">
              <div className="flex justify-between items-center">
                <Label className={attrLabelClass}>{t('products.attributes.field.options')}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewDefOptions([...newDefOptions, ''])}
                  className="text-primary"
                >
                  <Plus className="w-4 h-4 mr-1" /> {t('products.attributes.field.options_add')}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-sm">
                {newDefOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-xs bg-surface-muted border border-border-subtle rounded-input px-sm py-1">
                    <Input
                      className="flex-1 border-0 bg-transparent h-7 px-0 focus-visible:ring-0"
                      placeholder={t('products.attributes.field.option_placeholder', { index: i + 1 })}
                      value={opt}
                      aria-label={t('products.attributes.field.option_placeholder', { index: i + 1 })}
                      onChange={(e) => {
                        const nextOpts = [...newDefOptions];
                        nextOpts[i] = e.target.value;
                        setNewDefOptions(nextOpts);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setNewDefOptions(newDefOptions.filter((_, idx) => idx !== i))}
                      aria-label={t('products.modal.action.delete')}
                      className="text-on-surface-deep hover:text-error shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {newDefOptions.length === 0 && (
                  <p className="text-body-md text-on-surface-deep italic col-span-3">{t('products.attributes.field.options_empty')}</p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-xs">
            <Label htmlFor="attr-def-value" className={attrLabelClass}>{t('products.attributes.field.value')}</Label>
            {newDefType === 'LIST' ? (
              <Select value={newDefValue || undefined} onValueChange={v => setNewDefValue(v)}>
                <SelectTrigger id="attr-def-value" className="rounded-input" aria-label={t('products.attributes.field.value')}>
                  <SelectValue placeholder={t('products.attributes.field.select')} />
                </SelectTrigger>
                <SelectContent className="rounded-md shadow-fluent-8">
                  {newDefOptions.filter(o => o.trim() !== '').map(opt => (
                    <SelectItem key={opt} value={opt} className="text-body-md">{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : newDefType === 'BOOLEAN' ? (
              <Select value={newDefValue || 'unspecified'} onValueChange={v => setNewDefValue(v === 'unspecified' ? '' : v)}>
                <SelectTrigger id="attr-def-value" className="rounded-input" aria-label={t('products.attributes.field.value')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-md shadow-fluent-8">
                  <SelectItem value="unspecified" className="text-body-md">{t('products.attributes.field.unspecified')}</SelectItem>
                  <SelectItem value="true" className="text-body-md">{t('products.details.common.yes')}</SelectItem>
                  <SelectItem value="false" className="text-body-md">{t('products.details.common.no')}</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <Input
                id="attr-def-value"
                type={newDefType === 'NUMBER' ? 'number' : newDefType === 'DATE' ? 'date' : 'text'}
                placeholder={
                  newDefType === 'NUMBER'
                    ? t('products.attributes.field.value_placeholder_number')
                    : newDefType === 'DATE'
                      ? t('products.attributes.field.value_placeholder_date')
                      : t('products.attributes.field.value_placeholder_text')
                }
                value={newDefValue}
                onChange={e => setNewDefValue(e.target.value)}
              />
            )}
          </div>

          <div className="flex justify-end gap-sm pt-sm border-t border-border-subtle">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="rounded-button"
              onClick={() => {
                setIsCreatingDef(false);
                setNewDefName('');
                setNewDefType('STRING');
                setNewDefValue('');
                setNewDefOptions([]);
              }}
            >
              {t('products.modal.action.cancel')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="rounded-button"
              loading={creatingDefLoader}
              disabled={!newDefName.trim() || creatingDefLoader || (newDefType === 'LIST' && newDefOptions.filter(o => o.trim() !== '').length === 0)}
              onClick={(e) => {
                e.preventDefault();
                handleCreateDefinition();
              }}
            >
              {t('products.attributes.action.create')}
            </Button>
          </div>
        </div>
      )}

      {attributesDef.length === 0 && !isCreatingDef ? (
        <div className="p-lg text-center bg-surface-muted border border-dashed border-border-subtle rounded-md">
          <Layers className="mx-auto mb-sm text-on-surface-deep" size={24} />
          <p className="text-body-md text-on-surface-deep">{t('products.attributes.empty')}</p>
          <Button type="button" variant="secondary" size="sm" className="mt-md rounded-button" onClick={(e) => { e.preventDefault(); setIsCreatingDef(true); }}>
            <Plus className="w-4 h-4 mr-1" /> {t('products.attributes.action.create_first')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
          {attributesDef.map(attr => {
            const attrId = attr.id || attr.attribute_id;
            const val = productValues[attrId] || '';
            const isSaving = savingId === attrId;
            const hasValue = val !== '' && val !== null && val !== undefined;

          return (
            <div
              key={attrId}
              className={cn(
                'flex flex-col gap-xs p-sm rounded-md transition-colors duration-150 border',
                hasValue
                  ? 'bg-primary/5 border-primary/30'
                  : 'bg-surface-muted border-border-subtle'
              )}
            >
              <div className="flex items-center justify-between">
                <label className={cn(attrLabelClass, hasValue ? 'text-primary' : 'text-on-surface-deep')}>
                  {attr.name} {attr.is_required && <span className="text-error">*</span>}
                </label>
                {hasValue && (
                  <span className="text-body-sm-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full uppercase">
                    {t('products.attributes.active')}
                  </span>
                )}
              </div>

              <div className="flex gap-sm items-center mt-xs">
                <div className="flex-1">
                  {attr.data_type === 'LIST' && attr.options ? (
                    <Select value={val || undefined} onValueChange={v => handleChange(attrId, v)}>
                      <SelectTrigger className="rounded-input bg-surface" aria-label={attr.name}>
                        <SelectValue placeholder={t('products.attributes.field.select')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-md shadow-fluent-8 max-h-64">
                        {attr.options.map((opt: string) => (
                          <SelectItem key={opt} value={opt} className="text-body-md">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : attr.data_type === 'BOOLEAN' ? (
                    <Select value={String(val) || 'unspecified'} onValueChange={v => handleChange(attrId, v === 'unspecified' ? '' : v)}>
                      <SelectTrigger className="rounded-input bg-surface" aria-label={attr.name}>
                        <SelectValue placeholder={t('products.attributes.field.unspecified')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-md shadow-fluent-8">
                        <SelectItem value="unspecified" className="text-body-md">{t('products.attributes.field.unspecified')}</SelectItem>
                        <SelectItem value="true" className="text-body-md">{t('products.details.common.yes')}</SelectItem>
                        <SelectItem value="false" className="text-body-md">{t('products.details.common.no')}</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={attr.data_type === 'NUMBER' ? 'number' : attr.data_type === 'DATE' ? 'date' : 'text'}
                      className="bg-surface rounded-input"
                      placeholder={t('products.attributes.value_for', { name: attr.name })}
                      value={val}
                      aria-label={t('products.attributes.value_for', { name: attr.name })}
                      onChange={e => handleChange(attrId, e.target.value)}
                    />
                  )}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant={hasValue ? 'primary' : 'secondary'}
                  onClick={(e) => {
                    e.preventDefault();
                    handleSave(attr);
                  }}
                  disabled={isSaving}
                  className="shrink-0"
                  title={t('products.attributes.action.save_title')}
                  aria-label={t('products.attributes.action.save_title')}
                >
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
      )}
    </div>
  );
}
