import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { X, Save, User, Phone, MapPin, ToggleLeft, ToggleRight, Loader, Building } from 'lucide-react';
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
    contact: '',
    address: '',
    status: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        setFormData({
          name: supplier.name || '',
          contact: supplier.contact || '',
          address: supplier.address || '',
          status: supplier.status !== undefined ? supplier.status : true,
        });
      } else {
        setFormData({ name: '', contact: '', address: '', status: true });
      }
    }
  }, [supplier, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusToggle = () => {
    setFormData(prev => ({ ...prev, status: !prev.status }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (supplier) {
        await updateSupplier(supplier.id, formData);
        success('Proveedor actualizado con éxito');
      } else {
        await createSupplier(formData);
        success('Proveedor creado con éxito');
      }
      onSuccess();
    } catch (err) {
      showError(err.message || 'Error al guardar el proveedor');
    }
  };

  if (!isOpen) return null;

  const isNeoBrutalism = theme?.includes('neo-brutalism');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`bg-card text-foreground p-6 w-full max-w-md transition-all duration-300 ease-in-out transform scale-95 opacity-0 animate-scale-in ${isNeoBrutalism ? 'border-4 border-black shadow-neo-brutal-dialog' : 'rounded-2xl shadow-2xl'}`}>
        
        <div className={`flex justify-between items-center pb-4 mb-6 ${isNeoBrutalism ? 'border-b-4 border-black' : 'border-b'}`}>
            <div className="flex items-center gap-4">
                <Building className="h-8 w-8 text-primary"/>
                <h2 className={`text-2xl font-bold ${isNeoBrutalism ? 'uppercase' : ''}`}>{supplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h2>
            </div>
          <Button variant="ghost" size="icon" onClick={onClose} className={`rounded-full ${isNeoBrutalism ? 'border-2 border-black' : ''}`}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={`${isNeoBrutalism ? 'font-bold uppercase' : ''}`}>Nombre del Proveedor</Label>
              <Input leftIcon={<User />} id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Tech Supplies Inc." required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contact" className={`${isNeoBrutalism ? 'font-bold uppercase' : ''}`}>Información de Contacto</Label>
              <Input leftIcon={<Phone />} id="contact" name="contact" value={formData.contact} onChange={handleChange} placeholder="Ej: 123-456-7890 o email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className={`${isNeoBrutalism ? 'font-bold uppercase' : ''}`}>Dirección</Label>
              <Input leftIcon={<MapPin />} id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Ej: 123 Main St, Anytown, USA" />
            </div>

          <div className={`flex items-center justify-between p-3 rounded-lg ${isNeoBrutalism ? 'border-2 border-black' : 'bg-muted'}`}>
            <Label htmlFor="status" className={`font-bold ${isNeoBrutalism ? 'uppercase' : ''}`}>Estado</Label>
            <Button type="button" variant={'ghost'} onClick={handleStatusToggle} className={`flex items-center gap-2 rounded-full p-2 ${formData.status ? 'text-green-500' : 'text-red-500'}`}>
                {formData.status ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                <span className="font-bold">{formData.status ? 'Activo' : 'Inactivo'}</span>
            </Button>
          </div>

          <div className={`flex justify-end space-x-4 pt-6 ${isNeoBrutalism ? 'border-t-4 border-black' : 'border-t'}`}>
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
};

export default SupplierModal;
