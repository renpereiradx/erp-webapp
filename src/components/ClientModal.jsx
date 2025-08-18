import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from 'next-themes';
import { X, Save, User, Phone, MapPin, Loader, FileText } from 'lucide-react';
import useClientStore from '@/store/useClientStore';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';

const ClientModal = ({ isOpen, onClose, client, onSuccess }) => {
  const { theme } = useTheme();
  const { createClient, updateClient, loading } = useClientStore();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    address: '',
    contact: '',
    document_id: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (client) {
        setFormData({
          name: client.name || '',
          last_name: client.last_name || '',
          address: client.address || '',
          contact: client.contact || '',
          document_id: client.document_id || '',
        });
      } else {
        setFormData({ name: '', last_name: '', address: '', contact: '', document_id: '' });
      }
    }
  }, [client, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (client) {
        await updateClient(client.id, formData);
        success('Cliente actualizado con éxito');
      } else {
        await createClient(formData);
        success('Cliente creado con éxito');
      }
      onSuccess();
    } catch (err) {
      showError(err.message || 'Error al guardar el cliente');
    }
  };

  if (!isOpen) return null;

  const isNeoBrutalism = theme?.includes('neo-brutalism');
  const isMaterial = theme?.includes('material');

  const modalStyles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    },
    modal: {
      background: 'var(--card)',
      border: isNeoBrutalism ? '4px solid var(--border)' : '1px solid var(--border)',
      borderRadius: isNeoBrutalism ? '0px' : (isMaterial ? '16px' : '8px'),
      boxShadow: isNeoBrutalism ? '8px 8px 0px 0px rgba(0,0,0,1)' : '0px 4px 8px rgba(0, 0, 0, 0.1)',
      width: '100%',
      maxWidth: '500px',
      maxHeight: '90vh',
      overflow: 'auto'
    }
  };

  const modalContent = (
    <div style={modalStyles.overlay} onClick={onClose} data-testid="client-modal-overlay">
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()} data-testid="client-modal">
        <div style={{ padding: '24px', borderBottom: isNeoBrutalism ? '3px solid var(--border)' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <User className="w-6 h-6 text-primary" />
            <h2 style={{ fontSize: isNeoBrutalism ? '1.5rem' : '1.25rem', fontWeight: isNeoBrutalism ? '800' : '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none', margin: 0 }} data-testid="client-modal-title">
              {client ? 'Editar Cliente' : 'Nuevo Cliente'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="client-modal-close">
            <X className="h-6 w-6" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }} data-testid="client-modal-form">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <Label htmlFor="name" style={{ fontWeight: '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none', marginBottom: '8px', display: 'block' }}>Nombre</Label>
              <Input leftIcon={<User />} id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Juan" required data-testid="client-name-input" aria-required="true" />
            </div>
            <div>
              <Label htmlFor="last_name" style={{ fontWeight: '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none', marginBottom: '8px', display: 'block' }}>Apellido</Label>
              <Input leftIcon={<User />} id="last_name" name="last_name" value={formData.last_name} onChange={handleChange} placeholder="Ej: Pérez" data-testid="client-last-name-input" aria-required="false" />
            </div>
            <div>
              <Label htmlFor="document_id" style={{ fontWeight: '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none', marginBottom: '8px', display: 'block' }}>Documento</Label>
              <Input leftIcon={<FileText />} id="document_id" name="document_id" value={formData.document_id} onChange={handleChange} placeholder="Ej: 1234567-8" data-testid="client-document-input" aria-required="false" />
            </div>
            <div>
              <Label htmlFor="address" style={{ fontWeight: '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none', marginBottom: '8px', display: 'block' }}>Dirección</Label>
              <Input leftIcon={<MapPin />} id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Ej: Av. Siempre Viva 123" data-testid="client-address-input" aria-required="false" />
            </div>
            <div>
              <Label htmlFor="contact" style={{ fontWeight: '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none', marginBottom: '8px', display: 'block' }}>Contacto</Label>
              <Input leftIcon={<Phone />} id="contact" name="contact" value={formData.contact} onChange={handleChange} placeholder="Ej: 987-654-321 o juan.perez@example.com" data-testid="client-contact-input" aria-required="false" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '24px', borderTop: isNeoBrutalism ? '3px solid var(--border)' : '1px solid var(--border)' }} data-testid="client-modal-actions">
            <Button type="button" variant={isNeoBrutalism ? 'secondary' : 'outline'} onClick={onClose} disabled={loading} data-testid="client-modal-cancel">
              Cancelar
            </Button>
            <Button type="submit" variant="default" disabled={loading} className="min-w-[150px]" data-testid="client-modal-submit">
              {loading ? <Loader className="animate-spin" /> : <Save className="mr-2" />} 
              {client ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default ClientModal;