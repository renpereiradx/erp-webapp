import { useState, useEffect } from 'react';
import { attributeService } from '@/services/attributeService';
import { useToast } from '@/hooks/useToast';
import { Layers, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CategoryAttributesManagerProps {
  categoryId: number;
}

export function CategoryAttributesManager({ categoryId }: CategoryAttributesManagerProps) {
  const toast = useToast();
  const [attributes, setAttributes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [dataType, setDataType] = useState('STRING');
  const [optionsStr, setOptionsStr] = useState('');
  const [isVariant, setIsVariant] = useState(false);

  const loadAttributes = async (ignore = false) => {
    try {
      const res = await attributeService.getCategoryAttributes(categoryId);
      if (!ignore) {
        setAttributes(Array.isArray(res) ? res : (res?.data || []));
      }
    } catch (error) {
      if (!ignore) toast.error('Error al cargar los atributos de la categoría');
    } finally {
      if (!ignore) setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    loadAttributes(ignore);
    return () => { ignore = true; };
  }, [categoryId]);

  const handleCreate = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error('Nombre y código son requeridos');
      return;
    }

    let options = [];
    if (dataType === 'LIST' || dataType === 'MULTI_SELECT') {
      options = optionsStr.split(',').map(s => s.trim()).filter(Boolean);
      if (options.length === 0) {
        toast.error('Debe proveer opciones separadas por coma');
        return;
      }
    }

    setIsCreating(true);
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
      });
      toast.success('Atributo creado exitosamente');
      setName('');
      setCode('');
      setOptionsStr('');
      setDataType('STRING');
      setIsVariant(false);
      await loadAttributes();
    } catch (error: any) {
      toast.error(error?.message || 'Error al crear atributo');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este atributo? Afectará a todos los productos de esta categoría.')) return;
    try {
      await attributeService.deleteDefinition(id);
      toast.success('Atributo eliminado');
      await loadAttributes();
    } catch (error: any) {
      toast.error(error?.message || 'Error al eliminar atributo');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 bg-slate-50 border border-border-subtle rounded-xl border-dashed">
        <Loader2 className="animate-spin text-primary mr-2" size={20} />
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Cargando Atributos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* List of existing attributes */}
      <div className="space-y-2">
        {attributes.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-200 border-dashed rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium">
            No hay atributos definidos para esta categoría
          </div>
        ) : (
          <div className="grid gap-2">
            {attributes.map(attr => (
              <div key={attr.id} className="flex flex-col p-3 bg-white border border-border-subtle rounded-xl shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black text-text-main uppercase tracking-wider">{attr.name}</span>
                    <span className="ml-2 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded uppercase">{attr.data_type}</span>
                    {(attr.is_variant || attr.isVariant) && (
                      <span className="ml-2 text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded uppercase">Variante</span>
                    )}
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleDelete(attr.id)}
                    className="text-slate-400 hover:text-error transition-colors p-1"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="text-[10px] font-bold text-text-secondary font-mono mt-1">Code: {attr.code}</div>
                {attr.options && attr.options.length > 0 && (
                  <div className="text-[10px] font-medium text-slate-500 mt-1">
                    Opciones: {attr.options.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inline Form to Create New Attribute */}
      <div className="p-4 bg-slate-50 rounded-xl border border-border-subtle space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-main flex items-center gap-1.5">
          <Layers size={14} className="text-primary" />
          Nuevo Atributo
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <input 
            value={name} 
            onChange={e => {
              setName(e.target.value);
              // auto generate code
              if (!code || code === name.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, -1)) {
                setCode(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '_'));
              }
            }}
            placeholder="Nombre (ej. Talla)" 
            className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs font-bold outline-none focus:border-primary"
          />
          <input 
            value={code} 
            onChange={e => setCode(e.target.value)}
            placeholder="Código (ej. talla)" 
            className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs font-mono outline-none focus:border-primary"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <select 
            value={dataType} 
            onChange={e => setDataType(e.target.value)}
            className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs font-bold outline-none focus:border-primary"
          >
            <option value="STRING">Texto Corto (String)</option>
            <option value="NUMBER">Número</option>
            <option value="BOOLEAN">Si/No (Booleano)</option>
            <option value="DATE">Fecha</option>
            <option value="LIST">Lista (Una opción)</option>
            <option value="MULTI_SELECT">Multi Selección</option>
          </select>
          
          {(dataType === 'LIST' || dataType === 'MULTI_SELECT') && (
            <input 
              value={optionsStr} 
              onChange={e => setOptionsStr(e.target.value)}
              placeholder="Opciones (ej. S, M, L)" 
              className="w-full h-9 px-3 bg-white border border-border-subtle rounded-lg text-xs font-bold outline-none focus:border-primary"
            />
          )}
        </div>
        <div className="flex items-center gap-2 py-1">
          <input 
            type="checkbox" 
            id="isVariant" 
            checked={isVariant} 
            onChange={e => setIsVariant(e.target.checked)} 
            className="w-4 h-4 text-primary border-border-subtle rounded focus:ring-primary"
          />
          <label htmlFor="isVariant" className="text-xs font-bold text-text-secondary select-none cursor-pointer">
            Usar para generar variantes (ej. Talla, Color)
          </label>
        </div>
        <Button 
          type="button" 
          onClick={handleCreate}
          disabled={isCreating}
          className="w-full bg-slate-800 hover:bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest h-9 rounded-lg"
        >
          {isCreating ? <Loader2 size={14} className="animate-spin mr-2" /> : <Plus size={14} className="mr-2" />}
          Crear Atributo
        </Button>
      </div>
    </div>
  );
}
