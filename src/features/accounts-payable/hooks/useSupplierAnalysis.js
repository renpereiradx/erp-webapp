import { useState, useEffect, useMemo } from 'react';
import { supplierData as mockData } from '../data/supplierMockData';

/**
 * Custom hook to manage supplier analysis data and logic.
 * Follows "React Best Practices" - logic isolation and derived state.
 */
export const useSupplierAnalysis = (id) => {
  const [loading, setLoading] = useState(true);
  const [supplier, setSupplier] = useState(null);

  useEffect(() => {
    // Simulate API fetch
    const timer = setTimeout(() => {
      setSupplier(mockData);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [id]);

  // Derived state: calculate some extra stats if needed
  const tableStats = useMemo(() => {
    if (!supplier) return { total: 0, overdue: 0 };
    return {
      total: supplier.invoices.length,
      overdue: supplier.invoices.filter(i => i.isOverdue).length
    };
  }, [supplier]);

  return {
    loading,
    supplier,
    tableStats
  };
};
