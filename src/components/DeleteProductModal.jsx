import React, { useState, useEffect } from 'react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const DeleteProductModal = ({ isOpen, onClose, product, onConfirm, loading }) => {
  const { styles } = useThemeStyles();
  const { t } = useI18n();
  const { info, success, error: toastError } = useToast();
  const [confirmText, setConfirmText] = useState('');
  const [messageMode, setMessageMode] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
      setMessageMode(false);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const disabled = loading || confirmText !== product.name;

  const handleConfirm = async () => {
    try {
      await onConfirm(product);
      success('Producto desactivado', 2500);
      setMessageMode(true);
    } catch (e) {
      toastError(e.message || 'Error al eliminar');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
      <div className={`w-full max-w-lg p-0 overflow-hidden rounded-lg shadow-2xl ${styles.card()} animate-in zoom-in-95`}> 
        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b">
          <div className="p-2.5 bg-destructive/15 text-destructive rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1 space-y-1">
            <h2 className="text-lg font-semibold leading-none tracking-tight">
              {t('products.delete_title')}
            </h2>
            <p className="text-sm text-muted-foreground">
              {`"${product.name}"`}
            </p>
          </div>
          <div className="p-2 rounded-md text-xs font-medium bg-muted/60 border border-border/50">
            ID: {product.id}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 text-sm">
          {!messageMode && (
            <p className="leading-relaxed">
              {t('products.delete_question', 'Esta acción hará un borrado lógico (estado = inactivo). Para continuar escribe el nombre del producto:')}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 text-xs bg-muted/30 p-3 rounded-md border">
            <div className="space-y-0.5">
              <span className="font-medium flex items-center gap-1"><Package className="w-3 h-3"/>Nombre</span>
              <div className="text-muted-foreground break-all">{product.name}</div>
            </div>
            <div className="space-y-0.5">
              <span className="font-medium">Estado actual</span>
              <div className="text-muted-foreground">{product.state ? 'Activo' : 'Inactivo'}</div>
            </div>
            <div className="space-y-0.5">
              <span className="font-medium">Categoría</span>
              <div className="text-muted-foreground">{product.category_name || product.category?.name || '-'}</div>
            </div>
            <div className="space-y-0.5">
              <span className="font-medium">Tipo</span>
              <div className="text-muted-foreground">{product.product_type || 'PHYSICAL'}</div>
            </div>
          </div>

          {!messageMode && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Escribe el nombre exacto para confirmar</label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={product.name}
                className="w-full px-3 py-2 rounded-md border bg-background text-sm focus:outline-none focus:ring focus:ring-primary/30"
              />
            </div>
          )}

          <div className="p-3 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs space-y-1">
            <p className="font-medium">Impacto</p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>El producto no aparecerá en listados generales.</li>
              <li>Los registros históricos (ventas/compras) no se pierden.</li>
              <li>Puedes reactivarlo editando y marcando estado Activo.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t bg-muted/30">
          <Button variant="outline" disabled={loading} onClick={onClose}>
            {t('products.cancel')}
          </Button>
          {!messageMode && (
            <Button variant="destructive" disabled={disabled} onClick={handleConfirm} className="gap-2">
              <Trash2 className="w-4 h-4" />
              {loading ? t('products.deleting') : t('products.delete_action')}
            </Button>
          )}
          {messageMode && (
            <Button variant="default" onClick={onClose} className="gap-2">
              Cerrar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeleteProductModal;
