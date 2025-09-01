/**
 * Componente ClientSelector
 * Selector de clientes reutilizable con búsqueda y validación
 * Separado del componente principal para mejor mantenimiento
 */

import React, { useState, useMemo, useId } from 'react';
import { Search, User, Users } from 'lucide-react';
import { MOCK_CLIENTS } from '../constants/mockData';
import { useThemeStyles } from '@/hooks/useThemeStyles';

const ClientSelector = ({ 
  selectedClient, 
  onClientChange, 
  theme, // deprecado: se ignora a favor de contexto
  placeholder = 'Seleccionar cliente...',
  showSearch = true,
  className = '',
  'data-testid': dataTestId = 'client-selector',
  ...props
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

  const { styles: themeStyles, isMaterial, isFluent, isNeoBrutalism } = useThemeStyles();
  const styles = {
    container: 'space-y-3',
    label: themeStyles.label(),
    selectContainer: 'relative',
    searchContainer: 'relative mb-2',
    searchIcon: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground',
    // Inputs adaptativos: outlined (Material), subtle (Fluent), fallback base (brutalism mantiene legacy)
    searchInput: isMaterial
      ? themeStyles.input('outlined', { density: 'compact', extra: 'pl-10 w-full' })
      : isFluent
        ? themeStyles.input('subtle', { density: 'compact', extra: 'pl-10 w-full' })
        : 'w-full px-3 py-2 pl-10 border-2 border-black rounded-lg focus:border-blue-500 focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    select: isMaterial
      ? themeStyles.input('outlined', { density: 'compact', extra: 'w-full' })
      : isFluent
        ? themeStyles.input('subtle', { density: 'compact', extra: 'w-full' })
        : 'w-full px-3 py-2 border-2 border-black rounded-lg focus:border-blue-500 focus:outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    clientInfo: isMaterial
      ? themeStyles.card('tonal', { density: 'compact', extra: 'mt-2 p-3 rounded-lg' })
      : isFluent
        ? themeStyles.card('subdued', { density: 'compact', extra: 'mt-2 p-3 rounded-lg' })
        : 'mt-2 p-3 rounded-lg border-2 border-black bg-yellow-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]',
    clientName: 'font-medium',
    clientDetails: 'text-sm text-muted-foreground mt-1'
  };
  const generatedId = useId();
  const searchId = `client-search-${generatedId}`;
  const selectId = `client-select-${generatedId}`;

  return (
    <div className={`${styles.container} ${className}`} data-testid={dataTestId}>
  <label className={styles.label + ' block mb-2'} htmlFor={selectId} data-testid="client-label">
        <Users className="inline w-4 h-4 mr-2" />
        Cliente
      </label>

      {showSearch && (
        <div className={styles.searchContainer}>
          <div className="relative">
            <Search className={`${styles.searchIcon} w-4 h-4`} />
            <input
              id={searchId}
              type="text"
              placeholder="Buscar cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              data-testid="client-search-input"
              aria-label="Buscar cliente"
            />
          </div>
        </div>
      )}

      <div className={styles.selectContainer}>
  <select
          id={selectId}
          value={selectedClient}
          onChange={(e) => onClientChange(e.target.value)}
          className={styles.select}
          data-testid="client-select"
          aria-label="Selector de cliente"
        >
          <option value="">{placeholder}</option>
          {filteredClients.map((client) => (
            <option key={client.id} value={client.id} data-testid={`client-option-${client.id}`}>
              {client.name} - {client.phone}
            </option>
          ))}
        </select>
      </div>

      {selectedClientData && (
        <div className={styles.clientInfo} data-testid="client-info">
          <div className={styles.clientName} data-testid="client-name">
            <User className="inline w-4 h-4 mr-2" />
            {selectedClientData.name}
          </div>
          <div className={styles.clientDetails} data-testid="client-details">
            <div>📧 {selectedClientData.email}</div>
            <div>📞 {selectedClientData.phone}</div>
          </div>
        </div>
      )}

      {searchTerm && filteredClients.length === 0 && (
        <div className="text-center py-4 text-gray-500" data-testid="client-search-no-results">
          No se encontraron clientes que coincidan con "{searchTerm}"
        </div>
      )}
    </div>
  );
};

export default ClientSelector;
