import React, { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { X, User, FileText, Phone } from 'lucide-react';
import useClientStore from '@/store/useClientStore';
import { useToast } from '@/hooks/useToast';
import { Input } from '@/components/ui/Input'; // Usando el componente Input del proyecto
import { Switch } from '@/components/ui/switch'; // Usando el componente Switch

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
    if (isOpen) {
      if (client) {
        setFormData({
          name: client.name || '',
          last_name: client.last_name || '',
          document_id: client.document_id || '',
          contact: client.contact || '',
          status: client.status !== undefined ? client.status : true,
        });
      } else {
        setFormData({ name: '', last_name: '', document_id: '', contact: '', status: true });
      }
    }
  }, [client, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleStatusChange = (checked) => {
    setFormData((prev) => ({ ...prev, status: checked }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (client) {
        await updateClient(client.id, formData);
      } else {
        await createClient(formData);
      }
      onSuccess();
    } catch (err) {
      showError(err.message || 'Error al guardar el cliente');
    }
  };

  if (!isOpen) return null;

  // Estilos (simplificados para claridad, se asume que los estilos de tema se aplican)
  const modalStyles = { /* ... */ };
  const getButtonStyles = (variant) => { /* ... */ };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
      <div
        className={`p-6 rounded-lg w-full max-w-lg bg-card text-foreground ${isNeoBrutalism ? 'border-4 border-border shadow-neo-brutal' : 'border shadow-xl'}`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-2xl ${isNeoBrutalism ? 'font-black uppercase' : 'font-bold'}`}>
            {client ? 'Editar Cliente' : 'Crear Nuevo Cliente'}
          </h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Layout en Grid para campos principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre"
              name="name"
              value={formData.name}
              onChange={handleChange}
              leftIcon={<User size={18} />}
              required
            />
            <Input
              label="Apellido"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              leftIcon={<User size={18} />}
            />
          </div>
          <Input
            label="Documento de Identidad"
            name="document_id"
            value={formData.document_id}
            onChange={handleChange}
            leftIcon={<FileText size={18} />}
          />
          <Input
            label="Email o Teléfono de Contacto"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            leftIcon={<Phone size={18} />}
          />
          
          {/* Switch para el estado */}
          <div className="flex items-center justify-between pt-2">
            <label htmlFor="status" className={`font-medium ${isNeoBrutalism ? 'uppercase font-bold' : ''}`}>
              Estado del Cliente
            </label>
            <div className="flex items-center space-x-2">
                <span className={`text-sm ${!formData.status ? 'text-foreground' : 'text-muted-foreground'}`}>{isNeoBrutalism ? 'INACTIVO' : 'Inactivo'}</span>
                <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={handleStatusChange}
                />
                <span className={`text-sm ${formData.status ? 'text-foreground' : 'text-muted-foreground'}`}>{isNeoBrutalism ? 'ACTIVO' : 'Activo'}</span>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={onClose} className={`px-4 py-2 rounded ${isNeoBrutalism ? 'font-bold uppercase border-3 border-border shadow-neo-brutal-small' : 'bg-secondary text-secondary-foreground'}`}>
              Cancelar
            </button>
            <button type="submit" className={`px-4 py-2 rounded ${isNeoBrutalism ? 'font-bold uppercase bg-brutalist-lime text-black border-3 border-border shadow-neo-brutal-small' : 'bg-primary text-primary-foreground'}`} disabled={loading}>
              {loading ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ClientModal;