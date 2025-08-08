/**
 * Custom hook para lógica de proveedores
 * Centraliza la lógica de búsqueda, filtrado y gestión de proveedores
 * Integra con supplierService para operaciones con la API
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import supplierService from '../services/supplierService';

export const useSupplierLogic = () => {
  // Estado principal
  const [suppliers, setSuppliers] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalSuppliers, setTotalSuppliers] = useState(0);

  // Proveedores filtrados por búsqueda
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm.trim()) return suppliers;

    const term = searchTerm.toLowerCase();
    return suppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(term) ||
      supplier.email?.toLowerCase().includes(term) ||
      supplier.contact_person?.toLowerCase().includes(term) ||
      supplier.phone?.includes(term)
    );
  }, [suppliers, searchTerm]);

  // Proveedores activos únicamente
  const activeSuppliers = useMemo(() => {
    return suppliers.filter(supplier => supplier.is_active !== false);
  }, [suppliers]);

  // Cargar proveedores desde la API
  const loadSuppliers = useCallback(async (page = 1, limit = pageSize, search = '') => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await supplierService.getSuppliers({
        page,
        limit,
        search: search.trim()
      });

      if (result.success) {
        setSuppliers(Array.isArray(result.data) ? result.data : []);
        setTotalSuppliers(result.data?.length || 0);
        setCurrentPage(page);
      } else {
        setError(result.error);
        setSuppliers([]);
      }
    } catch (err) {
      setError('Error al cargar proveedores');
      console.error('Error loading suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  // Cargar proveedores activos únicamente
  const loadActiveSuppliers = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await supplierService.getActiveSuppliers();
      
      if (result.success) {
        setSuppliers(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error);
        setSuppliers([]);
      }
    } catch (err) {
      setError('Error al cargar proveedores activos');
      console.error('Error loading active suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Buscar proveedores con debounce
  const searchSuppliers = useCallback(async (searchTerm) => {
    if (!searchTerm.trim()) {
      await loadActiveSuppliers();
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await supplierService.searchSuppliers(searchTerm);
      
      if (result.success) {
        setSuppliers(Array.isArray(result.data) ? result.data : []);
      } else {
        setError(result.error);
        setSuppliers([]);
      }
    } catch (err) {
      setError('Error en la búsqueda');
      console.error('Error searching suppliers:', err);
    } finally {
      setLoading(false);
    }
  }, [loadActiveSuppliers]);

  // Efecto para cargar proveedores al montar el componente
  useEffect(() => {
    loadActiveSuppliers();
  }, [loadActiveSuppliers]);

  // Seleccionar proveedor por ID
  const selectSupplierById = useCallback(async (supplierId) => {
    if (!supplierId) {
      setSelectedSupplier(null);
      return null;
    }

    // Buscar primero en la lista actual
    const existingSupplier = suppliers.find(s => s.id === supplierId);
    if (existingSupplier) {
      setSelectedSupplier(existingSupplier);
      return existingSupplier;
    }

    // Si no está en la lista, cargar desde la API
    setLoading(true);
    try {
      const result = await supplierService.getSupplierById(supplierId);
      
      if (result.success) {
        setSelectedSupplier(result.data);
        return result.data;
      } else {
        setError(result.error);
        return null;
      }
    } catch (err) {
      setError('Error al cargar el proveedor');
      console.error('Error loading supplier by ID:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [suppliers]);

  // Limpiar selección
  const clearSelection = useCallback(() => {
    setSelectedSupplier(null);
  }, []);

  // Refrescar lista de proveedores
  const refreshSuppliers = useCallback(() => {
    if (searchTerm.trim()) {
      searchSuppliers(searchTerm);
    } else {
      loadActiveSuppliers();
    }
  }, [searchTerm, searchSuppliers, loadActiveSuppliers]);

  // Formatear proveedores para selector
  const getSuppliersForSelector = useCallback(() => {
    return supplierService.formatSuppliersForSelector(filteredSuppliers);
  }, [filteredSuppliers]);

  // Obtener información de proveedor seleccionado
  const getSelectedSupplierInfo = useCallback(() => {
    if (!selectedSupplier) return null;
    
    return supplierService.formatSupplierForDisplay(selectedSupplier);
  }, [selectedSupplier]);

  // Validar si un proveedor está activo
  const isSupplierActive = useCallback((supplier) => {
    return supplier && supplier.is_active !== false;
  }, []);

  // Estadísticas de proveedores
  const supplierStats = useMemo(() => {
    return {
      total: suppliers.length,
      active: activeSuppliers.length,
      inactive: suppliers.length - activeSuppliers.length,
      filtered: filteredSuppliers.length
    };
  }, [suppliers.length, activeSuppliers.length, filteredSuppliers.length]);

  // Manejo de paginación
  const goToPage = useCallback((page) => {
    loadSuppliers(page, pageSize, searchTerm);
  }, [loadSuppliers, pageSize, searchTerm]);

  const changePageSize = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    loadSuppliers(1, newSize, searchTerm);
  }, [loadSuppliers, searchTerm]);

  return {
    // Estado principal
    suppliers,
    selectedSupplier,
    searchTerm,
    loading,
    error,

    // Listas derivadas
    filteredSuppliers,
    activeSuppliers,

    // Paginación
    currentPage,
    pageSize,
    totalSuppliers,

    // Estadísticas
    supplierStats,

    // Setters
    setSearchTerm,
    setSelectedSupplier,

    // Acciones principales
    loadSuppliers,
    loadActiveSuppliers,
    searchSuppliers,
    selectSupplierById,
    clearSelection,
    refreshSuppliers,

    // Utilidades
    getSuppliersForSelector,
    getSelectedSupplierInfo,
    isSupplierActive,

    // Paginación
    goToPage,
    changePageSize,

    // Validaciones
    hasSuppliers: suppliers.length > 0,
    hasActiveSuppliers: activeSuppliers.length > 0,
    hasSelection: Boolean(selectedSupplier),
    isSearching: Boolean(searchTerm.trim())
  };
};

export default useSupplierLogic;
