import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, Layers, Plus, X } from 'lucide-react';
import { attributeService } from '@/services/attributeService';
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
  const [creatingDefLoader, setCreatingDefLoader] = useState(false);

  const toast = useToast();

  const loadData = async (ignore: boolean = false) => {
    setLoading(true);
    try {
      let defs;
      let currentVals;
      
      if (categoryId) {
        defs = await attributeService.getCategoryAttributes(categoryId);
      } else if (productId) {
        defs = await attributeService.getApplicableAttributes(productId);
      } else {
        return; // Nothing to load
      }

      if (productId) {
        currentVals = await attributeService.getProductAttributes(productId);
      } else {
        currentVals = { data: [] }; // No product values yet
      }

      if (!ignore) {
        const defsArray = Array.isArray(defs) ? defs : (defs?.data || []);
        const valsArray = Array.isArray(currentVals) ? currentVals : (currentVals?.data || []);
        
        setAttributesDef(defsArray.filter((d: any) => !d.is_variant && !d.isVariant));

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
    if (!categoryId) {
      toast.error('Debe asignar el producto a una categoría antes de crear atributos');
      return;
    }
    if (!newDefName.trim()) return;

    setCreatingDefLoader(true);
    try {
      const code = newDefName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
      await attributeService.createDefinition({
        category_id: Number(categoryId),
        name: newDefName.trim(),
        code: code,
        data_type: newDefType,
        is_visible: true,
        is_filterable: true,
        is_variant: false
      });
      toast.success('Atributo de categoría creado');
      setIsCreatingDef(false);
      setNewDefName('');
      setNewDefType('STRING');
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
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl mb-4 animate-in slide-in-from-top-2 flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="text-[10px] font-bold text-primary/80 uppercase tracking-wider mb-1 block">Nombre del atributo</label>
            <input 
              className="w-full h-9 px-3 bg-white border border-primary/20 rounded-lg text-sm outline-none focus:border-primary"
              placeholder="Ej. Material, RAM, Garantía"
              value={newDefName}
              onChange={e => setNewDefName(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <label className="text-[10px] font-bold text-primary/80 uppercase tracking-wider mb-1 block">Tipo de Dato</label>
            <select 
              className="w-full h-9 px-3 bg-white border border-primary/20 rounded-lg text-sm outline-none focus:border-primary"
              value={newDefType}
              onChange={e => setNewDefType(e.target.value)}
            >
              <option value="STRING">Texto</option>
              <option value="NUMBER">Número</option>
              <option value="BOOLEAN">Sí / No</option>
              <option value="DATE">Fecha</option>
            </select>
          </div>
          <Button 
            type="button"
            className="w-full md:w-auto h-9 bg-primary hover:bg-primary/90 text-white font-bold"
            disabled={!newDefName.trim() || creatingDefLoader}
            onClick={(e) => {
              e.preventDefault();
              handleCreateDefinition();
            }}
          >
            {creatingDefLoader ? <RefreshCw size={14} className="animate-spin" /> : 'Guardar'}
          </Button>
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

          return (
            <div key={attrId} className="flex flex-col gap-1.5 p-3 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-200 transition-colors">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                {attr.name} {attr.is_required && <span className="text-error">*</span>}
              </label>
              
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  {attr.data_type === 'LIST' && attr.options ? (
                    <select
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                      value={val}
                      onChange={e => handleChange(attrId, e.target.value)}
                    >
                      <option value="">Seleccionar...</option>
                      {attr.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  ) : attr.data_type === 'BOOLEAN' ? (
                    <select
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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
                      className="w-full h-9 px-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none"
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
                  className="h-9 w-9 p-0 bg-primary/10 hover:bg-primary/20 text-primary border-none shadow-none"
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
