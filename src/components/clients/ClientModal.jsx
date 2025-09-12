import React, { useState, useEffect } from 'react';
import { X, Save, User, AlertCircle, IdCard } from 'lucide-react';
import { useThemeStyles } from '@/hooks/useThemeStyles';
import { useI18n } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import useClientStore from '@/store/useClientStore';

/*
  Cliente API (docs):
  POST /client -> { name, last_name, document_id, contact }
  PUT /client/{id} -> mismos campos
  status se controla vía endpoint delete para inactivar; no se actualiza directamente.
*/

const ClientModal = ({ isOpen, onClose, client, onSuccess, container = null }) => {
  const { styles, isNeoBrutalism } = useThemeStyles();
  const { t } = useI18n();
  const { createClient, updateClient } = useClientStore();

  const isEditing = !!client;

  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    document_id: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: client.name?.split(' ')[0] || client.name || '',
        last_name: client.last_name || (client.name?.includes(' ') ? client.name.split(' ').slice(1).join(' ') : ''),
        document_id: client.document_id || '',
        email: client.contact?.email || '',
        phone: client.contact?.phone || ''
      });
    } else {
      setFormData({ name: '', last_name: '', document_id: '', email: '', phone: '' });
    }
  }, [isEditing, client]);

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
      if (!formData.last_name.trim()) throw new Error('El apellido es requerido');
      if (!formData.document_id.trim()) throw new Error('El CI es requerido');

      setLoading(true);

      // Compactar contacto a string (preferencia email, fallback phone)
      let contact = '';
      if (formData.email.trim()) contact = formData.email.trim();
      else if (formData.phone.trim()) contact = formData.phone.trim();

      const payload = {
        name: formData.name.trim(),
        last_name: formData.last_name.trim(),
        document_id: formData.document_id.trim(),
        contact: contact || undefined
      };

      // Remove undefined fields to match API expectations
      if (!payload.contact) {
        delete payload.contact;
      }

      let result;
      if (isEditing && client.id) {
        result = await updateClient(client.id, payload);
      } else {
        result = await createClient(payload);
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

  if (!isOpen) return null;

  // Usar fondo sólido según el tema
  const overlayStyle = {
    backgroundColor: isNeoBrutalism ? '#000000' : '#1a1a1a', // Fondo completamente sólido
    backdropFilter: 'blur(4px)'
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={overlayStyle}
    >
      <div className={`w-full max-w-2xl max-h-[85vh] flex flex-col ${styles.card()} shadow-2xl animate-in slide-in-from-bottom-4 duration-300`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <h2 className={`${styles.header('h2')} text-lg font-bold`}>
              {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
            {isEditing && (
              <Badge variant={client.status ? 'default' : 'secondary'} className="text-xs">
                {client.status ? 'Activo' : 'Inactivo'}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`${styles.label()} block text-sm font-medium mb-1`}>Nombre *</label>
                  <Input name="name" value={formData.name} onChange={handleChange} required placeholder="Nombre" className={styles.input()} />
                </div>
                <div>
                  <label className={`${styles.label()} block text-sm font-medium mb-1`}>Apellido *</label>
                  <Input name="last_name" value={formData.last_name} onChange={handleChange} required placeholder="Apellido" className={styles.input()} />
                </div>
              </div>
              <div>
                <label className={`${styles.label()} block text-sm font-medium mb-1`}>Documento (CI) *</label>
                <Input name="document_id" value={formData.document_id} onChange={handleChange} required placeholder="Ej: 1234567" className={styles.input()} />
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
              {isEditing && (
                <div className="pt-2 border-t text-xs text-muted-foreground">
                  <div className="flex gap-4">
                    <span>ID: {client.id}</span>
                    {client.user_id && <span>Usuario: {client.user_id}</span>}
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

export default ClientModal;
