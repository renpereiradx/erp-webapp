import { useState, useEffect, useRef } from 'react';
import { tagService } from '@/services/tagService';
import { useToast } from '@/hooks/useToast';
import { useI18n } from '@/lib/i18n';
import { X, Check, Plus, Loader2, Tags } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function ProductTagsManager({ productId, categoryId, disabled = false }: { productId: string | number | undefined; categoryId?: number; disabled?: boolean }) {
  const toast = useToast();
  const { t } = useI18n();
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
        if (!ignore) toast.error(t('products.tags.error.load'));
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
      toast.errorFrom(error, { fallback: t('products.tags.error.assign') });
    }
  };

  const handleRemove = async (tagId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!productId) return;
    try {
      await tagService.removeFromProduct(productId.toString(), tagId);
      setProductTags(prev => prev.filter(pt => pt.id !== tagId));
    } catch (error) {
      toast.error(t('products.tags.error.remove'));
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
      toast.errorFrom(error, { fallback: t('products.tags.error.create') });
    } finally {
      setIsCreating(false);
    }
  };

  if (disabled || !productId) {
    return (
      <div className="min-h-11 p-sm bg-surface-muted border border-dashed border-border-subtle rounded-md flex items-center justify-center text-body-sm-bold text-on-surface-deep">
        <Tags className="w-4 h-4 mr-sm opacity-50" />
        {t('products.tags.save_first')}
      </div>
    );
  }

  if (loading) {
    return <Skeleton className="h-11 rounded-md bg-surface-muted" />;
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
    <div className="relative" ref={wrapperRef}>
      <div
        className={cn(
          'min-h-11 p-1.5 bg-surface border rounded-input transition-all cursor-text flex flex-wrap gap-sm items-center',
          isDropdownOpen
            ? 'border-primary ring-2 ring-primary/20'
            : 'border-border-subtle hover:border-outline'
        )}
        onClick={() => setIsDropdownOpen(true)}
      >
        {productTags.map(tag => (
          <div
            key={tag.id}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-body-sm-bold text-white animate-in zoom-in-95 duration-150"
            style={{ backgroundColor: tag.color || '#94a3b8' }}
          >
            {tag.name}
            <button
              type="button"
              onClick={(e) => handleRemove(tag.id, e)}
              aria-label={`${t('products.modal.action.delete')}: ${tag.name}`}
              className="hover:opacity-80 rounded-full p-0.5 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        <input
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setIsDropdownOpen(true);
          }}
          placeholder={productTags.length === 0 ? t('products.tags.placeholder') : ''}
          className="flex-1 min-w-30 bg-transparent outline-none text-body-md text-foreground px-2 py-1 placeholder:text-on-surface-deep/60"
        />
      </div>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-sm bg-surface rounded-md shadow-fluent-8 border border-border-subtle max-h-60 overflow-y-auto z-50 p-xs animate-in fade-in slide-in-from-top-2 duration-150">
          {filteredTags.length > 0 && (
            <div className="p-xs space-y-0.5">
              <div className="px-sm py-1.5 text-label-caps uppercase text-on-surface-deep">
                {t('products.tags.existing')}
              </div>
              {filteredTags.map(tag => {
                const isSelected = productTags.some(pt => pt.id === tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => !isSelected && handleAssign(tag)}
                    disabled={isSelected}
                    className={cn(
                      'w-full flex items-center justify-between px-sm py-sm rounded-sm text-left text-body-md transition-colors duration-150',
                      isSelected
                        ? 'opacity-50 cursor-not-allowed bg-surface-muted text-foreground'
                        : 'hover:bg-surface-muted text-foreground'
                    )}
                  >
                    <div className="flex items-center gap-sm">
                      <span className="size-3 rounded-full border border-border-subtle" style={{ backgroundColor: tag.color || '#94a3b8' }} />
                      {tag.name}
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </button>
                );
              })}
            </div>
          )}

          {searchTerm.trim() && !exactMatch && (
            <div className="p-xs border-t border-border-subtle mt-xs">
              <button
                type="button"
                onClick={handleCreateAndAssign}
                disabled={isCreating}
                className="w-full flex items-center gap-sm px-sm py-2.5 rounded-sm text-left text-body-md hover:bg-surface-muted text-primary transition-colors duration-150"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {t('products.tags.create_new', { term: searchTerm.trim() })}
              </button>
            </div>
          )}

          {filteredTags.length === 0 && !searchTerm.trim() && (
            <div className="p-lg text-center text-body-md text-on-surface-deep">
              {t('products.tags.empty_suggestions')} <br /> {t('products.tags.empty_suggestions_hint')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
