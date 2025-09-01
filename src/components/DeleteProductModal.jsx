import React from 'react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Trash2 } from 'lucide-react';

const DeleteProductModal = ({ isOpen, onClose, product, onConfirm, loading }) => {
  const { styles } = useThemeStyles();
  const { t } = useI18n();

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
      <div className={`w-full max-w-md p-6 ${styles.card()}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-destructive/10 text-destructive rounded-full">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h2 className={styles.header('h2')}>{t('products.delete_title')}</h2>
            <p className={styles.body()}>
              {t('products.delete_question', `¿Estás seguro que deseas eliminar "${product.name}"? Esta acción no se puede deshacer.`)}
            </p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-muted/50 border border-border/50 rounded-md text-sm space-y-1">
            <p className={styles.label()}>{t('products.info_title', 'Información importante')}</p>
            <ul className="list-disc list-inside text-muted-foreground text-xs">
                <li>{t('products.delete_hint.soft', 'El producto será marcado como inactivo (soft delete).')}</li>
                <li>{t('products.delete_hint.reactivate', 'Podrás reactivarlo más tarde.')}</li>
            </ul>
        </div>

        <div className="flex gap-4 pt-6 mt-6 border-t border-border">
          <Button onClick={onClose} disabled={loading} variant="secondary" className="w-full">
            {t('products.cancel')}
          </Button>
          <Button onClick={() => onConfirm(product)} disabled={loading} variant="destructive" className="w-full">
            {loading ? t('products.deleting') : <><Trash2 className="w-4 h-4 mr-2" />{t('products.delete_action')}</>}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteProductModal;