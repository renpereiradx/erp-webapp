/**
 * Componente SupplierSelector
 * Selector de proveedores reutilizable con búsqueda y validación
 * Integra con useSupplierLogic para manejo de estado
 * Reutilizable en compras, reportes, etc.
 */

import React, { useState, useEffect, useId } from 'react';
import { Search, Building, User, Phone, Mail } from 'lucide-react';
import { useSupplierLogic } from '../hooks/useSupplierLogic';
// useThemeStyles removido para MVP - sin hooks problemáticos
import StatusBadge from '@/components/ui/StatusBadge';

const SupplierSelector = ({ 
  selectedSupplier, 
  onSupplierChange, 
  theme = 'neo-brutalism',
  placeholder = 'Seleccionar proveedor...',
  showSearch = true,
  showDetails = true,
  onlyActive = true,
  required = false,
  className = '',
  error = null
}) => {
  // Para MVP - estilos fijos sin hooks problemáticos
  const themeStyles = { styles: { input: () => 'input-class', card: (classes = '') => `card-class ${classes}`, label: () => 'label-class' } };
  const styles = themeStyles.styles || themeStyles;
  const supplierLogic = useSupplierLogic();
  
  const [localSearch, setLocalSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Destructuring del hook de proveedores
  const {
    filteredSuppliers,
    activeSuppliers,
    loading,
    error: supplierError,
    searchSuppliers,
    getSelectedSupplierInfo,
    isSupplierActive
  } = supplierLogic;

  // Usar solo proveedores activos si se especifica
  const availableSuppliers = onlyActive ? activeSuppliers : filteredSuppliers;

  // Buscar con debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      if (localSearch.trim()) {
        searchSuppliers(localSearch);
      }
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [localSearch, searchSuppliers]);

  // Obtener información del proveedor seleccionado
  const selectedSupplierInfo = getSelectedSupplierInfo();

  // Manejar selección de proveedor
  const handleSupplierSelect = (supplier) => {
    onSupplierChange(supplier);
    setIsOpen(false);
    setLocalSearch('');
  };

  // Manejar búsqueda local
  const handleSearchChange = (e) => {
    setLocalSearch(e.target.value);
    setIsOpen(true);
  };

  // Filtrar proveedores por búsqueda local también
  const searchFilteredSuppliers = availableSuppliers.filter(supplier => {
    if (!localSearch.trim()) return true;
    const term = localSearch.toLowerCase();
    return (
      supplier.name.toLowerCase().includes(term) ||
      supplier.email?.toLowerCase().includes(term) ||
      supplier.contact_person?.toLowerCase().includes(term)
    );
  });

  // Estilos dinámicos
  const containerClasses = `relative ${className}`;
  const inputClasses = `${styles.input()} ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`;
  const dropdownClasses = `absolute top-full left-0 right-0 z-50 mt-1 max-h-64 overflow-auto ${styles.card()} border`;
  const generatedId = useId();
  const searchInputId = `supplier-search-${generatedId}`;
  const fallbackSelectId = `supplier-select-${generatedId}`;

  return (
    <div className={containerClasses} data-testid={props?.['data-testid'] ?? 'supplier-selector'}>
      {/* Label */}
      <label className={styles.label()} htmlFor={fallbackSelectId} data-testid="supplier-label">
        <Building className="inline w-4 h-4 mr-2" />
        Proveedor{required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Búsqueda */}
      {showSearch && (
        <div className="relative mb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              id={searchInputId}
              type="text"
              placeholder="Buscar proveedor..."
              value={localSearch}
              onChange={handleSearchChange}
              onFocus={() => setIsOpen(true)}
              className={`w-full pl-10 ${inputClasses}`}
              data-testid="supplier-search-input"
              aria-label="Buscar proveedor"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2" data-testid="supplier-search-loading">
                <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
              </div>
            )}
          </div>

          {/* Dropdown de resultados */}
          {isOpen && searchFilteredSuppliers.length > 0 && (
            <div className={dropdownClasses} role="listbox" aria-label="Resultados de proveedores" data-testid="supplier-dropdown">
              {searchFilteredSuppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  onClick={() => handleSupplierSelect(supplier)}
                  role="option"
                  aria-selected={selectedSupplier?.id === supplier.id}
                  data-testid={`supplier-option-${supplier.id}`}
                  className={`p-3 cursor-pointer hover:bg-gray-50 border-b last:border-b-0 ${
                    selectedSupplier?.id === supplier.id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">
                        {supplier.name}
                        {!isSupplierActive(supplier) && (
                          <StatusBadge active={false} className="ml-2 align-middle" label="Inactivo" data-testid={`supplier-status-${supplier.id}`} />
                        )}
                      </div>
                      {supplier.contact_person && (
                        <div className="text-sm text-gray-600 flex items-center mt-1">
                          <User className="w-3 h-3 mr-1" />
                          {supplier.contact_person}
                        </div>
                      )}
                      <div className="text-sm text-gray-500 flex items-center mt-1">
                        {supplier.email && (
                          <span className="flex items-center mr-3">
                            <Mail className="w-3 h-3 mr-1" />
                            {supplier.email}
                          </span>
                        )}
                        {supplier.phone && (
                          <span className="flex items-center">
                            <Phone className="w-3 h-3 mr-1" />
                            {supplier.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No hay resultados */}
          {isOpen && searchFilteredSuppliers.length === 0 && localSearch.trim() && (
            <div className={dropdownClasses} data-testid="supplier-no-results">
              <div className="p-3 text-center text-gray-500">
                No se encontraron proveedores que coincidan con "{localSearch}"
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selector principal (fallback) */}
      {!showSearch && (
        <select
          id={fallbackSelectId}
          value={selectedSupplier?.id || ''}
          onChange={(e) => {
            const supplier = availableSuppliers.find(s => s.id === e.target.value);
            onSupplierChange(supplier || null);
          }}
          className={inputClasses}
          data-testid="supplier-select"
          aria-label="Selector de proveedor"
        >
          <option value="">{placeholder}</option>
          {availableSuppliers.map((supplier) => (
            <option key={supplier.id} value={supplier.id} data-testid={`supplier-option-${supplier.id}`}>
              {supplier.name} {supplier.contact_person ? `(${supplier.contact_person})` : ''}
            </option>
          ))}
        </select>
      )}

      {/* Información del proveedor seleccionado */}
      {showDetails && selectedSupplierInfo && (
        <div className={`mt-3 ${styles.card('p-3')}`} data-testid="supplier-info">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="font-medium text-gray-900 flex items-center">
                <Building className="w-4 h-4 mr-2" />
                {selectedSupplierInfo.displayName}
                {!isSupplierActive(selectedSupplier) && (
                  <StatusBadge active={false} className="ml-2" label="Inactivo" data-testid="supplier-selected-status" />
                )}
              </div>
              
              {selectedSupplier.contact_person && (
                <div className="text-sm text-gray-600 flex items-center mt-2">
                  <User className="w-3 h-3 mr-1" />
                  Contacto: {selectedSupplier.contact_person}
                </div>
              )}
              
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                {selectedSupplier.email && (
                  <div className="flex items-center">
                    <Mail className="w-3 h-3 mr-1" />
                    {selectedSupplier.email}
                  </div>
                )}
                {selectedSupplier.phone && (
                  <div className="flex items-center">
                    <Phone className="w-3 h-3 mr-1" />
                    {selectedSupplier.phone}
                  </div>
                )}
              </div>

              {selectedSupplier.notes && (
                <div className="text-sm text-gray-500 mt-2 italic" data-testid="supplier-notes">
                  {selectedSupplier.notes}
                </div>
              )}
            </div>
            
            <button
              onClick={() => handleSupplierSelect(null)}
              className="text-gray-400 hover:text-gray-600 ml-2"
              title="Limpiar selección"
              data-testid="supplier-clear-selection"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Mensajes de error */}
      {(error || supplierError) && (
        <div className="mt-2 text-sm text-red-600 flex items-center" data-testid="supplier-error" role="alert">
          <span className="mr-1">⚠️</span>
          {error || supplierError}
        </div>
      )}

      {/* Advertencia para proveedor inactivo */}
      {selectedSupplier && !isSupplierActive(selectedSupplier) && (
        <div className="mt-2 text-sm text-orange-600 flex items-center" data-testid="supplier-warning" role="status">
          <span className="mr-1">⚠️</span>
          El proveedor seleccionado está inactivo
        </div>
      )}

      {/* Cerrar dropdown al hacer clic fuera */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
          data-testid="supplier-overlay"
          aria-hidden="true"
        />
      )}
    </div>
  );
};

export default SupplierSelector;
