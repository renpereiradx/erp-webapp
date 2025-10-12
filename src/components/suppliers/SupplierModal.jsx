import React, { useState, useEffect } from 'react';
import { X, Save, Building2, AlertCircle, FileText, Phone, Mail, MapPin, MessageSquare } from 'lucide-react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import useSupplierStore from '@/store/useSupplierStore';

/*
  Supplier API (docs):
  POST /supplier/ -> { name, contact_info, tax_id }
  PUT /supplier/{id} -> mismos campos
  status se controla vía endpoint delete para inactivar; no se actualiza directamente.
*/

const SupplierModal = ({ isOpen, onClose, supplier, onSuccess }) => {
  const { styles } = useThemeStyles();
  const { t } = useI18n();
  const { createSupplier, updateSupplier } = useSupplierStore();

  const isEditing = !!supplier;

  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    email: '',
    phone: '',
    address: '',
    fax: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      const contactInfo = supplier.contact_info || {};
      setFormData({
        name: supplier.name || '',
        tax_id: supplier.tax_id || '',
        email: contactInfo.email || '',
        phone: contactInfo.phone || '',
        address: contactInfo.address || '',
        fax: contactInfo.fax || ''
      });
    } else {
      setFormData({ name: '', tax_id: '', email: '', phone: '', address: '', fax: '' });
    }
  }, [isEditing, supplier]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;
    setError('');

    try {
      if (!formData.name.trim()) throw new Error('El nombre es requerido');

      setLoading(true);

      const payload = {
        name: formData.name.trim(),
        tax_id: formData.tax_id.trim() || undefined,
        contact_info: {
          email: formData.email.trim() || undefined,
          phone: formData.phone.trim() || undefined,
          address: formData.address.trim() || undefined,
          fax: formData.fax.trim() || undefined
        }
      };

      // Remove undefined fields to match API expectations
      if (!payload.tax_id) {
        delete payload.tax_id;
      }
      
      // Clean empty contact_info fields
      Object.keys(payload.contact_info).forEach(key => {
        if (!payload.contact_info[key]) {
          delete payload.contact_info[key];
        }
      });

      let result;
      if (isEditing && supplier.id) {
        result = await updateSupplier(supplier.id, payload);
      } else {
        result = await createSupplier(payload);
      }

      if (!result?.success) {
        throw new Error(result?.error || 'Operación no confirmada');
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`w-full max-w-lg max-h-[75vh] flex flex-col ${styles.card()} shadow-2xl animate-in slide-in-from-bottom-4 duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className={`${styles.header('h2')} text-lg font-bold`}>
              {isEditing ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
            {isEditing && (
              <Badge variant={supplier.status ? 'default' : 'secondary'} className="text-xs">
                {supplier.status ? 'Activo' : 'Inactivo'}
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Content */}
        <ScrollArea className="flex-1 p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label className={`${styles.label()} block text-sm font-medium mb-1`}>Nombre del Proveedor *</label>
                <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Ej: Tech Supplies Inc." className={styles.input()} />
              </div>
              <div>
                <label className={`${styles.label()} block text-sm font-medium mb-1`}>RUC/Tax ID</label>
                <Input name="tax_id" value={formData.tax_id} onChange={handleChange} placeholder="Ej: 12345678-9" className={styles.input()} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`${styles.label()} block text-sm font-medium mb-1`}>Email</label>
                  <Input name="email" value={formData.email} onChange={handleChange} type="email" placeholder="email@dominio.com" className={styles.input()} />
                </div>
                <div>
                  <label className={`${styles.label()} block text-sm font-medium mb-1`}>Teléfono</label>
                  <Input name="phone" value={formData.phone} onChange={handleChange} placeholder="Ej: +595..." className={styles.input()} />
                </div>
              </div>
              <div>
                <label className={`${styles.label()} block text-sm font-medium mb-1`}>Dirección</label>
                <Input name="address" value={formData.address} onChange={handleChange} placeholder="Ej: Av. Mcal. López 1234, Asunción" className={styles.input()} />
              </div>
              <div>
                <label className={`${styles.label()} block text-sm font-medium mb-1`}>Fax</label>
                <Input name="fax" value={formData.fax} onChange={handleChange} placeholder="Ej: FAX-PAR-6356" className={styles.input()} />
              </div>
              {isEditing && (
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  <div className="flex gap-4">
                    <span>ID: {supplier.id}</span>
                    {supplier.user_id && <span>Usuario: {supplier.user_id}</span>}
                  </div>
                </div>
              )}
            </div>
          </form>
        </ScrollArea>
        
        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t bg-muted/20">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button type="submit" variant="default" disabled={loading} onClick={handleSubmit} className="flex items-center gap-2">
            {loading ? (
              <>
                <AlertCircle className="h-4 w-4 animate-spin" /> Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" /> {isEditing ? 'Actualizar' : 'Crear'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SupplierModal;
