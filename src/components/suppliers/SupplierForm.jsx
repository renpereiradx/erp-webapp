import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '../ui/Input';
import { useI18n } from '../../lib/i18n';
import { useThemeStyles } from '../../hooks/useThemeStyles';

const SupplierForm = ({ formData, setFormData, handleSubmit, handleCancel, loading, isEditing }) => {
  const { t } = useI18n();
  const { styles } = useThemeStyles();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className={styles.label()}>{t('field.name', 'NOMBRE')}</label>
        <Input name="name" value={formData.name} onChange={handleChange} required className={`mt-1 ${styles.input()}`} />
      </div>
      <div>
        <label className={styles.label()}>{t('field.email', 'EMAIL')}</label>
        <Input name="email" type="email" value={formData.email} onChange={handleChange} className={`mt-1 ${styles.input()}`} />
      </div>
      <div>
        <label className={styles.label()}>{t('field.phone', 'TELÉFONO')}</label>
        <Input name="phone" value={formData.phone} onChange={handleChange} className={`mt-1 ${styles.input()}`} />
      </div>
      <div>
        <label className={styles.label()}>{t('field.tax_id', 'RFC')}</label>
        <Input name="tax_id" value={formData.tax_id} onChange={handleChange} className={`mt-1 ${styles.input()}`} />
      </div>
      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading} className={`w-full ${styles.button('primary')}`}>
          {loading ? t('action.saving', 'Guardando...') : (isEditing ? t('action.update', 'Actualizar') : t('action.create', 'Crear'))}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel} className={`w-full ${styles.button('secondary')}`}>
          {t('action.cancel', 'Cancelar')}
        </Button>
      </div>
    </form>
  );
};

export default SupplierForm;
