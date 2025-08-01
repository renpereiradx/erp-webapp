import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useTheme } from 'next-themes';
import { X, Save, User, Phone, MapPin, ToggleLeft, ToggleRight, Loader, Building, FileText, MessageSquare } from 'lucide-react';
import useSupplierStore from '@/store/useSupplierStore';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';

const SupplierModal = ({ isOpen, onClose, supplier, onSuccess }) => {
  const { theme } = useTheme();
  const { createSupplier, updateSupplier, loading } = useSupplierStore();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    tax_id: '',
    contact_info: {
      phone: '',
      fax: '',
      address: ''
    },
    status: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        const contactInfo = supplier.contact_info ? (typeof supplier.contact_info === 'object' ? supplier.contact_info : JSON.parse(supplier.contact_info)) : {};
        setFormData({
          name: supplier.name || '',
          tax_id: supplier.tax_id || '',
          contact_info: {
            phone: contactInfo.phone || '',
            fax: contactInfo.fax || '',
            address: contactInfo.address || ''
          },
          status: supplier.status !== undefined ? supplier.status : true,
        });
      } else {
        setFormData({
          name: '',
          tax_id: '',
          contact_info: {
            phone: '',
            fax: '',
            address: ''
          },
          status: true
        });
      }
    }
  }, [supplier, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      contact_info: {
        ...prev.contact_info,
        [name]: value,
      },
    }));
  };

  const handleStatusToggle = () => {
    setFormData(prev => ({ ...prev, status: !prev.status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSend = {
        ...formData,
        contact_info: formData.contact_info
      };

      if (supplier) {
        await updateSupplier(supplier.id, dataToSend);
        success('Proveedor actualizado con éxito');
      } else {
        await createSupplier(dataToSend);
        success('Proveedor creado con éxito');
      }
      onSuccess();
    } catch (err) {
      showError(err.message || 'Error al guardar el proveedor');
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
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={modalStyles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '24px', borderBottom: isNeoBrutalism ? '3px solid var(--border)' : '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Building className="w-6 h-6 text-primary" />
            <h2 style={{ fontSize: isNeoBrutalism ? '1.5rem' : '1.25rem', fontWeight: isNeoBrutalism ? '800' : '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none', margin: 0 }}>
              {supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <Label htmlFor="name" style={{ fontWeight: '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none', marginBottom: '8px', display: 'block' }}>Nombre del Proveedor</Label>
              <Input leftIcon={<User />} id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Tech Supplies Inc." required />
            </div>
            <div>
              <Label htmlFor="tax_id" style={{ fontWeight: '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none', marginBottom: '8px', display: 'block' }}>RUC</Label>
              <Input leftIcon={<FileText />} id="tax_id" name="tax_id" value={formData.tax_id} onChange={handleChange} placeholder="Ej: 12345678-9" />
            </div>
            <div>
              <Label htmlFor="phone" style={{ fontWeight: '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none', marginBottom: '8px', display: 'block' }}>Teléfono</Label>
              <Input leftIcon={<Phone />} id="phone" name="phone" value={formData.contact_info.phone} onChange={handleContactInfoChange} placeholder="Ej: +595 983 111 222" />
            </div>
            <div>
              <Label htmlFor="fax" style={{ fontWeight: '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none', marginBottom: '8px', display: 'block' }}>Fax</Label>
              <Input leftIcon={<MessageSquare />} id="fax" name="fax" value={formData.contact_info.fax} onChange={handleContactInfoChange} placeholder="Ej: FAX-PAR-6356" />
            </div>
            <div>
              <Label htmlFor="address" style={{ fontWeight: '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none', marginBottom: '8px', display: 'block' }}>Dirección</Label>
              <Input leftIcon={<MapPin />} id="address" name="address" value={formData.contact_info.address} onChange={handleContactInfoChange} placeholder="Ej: Av. Mcal. López 1234, Asunción, Paraguay" />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: isNeoBrutalism ? '0px' : '8px', border: isNeoBrutalism ? '2px solid var(--border)' : '1px solid var(--border)', background: 'var(--muted)' }}>
              <Label htmlFor="status" style={{ fontWeight: '600', textTransform: isNeoBrutalism ? 'uppercase' : 'none' }}>Estado</Label>
              <Button type="button" variant={'ghost'} onClick={handleStatusToggle} style={{ color: formData.status ? 'var(--success)' : 'var(--destructive)' }}>
                  {formData.status ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  <span style={{ fontWeight: 'bold' }}>{formData.status ? 'Activo' : 'Inactivo'}</span>
              </Button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px', paddingTop: '24px', borderTop: isNeoBrutalism ? '3px solid var(--border)' : '1px solid var(--border)' }}>
            <Button type="button" variant={isNeoBrutalism ? 'secondary' : 'outline'} onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="default" disabled={loading} className="min-w-[150px]">
              {loading ? <Loader className="animate-spin" /> : <Save className="mr-2" />} 
              {supplier ? 'Guardar Cambios' : 'Crear'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default SupplierModal;