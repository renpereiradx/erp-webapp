/**
 * Componente ClientSelector
 * Selector de clientes reutilizable con búsqueda y validación
 * Separado del componente principal para mejor mantenimiento
 */

import React, { useState, useMemo } from 'react';
import { Search, User, Users } from 'lucide-react';
import { MOCK_CLIENTS } from '../constants/mockData';

const ClientSelector = ({ 
  selectedClient, 
  onClientChange, 
  theme = 'neo-brutalism',
  placeholder = 'Seleccionar cliente...',
  showSearch = true,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar clientes basado en la búsqueda
  const filteredClients = useMemo(() => {
    if (!searchTerm) return MOCK_CLIENTS;
    
    const term = searchTerm.toLowerCase();
    return MOCK_CLIENTS.filter(client =>
      client.name.toLowerCase().includes(term) ||
      client.email.toLowerCase().includes(term) ||
      client.phone.includes(term)
    );
  }, [searchTerm]);

  // Obtener cliente seleccionado
  const selectedClientData = useMemo(() => {
    return MOCK_CLIENTS.find(client => client.id === selectedClient);
  }, [selectedClient]);

  // Estilos por tema
  const getThemeStyles = () => {
    const baseStyles = {
      container: 'space-y-3',
      label: 'block text-sm font-medium mb-2',
      selectContainer: 'relative',
      select: 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2',
      searchContainer: 'relative mb-2',
      searchInput: 'w-full px-3 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2',
      searchIcon: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400',
      clientInfo: 'mt-2 p-3 rounded-lg border',
      clientName: 'font-medium',
      clientDetails: 'text-sm text-gray-600 mt-1'
    };

    switch (theme) {
      case 'material':
        return {
          ...baseStyles,
          select: `${baseStyles.select} border-gray-300 focus:border-blue-500 focus:ring-blue-500`,
          searchInput: `${baseStyles.searchInput} border-gray-300 focus:border-blue-500 focus:ring-blue-500`,
          clientInfo: `${baseStyles.clientInfo} bg-blue-50 border-blue-200`
        };
      
      case 'fluent':
        return {
          ...baseStyles,
          select: `${baseStyles.select} border-gray-200 focus:border-blue-600 focus:ring-blue-600 shadow-sm`,
          searchInput: `${baseStyles.searchInput} border-gray-200 focus:border-blue-600 focus:ring-blue-600 shadow-sm`,
          clientInfo: `${baseStyles.clientInfo} bg-gray-50 border-gray-200`
        };
      
      default: // neo-brutalism
        return {
          ...baseStyles,
          select: `${baseStyles.select} border-2 border-black focus:border-blue-500 focus:ring-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`,
          searchInput: `${baseStyles.searchInput} border-2 border-black focus:border-blue-500 focus:ring-blue-500 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`,
          clientInfo: `${baseStyles.clientInfo} bg-yellow-50 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`
        };
    }
  };

  const styles = getThemeStyles();

  return (
    <div className={`${styles.container} ${className}`}>
      <label className={styles.label}>
        <Users className="inline w-4 h-4 mr-2" />
        Cliente
      </label>

      {showSearch && (
        <div className={styles.searchContainer}>
          <div className="relative">
            <Search className={`${styles.searchIcon} w-4 h-4`} />
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>
      )}

      <div className={styles.selectContainer}>
        <select
          value={selectedClient}
          onChange={(e) => onClientChange(e.target.value)}
          className={styles.select}
        >
          <option value="">{placeholder}</option>
          {filteredClients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name} - {client.phone}
            </option>
          ))}
        </select>
      </div>

      {selectedClientData && (
        <div className={styles.clientInfo}>
          <div className={styles.clientName}>
            <User className="inline w-4 h-4 mr-2" />
            {selectedClientData.name}
          </div>
          <div className={styles.clientDetails}>
            <div>📧 {selectedClientData.email}</div>
            <div>📞 {selectedClientData.phone}</div>
          </div>
        </div>
      )}

      {searchTerm && filteredClients.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          No se encontraron clientes que coincidan con "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default ClientSelector;
