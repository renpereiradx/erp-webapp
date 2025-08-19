import React from 'react';
import { useTheme } from 'next-themes';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useI18n } from '@/lib/i18n';

const DeleteSupplierModal = ({ isOpen, onClose, supplier, onConfirm, loading }) => {
  const { t } = useI18n();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-card p-6 rounded-lg w-full max-w-md text-center border border-border">
        <div className="flex justify-center mb-4">
            <AlertTriangle className="w-16 h-16 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold mb-4">{t('suppliers.delete_title')}</h2>
        <p className="mb-6">{t('suppliers.delete_subtitle')} "{supplier?.name}".</p>
        <div className="flex justify-center space-x-4">
          <Button onClick={onClose} variant="secondary" disabled={loading}>{t('suppliers.cancel')}</Button>
          <Button onClick={() => onConfirm(supplier)} variant="destructive" disabled={loading}>
            {loading ? t('suppliers.deleting') : t('suppliers.delete_confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSupplierModal;