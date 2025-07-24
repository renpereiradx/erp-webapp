
import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { X } from 'lucide-react';
import useClientStore from '@/store/useClientStore';
import { useToast } from '@/hooks/useToast';

const ClientModal = ({ isOpen, onClose, client, onSuccess }) => {
  const { theme } = useTheme();
  const { createClient, updateClient, loading } = useClientStore();
  const { success, error: showError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    last_name: '',
    document_id: '',
    contact: '',
    status: true,
  });

  const isNeoBrutalism = theme.includes('neo-brutalism');

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || '',
        last_name: client.last_name || '',
        document_id: client.document_id || '',
        contact: client.contact || '',
        status: client.status !== undefined ? client.status : true,
      });
    } else {
      setFormData({
        name: '',
        last_name: '',
        document_id: '',
        contact: '',
        status: true,
      });
    }
  }, [client, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (client) {
        await updateClient(client.id, formData);
        success('Cliente actualizado exitosamente');
      } else {
        await createClient(formData);
        success('Cliente creado exitosamente');
      }
      onSuccess();
    } catch (err) {
      showError(err.message || 'Error al guardar el cliente');
    }
  };

  if (!isOpen) return null;

  const getModalStyles = () => {
    if (isNeoBrutalism) return {
        background: 'var(--background)',
        border: '4px solid var(--border)',
        boxShadow: '8px 8px 0px 0px rgba(0,0,0,1)',
    };
    return {
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    };
  };

  const getInputStyles = () => {
    if (isNeoBrutalism) return {
        border: '3px solid var(--border)',
        borderRadius: '0px',
        background: 'var(--background)',
    };
    return {
        border: '1px solid var(--border)',
        borderRadius: '4px',
        background: 'var(--input)',
    };
  };

  const getButtonStyles = (variant = 'primary') => {
    if (isNeoBrutalism) return {
        primary: {
            background: 'var(--brutalist-lime)',
            color: '#000',
            border: '3px solid var(--border)',
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        },
        secondary: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '3px solid var(--border)',
            boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
        }
    }[variant];
    return {
        primary: { background: 'var(--primary)', color: 'var(--primary-foreground)' },
        secondary: { background: 'var(--secondary)', color: 'var(--secondary-foreground)' }
    }[variant];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div style={getModalStyles()} className="p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">{client ? 'Editar Cliente' : 'Crear Cliente'}</h2>
          <button onClick={onClose}><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              style={getInputStyles()}
              className="w-full p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium mb-1">Apellido</label>
            <input
              type="text"
              name="last_name"
              id="last_name"
              value={formData.last_name}
              onChange={handleChange}
              style={getInputStyles()}
              className="w-full p-2"
              required
            />
          </div>
          <div>
            <label htmlFor="document_id" className="block text-sm font-medium mb-1">Documento</label>
            <input
              type="text"
              name="document_id"
              id="document_id"
              value={formData.document_id}
              onChange={handleChange}
              style={getInputStyles()}
              className="w-full p-2"
            />
          </div>
          <div>
            <label htmlFor="contact" className="block text-sm font-medium mb-1">Contacto</label>
            <input
              type="text"
              name="contact"
              id="contact"
              value={formData.contact}
              onChange={handleChange}
              style={getInputStyles()}
              className="w-full p-2"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="status"
              id="status"
              checked={formData.status}
              onChange={handleChange}
              className="h-4 w-4"
            />
            <label htmlFor="status" className="ml-2 block text-sm">Activo</label>
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} style={getButtonStyles('secondary')} className="px-4 py-2 rounded">
              Cancelar
            </button>
            <button type="submit" style={getButtonStyles('primary')} className="px-4 py-2 rounded" disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;
