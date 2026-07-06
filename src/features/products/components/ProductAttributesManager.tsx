import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Layers, Plus, X } from 'lucide-react';
import { attributeService } from '@/services/attributeService';
import { categoryService } from '@/services/categoryService';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';

export function ProductAttributesManager({ productId, categoryId }: { productId: string; categoryId?: string | number }) {
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
        toast.error("Error al cargar los atributos del producto");
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
      toast.error('Debe guardar los datos básicos del producto antes de asignar atributos.');
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
      toast.success(`Atributo ${attr.name} guardado`);
    } catch (err) {
      console.error(err);
      toast.error(`Error al guardar ${attr.name}`);
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
      
      toast.success('Atributo creado y guardado exitosamente');
      setIsCreatingDef(false);
      setNewDefName('');
      setNewDefType('STRING');
      setNewDefValue('');
      setNewDefOptions([]);
      await loadData();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la definición del atributo');
    } finally {
      setCreatingDefLoader(false);
    }
  };

  if (loading && attributesDef.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs">
        <RefreshCw className="animate-spin mx-auto mb-2" size={20} />
        Cargando atributos descriptivos...
      </div>
    );
  }

  if (!productId) {
    return (
      <div className="p-12 text-center border-2 border-dashed border-outline-variant/30 rounded-2xl bg-surface-container-lowest">
        <Layers className="mx-auto text-outline-variant mb-4" size={32} />
        <h3 className="text-title-md font-bold text-on-surface mb-2">Guarde el producto primero</h3>
        <p className="text-body-sm text-on-surface-variant">Debe guardar los datos básicos de este producto antes de asignar atributos descriptivos.</p>
      </div>
    );
  }

  if (!categoryId) {
    return (
      <div className="p-8 text-center text-amber-600 bg-amber-50 border border-dashed border-amber-200 rounded-xl">
        <Layers className="mx-auto mb-2 opacity-50" size={24} />
        <p className="text-sm font-bold">No hay categoría seleccionada</p>
        <p className="text-xs mt-1">Debe seleccionar una categoría en la pestaña <b>Datos Básicos</b> para gestionar los atributos.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex justify-between items-start gap-4">
        <p className="text-[10px] text-blue-700 font-medium">
          Estos atributos describen las propiedades del producto y NO dividen el inventario. 
          Use este panel para especificar origen, materiales, garantías, etc.
        </p>
        {categoryId && (
          <Button 
            type="button"
            size="sm" 
            variant="outline" 
            className="shrink-0 h-7 text-[10px] uppercase font-bold text-primary border-primary/20 hover:bg-primary/5"
            onClick={(e) => {
              e.preventDefault();
              setIsCreatingDef(!isCreatingDef);
            }}
          >
            {isCreatingDef ? <X size={12} className="mr-1" /> : <Plus size={12} className="mr-1" />}
            {isCreatingDef ? 'Cancelar' : 'Nuevo Atributo'}
          </Button>
        )}
      </div>

      {isCreatingDef && (
        <div className="p-5 bg-slate-50 border border-primary/20 rounded-2xl mb-6 space-y-4 animate-in slide-in-from-top-3 duration-200">
          <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Plus size={14} /> Nuevo Atributo Descriptivo
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Nombre del atributo</label>
              <input 
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                placeholder="Ej. Material, RAM, Garantía"
                value={newDefName}
                onChange={e => setNewDefName(e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Tipo de Dato</label>
              <select 
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={newDefType}
                onChange={e => {
                  setNewDefType(e.target.value);
                  setNewDefValue('');
                }}
              >
                <option value="STRING">Texto (STRING)</option>
                <option value="NUMBER">Número (NUMBER)</option>
                <option value="BOOLEAN">Sí / No (BOOLEAN)</option>
                <option value="DATE">Fecha (DATE)</option>
                <option value="LIST">Lista de opciones (LIST)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Grupo / Categoría</label>
              <select 
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                value={newDefCategory}
                onChange={e => setNewDefCategory(e.target.value)}
              >
                <optgroup label="Grupos de Sistema">
                  <option value="General">General (Sin categoría)</option>
                </optgroup>
                {apiCategories.length > 0 && (
                  <optgroup label="Categorías de Producto">
                    {apiCategories.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {Number(c.id) === Number(categoryId) ? '(Actual del Producto)' : ''}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          {newDefType === 'LIST' && (
            <div className="bg-white p-3.5 rounded-xl border border-slate-100 space-y-2.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider flex justify-between items-center">
                Opciones de la lista
                <button 
                  type="button" 
                  onClick={() => setNewDefOptions([...newDefOptions, ''])} 
                  className="text-primary hover:underline flex items-center text-[10px]"
                >
                  <Plus size={12} className="mr-0.5" /> Añadir opción
                </button>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {newDefOptions.map((opt, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
                    <input 
                      className="flex-1 bg-transparent text-xs outline-none w-full" 
                      placeholder={`Opción ${i + 1}`} 
                      value={opt} 
                      onChange={(e) => {
                        const nextOpts = [...newDefOptions];
                        nextOpts[i] = e.target.value;
                        setNewDefOptions(nextOpts);
                      }}
                    />
                    <button 
                      type="button" 
                      onClick={() => setNewDefOptions(newDefOptions.filter((_, idx) => idx !== i))} 
                      className="text-slate-400 hover:text-error shrink-0"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                {newDefOptions.length === 0 && (
                  <p className="text-[11px] text-slate-400 italic col-span-3">Añade al menos una opción para tu lista.</p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Valor para este producto (Opcional)</label>
            {newDefType === 'LIST' ? (
              <select
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                value={newDefValue}
                onChange={e => setNewDefValue(e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {newDefOptions.filter(o => o.trim() !== '').map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : newDefType === 'BOOLEAN' ? (
              <select
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                value={newDefValue}
                onChange={e => setNewDefValue(e.target.value)}
              >
                <option value="">No especificado</option>
                <option value="true">Sí</option>
                <option value="false">No</option>
              </select>
            ) : (
              <input
                type={newDefType === 'NUMBER' ? 'number' : newDefType === 'DATE' ? 'date' : 'text'}
                className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                placeholder={newDefType === 'NUMBER' ? 'Ej. 120' : newDefType === 'DATE' ? 'Seleccionar fecha' : 'Ej. Importado, 55 pulgadas, etc.'}
                value={newDefValue}
                onChange={e => setNewDefValue(e.target.value)}
              />
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
            <Button 
              type="button"
              variant="outline"
              size="sm"
              className="text-[10px] uppercase font-bold px-4 h-8 rounded-lg"
              onClick={() => {
                setIsCreatingDef(false);
                setNewDefName('');
                setNewDefType('STRING');
                setNewDefValue('');
                setNewDefOptions([]);
              }}
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              size="sm"
              className="bg-primary hover:bg-primary/95 text-white text-[10px] uppercase font-bold px-5 h-8 rounded-lg flex items-center gap-1.5 shadow-sm"
              disabled={!newDefName.trim() || creatingDefLoader || (newDefType === 'LIST' && newDefOptions.filter(o => o.trim() !== '').length === 0)}
              onClick={(e) => {
                e.preventDefault();
                handleCreateDefinition();
              }}
            >
              {creatingDefLoader ? <RefreshCw size={12} className="animate-spin" /> : 'Crear y Guardar'}
            </Button>
          </div>
        </div>
      )}

      {attributesDef.length === 0 && !isCreatingDef ? (
        <div className="p-8 text-center text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-xl">
          <Layers className="mx-auto mb-2 text-slate-300" size={24} />
          <p className="text-sm font-medium">No hay atributos descriptivos definidos para esta categoría.</p>
          {categoryId && (
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={(e) => { e.preventDefault(); setIsCreatingDef(true); }}>
              <Plus size={14} className="mr-1" /> Crear el primero
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {attributesDef.map(attr => {
            const attrId = attr.id || attr.attribute_id;
            const val = productValues[attrId] || '';
            const isSaving = savingId === attrId;
            const hasValue = val !== '' && val !== null && val !== undefined;

          return (
            <div 
              key={attrId} 
              className={`flex flex-col gap-1.5 p-3 rounded-xl transition-all duration-200 ${
                hasValue 
                  ? 'bg-primary/[0.04] border border-primary/30 shadow-sm ring-1 ring-primary/10' 
                  : 'bg-slate-50 border border-slate-100 hover:border-slate-200 opacity-80 hover:opacity-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <label className={`text-[10px] font-black uppercase tracking-wider ${hasValue ? 'text-primary' : 'text-slate-500'}`}>
                  {attr.name} {attr.is_required && <span className="text-error">*</span>}
                </label>
                {hasValue && (
                  <span className="text-[8px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">
                    Activo
                  </span>
                )}
              </div>
              
              <div className="flex gap-2 items-center mt-1">
                <div className="flex-1">
                  {attr.data_type === 'LIST' && attr.options ? (
                    <select
                      className={`w-full h-9 px-3 bg-white border rounded-lg text-sm text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors ${hasValue ? 'border-primary/30' : 'border-slate-200'}`}
                      value={val}
                      onChange={e => handleChange(attrId, e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {attr.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : attr.data_type === 'BOOLEAN' ? (
                    <select
                      className={`w-full h-9 px-3 bg-white border rounded-lg text-sm text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors ${hasValue ? 'border-primary/30' : 'border-slate-200'}`}
                      value={String(val)}
                      onChange={e => handleChange(attrId, e.target.value)}
                    >
                      <option value="">No especificado</option>
                      <option value="true">Sí</option>
                      <option value="false">No</option>
                    </select>
                  ) : (
                    <input
                      type={attr.data_type === 'NUMBER' ? 'number' : attr.data_type === 'DATE' ? 'date' : 'text'}
                      className={`w-full h-9 px-3 bg-white border rounded-lg text-sm text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors ${hasValue ? 'border-primary/30' : 'border-slate-200'}`}
                      placeholder={`Valor para ${attr.name}`}
                      value={val}
                      onChange={e => handleChange(attrId, e.target.value)}
                    />
                  )}
                </div>
                <Button 
                  type="button"
                  size="sm" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleSave(attr);
                  }} 
                  disabled={isSaving}
                  className={`h-9 w-9 p-0 border-none shadow-none transition-all duration-200 ${
                    hasValue 
                      ? 'bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20' 
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-500'
                  }`}
                  title="Guardar atributo individual"
                >
                  {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
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
