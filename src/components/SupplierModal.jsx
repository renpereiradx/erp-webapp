import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { X } from 'lucide-react';
import useSupplierStore from '@/store/useSupplierStore';
import { useToast } from '@/hooks/useToast';

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
  }, [supplier, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (supplier) {
        await updateSupplier(supplier.id, formData);
        success('Proveedor actualizado');
      } else {
        await createSupplier(formData);
        success('Proveedor creado');
      }
      onSuccess();
    } catch (err) {
      showError(err.message || 'Error al guardar proveedor');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-card p-6 rounded-lg w-full max-w-md border border-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{supplier ? 'Editar Proveedor' : 'Crear Proveedor'}</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Nombre" className="w-full p-2 bg-input border border-border rounded" required />
          <input type="text" name="contact" value={formData.contact} onChange={handleChange} placeholder="Contacto" className="w-full p-2 bg-input border border-border rounded" />
          <textarea name="address" value={formData.address} onChange={handleChange} placeholder="Dirección" className="w-full p-2 bg-input border border-border rounded"></textarea>
          <div className="flex items-center">
            <input type="checkbox" name="status" id="status-supplier" checked={formData.status} onChange={handleChange} className="h-4 w-4" />
            <label htmlFor="status-supplier" className="ml-2">Activo</label>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded bg-secondary text-secondary-foreground">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded bg-primary text-primary-foreground" disabled={loading}>{loading ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupplierModal;
