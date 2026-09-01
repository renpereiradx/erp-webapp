import { useState, useEffect } from 'react';
import { useVariants } from '@/hooks/useVariants';
import { useI18n } from '@/lib/i18n';
import { VariantModal } from '@/components/modals/VariantModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Package, Plus, Pencil, AlertTriangle, Search } from 'lucide-react';
import { formatCurrency } from '@/utils/currencyUtils';

interface ProductVariantsManagerProps {
  productId: string;
  categoryId?: string | number;
  compact?: boolean;
}

const tableHeadClass = 'text-label-caps uppercase text-on-surface-deep bg-surface-muted';
const dataChipClass = 'bg-surface-subtle text-on-surface-deep rounded-xs px-1.5 py-0.5 text-body-sm-bold';

export function ProductVariantsManager({ productId, categoryId }: ProductVariantsManagerProps) {
  const { t } = useI18n();
  const { variants, searchTerm, setSearchTerm, toggleVariantStatus, createVariant, editVariant, setActiveProductId, loading } = useVariants();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [variantToEdit, setVariantToEdit] = useState<any>(null);

  useEffect(() => {
    if (productId) {
      setActiveProductId(productId);
    }
  }, [productId, setActiveProductId]);

  const handleEdit = (variant: any) => {
    setVariantToEdit(variant);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    if (!productId) {
      alert(t('products.variants.save_first_text'));
      return;
    }
    setVariantToEdit(null);
    setIsModalOpen(true);
  };

  const handleSaveVariant = async (data: any) => {
    if (variantToEdit) {
      await editVariant(variantToEdit.id, data);
    } else {
      await createVariant(data);
    }
  };

  if (loading) {
    return (
      <div className="space-y-md p-md" aria-busy="true">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full bg-surface-muted" />
        ))}
      </div>
    );
  }

  if (!productId) {
    return (
      <div className="text-center border border-dashed border-border-subtle bg-surface-muted rounded-md p-lg">
        <Package className="mx-auto text-on-surface-deep mb-sm" size={24} />
        <h3 className="text-title-md text-foreground mb-xs">{t('products.variants.save_first_title')}</h3>
        <p className="text-body-md text-on-surface-deep">{t('products.variants.save_first_text')}</p>
      </div>
    );
  }

  if (variants.length === 0) {
    return (
      <div className="text-center border border-dashed border-border-subtle bg-surface-muted rounded-md p-lg">
        <Package className="mx-auto text-on-surface-deep mb-sm" size={24} />
        <h3 className="text-title-md text-foreground mb-xs">{t('products.variants.empty_title')}</h3>
        <p className="text-body-md text-on-surface-deep">{t('products.variants.empty_text')}</p>
        <Button type="button" variant="secondary" className="mt-md rounded-button" onClick={handleCreate}>
          {t('products.variants.action.create_first', 'Agregar primera variante')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-md">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-sm">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-sm flex items-center text-on-surface-deep pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <Input
            id="variant-search"
            type="text"
            placeholder={t('products.variants.search_placeholder', 'Buscar variantes...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-64"
            aria-label={t('products.variants.search_placeholder', 'Buscar variantes...')}
          />
        </div>

        <Button type="button" variant="primary" className="rounded-button" onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          {t('products.variants.action.new', 'Nueva Variante')}
        </Button>
      </div>

      <div className="bg-surface border border-border-subtle rounded-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-surface-muted hover:bg-surface-muted border-0">
                <TableHead className={`${tableHeadClass} w-12`}>{t('products.variants.table.state', 'Estado')}</TableHead>
                <TableHead className={tableHeadClass}>{t('products.variants.table.info', 'Info Variante')}</TableHead>
                <TableHead className={tableHeadClass}>{t('products.variants.table.attributes', 'Atributos')}</TableHead>
                <TableHead className={`${tableHeadClass} text-right`}>{t('products.table.stock')}</TableHead>
                <TableHead className={`${tableHeadClass} text-right`}>{t('products.variants.table.price', 'Precio')}</TableHead>
                <TableHead className={`${tableHeadClass} text-center w-16`}>{t('products.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id} className="group hover:bg-surface-muted transition-colors duration-150">
                  <TableCell className="text-center">
                    <Switch
                      checked={variant.isActive}
                      onCheckedChange={() => toggleVariantStatus(variant.id, variant.isActive)}
                      aria-label={`${t('products.variants.table.state')}: ${variant.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-sm">
                      <div className="rounded-sm bg-surface-subtle flex items-center justify-center text-primary size-8 shrink-0">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-body-md-bold text-foreground">{variant.name}</p>
                        <div className="flex items-center gap-xs mt-xs">
                          <span className={dataChipClass}>{t('products.variants.sku_label')}: {variant.sku}</span>
                          <span className={dataChipClass}>{t('products.variants.barcode_label')}: {variant.barcode}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-xs">
                      {variant.attributes.map((attr, idx) => (
                        <span
                          key={idx}
                          className={`${attr.bgColor} ${attr.color} border ${attr.borderColor} text-body-sm-bold px-1.5 py-0.5 rounded-xs`}
                        >
                          <span className="opacity-70">{attr.name}:</span>
                          <span className="font-bold">{attr.value}</span>
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end gap-xs">
                      <span className={`text-data-mono font-data-mono ${variant.lowStock ? 'text-error' : 'text-foreground'}`}>
                        {variant.stock}
                      </span>
                      {variant.lowStock && (
                        <span className="flex items-center gap-xs text-body-sm-bold text-error">
                          <AlertTriangle className="w-4 h-4" /> {t('products.variants.low_stock', 'Bajo')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-data-mono font-data-mono text-foreground">{formatCurrency(variant.price)}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(variant)}
                        title={t('products.variants.action.edit', 'Editar Variante')}
                        aria-label={t('products.variants.action.edit', 'Editar Variante')}
                        className="text-on-surface-deep hover:text-primary transition-colors duration-150"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal */}
      <VariantModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleSaveVariant}
        product={{ id: productId, category_id: categoryId }}
        variantToEdit={variantToEdit}
      />
    </div>
  );
}
