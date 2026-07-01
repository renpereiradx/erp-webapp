import { useState, useEffect, useRef } from 'react';
import { tagService } from '@/services/tagService';
import { useToast } from '@/hooks/useToast';
import { X, Check, Plus, Loader2, Tags } from 'lucide-react';

export function ProductTagsManager({ productId, categoryId, disabled = false }: { productId: string | number | undefined; categoryId?: number; disabled?: boolean }) {
  const toast = useToast();
  const [allTags, setAllTags] = useState<any[]>([]);
  const [productTags, setProductTags] = useState<any[]>([]);
  const [loading, setLoading] = useState(!disabled && !!productId);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled || !productId) return;
    let ignore = false;
    const fetchData = async () => {
      try {
        const [tagsRes, prodTagsRes] = await Promise.all([
          tagService.getAll(),
          tagService.getProductTags(productId.toString())
        ]);
        if (!ignore) {
          const allT = Array.isArray(tagsRes) ? tagsRes : (tagsRes?.data || []);
          setAllTags(allT);
          
          const rawProdTags = Array.isArray(prodTagsRes) ? prodTagsRes : (prodTagsRes?.data || []);
          const normalizedProductTags = rawProdTags.map((pt: any) => {
            const tagId = pt.tag_id || pt.id;
            const fullTag = allT.find((t: any) => t.id === tagId);
            return fullTag || pt;
          });
          
          setProductTags(normalizedProductTags);
        }
      } catch (error) {
        console.error(error);
        if (!ignore) toast.error('Error al cargar las etiquetas');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchData();
    return () => { ignore = true; };
  }, [productId, disabled]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  const handleAssign = async (tag: any) => {
    if (!productId) return;
    if (productTags.find(pt => pt.id === tag.id)) return;
    try {
      await tagService.assignToProduct(productId.toString(), tag.id);
      setProductTags(prev => [...prev, tag]);
      setSearchTerm('');
      setIsDropdownOpen(false);
    } catch (error: any) {
      if (error?.code === 'VALIDATION_ERROR' && error.message) {
        // Mejorar la UX del mensaje limpiando IDs técnicos del backend
        let msg = error.message;
        msg = msg.replace(/tag \d+ /g, 'La etiqueta ');
        msg = msg.replace(/la categoría \d+ pero/g, 'otra categoría, pero');
        msg = msg.replace(/el producto \S+ /g, 'este producto ');
        msg = msg.replace(/categoría \d+ '(.+?)'/g, "categoría '$1'");
        error.message = msg;
      }
      toast.errorFrom(error, { fallback: 'Error al asignar etiqueta' });
    }
  };

  const handleRemove = async (tagId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!productId) return;
    try {
      await tagService.removeFromProduct(productId.toString(), tagId);
      setProductTags(prev => prev.filter(pt => pt.id !== tagId));
    } catch (error) {
      toast.error('Error al remover etiqueta');
    }
  };

  const handleCreateAndAssign = async () => {
    if (!productId || !searchTerm.trim() || isCreating) return;
    setIsCreating(true);
    try {
      // Pick a random nice color from a curated palette
      const colors = ['#0ea5e9', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981', '#14b8a6'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      
      const newTag = await tagService.create({ 
        name: searchTerm.trim(), 
        color: randomColor, 
        tag_type: 'GENERAL',
        category_id: null
      });
      setAllTags(prev => [...prev, newTag]);
      await handleAssign(newTag);
    } catch (error) {
      toast.errorFrom(error, { fallback: 'Error al crear etiqueta' });
    } finally {
      setIsCreating(false);
    }
  };

  if (disabled || !productId) {
    return (
      <div className="min-h-[44px] p-3 bg-slate-50 border border-slate-200 border-dashed rounded-xl flex items-center justify-center text-xs text-slate-400 font-medium">
        <Tags size={14} className="mr-2 opacity-50" />
        Guarde el producto primero para habilitar las etiquetas
      </div>
    );
  }

  if (loading) {
    return <div className="animate-pulse h-[44px] bg-slate-100 rounded-xl"></div>;
  }

  // Mostrar solo tags globales (null o 0) o que pertenezcan a la misma categoría del producto
  const applicableTags = allTags.filter(t => 
    t.category_id === null || 
    t.category_id === undefined || 
    t.category_id === 0 ||
    t.category_id === Number(categoryId)
  );

  const filteredTags = applicableTags.filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const exactMatch = applicableTags.find(t => t.name.toLowerCase() === searchTerm.toLowerCase().trim());

  return (
    <div className="relative font-display" ref={wrapperRef}>
      <div 
        className={`min-h-[44px] p-1.5 bg-white border ${isDropdownOpen ? 'border-primary ring-4 ring-primary/10' : 'border-border-subtle'} rounded-xl transition-all cursor-text flex flex-wrap gap-2 items-center hover:border-slate-300`}
        onClick={() => setIsDropdownOpen(true)}
      >
        {productTags.map(tag => (
          <div 
            key={tag.id} 
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold text-white shadow-sm animate-in zoom-in-95"
            style={{ backgroundColor: tag.color || '#94a3b8' }}
          >
            {tag.name}
            <button 
              type="button" 
              onClick={(e) => handleRemove(tag.id, e)}
              className="hover:bg-black/20 rounded-full p-0.5 transition-colors focus:outline-none"
            >
              <X size={10} />
            </button>
          </div>
        ))}
        
        <input
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          placeholder={productTags.length === 0 ? "Buscar o crear etiquetas..." : ""}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm font-bold text-text-main px-2 py-1 placeholder:text-slate-300 placeholder:font-medium"
        />
      </div>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-fluent-16 border border-slate-100 max-h-60 overflow-y-auto z-50 p-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {filteredTags.length > 0 && (
            <div className="p-1 space-y-0.5">
              <div className="px-2 py-1.5 text-[9px] font-black uppercase tracking-widest text-slate-400">Etiquetas Existentes</div>
              {filteredTags.map(tag => {
                const isSelected = productTags.some(pt => pt.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => !isSelected && handleAssign(tag)}
                    disabled={isSelected}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-xs font-bold transition-colors ${isSelected ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'hover:bg-slate-50 text-text-main'}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-3 h-3 rounded-full shadow-sm border border-black/5" style={{ backgroundColor: tag.color || '#94a3b8' }} />
                      {tag.name}
                    </div>
                    {isSelected && <Check size={14} className="text-primary" />}
                  </button>
                );
              })}
            </div>
          )}

          {searchTerm.trim() && !exactMatch && (
            <div className="p-1 border-t border-slate-100 mt-1">
              <button
                type="button"
                onClick={handleCreateAndAssign}
                disabled={isCreating}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-xs font-bold hover:bg-primary/5 text-primary transition-colors"
              >
                {isCreating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Crear nueva etiqueta "{searchTerm.trim()}"
              </button>
            </div>
          )}

          {filteredTags.length === 0 && !searchTerm.trim() && (
            <div className="p-5 text-center text-xs font-medium text-slate-400">
              No hay etiquetas sugeridas. <br /> Escribe para crear la primera.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
