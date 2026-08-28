import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '../ui/Input';
import { useI18n } from '../../lib/i18n';


const ClientForm = ({ formData, setFormData, handleSubmit, handleCancel, loading, isEditing }) => {
  const { t } = useI18n();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground">{t('field.name', 'NOMBRE')}</label>
        <Input name="name" value={formData.name} onChange={handleChange} required className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">{t('field.email', 'EMAIL')}</label>
        <Input name="email" type="email" value={formData.email} onChange={handleChange} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">{t('field.phone', 'TELÉFONO')}</label>
        <Input name="phone" value={formData.phone} onChange={handleChange} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
      </div>

      <div>
        <label className="text-sm font-medium text-foreground">{t('field.tax_id', 'RFC')}</label>
        <Input name="tax_id" value={formData.tax_id} onChange={handleChange} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
      </div>
      
      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={loading} variant="primary" className="w-full">
          {loading ? t('action.saving', 'Guardando...') : (isEditing ? t('action.update', 'Actualizar') : t('action.create', 'Crear'))}
        </Button>
        <Button type="button" variant="secondary" onClick={handleCancel} className="w-full">
          {t('action.cancel', 'Cancelar')}
        </Button>
      </div>
    </form>
  );
};

export default ClientForm;
